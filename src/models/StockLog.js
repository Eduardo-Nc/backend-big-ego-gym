const { Schema, model, Types } = require('mongoose');

const StockLogSchema = new Schema({
  product: {
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  quantityChange: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    enum: ['initial', 'sale', 'manual_adjustment', 'return', 'restock'],
    default: 'manual_adjustment',
  },
  description: {
    type: String,
  },
}, {
  versionKey: false,
  timestamps: true
});

module.exports = model('StockLog', StockLogSchema);
