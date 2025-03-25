const express = require('express');
const sellController = require('../controllers/sell.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // Import auth middleware

const sellRouter = express.Router();

// Create a sale
sellRouter.post('/', authMiddleware.verifyToken, sellController.createSale);

// Get all sales with total amount
sellRouter.get('/', authMiddleware.verifyToken, sellController.getAllSales);

module.exports = sellRouter;
