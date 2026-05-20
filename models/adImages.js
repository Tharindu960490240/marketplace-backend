const pool = require("../config/database");
const createAdImagesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ad_images (
      id SERIAL PRIMARY KEY,

      ad_id INT NOT NULL,
      CONSTRAINT fk_ad
        FOREIGN KEY(ad_id)
        REFERENCES ads(id)
        ON DELETE CASCADE,

      image_url TEXT NOT NULL,
      image_key TEXT,

      is_primary BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating ad_images table:", err);
  }
};
module.exports = { createAdImagesTable };