const mongoose = require('mongoose');

// Define possible values using enums
const FORM_ENUM = ['tablet', 'capsule', 'syrup', 'injection', 'ointment'];
const STRENGTH_ENUM = ['100 mg', '250 mg', '500 mg', '1 g', '2 g'];
const UNIT_ENUM = ['pieces', 'boxes', 'bottles', 'packs', 'strips'];

const medicineSchema = new mongoose.Schema({
  // A unique identifier for each medicine
  medicineId: {
    type: String,
    required: true,
    unique: true,
  },

  // The brand or generic name of the medicine
  name: {
    type: String,
    required: true,
  },

  // The scientific name of the medicine
  genericName: {
    type: String,
    required: true,
  },

  // The name of the manufacturer producing the medicine
  manufacturer: {
    type: String,
    required: true,
  },

  // Reference to the supplier (Supplier ID) from whom the medicine is purchased
  // supplierId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Supplier',
  //   required: true,
  // },

  // Classification of medicine (e.g., antibiotic, analgesic, etc.)
  category: {
    type: String,
    required: true,
  },

  // Form of the medicine (restricted to specific forms using enum)
  form: {
    type: String,
    enum: FORM_ENUM,
    required: true,
  },

  // Dosage strength (restricted using enum)
  strength: {
    type: String,
    enum: STRENGTH_ENUM,
    required: true,
  },

  // Unit of measurement (restricted using enum)
  unit: {
    type: String,
    enum: UNIT_ENUM,
    required: true,
  },

  // The batch number of the medicine
  batchNumber: {
    type: String,
    required: true,
  },

  // Date the medicine was manufactured
  manufactureDate: {
    type: Date,
    required: true,
  },


  // Maximum Retail Price (MRP) for the medicine
  mrp: {
    type: Number,
    required: true,
  },

  // The price at which the medicine was purchased
  purchasePrice: {
    type: Number,
    required: true,
  },

  // The price at which the medicine is sold to customers
  sellingPrice: {
    type: Number,
    required: true,
  },

  // Minimum quantity that should be kept in inventory
  minimumStockLevel: {
    type: Number,
    required: true,
  },

  // Shelf location within the pharmacy for storage
  shelfLocation: {
    type: String,
    required: true,
  },

  // Indicates whether a prescription is required to dispense the medicine
  prescriptionRequired: {
    type: Boolean,
    required: true,
  },

  // Additional notes or warnings about the medicine
  notes: {
    type: String,
  },

  // Status of the medicine (active or inactive)
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps automatically


const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;
