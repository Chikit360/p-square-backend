const mongoose = require('mongoose');
const generateCustomId = require('../utils/generateSchemaID');
const { Schema } = mongoose;

// Define the Customer Schema
const customerSchema = new Schema(
  {
    email: {
      type: String,
      required: false, // Not required
      unique: true, // Email should be unique if provided
      lowercase: true, // Convert email to lowercase
      trim: true, // Trim any whitespace
    },
    name: {
      type: String,
      required: false, // Not required
      trim: true, // Trim any extra spaces
    },
    mobile: {
      type: String,
      required: true, // Mobile is required
      unique: true, // Ensure the mobile number is unique
      validate: {
        validator: function (v) {
          // Custom regex for validating mobile number format
          return /\d{10}/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock', // Reference to the Stock model, assuming you have one
      },
    ],
    dateOfBirth: {
      type: Date,
      required: false, // Not required
    },
    address: {
      type: String,
      required: false, // Not required
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'], // Optionally include gender field
      required: false,
    },
    medicalHistory: {
      type: String,
      required: false, // Not required
      trim: true,
    },
  },
  {
    timestamps: true, // This will automatically manage createdAt and updatedAt fields
  }
);

// Pre-save hook to generate a custom _id before saving
customerSchema.pre('save', function(next) {
  if (this.isNew) {
    // Pass your prefix ('MED' or any other) to the generateCustomId function
    this._id = generateCustomId('CUST'); // You can change the 'MED' to any other prefix as needed
  }
  next();
});

// Create and export the Customer model
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
