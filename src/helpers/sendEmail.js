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
const sendPasswordResetEmail = async (correo, nombre, token) => {

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

  <a href="http://10.0.2.2:4000/api/users/redirectpassword/${token}" class="button">Restablecer Contraseña</a>

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
    <style type="text/css">
    *{
      font-family:Arial;
      text-align:flex-start;
    }
    content {
      display:flex;
      flex-flow:column nowrap;
      justify-content:flex-start;
      align-items: flex-start;
      text-align: left;
      width:100%;
      height:1300px;
      color: white;
      border-radius: 7px;
      border:4px solid blue;
    }
    h1{
        font-size:22px;
        text-transform: capitalize;
    }
    label{
      font-size:18px;
    }
  
    a.button {
      -webkit-appearance: button;
      -moz-appearance: button;
      appearance: button;
      font-size:25px;
      color:blue;
      text-decoration: none;
      color: initial;
  }
  
    strong{
      font-size:25px;
    }
    </style>
  
    <div id="content">
    <h1>Hola ${nombre}</h1>
    <br /> 
    <label>¡Felicidades, ya formas parte de nuestra familia Big Ego Gym! Bienvenido(a)</label>
    <br /> <br /> 
    <label id="contrasena">Tú correo es: </label> 
    <br /> 
    <strong id="contrasena">${correo}</strong>
    <br /> <br /> 
    <label id="contrasena">Tú contraseña es: </label> 
    <br /> 
    <strong id="contrasena">${contrasena}</strong>
    <br /> <br /> 
      <label id="contrasena">Para registrar tu entrada y salida podrias utilizar tu QR: </label> 
    <br /> <br /> 
    <img src="${urlQR}" id="qrImage" alt="Código QR del usuario" width="300" />
    <br /> <br /> 
    <label>No olvides que puedes cambiar tú contraseña y consultar tu ID de acceso (QR) en el apartado perfil</label>
    <br />
    </div>
    `;

  await sendEmail(correo, 'Alta de usuario', message);
};

module.exports = {
  sendPasswordResetEmail,
  sendAccessCredentialsForEmail
};
