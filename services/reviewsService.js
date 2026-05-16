const pool = require("../config/database");

// ================= CREATE REVIEW (USER) =================
const createReview = async (userId, adId, rating, comment) => {
  // prevent duplicate review (already enforced in DB but good safety check)
  const existing = await pool.query(
    `SELECT id FROM reviews WHERE user_id=$1 AND ad_id=$2`,
    [userId, adId],
  );

  if (existing.rows.length > 0) {
    throw new Error("You already reviewed this ad");
  }

  const result = await pool.query(
    `INSERT INTO reviews (user_id, ad_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, adId, rating, comment],
  );

  return result.rows[0];
};

// ================= GET REVIEWS FOR AN AD =================
const getReviewsByAd = async (adId) => {
  const result = await pool.query(
    `SELECT r.*, u.name, u.email
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.ad_id = $1
     ORDER BY r.created_at DESC`,
    [adId],
  );

  return result.rows;
};

// ================= DELETE REVIEW (ADMIN ONLY) =================
const deleteReview = async (user, reviewId) => {
  // 1. Check if review exists
  const existing = await pool.query(
    `SELECT user_id FROM reviews WHERE id = $1`,
    [reviewId],
  );

  if (existing.rows.length === 0) {
    throw new Error("Review not found");
  }

  const review = existing.rows[0];

  // 2. Authorization check
  if (user.role !== "admin" && user.id !== review.user_id) {
    throw new Error("Not authorized to delete this review");
  }

  // 3. Delete
  const result = await pool.query(
    `DELETE FROM reviews
     WHERE id = $1
     RETURNING *`,
    [reviewId],
  );

  return result.rows[0];
};

module.exports = {
  createReview,
  getReviewsByAd,
  deleteReview,
};
