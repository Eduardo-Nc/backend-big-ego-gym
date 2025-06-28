const { Schema, model } = require('mongoose');

const SaleItemSchema = new Schema({
    itemType: {
        type: String,
        enum: ['products', 'membership'],
        required: true,
    },
    item: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'items.itemType',
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const SalesSchema = new Schema({
    items: {
        type: [SaleItemSchema],
        required: true
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Efectivo', 'Transferencia', 'Pendiente'],
        required: true,
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    paid: {
        type: Boolean,
        required: true,
        default: false
    },
    paymentDate: {
        type: Date,
        default: Date.now,
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

module.exports = model('Sale', SalesSchema);
