const express = require('express');
const { dashboardAnalytics } = require('../controllers/adminController');
const router = express.Router();


// Route to get all customers
router.get('/analytics', dashboardAnalytics);

module.exports = router;
