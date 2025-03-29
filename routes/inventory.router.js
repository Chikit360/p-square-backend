// routes/stockRoutes.ts
const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const inventoryRouter = express.Router();

// Add inventory
inventoryRouter.post('/', inventoryController.addOrUpdateInventory);

// Get All inventory Details (Grouped by Medicine ID)
inventoryRouter.get('/', inventoryController.getAllInventoryDetails);

// inventory by medicineId
inventoryRouter.get('/medicine-id/:id', inventoryController.getInventoryDetailsByMedicineId);


module.exports = inventoryRouter;
