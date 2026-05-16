const pool = require("../config/database");

const createNotificationTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,

        user_id INT NOT NULL,
        CONSTRAINT fk_notification_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        type VARCHAR(50) NOT NULL,

        reference_id INT,

        is_read BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_user
      ON notifications(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_read
      ON notifications(is_read);
    `);

  } catch (err) {
    console.error("Error creating notifications table:", err);
  }
};

module.exports = { createNotificationTable };