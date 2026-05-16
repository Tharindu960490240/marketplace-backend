const pool = require("../config/database");

// ================= CREATE PAYMENT =================
const createPayment = async (data) => {
  const { user_id, ad_id, amount, method } = data;

  const result = await pool.query(
    `INSERT INTO payments 
     (user_id, ad_id, amount, method, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [user_id, ad_id, amount, method]
  );

  return result.rows[0];
};

// ================= COMPLETE PAYMENT =================
const completePayment = async (paymentId, transactionId) => {
  const result = await pool.query(
    `UPDATE payments
     SET status='completed', transaction_id=$2
     WHERE id=$1
     RETURNING *`,
    [paymentId, transactionId]
  );

  return result.rows[0];
};

// ================= GET USER PAYMENTS =================
const getUserPayments = async (userId) => {
  const result = await pool.query(
    `SELECT p.*, a.title
     FROM payments p
     JOIN ads a ON p.ad_id = a.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows;
};

module.exports = {
  createPayment,
  completePayment,
  getUserPayments
};