const pool = require("../config/database");

// ================= CREATE FEATURE =================
const createFeaturedAd = async (adId, userId, feature_type, days) => {
  // 1. Check ownership
  const ad = await pool.query(
    `SELECT id FROM ads WHERE id=$1 AND user_id=$2`,
    [adId, userId]
  );

  if (ad.rows.length === 0) {
    throw new Error("Unauthorized or Ad not found");
  }

  // 2. Create feature record
  const result = await pool.query(
    `INSERT INTO featured_ads 
     (ad_id, feature_type, start_date, end_date, payment_status)
     VALUES ($1, $2, NOW(), NOW() + ($3 || ' days')::INTERVAL, 'pending')
     RETURNING *`,
    [adId, feature_type, days]
  );

  return result.rows[0];
};

// ================= ACTIVATE FEATURE =================
const activateFeaturedAd = async (featureId) => {
  // mark payment as paid
  const feature = await pool.query(
    `UPDATE featured_ads
     SET payment_status='paid'
     WHERE id=$1
     RETURNING *`,
    [featureId]
  );

  if (feature.rows.length === 0) {
    throw new Error("Feature not found");
  }

  const adId = feature.rows[0].ad_id;

  // update ads table
  await pool.query(
    `UPDATE ads SET is_featured=true WHERE id=$1`,
    [adId]
  );

  return feature.rows[0];
};

// ================= GET MY FEATURED ADS =================
const getMyFeaturedAds = async (userId) => {
  const result = await pool.query(
    `SELECT fa.*, a.title
     FROM featured_ads fa
     JOIN ads a ON fa.ad_id = a.id
     WHERE a.user_id=$1
     ORDER BY fa.created_at DESC`,
    [userId]
  );

  return result.rows;
};

// ================= CHECK EXPIRED =================
const deactivateExpiredAds = async () => {
  // find expired features
  const expired = await pool.query(
    `SELECT ad_id FROM featured_ads
     WHERE end_date < NOW() AND payment_status='paid'`
  );

  for (let row of expired.rows) {
    await pool.query(
      `UPDATE ads SET is_featured=false WHERE id=$1`,
      [row.ad_id]
    );
  }

  return { message: "Expired ads updated" };
};

module.exports = {
  createFeaturedAd,
  activateFeaturedAd,
  getMyFeaturedAds,
  deactivateExpiredAds
};