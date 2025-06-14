const { Schema, model } = require('mongoose');

const CheckInSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  versionKey: false,
  timestamps: true
});

module.exports = model('CheckIn', CheckInSchema);
