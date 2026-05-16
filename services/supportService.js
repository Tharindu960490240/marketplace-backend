const pool = require("../config/database");

//  Create ticket
const createTicketService = async (userId, subject, message) => {
  const ticketResult = await pool.query(
    `INSERT INTO support_tickets (user_id, subject)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, subject],
  );

  const ticket = ticketResult.rows[0];

  await pool.query(
    `INSERT INTO support_messages (ticket_id, sender_id, message)
     VALUES ($1, $2, $3)`,
    [ticket.id, userId, message],
  );

  return ticket;
};

//  Send message
const sendMessageService = async (ticketId, senderId, message) => {
  const result = await pool.query(
    `INSERT INTO support_messages (ticket_id, sender_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ticketId, senderId, message],
  );

  return result.rows[0];
};

//  Get user tickets
const getUserTicketsService = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      st.*,
      u.first_name,
      u.profile_image,
      COUNT(sm.id) FILTER (
        WHERE sm.is_read = false 
        AND sm.sender_id != $1
      ) AS unread_count
    FROM support_tickets st
    JOIN users u ON st.user_id = u.id
    LEFT JOIN support_messages sm 
      ON sm.ticket_id = st.id
    WHERE st.user_id = $1
    GROUP BY st.id, u.first_name, u.profile_image
    ORDER BY st.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

//  Get all tickets (admin)
const getAllTicketsService = async () => {
  const result = await pool.query(
    `
    SELECT 
      st.*,
      u.first_name,
      u.profile_image,
      COUNT(sm.id) FILTER (
        WHERE sm.is_read = false 
        AND sm.sender_id = u.id
      ) AS unread_count
    FROM support_tickets st
    JOIN users u ON st.user_id = u.id
    LEFT JOIN support_messages sm 
      ON sm.ticket_id = st.id
    GROUP BY st.id, u.first_name, u.profile_image
    ORDER BY st.created_at DESC
    `,
  );

  return result.rows;
};

//  Get messages
const getMessagesService = async (ticketId) => {
  const result = await pool.query(
    `SELECT *
     FROM support_messages
     WHERE ticket_id = $1
     ORDER BY created_at ASC`,
    [ticketId],
  );

  return result.rows;
};

//  Close ticket
const closeTicketService = async (ticketId) => {
  await pool.query(
    `UPDATE support_tickets
     SET status = 'closed', updated_at = NOW()
     WHERE id = $1`,
    [ticketId],
  );
};

//  Check ticket ownership
const getTicketByIdService = async (ticketId) => {
  const result = await pool.query(
    `SELECT * FROM support_tickets WHERE id = $1`,
    [ticketId],
  );

  return result.rows[0];
};

//  Mark messages as read
const markMessagesAsReadService = async (ticketId, userId) => {
  await pool.query(
    `UPDATE support_messages
     SET is_read = TRUE
     WHERE ticket_id = $1 AND sender_id != $2`,
    [ticketId, userId],
  );
};

module.exports = {
  createTicketService,
  sendMessageService,
  getUserTicketsService,
  getAllTicketsService,
  getMessagesService,
  closeTicketService,
  getTicketByIdService,
  markMessagesAsReadService,
};
