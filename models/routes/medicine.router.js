const express = require('express');
const medicineController = require('../controllers/medicine.controller');

const router = express.Router();

// Create a new medicine
router.post('/', medicineController.createMedicine);

// Search medicines
router.get('/search', medicineController.searchMedicines);

// Filter medicines
router.get('/filter', medicineController.filterMedicines);

// Receive notifications for low stock
router.get('/low-stock', medicineController.lowStockNotifications);

// Sort medicines
router.get('/sort', medicineController.sortMedicines);

// Expiration alerts for medicines nearing expiry
router.get('/expiration-alerts', medicineController.expirationAlerts);

// Update quantity of a specific medicine
router.patch('/:id/quantity', medicineController.updateMedicineQuantity);

// Read all medicines
router.get('/', medicineController.getAllMedicines);

// ative available medicine 
router.get('/active', medicineController.getAvailableMedicines);

// Read medicine by ID
router.get('/:id', medicineController.getMedicineById);

// Update a medicine by ID
router.put('/:id', medicineController.updateMedicineById);

// Delete a medicine by ID
router.delete('/:id', medicineController.deleteMedicineById);

module.exports = router;
