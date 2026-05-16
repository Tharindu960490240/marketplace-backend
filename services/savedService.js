const pool = require("../config/database");

// ================= SAVE AD =================
const saveAd = async (userId, adId) => {
  // prevent duplicate saves
  const existing = await pool.query(
    `SELECT id FROM saved_ads WHERE user_id=$1 AND ad_id=$2`,
    [userId, adId]
  );

  if (existing.rows.length > 0) {
    throw new Error("Ad already saved");
  }

  const result = await pool.query(
    `INSERT INTO saved_ads (user_id, ad_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, adId]
  );

  return result.rows[0];
};

// ================= REMOVE SAVED AD =================
const removeSavedAd = async (userId, adId) => {
  const result = await pool.query(
    `DELETE FROM saved_ads
     WHERE user_id=$1 AND ad_id=$2
     RETURNING *`,
    [userId, adId]
  );

  if (result.rows.length === 0) {
    throw new Error("Saved ad not found");
  }

  return result.rows[0];
};

// ================= GET SAVED ADS =================
const getSavedAds = async (queryParams, userId) => {
  const {
    page = 1,
    limit = 10,
    search,
  } = queryParams;

  const offset = (page - 1) * limit;
  const values = [userId];

  // ================= BASE QUERY =================
  let baseQuery = `
    FROM saved_ads s
    JOIN ads a ON a.id = s.ad_id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE s.user_id = $1
  `;

  // ================= SEARCH =================
  if (search) {
    values.push(`%${search}%`);
    baseQuery += ` AND a.title ILIKE $${values.length}`;
  }

  // ================= COUNT =================
  const countQuery = `SELECT COUNT(*) ${baseQuery}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);

  // ================= MAIN QUERY =================
  values.push(limit, offset);

  const dataQuery = `
    SELECT 
      a.*,

      -- category
      json_build_object(
        'id', c.id,
        'name', c.name
      ) AS category,

      -- user
      json_build_object(
        'id', u.id,
        'name', u.first_name,
        'email', u.email,
        'phone', u.phone
      ) AS user,

      -- images
      COALESCE(
        (
          SELECT json_agg(
            jsonb_build_object(
              'id', ai.id,
              'image_url', ai.image_url,
              'is_primary', ai.is_primary
            )
            ORDER BY ai.is_primary DESC, ai.id ASC
          )
          FROM ad_images ai
          WHERE ai.ad_id = a.id
        ),
        '[]'
      ) AS images,

      -- primary image
      (
        SELECT ai.image_url
        FROM ad_images ai
        WHERE ai.ad_id = a.id AND ai.is_primary = true
        LIMIT 1
      ) AS primary_image,

      -- saved count
      (
        SELECT COUNT(*)
        FROM saved_ads sa
        WHERE sa.ad_id = a.id
      )::int AS saved_count,

      -- ALWAYS TRUE (because this is saved list)
      true AS is_saved,

      -- review count
      (
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.ad_id = a.id
      )::int AS review_count,

      -- avg rating
      COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::numeric * 2) / 2
          FROM reviews r
          WHERE r.ad_id = a.id
        ),
        0
      )::float AS avg_rating

    ${baseQuery}

    ORDER BY s.created_at DESC

    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(dataQuery, values);

  return {
    success: true,
    data: result.rows,
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

module.exports = {
  saveAd,
  removeSavedAd,
  getSavedAds
};