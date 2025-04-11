const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  /**
   * The user or entity the token is associated with.
   * Replace 'User' with the appropriate model name if needed.
   */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  /**
   * The actual token string.
   */
  token: {
    type: String,
    required: true,
    unique: true
  },

  /**
   * Issued At timestamp (UNIX epoch in seconds).
   */
  iat: {
    type: Number,
    required: true
  },

  /**
   * Expiration timestamp (UNIX epoch in seconds).
   */
  exp: {
    type: Number,
    required: true
  },

  /**
   * Type of token (optional but recommended).
   * e.g., 'access', 'refresh', 'email_verification', etc.
   */
  type: {
    type: String,
    enum: ['access', 'refresh', 'email_verification', 'password_reset'],
    required: true
  },

  /**
   * Whether the token is still valid.
   */
  blacklisted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Token', tokenSchema);
