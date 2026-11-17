const validateContact = (req, res, next) => {
    const { nombre, email, mensaje } = req.body || {};
    if (
        typeof nombre !== 'string' ||
        typeof email !== 'string' ||
        typeof mensaje !== 'string' ||
        !nombre.trim() ||
        !email.trim() ||
        !mensaje.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: 'Completa tu nombre, correo y mensaje para poder contactarte.'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: 'Escribe un correo electrónico válido.'
        });
    }

    if (nombre.trim().length < 2 || mensaje.trim().length < 5) {
        return res.status(400).json({
            success: false,
            message: 'Revisa tu nombre y escribe un mensaje de al menos 5 caracteres.'
        });
    }

    next();
};

module.exports = validateContact;