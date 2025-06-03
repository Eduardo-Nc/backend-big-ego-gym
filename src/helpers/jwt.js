const jwt = require('jsonwebtoken');

/**
 * Genera un JWT con opciones personalizadas
 * @param {string} uid - ID del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} expiresIn - Tiempo de expiración (opcional, default: 24h)
 * @param {object} extraPayload - Payload adicional (opcional)
 */
const generarJWT = (uid, name, expiresIn = '24h', extraPayload = {}) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, name, ...extraPayload };

        jwt.sign(payload, process.env.SECRET_JWT_SEED, { expiresIn }, (err, token) => {
            if (err) {
                console.log(err);
                return reject('No se pudo generar el token');
            }
            resolve(token);
        });
    });
};

module.exports = {
    generarJWT
};
