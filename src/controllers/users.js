const { response } = require('express');
const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const CheckIn = require('../models/checkIn');
const { generarJWT } = require('../helpers/jwt');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendAccessCredentialsForEmail, resendAccessCredentials } = require('../helpers/sendEmail');
const { generateAndUploadQR } = require('../helpers/qr');
const { saveFileToCloudinary } = require('../helpers/saveFiles');

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


const getUsers = async (req, res = response) => {
    try {
        const usuarios = await Users.find({
            status: true
        }).populate('rol').populate('subscription').sort({ createdAt: -1 });

        if (!usuarios) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuarios no encontrados'
            })
        } else {
            return res.status(200).json(usuarios);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}

const getUser = async (req, res = response) => {
    try {
        const { user_id } = req.params;

        const usuario = await Users.findById(user_id).populate('rol').populate('subscription');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
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

const registerCheckIn = async (userId) => {
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() - 10 * 60000); // 10 minutos antes

    try {
        const checkInExistente = await CheckIn.findOne({
            user: userId,
            checkInTime: {
                $gte: minAllowedTime,
                $lte: now
            }
        });

        if (checkInExistente) {
            return {
                ok: false,
                msg: 'Ya existe un check-in reciente. Espera al menos 10 minutos.'
            };
        }

        await CheckIn.create({ user: userId });

        return {
            ok: true,
            msg: 'Check-in registrado correctamente'
        };

    } catch (err) {
        console.error('Error registrando check-in:', err);
        return {
            ok: false,
            msg: 'Error en el servidor al registrar el check-in'
        };
    }
};

const checkMembership = async (req, res = response) => {
    try {
        const { id } = req.params;

        const usuario = await Users.findById(id)
            .populate('rol')
            .populate('subscription');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                status: 'not_found',
                msg: 'Usuario no encontrado'
            });
        }

        if (!usuario.status) {
            return res.status(403).json({
                ok: false,
                status: 'inactive_user',
                msg: 'El usuario está inactivo'
            });
        }

        const now = new Date();

        if (!usuario.subscription || !usuario.membershipStart || !usuario.membershipEnd) {
            return res.status(400).json({
                ok: false,
                status: 'no_membership',
                msg: 'El usuario no cuenta con una membresía activa',
                user: usuario
            });
        }

        const membershipEnd = new Date(usuario.membershipEnd);

        if (membershipEnd > now) {
            const result = await registerCheckIn(usuario._id);
            if (!result.ok) {
                return res.status(400).json(result);
            }

            return res.status(200).json({
                ok: true,
                status: 'membership_active',
                msg: 'El usuario tiene una membresía activa',
                user: usuario,
                membership: {
                    subscription: usuario.subscription,
                    start: usuario.membershipStart,
                    end: usuario.membershipEnd
                }
            });
        } else {
            return res.status(400).json({
                ok: false,
                status: 'membership_expired',
                msg: 'La membresía del usuario ha vencido',
                user: usuario,
                membership: {
                    subscription: usuario.subscription,
                    start: usuario.membershipStart,
                    end: usuario.membershipEnd
                }
            });
        }

    } catch (error) {
        console.error('Error al verificar membresía:', error);
        return res.status(500).json({
            ok: false,
            status: 'server_error',
            msg: 'Ocurrió un error en el servidor'
        });
    }
};



const getByEmployee = async (req, res = response) => {
    const { id } = req.params;

    try {
        const empleados = await Users.find({
            rol: new ObjectId(id),
            status: true
        }).populate('rol').populate('subscription');

        if (!empleados || empleados.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontraron empleados'
            });
        }

        return res.status(200).json(empleados);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        });
    }
};

const createUser = async (req, res = response) => {
    try {
        const {
            nombreUsuario,
            apellidosUsuario,
            correo,
            telefonoUsuario,
            contrasena,
            direccion,
            edadUsuario,
            rol
        } = req.body;

        // Verificar si ya existe
        const usuarioExistente = await Users.findOne({ status: true, correo });
        if (usuarioExistente) {
            return res.status(409).json({
                ok: false,
                msg: 'El correo electrónico ya está registrado con otro usuario'
            });
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(contrasena, salt);

        // Crear usuario base
        const nuevoUsuario = new Users({
            nombreUsuario,
            apellidosUsuario,
            correo,
            telefonoUsuario,
            contrasena: hashedPassword,
            direccion,
            edadUsuario,
            rol,
            status: true,
        });

        const usuarioGuardado = await nuevoUsuario.save();

        // 1. Subir foto si se envió
        if (req.files && req.files.fotoUsuario) {
            const file = req.files.fotoUsuario;
            const imageUrl = await saveFileToCloudinary(file.tempFilePath, 'user_photos', usuarioGuardado._id.toString());
            usuarioGuardado.fotoUsuario = imageUrl;
        } else {
            usuarioGuardado.fotoUsuario = "https://cdn-icons-png.flaticon.com/512/4792/4792929.png";
        }

        // 2. Generar y subir QR
        const urlQR = await generateAndUploadQR(usuarioGuardado._id.toString());
        usuarioGuardado.qrUsuario = urlQR;

        // Guardar cambios
        await usuarioGuardado.save();

        // 3. Enviar credenciales por correo
        await sendAccessCredentialsForEmail(correo, nombreUsuario, contrasena, urlQR);

        // 4. Generar JWT
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
    const { user_id } = req.params;
    const {
        nombreUsuario,
        apellidosUsuario,
        correo,
        telefonoUsuario,
        direccion,
        rol
    } = req.body;

    try {
        // Buscar el usuario original
        const existingUser = await Users.findById(user_id);
        if (!existingUser) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado',
            });
        }

        // Verificar si el correo fue modificado
        const correoModificado = correo && correo !== existingUser.correo;

        // Clonamos el body y eliminamos fotoUsuario si es un objeto (posiblemente archivo en form)
        const dataToUpdate = { ...req.body };
        if (dataToUpdate.fotoUsuario && typeof dataToUpdate.fotoUsuario === 'object') {
            delete dataToUpdate.fotoUsuario;
        }

        // Actualizar los datos principales
        let updatedUser = await Users.findByIdAndUpdate(user_id, {
            nombreUsuario,
            apellidosUsuario,
            correo,
            telefonoUsuario,
            direccion,
            rol
        }, {
            new: true,
            runValidators: true,
        });

        // Actualizar imagen si se envió
        if (req.files && req.files.fotoUsuario) {
            const file = req.files.fotoUsuario;
            const imageUrl = await saveFileToCloudinary(
                file.tempFilePath,
                'user_photos',
                updatedUser._id.toString()
            );

            updatedUser.fotoUsuario = imageUrl;
            await updatedUser.save();
        }

        // Si el correo fue modificado, enviar notificación
        if (correoModificado) {
            await resendAccessCredentials(correo, updatedUser.nombreUsuario, updatedUser.qrUsuario);
        }

        return res.status(200).json({
            ok: true,
            msg: 'Usuario actualizado correctamente',
            user: updatedUser,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error del servidor, habla con el administrador',
        });
    }
};

const loginUser = async (req, res = response) => {
    try {
        const { correo, contrasena } = req.body;

        const usuario = await Users.findOne({ correo }).populate('rol').populate('subscription');

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
    try {
        const { uid } = req;

        if (!uid) {
            return res.status(400).json({
                ok: false,
                msg: 'UID no proporcionado en la solicitud'
            });
        }

        const usuario = await Users.findById(uid).populate('rol').populate('subscription');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe un usuario con ese UID'
            });
        }

        if (!usuario.status) {
            return res.status(403).json({
                ok: false,
                msg: 'El usuario está inactivo o fue eliminado. Contacta al administrador.'
            });
        }

        const token = await generarJWT(uid, usuario.nombreUsuario);

        const usuarioData = {
            uid: usuario._id,
            nombreUsuario: usuario.nombreUsuario,
            apellidosUsuario: usuario.apellidosUsuario,
            correo: usuario.correo,
            telefonoUsuario: usuario.telefonoUsuario,
            direccion: usuario.direccion,
            fotoUsuario: usuario.fotoUsuario,
            qrUsuario: usuario.qrUsuario,
            edadUsuario: usuario.edadUsuario,
            status: usuario.status,
            rol: usuario.rol
        };

        return res.status(200).json({
            ok: true,
            usuario: usuarioData,
            token
        });

    } catch (error) {
        console.error('Error al revalidar token:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor. Por favor, contacta al administrador.'
        });
    }
};



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
        const decoded = jwt.verify(token, process.env.SECRET_JWT_SEED);

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
            msg: 'Token inválido o expirado, es necesario solicitar nuevamente '
        });
    }
};

const sendRedirectToApp = async (req, res = response) => {
    const { token } = req.params;
    const deepLink = `combigegogym://forgetpassword/${token}`;

    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirección hacia App BIG EGO GYM...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            width:90%;
            height:100vh;
            display:flex;
            flex-direction:column;
            justify-content:flex-start;
            margin-top:50px;
            align-items:center;
            font-family: Arial, sans-serif;
            text-align: center;
          }
          a {
            font-size: 18px;
            color: blue;
          }
        </style>
      </head>
      <body>
        <h2>Abriendo la app...</h2>
        <p>Si no se abre automáticamente, toca el botón de abajo:</p>
        <a href="${deepLink}">Abrir App</a>

        <script>
          setTimeout(() => {
            window.location.href = "${deepLink}";
          }, 100);
        </script>
      </body>
    </html>
  `);
};

module.exports = {
    loginUser,
    createUser,
    revalidateToken,
    updateUser,
    deleteUser,
    getUser,
    sendPasswordReset,
    sendRedirectToApp,
    resetPassword,
    getUsers,
    getByEmployee,
    checkMembership
}