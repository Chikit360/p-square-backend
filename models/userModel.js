const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateCustomId = require('../utils/generateSchemaID');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['pharmacy_manager', 'pharmacist', 'cashier', 'pharmacy_staff', 'customer'],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});


// Middleware to hash the password before saving
userSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Pass your prefix ('MED' or any other) to the generateCustomId function
      this._id = generateCustomId('USR'); // You can change the 'MED' to any other prefix as needed
    }
    if (!this.isModified('password')) {
      return next();
    }
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    // Replace the plain text password with the hashed password
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};



const User = mongoose.model('User', userSchema);
module.exports = User;
