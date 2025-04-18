const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getNotificationCount,
  markAllAsRead
} = require('../controllers/notificationController');



router.get('/',  getUserNotifications);
router.get('/count',  getNotificationCount);
router.put('/mark-all-read',  markAllAsRead);

module.exports = router;
