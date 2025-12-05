const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
  workId: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: false }
});

const FarmerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  profileImage: String,
  payments: [PaymentSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Farmer', FarmerSchema);