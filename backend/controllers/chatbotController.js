const axios = require('axios');
const { createInterface } = require('node:readline');
const CafeteriaModel = require('../models/cafeteriaModel');

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma3:latest';
const OLLAMA_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2_000;

const BARISTA_INSTRUCTIONS = `Eres el barista experto de "Café de altura, sabor de origen", en Cochabamba, Bolivia.
Responde en español, con calidez y en no más de dos frases cortas.
Recomienda solo productos del menú; usa sus precios exactos en Bolivianos (Bs.).
No inventes productos, ingredientes ni precios. Si preguntan algo ajeno al café, redirige con amabilidad.`;

function responderError(res, status, code, respuesta) {
  return res.status(status).json({ error: code, respuesta });
}

function obtenerRespuestaBaristaLocal(consulta, productos = []) {
  const query = consulta.toLowerCase();
  if (query.includes('precio') || query.includes('cuesta') || query.includes('cuanto') || query.includes('cuánto')) {
    const p = productos.find(x => query.includes(x.nombre.toLowerCase())) || productos[0] || { nombre: 'Café Americano', precio: 18 };
    return `Nuestro ${p.nombre} tiene un precio de Bs. ${p.precio}. Todos nuestros cafés se preparan al momento con granos de especialidad.`;
  }
  if (query.includes('suave') || query.includes('dulce') || query.includes('caramelo') || query.includes('leche')) {
    return 'Te recomiendo el Caramel Velvet Latte o el Flat White: suaves, con microespuma sedosa y notas dulces de caramelo tostado.';
  }
  if (query.includes('fuerte') || query.includes('intenso') || query.includes('despertar') || query.includes('energía') || query.includes('estudiar')) {
    return 'Para recargar energías con intensidad y sabor puro, nuestro Café Americano doble o Flat White son las opciones perfectas.';
  }
  if (query.includes('frio') || query.includes('frío') || query.includes('calor') || query.includes('frappé') || query.includes('frappe') || query.includes('ice') || query.includes('helado')) {
    return '¡Prueba nuestro Iced Vanilla Cold Brew macerado 18 horas o el Frappé Espresso Choco! Son deliciosos y refrescantes.';
  }
  if (query.includes('postre') || query.includes('comer') || query.includes('croissant') || query.includes('brownie') || query.includes('cheesecake') || query.includes('tarta')) {
    return 'Te sugiero acompañar tu taza con nuestro Croissant de Mantequilla recién horneado o el Cheesecake de Frutos Rojos.';
  }
  if (query.includes('donde') || query.includes('dónde') || query.includes('ubicacion') || query.includes('ubicación') || query.includes('direccion') || query.includes('dirección')) {
    return 'Nos encontramos en Cochabamba, Bolivia. Atendemos todos los días de 07:30 a 21:30.';
  }
  if (query.includes('horario') || query.includes('hora') || query.includes('abierto') || query.includes('atienden')) {
    return 'Nuestro horario de atención es de lunes a domingo de 07:30 a 21:30. ¡Te esperamos para compartir un buen café!';
  }
  if (query.includes('envio') || query.includes('envío') || query.includes('delivery') || query.includes('domicilio')) {
    return '¡Sí, hacemos envíos a domicilio! Puedes armar tu pedido en el carrito interactivo y confirmarlo fácilmente por WhatsApp.';
  }
  return '¡Hola! Es un placer saludarte en "Café de altura, sabor de origen". Con gusto te recomiendo opciones de nuestra barra. ¿Prefieres un café caliente, frío o un acompañamiento dulce?';
}

function aceptaStreaming(req) {
  const acceptHeader = req.get('accept') || '';
  return acceptHeader.split(',').some((format) => (
    format.split(';')[0].trim().toLowerCase() === 'text/event-stream'
  ));
}

function detalleErrorOllama(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    console.warn(`Ollama excedió el tiempo límite de ${OLLAMA_TIMEOUT_MS} ms.`);
    return {
      status: 503,
      code: 'OLLAMA_TIMEOUT',
      respuesta: 'El barista está tardando más de lo esperado. Inténtalo nuevamente en un momento.'
    };
  }

  if (error instanceof SyntaxError || error.response) {
    console.error('Ollama devolvió una respuesta inválida:', error.message);
    return {
      status: 502,
      code: 'OLLAMA_ERROR',
      respuesta: 'El barista tuvo un problema al preparar la respuesta. Inténtalo de nuevo.'
    };
  }

  console.warn(`No se pudo conectar con Ollama (${error.code || error.message}).`);
  return {
    status: 503,
    code: 'OLLAMA_UNAVAILABLE',
    respuesta: 'El barista virtual no está disponible por ahora. Verifica que Ollama esté ejecutándose e inténtalo de nuevo.'
  };
}

exports.chatConBarista = async (req, res) => {
  const mensaje = req.body?.mensaje;

  if (typeof mensaje !== 'string' || mensaje.trim().length === 0) {
    return responderError(
      res,
      400,
      'INVALID_MESSAGE',
      'Escríbeme un mensaje y con gusto te recomiendo algo rico.'
    );
  }

  const consulta = mensaje.trim();
  if (consulta.length > MAX_MESSAGE_LENGTH) {
    return responderError(
      res,
      413,
      'MESSAGE_TOO_LONG',
      'Tu mensaje es un poco largo. ¿Puedes resumirlo para que pueda ayudarte?'
    );
  }

  let productos;
  try {
    productos = await CafeteriaModel.getProductos();
  } catch (error) {
    console.error('No se pudo consultar el menú para el chatbot:', error);
    return responderError(
      res,
      503,
      'MENU_UNAVAILABLE',
      'Ahora mismo no puedo consultar el menú. Inténtalo nuevamente en un momento.'
    );
  }

  const menu = productos.map(({ nombre, descripcion, precio }) => {
    const detalle = typeof descripcion === 'string' ? `: ${descripcion.slice(0, 100)}` : '';
    return `- ${nombre}${detalle} (Bs. ${precio})`;
  }).join('\n');
  const prompt = `${BARISTA_INSTRUCTIONS}

MENÚ ACTUAL:
${menu}

CLIENTE: ${consulta}
BARISTA:`;
  const aceptaStream = aceptaStreaming(req);

  try {
    if (aceptaStream) {
      const abortController = new AbortController();
      res.once('close', () => {
        if (!res.writableEnded) abortController.abort();
      });

      const response = await axios.post(
        OLLAMA_URL,
        {
          model: OLLAMA_MODEL,
          prompt,
          stream: true,
          keep_alive: '10m',
          options: {
            num_ctx: 1024,
            num_predict: 48,
            temperature: 0.4
          }
        },
        {
          timeout: OLLAMA_TIMEOUT_MS,
          responseType: 'stream',
          signal: abortController.signal,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      res.status(200).set({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
      res.flushHeaders();

      const lineReader = createInterface({ input: response.data, crlfDelay: Infinity });
      for await (const line of lineReader) {
        if (!line.trim()) continue;

        const chunk = JSON.parse(line);
        if (typeof chunk.response === 'string' && chunk.response) {
          res.write(`data: ${JSON.stringify({ token: chunk.response })}\n\n`);
        }
        if (chunk.done) break;
      }

      if (!res.destroyed && !res.writableEnded) {
        res.write('data: {"done":true}\n\n');
        res.end();
      }
      return;
    }

    const response = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        keep_alive: '10m',
        options: {
          num_ctx: 1024,
          num_predict: 48,
          temperature: 0.4
        }
      },
      {
        timeout: OLLAMA_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        maxContentLength: 1_000_000,
        maxBodyLength: 1_000_000
      }
    );

    const respuesta = response.data?.response;
    if (typeof respuesta !== 'string' || respuesta.trim().length === 0) {
      console.warn('Ollama respondió sin texto para el chatbot.');
      return responderError(
        res,
        502,
        'INVALID_OLLAMA_RESPONSE',
        'No alcancé a preparar una respuesta. ¿Puedes intentarlo de nuevo?'
      );
    }

    return res.json({ respuesta: respuesta.trim() });
  } catch (error) {
    console.warn(`Ollama no respondió (${error.code || error.message}). Usando barista experto local.`);
    const respuestaRespaldo = obtenerRespuestaBaristaLocal(consulta, productos);

    if (aceptaStream) {
      if (!res.headersSent) {
        res.status(200).set({
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no'
        });
        res.flushHeaders();
      }

      // Simular transmisión suave del barista local
      const palabras = respuestaRespaldo.split(' ');
      for (const [idx, palabra] of palabras.entries()) {
        const sufijo = idx === palabras.length - 1 ? '' : ' ';
        res.write(`data: ${JSON.stringify({ token: palabra + sufijo })}\n\n`);
      }

      if (!res.destroyed && !res.writableEnded) {
        res.write('data: {"done":true}\n\n');
        res.end();
      }
      return;
    }

    return res.json({ respuesta: respuestaRespaldo });
  }
};
