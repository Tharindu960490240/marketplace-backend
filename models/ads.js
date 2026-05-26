const pool = require("../config/database");

const createAdTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ads (
      id SERIAL PRIMARY KEY,

      user_id INT NOT NULL,
      CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      category_id INT NOT NULL,
      CONSTRAINT fk_category
        FOREIGN KEY(category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

      sub_category VARCHAR(100),

      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,

      price DECIMAL(10,2)
        CHECK (price >= 0),

      negotiable BOOLEAN DEFAULT FALSE,

      district VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      
      latitude NUMERIC(10, 7),
      longitude NUMERIC(10, 7),

      status VARCHAR(20) DEFAULT 'pending'
        CHECK (
          status IN (
            'pending',
            'active',
            'sold',
            'rejected',
            'deleted'
          )
        ),

      is_featured BOOLEAN DEFAULT FALSE,

      views_count INT DEFAULT 0
        CHECK (views_count >= 0),
      reason TEXT,
      expires_at TIMESTAMP,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);

    // Basic indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_user_id
      ON ads(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_status
      ON ads(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_location
      ON ads(district, city);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_category
      ON ads(category_id);
    `);

    // Performance indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_created_at
      ON ads(created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_price
      ON ads(price);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_featured
      ON ads(is_featured);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ads_expires_at
      ON ads(expires_at);
    `);

    // console.log("Ads table created successfully");
  } catch (err) {
    console.error("Error creating ads table:", err);
  }
};

module.exports = { createAdTable };
