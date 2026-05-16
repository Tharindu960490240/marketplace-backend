const pool = require("../config/database");

const createSubscriptionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,

          user_id INT NOT NULL,
          CONSTRAINT fk_subscription_user
            FOREIGN KEY(user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

          plan VARCHAR(10) NOT NULL 
            CHECK (plan IN ('basic', 'premium')),

          start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMP NOT NULL,

          status VARCHAR(10) NOT NULL 
            CHECK (status IN ('active', 'expired')),

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
      ON subscriptions(user_id);
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription
      ON subscriptions(user_id)
      WHERE status = 'active';
    `);

    // console.log("Subscriptions table & indexes created");
  } catch (err) {
    console.error("Error creating subscriptions table:", err);
  }
};

module.exports = { createSubscriptionsTable };