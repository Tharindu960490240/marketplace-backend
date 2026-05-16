const pool = require("../config/database");

const downgradeExpiredUsers = async () => {
  try {
    await pool.query(`
      UPDATE users
      SET subscription_type = 'basic'
      WHERE subscription_type = 'premium'
      AND subscription_expiry < NOW()
    `);

    console.log("Expired subscriptions downgraded");
  } catch (err) {
    console.error("Cron job error:", err);
  }
};

module.exports = downgradeExpiredUsers;