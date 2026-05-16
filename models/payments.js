const pool = require("../config/database");
const createPaymentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,

      user_id INT,
      ad_id INT,

      amount DECIMAL(10,2) NOT NULL,

      method VARCHAR(50), -- PayHere, bank, etc.

      status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),

      transaction_id TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating payments table:", err);
  }
};

module.exports = { createPaymentsTable };