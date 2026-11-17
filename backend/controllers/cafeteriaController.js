const CafeteriaModel = require('../models/cafeteriaModel');

exports.getProductos = async (req, res) => {
  try {
    const productos = await CafeteriaModel.getProductos();
    res.json(productos);
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    res.status(500).json({ error: 'No se pudieron cargar los productos.' });
  }
};

exports.getInicio = async (req, res) => {
  try {
    const inicio = await CafeteriaModel.getInicio();
    res.json(inicio ?? {});
  } catch (error) {
    console.error('Error en GET /api/inicio:', error);
    res.status(500).json({ error: 'No se pudo cargar la información de inicio.' });
  }
};

exports.enviarContacto = async (req, res) => {
  try {
    const id = await CafeteriaModel.createContacto({
      nombre: req.body.nombre.trim(),
      email: req.body.email.trim(),
      mensaje: req.body.mensaje.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Mensaje guardado',
      id
    });
  } catch (error) {
    console.error('Error en POST /api/contacto:', error);
    return res.status(500).json({
      success: false,
      message: 'No se pudo guardar tu mensaje. Inténtalo nuevamente.'
    });
  }
};