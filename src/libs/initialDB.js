const Role = require('../models/role');
const Users = require('../models/users');
const Subscription = require('../models/subscription');

const createRoles = async () => {
  try {

    const count = await Role.estimatedDocumentCount();

    if (count > 0) return;

    const values = await Promise.all([
      new Role({ name: "Super Administrador" }).save(),
      new Role({ name: "Administrador" }).save(),
      new Role({ name: "Empleado" }).save(),
      new Role({ name: "Usuario App" }).save(),
    ]);

    console.log(values);
  } catch (error) {
    console.error(error);
  }
};

const createUsers = async () => {
  try {

    const count = await Users.estimatedDocumentCount();

    if (count > 0) return;


    const values = await Promise.all([
      new Users({
        nombreUsuario: "Luis Eduardo",
        apellidosUsuario: "Negron Chan",
        correo: "admin@live.com",
        telefonoUsuario: 9971210804,
        contrasena: "$2a$10$HIfNkb0Epj6BHh4pkxykiuzSkhoLp9I4wkU.omxRbV6I5Knf4QTUS",
        direccion: "Calle 20 x 33 y 35 col san bernardo",
        fotoUsuario: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        qrUsuario: "https://w7.pngwing.com/pngs/1006/79/png-transparent-qr-code-qr-code-qr-code-thumbnail.png",
        edadUsuario: new Date(),
        rol: "683df9ce23f1d823782f6a63",
        status: true
      }).save(),
      new Users({
        nombreUsuario: "Luis Eduardo",
        apellidosUsuario: "Negron Chan",
        correo: "empleado@live.com",
        telefonoUsuario: 9971210804,
        contrasena: "$2a$10$HIfNkb0Epj6BHh4pkxykiuzSkhoLp9I4wkU.omxRbV6I5Knf4QTUS",
        direccion: "Calle 20 x 33 y 35 col san bernardo",
        fotoUsuario: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        qrUsuario: "https://w7.pngwing.com/pngs/1006/79/png-transparent-qr-code-qr-code-qr-code-thumbnail.png",
        edadUsuario: new Date(),
        rol: "683df9ce23f1d823782f6a64",
        status: true
      }).save(),
    ]);

    console.log(values);
  } catch (error) {
    console.error(error);
  }
};

const createSubscription = async () => {
  try {

    const count = await Subscription.estimatedDocumentCount();

    if (count > 0) return;

    const values = await Promise.all([
      new Subscription({ name: "Visita", typeSubscription: "Día", price: 40, status: true }).save()
    ]);

    console.log(values);
  } catch (error) {
    console.error(error);
  }
};


module.exports = {
  createRoles,
  createUsers,
  createSubscription
};
