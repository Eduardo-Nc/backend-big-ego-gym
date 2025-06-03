const { response } = require('express');
const jwt = require('jsonwebtoken');

const validarJWT = (req, res = response, next) => {

    // x-token headers
    const token = req.header('x-token');
    // console.log(token)
    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {

        const { uid, name } = jwt.verify(
            token,
            process.env.SECRET_JWT_SEED
        );

        req.uid = uid;
        req.name = name;


    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }



    next();
}

const validarJWTForgotPassword = (req, res = response, next) => {

    // token body
    const { resetLink } = req.body;


    if (!resetLink) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {

        const { uid, name } = jwt.verify(
            resetLink,
            process.env.SECRET_JWT_SEED
        );

        req.uid = uid;
        req.name = name;


    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido o expirado, intente realizar una nueva solicitud'
        });
    }



    next();
}


module.exports = {
    validarJWT,
    validarJWTForgotPassword
}
