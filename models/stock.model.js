const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a unique combination of medicineId and expiryDate
StockSchema.index({ medicineId: 1, expiryDate: 1 }, { unique: true });

const Stock = mongoose.model('Stock', StockSchema);
module.exports = Stock;
