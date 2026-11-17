const db = require('../config/db');

const products = [
  {
    nombre: 'Café Americano',
    precio: 18,
    descripcion: 'Espresso doble suavizado con agua caliente; intenso, limpio y aromático.'
  },
  {
    nombre: 'Mocaccino',
    precio: 25,
    descripcion: 'Espresso, chocolate y leche cremosa, terminado con un toque de cacao.'
  },
  {
    nombre: 'Latte de la Casa',
    precio: 24,
    descripcion: 'Espresso equilibrado con leche vaporizada y una fina capa de espuma.'
  },
  {
    nombre: 'Flat White',
    precio: 24,
    descripcion: 'Doble espresso con leche sedosa para resaltar el sabor del café.'
  },
  {
    nombre: 'Croissant de Mantequilla',
    precio: 15,
    descripcion: 'Croissant dorado, hojaldrado y horneado para acompañar tu café.'
  },
  {
    nombre: 'Brownie de Chocolate',
    precio: 18,
    descripcion: 'Brownie húmedo de chocolate con una superficie ligeramente crocante.'
  },
  {
    nombre: 'Cheesecake de la Casa',
    precio: 23,
    descripcion: 'Tarta cremosa de queso con base crocante, ideal para compartir.'
  }
];

async function seedCatalog() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contactos (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      mensaje TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const inserted = [];
  const skipped = [];

  for (const product of products) {
    const [existing] = await db.execute(
      'SELECT id FROM productos WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [product.nombre]
    );

    if (existing.length > 0) {
      skipped.push(product.nombre);
      continue;
    }

    await db.execute(
      'INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)',
      [product.nombre, product.precio, product.descripcion]
    );
    inserted.push(product.nombre);
  }

  console.log(`Tabla contactos lista. Productos agregados: ${inserted.length}.`);
  if (inserted.length) console.log(`Nuevos productos: ${inserted.join(', ')}`);
  if (skipped.length) console.log(`Ya existían: ${skipped.join(', ')}`);
}

seedCatalog()
  .catch((error) => {
    console.error('No se pudo preparar la base para el catálogo y contacto:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
