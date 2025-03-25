// routes/stockRoutes.ts
const express = require('express');
const stockController = require('../controllers/stock.controller');
const stockRouter = express.Router();

// Add Stock
stockRouter.post('/', stockController.addOrUpdateStock);

// Get All Stock Details (Grouped by Medicine ID)
stockRouter.get('/', stockController.getAllStockDetails);


module.exports = stockRouter;
