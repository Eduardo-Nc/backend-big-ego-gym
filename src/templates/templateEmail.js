const { sendEmail } = require('../helpers/sendEmail');


const forgotPasswordTemplate = (data) => {

  return new Promise(async (resolve, reject) => {

    const { name, company, email, token } = data;


    htmlTextEmail = `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Recuperar contraseña</title>
  <link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300&display=swap" rel="stylesheet">
</head>
<body>
  
  <style type="text/css">
    *{
      font-family:Arial;
      text-align:center;
    }
    content {
      display:flex;
      flex-flow:column nowrap;
      justify-content:center;
      align-items: center;
      text-align: center;
      width:100%;
      height:1300px;
      color: white;
      border-radius: 7px;
      border:4px solid blue;
    }
    h1{
        font-size:23px;
        text-transform: capitalize;
    }
    h3{
        text-align: left;
        font-size:15px;
    }
    label{
      font-size:25px;
      font-family: 'Quicksand', sans-serif;
    }
  
    .button {

      background:#007bff;
      padding:10px;
      border-radius:4px;
      text-decoration: none;
      color: white;
  }
    
  
    strong{
      font-size:25px;
    }
    
    </style>
  
  <div id="content">
    <h1>Hola, ${name}</h1>
    <hr>
    <br /> 
    <label>Estás recibiendo este correo porque hiciste una solicitud de recuperación de contraseña para tu cuenta (${email}).</label>
    <br /> <br /> 
    <label id="contrasena">Para continuar, favor de oprimir el siguiente botón: </label> 
    <br />  <br />  <br /> 
    <a href="${process.env.CLIENT_URL}/resetpassword/${token}" class="button">Restablecer Contraseña</a>
    <br /> <br />  <br /> 
    <label id="contrasena">Ó bien copia el siguiente link e ingréselo en su navegador favorito: </label> 
    <br />  <br /> 
    <h3>${process.env.CLIENT_URL}/resetpassword/${token}</h3>
    <br /> <br />
    <label>Si no realizaste esta solicitud, no se requiere realizar ninguna otra acción.</label>
    
    <h3>Saludos, ${company}</h3>
    </div>

</body>
</html>
`;

    let respuesta = await sendEmail(email, `Sistema de recuperación de contraseñas de ${company}`, htmlTextEmail)
    if (respuesta === true) {
      resolve(true)
    } else {
      reject(false)
    }

  })
}


module.exports = {
  forgotPasswordTemplate
};