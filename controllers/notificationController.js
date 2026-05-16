const {
  getNotificationServices,
  markAllAsReadService,
  markAsReadService,
  getUnreadNotificationCountService
} = require("../services/notificationService");

//  Get notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await getNotificationServices(userId);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await getUnreadNotificationCountService(userId);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications count" });
  }
};

//  Mark one as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await markAsReadService(req.params.id, userId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
};

//  Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await markAllAsReadService(userId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadNotificationCount
};
