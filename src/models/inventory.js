const { Schema, model } = require('mongoose');

const InventorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Máquina', 'Banco', 'Pesas', 'Accesorio', 'Otro'],
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    condition: {
        type: String,
        enum: ['Nuevo', 'Usado', 'Reparado'],
        default: 'Nuevo',
    },
    price: {
        type: Number,
        min: 0,
        default: 0,
    },
    brand: {
        type: String,
        trim: true,
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model('inventory', InventorySchema);
