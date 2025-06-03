const express = require('express');
require('dotenv').config();
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');


const { dbConnection } = require('./src/database/config');
const { createRoles, createUsers } = require('./src/libs/initialDB');


// createRoles();
// createUsers();

// Base de datos
dbConnection();

// CORS
app.use(cors());

// FILEUPLOAD
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: false
}));


// MORGAN
app.use(morgan('dev'));


// Lectura y parseo del body
app.use(express.json());



// Rutas
//Página de inicio
app.get('/', (req, res) => {
  res.send('Bienvenido al servidor "BIG EGO GYM"')
})

app.use('/api/users', require('./src/routes/users.routes'));


app.use(express.static(path.join(__dirname, './public')));

app.use(express.static(path.join(__dirname, './src/facturas')));

app.use(express.static(path.join(__dirname, './src/templates')));


app.set('port', process.env.PORT || 30020);


server.listen(app.get('port'), () => {
  console.log(`Servidor corriendo en puerto: ${app.get('port')}`);
});
