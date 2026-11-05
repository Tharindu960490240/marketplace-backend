const {
  closeTicketService,
  createTicketService,
  getAllTicketsService,
  getMessagesService,
  getTicketByIdService,
  getUserTicketsService,
  markMessagesAsReadService,
  sendMessageService,
} = require("../services/supportService");
const {
  createNotificationService,
  createAdminNotificationService,
  markNotificationsAsReadByReferenceService
} = require("../services/notificationService");

//  Create ticket
const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user.id;

    const ticket = await createTicketService(userId, subject, message);

    //  notify every admin (was hardcoded to user id 1)
    await createAdminNotificationService("new_ticket", ticket.id);

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

//  Send message
const sendMessage = async (req, res) => {
  try {
    const { ticketId, message } = req.body;
    const senderId = req.user.id;

    const ticket = await getTicketByIdService(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    //  Check ownership or admin
    if (ticket.user_id !== senderId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await sendMessageService(ticketId, senderId, message);

    //  Notify the other side: admin reply -> ticket owner; user reply -> all admins
    if (req.user.role === "admin") {
      if (ticket.user_id !== senderId) {
        await createNotificationService(
          ticket.user_id,
          "support_reply",
          ticketId,
        );
      }
    } else {
      await createAdminNotificationService("support_reply", ticketId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

//  Get tickets
const getTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets =
      req.user.role === "admin"
        ? await getAllTicketsService()
        : await getUserTicketsService(userId);

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

//  Get messages
const getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await getTicketByIdService(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Mark chat messages as read
    await markMessagesAsReadService(ticketId, userId);

    // Mark related notifications as read
    await markNotificationsAsReadByReferenceService(
      userId,
      ticketId
    );

    const messages = await getMessagesService(ticketId);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

//  Close ticket
const closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await getTicketByIdService(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await closeTicketService(ticketId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to close ticket" });
  }
};

module.exports = {
  createTicket,
  sendMessage,
  getTickets,
  getMessages,
  closeTicket,
};
