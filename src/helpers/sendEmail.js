const nodemailer = require('nodemailer');

// Configura el transporte con Gmail y clave de app
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Función genérica para enviar correo
const sendEmail = async (to, subject, html) => {

  await transporter.sendMail({
    from: `"BigEgo Soporte" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });
};

// Función específica para recuperación
const sendPasswordResetEmail = async (correo, nombre, token, server) => {

  message = `
  <style type="text/css">
  body {
    font-family: Arial, sans-serif;
    background-color: #f5f8fa;
    color: #333333;
    margin: 0;
    padding: 0;
  }
  #content {
    max-width: 600px;
    background-color: #ffffff;
    margin: 30px auto;
    padding: 30px;
    border-radius: 8px;
    border: 1px solid #d1d9e6;
  }
  h1 {
    font-size: 26px;
    color: #1a1a1a;
    margin-bottom: 20px;
  }
  p {
    font-size: 18px;
    line-height: 1.5;
    margin-bottom: 25px;
  }
  a.button {
    display: inline-block;
    padding: 15px 30px;
    background-color: #007bff; /* azul */
    color: white !important;
    font-size: 17px;
    text-decoration: none;
    border-radius: 6px;
    cursor: pointer;
  }
  a.button:hover {
    background-color: #0056b3;
  }
  .small-text {
    font-size: 14px;
    color: #666666;
    margin-top: 30px;
  }
</style>

<div id="content">
  <h1>Hola ${nombre},</h1>

  <p>Has solicitado restablecer tu contraseña.</p>

  <p>Para continuar, presiona el botón de abajo. Esto te redireccionará a la app para validar tu identidad.</p>

  <a href="${server}/api/users/redirectpassword/${token}"  class="button">Restablecer Contraseña</a>

  <p class="small-text">
    Este código expira en 15 minutos.<br />
    Si no fuiste tú, puedes ignorar este mensaje.
  </p>
</div>
    `;

  await sendEmail(correo, 'Recuperación de contraseña', message);
};

// Función específica para envio de credenciales
const sendAccessCredentialsForEmail = async (correo, nombre, contrasena, urlQR) => {
  message = `
    <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Membresía Activada - Big Ego Gym</title>
  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    body {
      background-color: #f2f4f8;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }

    #content {
      background: white;
      border: 4px solid #007BFF;
      border-radius: 10px;
      max-width: 600px;
      width: 100%;
      padding: 30px;
      color: #333;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 26px;
      color: #007BFF;
      margin-bottom: 10px;
    }

    p {
      font-size: 18px;
      margin: 10px 0;
    }

    strong {
      font-size: 20px;
      color: #000;
    }

    img#qrImage {
      margin-top: 20px;
      width: 250px;
      height: auto;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .note {
      margin-top: 20px;
      font-size: 16px;
      color: #555;
    }

    @media (max-width: 600px) {
      #content {
        padding: 20px;
      }

      img#qrImage {
        width: 200px;
      }
    }
  </style>
</head>
<body>

  <div id="content">
    <h1>Hola ${nombre}</h1>

    <p>¡Felicidades, ya formas parte de nuestra familia <strong>Big Ego Gym</strong>! Bienvenido(a).</p>

    <p><strong>Tu correo:</strong> ${correo}</p>
    <p><strong>Tu contraseña:</strong> ${contrasena}</p>

    <p>Para registrar tu entrada y salida, puedes usar este código QR:</p>
    <img src="${urlQR}" id="qrImage" alt="Código QR del usuario" />

    <p class="note">No olvides que puedes cambiar tu contraseña y consultar tu ID de acceso (QR) en el apartado Perfil.</p>
  </div>

</body>
</html>
    `;

  await sendEmail(correo, 'Alta de usuario', message);
};

const resendAccessCredentials = async (correo, nombre, urlQR) => {
  message = `
    <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Membresía Activada - Big Ego Gym</title>
  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    body {
      background-color: #f2f4f8;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }

    #content {
      background: white;
      border: 4px solid #007BFF;
      border-radius: 10px;
      max-width: 600px;
      width: 100%;
      padding: 30px;
      color: #333;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 26px;
      color: #007BFF;
      margin-bottom: 10px;
    }

    p {
      font-size: 18px;
      margin: 10px 0;
    }

    strong {
      font-size: 20px;
      color: #000;
    }

    img#qrImage {
      margin-top: 20px;
      width: 250px;
      height: auto;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .note {
      margin-top: 20px;
      font-size: 16px;
      color: #555;
    }

    @media (max-width: 600px) {
      #content {
        padding: 20px;
      }

      img#qrImage {
        width: 200px;
      }
    }
  </style>
</head>
<body>

  <div id="content">
    <h1>Hola ${nombre}</h1>

    <p>Hemos detectado que recientemente actualizaste tu correo electrónico, te compartimos nuevamente tu código QR de acceso.</p>

    <p>Para registrar tu entrada y salida, puedes usar este código QR:</p>
    <img src="${urlQR}" id="qrImage" alt="Código QR del usuario" />

    <p class="note">No olvides que puedes cambiar tu contraseña y consultar tu ID de acceso (QR) en el apartado Perfil.</p>
  </div>

</body>
</html>
    `;

  await sendEmail(correo, 'Actualización de correo electrónico', message);
};

const membershipTemplate = async (correo, nombre, urlQR, membresia, fecha) => {
  message = `
   <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Membresía Activada</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f6f8;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .container {
      background-color: #fff;
      border-radius: 10px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      color: #28a745;
    }

    .qr {
      margin-top: 20px;
    }

    .qr img {
      width: 200px;
      height: 200px;
    }

    .details {
      margin-top: 20px;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>¡Membresía Activada!</h1>
    <p>Hola <strong>${nombre}</strong></p>
    <p>Tu membresía <strong>${membresia}</strong> ha sido activada con éxito.</p>
    <div class="details">
      <p>Fecha de expiración:<br></br><strong>${fecha}</strong></p>
    </div>
    <div class="qr">
      <p>QR de acceso:</p>
      <img src="${urlQR}" alt="Código QR de acceso">
    </div>
  </div>
</body>
</html>
    `;

  await sendEmail(correo, 'Activación de membresía', message);
};

module.exports = {
  sendPasswordResetEmail,
  sendAccessCredentialsForEmail,
  membershipTemplate,
  resendAccessCredentials
};
