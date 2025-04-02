const mongoose = require('mongoose');
const generateCustomId = require('../utils/generateSchemaID');

/**
 * Medicine Schema
 * Defines the structure for storing medicine-related information in the database.
 */
const medicineSchema = new mongoose.Schema({
  
  /**
   * Unique of the medicine.
   * Required: Yes
   * Type: String
   * Trims leading and trailing whitespace.
   */
  medicineCode: {
    type: String,
    required: true,
    trim: true
  },
  /**
   * Name of the medicine.
   * Required: Yes
   * Type: String
   * Trims leading and trailing whitespace.
   */
  name: {
    type: String,
    required: true,
    trim: true
  },
  /**
   * Generic Name of the medicine.
   * Required: Yes
   * Type: String
   * Trims leading and trailing whitespace.
   */
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  /**
   * Manufacturer of the medicine.
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  // manufacturer: {
  //   type: String,
  //   trim: true
  // },
  /**
   * Category of the medicine (e.g., antibiotic, analgesic).
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  // category: {
  //   type: String,
  //   trim: true
  // },
  /**
   * Form of the medicine (e.g., tablet, capsule).
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  form: {
    type: String,
    trim: true
  },
  /**
   * Strength of the medicine (e.g., 500 mg).
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  strength: {
    type: String,
    trim: true
  },
  /**
   * Unit of measurement (e.g., pieces, bottles).
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  unit: {
    type: String,
    trim: true
  },
  /**
   * Indicates if a prescription is required to dispense the medicine.
   * Required: No
   * Type: Boolean
   * Default: false
   */
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  /**
   * Additional notes or information about the medicine.
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  // notes: {
  //   type: String,
  //   trim: true
  // },
  /**
   * Status of the medicine's availability.
   * Required: No
   * Type: String
   * Enum: ['Active', 'Inactive']
   * Default: 'Active'
   */
  // status: {
  //   type: String,
  //   enum: ['active', 'inactive'],
  //   default: 'Active'
  // }
}, {
  /**
   * Automatically adds `createdAt` and `updatedAt` timestamps to the schema.
   */
  timestamps: true
});

// Pre-save hook to generate a custom _id before saving
medicineSchema.pre('save', function(next) {
  if (this.isNew) {
    // Pass your prefix ('MED' or any other) to the generateCustomId function
    this._id = generateCustomId('MED'); // You can change the 'MED' to any other prefix as needed
  }
  next();
});

/**
 * Medicine Model
 * Represents the 'Medicine' collection in the database.
 */
const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;
