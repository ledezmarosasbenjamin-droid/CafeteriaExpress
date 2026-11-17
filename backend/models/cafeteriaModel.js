const db = require('../config/db');

const CafeteriaModel = {
    getInicio: async () => {
        const [rows] = await db.query('SELECT * FROM inicio LIMIT 1');
        return rows[0];
    },
    getProductos: async () => {
        const [rows] = await db.query('SELECT * FROM productos ORDER BY id ASC');
        return rows;
    },
    getUsuarios: async () => {
        const [rows] = await db.query('SELECT id, nombre, email, rol FROM usuarios');
        return rows;
    },
    createContacto: async ({ nombre, email, mensaje }) => {
        const [result] = await db.query(
            'INSERT INTO contactos (nombre, email, mensaje) VALUES (?, ?, ?)',
            [nombre, email, mensaje]
        );
        return result.insertId;
    }
};

module.exports = CafeteriaModel;