const express = require('express');
const stockController = require('../controllers/stock.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // Import auth middleware

const stockRouter = express.Router();

// Create a sale
stockRouter.post('/', authMiddleware.verifyToken, stockController.createSale);

// Get all sales with total amount
stockRouter.get('/', authMiddleware.verifyToken, stockController.getAllSales);

module.exports = stockRouter;
