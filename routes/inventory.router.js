// routes/stockRoutes.ts
const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const inventoryRouter = express.Router();

// Add inventory
inventoryRouter.post('/', inventoryController.addOrUpdateInventory);

// Get All inventory Details (Grouped by Medicine ID)
inventoryRouter.get('/', inventoryController.getAllInventoryDetails);

// inventory by medicineId
inventoryRouter.get('/medicine-id/:id', inventoryController.getInventoryDetailsByMedicineId);

// Route for adding inventory
inventoryRouter.post('/add', inventoryController.addInventory);

// Route for updating inventory by ID
inventoryRouter.put('/:inventoryId/update', inventoryController.updateInventoryById);


module.exports = inventoryRouter;
