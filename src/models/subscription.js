const { Schema, model } = require('mongoose');

const subscriptionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  typeSubscription: {
    type: String,
    enum: ['Día', 'Semana', 'Mes'],
    required: true,
  },
  category: {
    type: String,
    enum: ['membership'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  versionKey: false,
  timestamps: true
});


module.exports = model('subscription', subscriptionSchema);