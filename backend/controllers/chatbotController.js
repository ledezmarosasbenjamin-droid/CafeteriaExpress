const axios = require('axios');
const { createInterface } = require('node:readline');
const CafeteriaModel = require('../models/cafeteriaModel');

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma3:latest';
const OLLAMA_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2_000;

const BARISTA_INSTRUCTIONS = `Eres el barista experto de CoffeeHouse, en Cochabamba, Bolivia.
Responde en español, con calidez y en no más de dos frases cortas.
Recomienda solo productos del menú; usa sus precios exactos en Bolivianos (Bs.).
No inventes productos, ingredientes ni precios. Si preguntan algo ajeno al café, redirige con amabilidad.`;

function responderError(res, status, code, respuesta) {
  return res.status(status).json({ error: code, respuesta });
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
    const detalle = detalleErrorOllama(error);

    if (res.headersSent) {
      if (!res.destroyed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          error: detalle.code,
          respuesta: detalle.respuesta
        })}\n\n`);
        res.end();
      }
      return;
    }

    return responderError(res, detalle.status, detalle.code, detalle.respuesta);
  }
};
