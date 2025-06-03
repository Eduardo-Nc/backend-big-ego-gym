const { Schema, model } = require('mongoose');


const usersSchema = Schema({
    nombreUsuario: {
        type: String,
        require: true
    },
    apellidosUsuario: {
        type: String,
        require: true
    },
    correo: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    telefonoUsuario: {
        type: String,
        require: true
    },
    contrasena: {
        type: String,
        require: true
    },
    direccion: {
        type: String,
        require: true
    },
    fotoUsuario: {
        type: String,
        require: true
    },
    qrUsuario: {
        type: String,
        require: true
    },
    edadUsuario: {
        type: Date,
        require: false
    },
    rol:
    {
        type: Schema.Types.ObjectId,
        ref: "role",
        require: true
    },
    creationDate: {
        type: Date,
        defaultValue: new Date(),
        require: true
    },
    status:
    {
        type: Boolean,
        require: true,
        defaultValue: true
    }
},
    {
        versionKey: false,
        timestamps: true
    });

module.exports = model('Users', usersSchema);



