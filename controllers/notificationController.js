const notificationModel = require('../models/notificationModel')
const  sendResponse = require('../utils/response.formatter');

exports.getUserNotifications = async (req, res) => {
  try {
    // console.log ('Fetching notifications for user:', req.user._id);
    const notifications = await notificationModel.find({userId:req.user._id})
      .sort({ createdAt: -1 });

    return sendResponse(res, {
      status: 200,
      message: 'Notifications fetched',
      data: notifications,
    });
  } catch (error) {
    return sendResponse(res, {
      status: 500,
      message: 'Error fetching notifications',
      data: { error: error.message },
    });
  }
};

exports.getNotificationCount = async (req, res) => {
  try {
    const count = await notificationModel.countDocuments({userId:req.user._id, isRead: false });
    return sendResponse(res, {
      status: 200,
      message: 'Unread notification count',
      data: { count },
    });
  } catch (error) {
    return sendResponse(res, {
      status: 500,
      message: 'Error counting notifications',
      data: { error: error.message },
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationModel.updateMany({userId:req.user._id,  isRead: false }, { isRead: true });
    return sendResponse(res, {
      status: 200,
      message: 'All notifications marked as read',
      data: {},
    });
  } catch (error) {
    return sendResponse(res, {
      status: 500,
      message: 'Error updating notifications',
      data: { error: error.message },
    });
  }
};
