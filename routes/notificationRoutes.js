const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadNotificationCount
} = require("../controllers/notificationController");


// ================= USER =================

// Get logged-in user's notifications
router.get("/", authMiddleware, getNotifications);
router.get("/count", authMiddleware, getUnreadNotificationCount);

// Mark single notification as read
router.patch("/:id/read", authMiddleware, markAsRead);

// Mark all notifications as read
router.patch("/read-all", authMiddleware, markAllAsRead);


module.exports = router;