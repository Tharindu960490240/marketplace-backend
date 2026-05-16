const pool = require("../config/database");

//  Create notification
const createNotificationService = async (userId, type, referenceId) => {
  await pool.query(
    `INSERT INTO notifications (user_id, type, reference_id)
     VALUES ($1, $2, $3)`,
    [userId, type, referenceId]
  );
};

//  Get notifications
const getNotificationServices = async (userId) => {
  const result = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

const getUnreadNotificationCountService = async (userId) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM notifications
    WHERE user_id = $1
    AND is_read = false
    `,
    [userId]
  );

  return parseInt(result.rows[0].count, 10);
};

//  Mark one as read
const markAsReadService = async (id, userId) => {
  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
};

//  Mark all as read
const markAllAsReadService = async (userId) => {
  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1`,
    [userId]
  );
};

const markNotificationsAsReadByReferenceService = async (
  userId,
  referenceId
) => {
  await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1
    AND reference_id = $2
    `,
    [userId, referenceId]
  );
};

module.exports = {
  createNotificationService,
  getNotificationServices,
  markAsReadService,
  markAllAsReadService,
  getUnreadNotificationCountService,
  markNotificationsAsReadByReferenceService
};