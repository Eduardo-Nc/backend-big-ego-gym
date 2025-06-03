const { response } = require('express');
const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const { generarJWT } = require('../helpers/jwt');
const nodemailer = require('nodemailer');
const { sendPasswordResetEmail, sendAccessCredentialsForEmail } = require('../helpers/sendEmail');

const getUser = async (req, res = response) => {
    try {

        const { user_id } = req.params;

        const usuario = await Users.findById(user_id).populate('rol');

        console.log(usuario)

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        } else {
            return res.status(200).json(usuario);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }

}


const createUser = async (req, res = response) => {
    try {
        const {
            nombreUsuario,
            apellidosUsuario,
            correo,
            telefonoUsuario,
            contrasena,
            direccion,
            fotoUsuario,
            qrUsuario,
            edadUsuario,
            rol
        } = req.body;

        // Verifica si el usuario ya existe con ese correo
        const usuarioExistente = await Users.findOne({ status: true, correo });

        if (usuarioExistente) {
            return res.status(409).json({
                ok: false,
                msg: 'El correo electrónico ya está registrado con otro usuario'
            });
        }

        // Crea una nueva instancia de usuario
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(contrasena, salt);

        const nuevoUsuario = new Users({
            nombreUsuario,
            apellidosUsuario,
            correo,
            telefonoUsuario,
            contrasena: hashedPassword,
            direccion,
            fotoUsuario,
            qrUsuario,
            edadUsuario,
            rol,
            status: true
        });

        const usuarioGuardado = await nuevoUsuario.save();
        //Enivar datos de acceso
        if (usuarioGuardado) {
            await sendAccessCredentialsForEmail(correo, nombreUsuario, contrasena)
        }

        // Generar JWT
        const token = await generarJWT(usuarioGuardado._id, usuarioGuardado.nombreUsuario);

        return res.status(201).json({
            ok: true,
            msg: 'Usuario creado correctamente',
            uid: usuarioGuardado._id,
            name: usuarioGuardado.nombreUsuario,
            roles: usuarioGuardado.rol,
            token
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error del servidor. Por favor, contacta al administrador.'
        });
    }
};


const updateUser = async (req, res = response) => {

    const { uid } = req.params;

    try {

        const updatedUser = await Users.findByIdAndUpdate(
            uid,
            req.body,
            {
                new: true,
            }
        );


        if (!updatedUser) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            })
        }
        else {
            return res.status(200).json({
                ok: true,
                msg: 'Usuario fue actualizado correctamente'
            });
        }


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}

const loginUser = async (req, res = response) => {
    try {
        const { correo, contrasena } = req.body;

        const usuario = await Users.findOne({ correo }).populate('rol');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe un usuario con ese correo'
            });
        }

        if (!usuario.status) {
            return res.status(403).json({
                ok: false,
                msg: 'Este usuario fue eliminado o está inactivo. Contacta a un administrador.'
            });
        }

        // Verifica la contraseña
        const isValidPassword = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!isValidPassword) {
            return res.status(401).json({
                ok: false,
                msg: 'Contraseña incorrecta'
            });
        }

        // Generar JWT
        const token = await generarJWT(usuario._id, usuario.nombreUsuario);

        return res.status(200).json({
            ok: true,
            uid: usuario._id,
            nombreUsuario: usuario.nombreUsuario,
            correo: usuario.correo,
            rol: usuario.rol,
            apellidosUsuario: usuario.apellidosUsuario,
            telefonoUsuario: usuario.telefonoUsuario,
            direccion: usuario.direccion,
            fotoUsuario: usuario.fotoUsuario,
            qrUsuario: usuario.qrUsuario,
            edadUsuario: usuario.edadUsuario,
            status: true,
            token
        });

    } catch (error) {
        console.error('Error al hacer login:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el servidor. Por favor contacta al administrador.'
        });
    }
};


const revalidateToken = async (req, res = response) => {
    const { uid } = req;

    try {
        const usuario = await Users.findById(uid).populate('rol');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe un usuario con ese correo'
            });
        }

        if (!usuario.status) {
            return res.status(403).json({
                ok: false,
                msg: 'Este usuario fue eliminado o está inactivo. Contacta a un administrador.'
            });
        }

        const {
            _id,
            nombreUsuario,
            correo,
            rol,
            apellidosUsuario,
            telefonoUsuario,
            direccion,
            fotoUsuario,
            qrUsuario,
            edadUsuario,
            status
        } = usuario;

        // Generar JWT
        const token = await generarJWT(uid, nombreUsuario);

        res.status(200).json({
            ok: true,
            uid: _id,
            nombreUsuario,
            correo,
            rol,
            apellidosUsuario,
            telefonoUsuario,
            direccion,
            fotoUsuario,
            qrUsuario,
            edadUsuario,
            status,
            token
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        });
    }
}




const deleteUser = async (req, res = response) => {

    const { user_id } = req.params;

    try {

        const updatedUser = await Users.findByIdAndUpdate(
            user_id,
            { status: false },
            {
                new: true,
            }
        );


        if (!updatedUser) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            })
        }
        else {

            return res.status(200).json({
                ok: true,
                msg: 'Usuario fue eliminado correctamente'
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}

const sendPasswordReset = async (req, res = response) => {
    const { correo } = req.body;

    try {
        const usuario = await Users.findOne({ correo });

        if (!usuario || !usuario.status) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe un usuario activo con ese correo'
            });
        }

        // Generar token de recuperación válido por 15 minutos
        const token = await generarJWT(usuario._id, usuario.nombreUsuario, '15m', { reset: true });

        // Enviar el token por correo
        await sendPasswordOfEmail(usuario.correo, usuario.nombreUsuario, token);

        return res.status(200).json({
            ok: true,
            msg: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña'
        });

    } catch (error) {
        console.error('Error en recuperación:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error del servidor'
        });
    }
};

const sendPasswordOfEmail = async (correo, nombre, token) => {
    await sendPasswordResetEmail(correo, nombre, token)
};

const resetPassword = async (req, res = response) => {
    const { token, nuevaContrasena } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.reset) {
            return res.status(400).json({
                ok: false,
                msg: 'Este token no es válido para recuperación de contraseña'
            });
        }

        const usuario = await Users.findById(decoded.uid);
        if (!usuario || !usuario.status) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        const salt = bcrypt.genSaltSync();
        usuario.contrasena = bcrypt.hashSync(nuevaContrasena, salt);
        await usuario.save();

        return res.status(200).json({
            ok: true,
            msg: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        return res.status(400).json({
            ok: false,
            msg: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    loginUser,
    createUser,
    revalidateToken,
    updateUser,
    deleteUser,
    getUser,
    sendPasswordReset,
    resetPassword
}