const express = require('express');
const cors = require('cors');
const chatbotController = require('./controllers/chatbotController');
const cafeteriaController = require('./controllers/cafeteriaController');
const validateContact = require('./middleware/validateContact');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rutas que Angular está buscando
app.get('/api/productos', cafeteriaController.getProductos);
app.get('/api/cafeteria', cafeteriaController.getProductos);
app.get('/api/inicio', cafeteriaController.getInicio);
app.post('/api/contacto', validateContact, cafeteriaController.enviarContacto);

// Ruta del Chatbot con IA
app.post('/api/chatbot', chatbotController.chatConBarista);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'INVALID_JSON',
      respuesta: 'No pude leer tu mensaje. Inténtalo nuevamente.'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'REQUEST_TOO_LARGE',
      respuesta: 'El mensaje enviado es demasiado grande.'
    });
  }

  console.error('Error inesperado en el backend:', error);
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    respuesta: 'Ocurrió un problema inesperado. Inténtalo nuevamente.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});