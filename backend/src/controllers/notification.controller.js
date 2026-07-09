const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const listMine = catchAsync(async (req, res) => {
  const { items, meta, unreadCount } = await notificationService.listMine(req.user._id, req.query);
  return new ApiResponse(200, { items, meta, unreadCount }, 'Notifications retrieved').send(res);
});

const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.unreadCount(req.user._id);
  return new ApiResponse(200, { count }, 'Unread count retrieved').send(res);
});

const markRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  return new ApiResponse(200, notification, 'Notification marked as read').send(res);
});

const markAllRead = catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  return new ApiResponse(200, null, 'All notifications marked as read').send(res);
});

module.exports = { listMine, getUnreadCount, markRead, markAllRead };
