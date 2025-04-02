const express = require('express');
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware'); // Import auth middleware

const stockRouter = express.Router();

// Create a sale
stockRouter.post('/', authMiddleware.verifyToken, stockController.createSale);

// Get all sales with total amount
stockRouter.get('/', authMiddleware.verifyToken, stockController.getAllSales);

module.exports = stockRouter;
