const pool = require("../config/database");

const createFeaturedAdsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS featured_ads (
      id SERIAL PRIMARY KEY,

      ad_id INT NOT NULL,
      CONSTRAINT fk_featured_ad
        FOREIGN KEY(ad_id)
        REFERENCES ads(id)
        ON DELETE CASCADE,

      feature_type VARCHAR(20) NOT NULL
        CHECK (
          feature_type IN (
            'boost',
            'featured'
          )
        ),

      start_date TIMESTAMP NOT NULL,

      end_date TIMESTAMP NOT NULL,

      payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (
          payment_status IN (
            'pending',
            'paid',
            'failed'
          )
        ),

      amount DECIMAL(10,2)
        CHECK (amount >= 0),

      transaction_id VARCHAR(255),

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CHECK (end_date > start_date)
    );
  `;

  try {
    await pool.query(query);

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_featured_ads_ad_id
      ON featured_ads(ad_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_featured_ads_feature_type
      ON featured_ads(feature_type);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_featured_ads_payment_status
      ON featured_ads(payment_status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_featured_ads_dates
      ON featured_ads(start_date, end_date);
    `);

    // console.log("featured_ads table created successfully");
  } catch (err) {
    console.error("Error creating featured_ads table:", err);
  }
};

module.exports = { createFeaturedAdsTable };