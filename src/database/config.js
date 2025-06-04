const mongoose = require('mongoose');

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_CNN); // Opciones innecesarias en Mongoose 6+

        console.log('✅ DB en línea');
    } catch (error) {
        console.error('❌ Error de conexión a MongoDB:', error.message);
        throw new Error('Error al inicializar la BD');
    }
};

module.exports = {
    dbConnection
};