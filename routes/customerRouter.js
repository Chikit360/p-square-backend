const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Route to get all customers
router.get('/', customerController.getAllCustomers);

// Route to get a customer by ID
router.get('/:id', customerController.getCustomerById);
router.get('/:id/purchase-history', customerController.getCustomerPurchaseHistory);


module.exports = router;
