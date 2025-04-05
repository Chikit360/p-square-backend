const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sendResponse = require('../utils/response.formatter');

const userController = {};

// User login
userController.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return sendResponse(res, {
        data: null,
        status: 404,
        message: 'User not found',
        error: true
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendResponse(res, {
        data: null,
        status: 400,
        message: 'Invalid password',
        error: true
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '365d' });

    return sendResponse(res, {
      data: { ...user.toObject(), token },
      status: 200,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return sendResponse(res, {
      data: null,
      status: 500,
      message: 'Internal server error',
      error: true
    });
  }
};

// Get current logged-in user info
userController.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return sendResponse(res, {
        data: null,
        status: 404,
        message: 'User not found',
        error: true
      });
    }
    return sendResponse(res, {
      data: user,
      status: 200,
      message: 'User info retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return sendResponse(res, {
      data: null,
      status: 500,
      message: 'Internal server error',
      error: true
    });
  }
};

// Update user
userController.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');

    if (!updatedUser) {
      return sendResponse(res, {
        data: null,
        status: 404,
        message: 'User not found',
        error: true
      });
    }

    return sendResponse(res, {
      data: updatedUser,
      status: 200,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return sendResponse(res, {
      data: null,
      status: 500,
      message: 'Internal server error',
      error: true
    });
  }
};

// Delete user
userController.deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return sendResponse(res, {
        data: null,
        status: 404,
        message: 'User not found',
        error: true
      });
    }

    return sendResponse(res, {
      data: null,
      status: 200,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendResponse(res, {
      data: null,
      status: 500,
      message: 'Internal server error',
      error: true
    });
  }
};

module.exports = userController;
