const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");

const {
  createTicket,
  sendMessage,
  getTickets,
  getMessages,
  closeTicket,
} = require("../controllers/supportController");

// ================= USER =================

// Create ticket (Contact Support)
router.post("/ticket", authMiddleware, createTicket);

// Send message (user/admin reply)
router.post("/message", authMiddleware, sendMessage);

// Get logged-in user's tickets
router.get("/", authMiddleware, getTickets);

// Get messages of a ticket
router.get("/:ticketId", authMiddleware, getMessages);

// Close ticket
router.patch("/:ticketId/close", authMiddleware, closeTicket);

module.exports = router;
