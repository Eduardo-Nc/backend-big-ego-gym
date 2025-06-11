const { Schema, model } = require('mongoose');

const ProductsSchema = new Schema({
    category: {
        type: String,
        enum: ['products'],
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: false,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: false
    },
    creationDate: {
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

module.exports = model('Product', ProductsSchema);
