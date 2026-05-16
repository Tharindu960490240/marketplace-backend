const pool = require("../config/database");

// ================= GET IMAGES BY AD =================
const getImagesByAd = async (adId) => {
  const result = await pool.query(
    `SELECT id, image_url, is_primary
     FROM ad_images
     WHERE ad_id = $1
     ORDER BY is_primary DESC, created_at ASC`,
    [adId]
  );

  return result.rows;
};

// ================= DELETE IMAGE =================
const deleteImage = async (imageId, userId) => {
  const result = await pool.query(
    `DELETE FROM ad_images 
     WHERE id = $1 
     AND ad_id IN (
       SELECT id FROM ads WHERE user_id = $2
     )
     RETURNING *`,
    [imageId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Image not found or unauthorized");
  }

  return result.rows[0];
};

// ================= SET PRIMARY IMAGE =================
const setPrimaryImage = async (imageId, userId) => {
  // 1. Get ad_id
  const image = await pool.query(
    `SELECT ad_id FROM ad_images WHERE id = $1`,
    [imageId]
  );

  if (image.rows.length === 0) {
    throw new Error("Image not found");
  }

  const adId = image.rows[0].ad_id;

  // 2. Check ownership
  const ad = await pool.query(
    `SELECT id FROM ads WHERE id = $1 AND user_id = $2`,
    [adId, userId]
  );

  if (ad.rows.length === 0) {
    throw new Error("Unauthorized");
  }

  // 3. Reset all images
  await pool.query(
    `UPDATE ad_images SET is_primary = false WHERE ad_id = $1`,
    [adId]
  );

  // 4. Set selected image as primary
  const updated = await pool.query(
    `UPDATE ad_images SET is_primary = true WHERE id = $1 RETURNING *`,
    [imageId]
  );

  return updated.rows[0];
};

// ================= ADD MORE IMAGES =================
const addImages = async (adId, files, userId) => {
  // check ownership
  const ad = await pool.query(
    `SELECT id FROM ads WHERE id=$1 AND user_id=$2`,
    [adId, userId]
  );

  if (ad.rows.length === 0) {
    throw new Error("Unauthorized");
  }

  const insertedImages = [];

  for (let file of files) {
    const result = await pool.query(
      `INSERT INTO ad_images (ad_id, image_url, is_primary)
       VALUES ($1, $2, false)
       RETURNING *`,
      [adId, `/uploads/${file.filename}`]
    );

    insertedImages.push(result.rows[0]);
  }

  return insertedImages;
};

module.exports = {
  getImagesByAd,
  deleteImage,
  setPrimaryImage,
  addImages
};