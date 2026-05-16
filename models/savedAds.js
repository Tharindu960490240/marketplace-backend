// tables/savedAdsTable.js

const pool = require("../config/database");

const createSavedAdsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS saved_ads (
      id SERIAL PRIMARY KEY,

      user_id INT NOT NULL,
      CONSTRAINT fk_saved_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      ad_id INT NOT NULL,
      CONSTRAINT fk_saved_ad
        FOREIGN KEY(ad_id)
        REFERENCES ads(id)
        ON DELETE CASCADE,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(user_id, ad_id)
    );
  `;

  try {
    await pool.query(query);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_ads_user_id
      ON saved_ads(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_ads_ad_id
      ON saved_ads(ad_id);
    `);

    // console.log("saved_ads table created");
  } catch (err) {
    console.error("Error creating saved_ads table:", err);
  }
};

module.exports = { createSavedAdsTable };