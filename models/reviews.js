// tables/reviewsTable.js

const pool = require("../config/database");

const createReviewsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,

      ad_id INT NOT NULL,
      CONSTRAINT fk_review_ad
        FOREIGN KEY(ad_id)
        REFERENCES ads(id)
        ON DELETE CASCADE,

      user_id INT NOT NULL,
      CONSTRAINT fk_review_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      
      rating NUMERIC(2,1) NOT NULL,
      CONSTRAINT rating_range_check
        CHECK (
          rating >= 1 AND rating <= 5
          AND rating * 2 = FLOOR(rating * 2)
        ),

      comment TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT unique_user_ad_review UNIQUE (ad_id, user_id)
    );
  `;

  try {
    await pool.query(query);

    // indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_ad_id
      ON reviews(ad_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id
      ON reviews(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_rating
      ON reviews(rating);
    `);

    // console.log("reviews table created");
  } catch (err) {
    console.error("Error creating reviews table:", err);
  }
};

module.exports = { createReviewsTable };