const mongoose = require('mongoose');
const generateCustomId = require('../utils/generateSchemaID');

const stockSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to generate a custom _id before saving
stockSchema.pre('save', function(next) {
  if (this.isNew) {
    // Pass your prefix ('MED' or any other) to the generateCustomId function
    this._id = generateCustomId('STK'); // You can change the 'MED' to any other prefix as needed
  }
  next();
});

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock;
