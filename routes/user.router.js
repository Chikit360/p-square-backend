// user.router.js
const express = require('express');
const bodyParser = require('body-parser');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// User login route
router.post('/login', userController.login);

// Get current user info
router.get('/me', authMiddleware.verifyToken, userController.getCurrentUser);

// Delete user
router.delete('/:id', authMiddleware.verifyToken, userController.deleteUser);

// Update user
router.put('/:id', authMiddleware.verifyToken, userController.updateUser);

module.exports = router;
