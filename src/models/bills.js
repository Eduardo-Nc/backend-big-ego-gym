const { Schema, model } = require('mongoose');

const BillsSchema = new Schema({
    typePay: {
        type: String,
        enum: ['Efectivo', 'Transferencia'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: false,
        min: 0
    },
    responsible: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        require: true
    },
    description: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
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

module.exports = model('bill', BillsSchema);
