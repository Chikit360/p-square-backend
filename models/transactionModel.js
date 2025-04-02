const mongoose = require('mongoose');
const generateCustomId = require('../utils/generateSchemaID');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sell',
  },
  transactionType: {
    type: String,
    enum: ['Sale', 'Purchase', 'Return'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Cheque', 'UPI', 'Net Banking'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Cancelled'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate a custom _id before saving
transactionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Pass your prefix ('MED' or any other) to the generateCustomId function
    this._id = generateCustomId('TRNC'); // You can change the 'MED' to any other prefix as needed
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
