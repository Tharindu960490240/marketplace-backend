const pool = require("../config/database");

const createSupportTables = async () => {
  try {
    // 🎫 Tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,

        user_id INT NOT NULL,
        CONSTRAINT fk_ticket_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        subject VARCHAR(255) NOT NULL,

        status VARCHAR(20) DEFAULT 'open'
          CHECK (status IN ('open', 'closed')),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 💬 Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,

        ticket_id INT NOT NULL,
        CONSTRAINT fk_ticket
          FOREIGN KEY(ticket_id)
          REFERENCES support_tickets(id)
          ON DELETE CASCADE,

        sender_id INT NOT NULL,
        CONSTRAINT fk_sender
          FOREIGN KEY(sender_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        message TEXT NOT NULL,

        is_read BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ⚡ Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_user
      ON support_tickets(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_ticket
      ON support_messages(ticket_id);
    `);

  } catch (err) {
    console.error("Error creating support tables:", err);
  }
};

module.exports = { createSupportTables };