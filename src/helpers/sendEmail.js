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
        font-size:26px;
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
    <label>Has solicitado restablecer tu contraseña.</label>
    <br /> <br /> 
    <label id="contrasena">Copia este código/token y pégalo en tu app para continuar: </label> 
    <br /> 
   <a href="${token}">${token}</a>
    <br /> <br /> 
    <label>Este código expira en 15 minutos.</label>
    <br /> <br /> 
    <label>Si no fuiste tú, puedes ignorar este mensaje.</label>
    <br />
    </div>
    `;

    await sendEmail(correo, 'Recuperación de contraseña', message);
};

// Función específica para envio de credenciales
const sendAccessCredentialsForEmail = async (correo, nombre, contrasena) => {
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
    <label>No olvides cambiar tú contraseña en el apartado de perfil</label>
    <br />
    </div>
    `;

    await sendEmail(correo, 'Alta de usuario', message);
};

module.exports = {
    sendPasswordResetEmail,
    sendAccessCredentialsForEmail
};
