const mongoose = require('mongoose');

/**
 * Inventory Schema
 * Defines the structure for storing inventory-related information in the database.
 */
const inventorySchema = new mongoose.Schema({
  /**
   * Reference to the associated medicine.
   * Required: Yes
   * Type: ObjectId
   * Refers to the 'Medicine' collection.
   */
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  /**
   * Reference to the supplier.
   * Required: Yes
   * Type: ObjectId
   * Refers to the 'Supplier' collection.
   */
  // supplier: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Supplier',
  //   required: true
  // },
  /**
   * The batch number of the medicine.
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  batchNumber: {
    type: String,
    trim: true
  },
  /**
   * Date when the medicine was manufactured.
   * Required: No
   * Type: Date
   */
  manufactureDate: {
    type: Date
  },
  /**
   * Date after which the medicine should not be used.
   * Required: No
   * Type: Date
   */
  expiryDate: {
    type: Date
  },
  /**
   * Maximum Retail Price of the medicine.
   * Required: Yes
   * Type: Number
   */
  mrp: {
    type: Number,
    required: true
  },
  /**
   * Price at which the medicine was purchased.
   * Required: Yes
   * Type: Number
   */
  purchasePrice: {
    type: Number,
    required: true
  },
  /**
   * Price at which the medicine is sold.
   * Required: Yes
   * Type: Number
   */
  sellingPrice: {
    type: Number,
    required: true
  },
  /**
   * Current stock level of the medicine.
   * Required: Yes
   * Type: Number
   */
  quantityInStock: {
    type: Number,
    required: true
  },
  /**
   * Minimum quantity to maintain in stock.
   * Required: Yes
   * Type: Number
   */
  minimumStockLevel: {
    type: Number,
    required: true
  },
  /**
   * Storage location within the facility.
   * Required: No
   * Type: String
   * Trims leading and trailing whitespace.
   */
  shelfLocation: {
    type: String,
    trim: true
  },
  /**
   * Stock level at which reordering is triggered.
   * Required: Yes
   * Type: Number
   */
  // reorderLevel: {
  //   type: Number,
  //   required: true
  // },
  // /**
  //  * Lead time in days to replenish stock.
  //  * Required: Yes
  //  * Type: Number
  //  */
  // leadTime: {
  //   type: Number,
  //   required: true
  // }
}, {
  /**
   * Automatically adds `createdAt` and `updatedAt` timestamps to the schema.
   */
  timestamps: true
});

/**
 * Compound index to ensure unique combination of `medicineId` and `expiryDate`.
 * This helps in preventing duplicate records for the same medicine batch.
 */
inventorySchema.index({ medicineId: 1, expiryDate: 1,batchNumber:1 }, { unique: true });

/**
 * Inventory Model
 * Represents the 'Inventory' collection in the database.
 */
const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
