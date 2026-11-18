const db = require('../config/db');

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    nombre: 'Café Americano',
    precio: 18,
    descripcion: 'Espresso doble suavizado con agua caliente filtrada; perfil intenso, notas cítricas y aroma envolvente.',
    categoria: 'Calientes',
    popular: true,
    intensidad: 4
  },
  {
    id: 2,
    nombre: 'Mocaccino',
    precio: 25,
    descripcion: 'Espresso selecto, chocolate artesanal 70% cacao y leche cremada aterciopelada.',
    categoria: 'Especialidades',
    popular: true,
    intensidad: 3
  },
  {
    id: 3,
    nombre: 'Caramel Velvet Latte',
    precio: 24,
    descripcion: 'Espresso equilibrado con leche vaporizada sedosa y notas de caramelo tostado.',
    categoria: 'Calientes',
    popular: true,
    intensidad: 2
  },
  {
    id: 4,
    nombre: 'Flat White Artesanal',
    precio: 24,
    descripcion: 'Doble ristretto con microespuma de leche sedosa que resalta el dulzor natural del grano.',
    categoria: 'Calientes',
    popular: false,
    intensidad: 4
  },
  {
    id: 5,
    nombre: 'Iced Vanilla Cold Brew',
    precio: 26,
    descripcion: 'Macerado en frío por 18 horas, servido sobre hielo cristalino con toque de vainilla de Madagascar.',
    categoria: 'Fríos',
    popular: true,
    intensidad: 4
  },
  {
    id: 6,
    nombre: 'Frappé Espresso Choco',
    precio: 28,
    descripcion: 'Espresso batido con hielo frappé, crema batida fresca y sirope de chocolate belga.',
    categoria: 'Fríos',
    popular: false,
    intensidad: 3
  },
  {
    id: 7,
    nombre: 'Croissant de Mantequilla Francés',
    precio: 15,
    descripcion: 'Croissant dorado, hojaldrado artesanalmente y horneado cada mañana con mantequilla pura.',
    categoria: 'Repostería',
    popular: true,
    intensidad: 1
  },
  {
    id: 8,
    nombre: 'Brownie de Chocolate & Nueces',
    precio: 18,
    descripcion: 'Brownie húmedo de cacao con corteza crujiente y nueces tostadas seleccionadas.',
    categoria: 'Repostería',
    popular: false,
    intensidad: 1
  },
  {
    id: 9,
    nombre: 'Cheesecake de Frutos Rojos',
    precio: 23,
    descripcion: 'Tarta cremosa de queso estilo neoyorquino con coulis casero de frutos del bosque.',
    categoria: 'Repostería',
    popular: true,
    intensidad: 1
  }
];

const DEFAULT_INICIO = {
  id: 1,
  titulo: 'Café de altura, sabor de origen',
  subtitulo: 'Sabor de origen en cada preparación.',
  mensaje: 'Granos de especialidad cultivados en alturas privilegiadas, tostados en pequeños lotes y preparados con pasión para una experiencia inolvidable.'
};

const memoriaContactos = [];

const CafeteriaModel = {
  getInicio: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM inicio LIMIT 1');
      return rows[0] || DEFAULT_INICIO;
    } catch (error) {
      console.warn('Base de datos no disponible para inicio; usando valores predeterminados.');
      return DEFAULT_INICIO;
    }
  },

  getProductos: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM productos ORDER BY id ASC');
      if (rows && rows.length > 0) return rows;
      return DEFAULT_PRODUCTS;
    } catch (error) {
      console.warn('Base de datos no disponible para productos; usando catálogo precargado.');
      return DEFAULT_PRODUCTS;
    }
  },

  getUsuarios: async () => {
    try {
      const [rows] = await db.query('SELECT id, nombre, email, rol FROM usuarios');
      return rows;
    } catch (error) {
      return [
        { id: 1, nombre: 'Valentina Morales', email: 'valentina@coffeehouse.bo', rol: 'Head Barista' },
        { id: 2, nombre: 'Mateo Quiroga', email: 'mateo@coffeehouse.bo', rol: 'Tostador & Q-Grader' },
        { id: 3, nombre: 'Camila Rojas', email: 'camila@coffeehouse.bo', rol: 'Experiencia & Hospitalidad' }
      ];
    }
  },

  createContacto: async ({ nombre, email, mensaje }) => {
    try {
      const [result] = await db.query(
        'INSERT INTO contactos (nombre, email, mensaje) VALUES (?, ?, ?)',
        [nombre, email, mensaje]
      );
      return result.insertId;
    } catch (error) {
      console.warn('Base de datos no disponible para contactos; guardando en memoria local.');
      const nuevoId = memoriaContactos.length + 1;
      memoriaContactos.push({ id: nuevoId, nombre, email, mensaje, fecha: new Date() });
      return nuevoId;
    }
  }
};

module.exports = CafeteriaModel;
