const pool = require("../config/database");
const { getUserById } = require("./authService");
require("dotenv").config();

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const { s3 } = require("../middlewares/upload");

// ================= CREATE AD =================
const createAdService = async (data, userId) => {
  const {
    title,
    description,
    category_id,
    sub_category,
    price,
    negotiable,
    district,
    city,
    latitude,
    longitude,
  } = data;

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  // const allowed = await canPostAd(userId);
  // if (!allowed) {
  //   throw new Error("Monthly ad limit reached. Upgrade to premium.");
  // }

  const featured = isPremium(user);

  const result = await pool.query(
    `INSERT INTO ads 
     (user_id, title, description, category_id, sub_category, price, negotiable, district, city, latitude, longitude, status, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12)
     RETURNING *`,
    [
      userId,
      title,
      description,
      category_id,
      sub_category,
      price,
      negotiable ?? false,
      district,
      city,
      latitude ?? null,
      longitude ?? null,
      featured,
    ],
  );

  return result.rows[0];
};

// ================= UPLOAD IMAGES =================
const uploadAdImagesService = async (adId, files) => {
  const queries = files.map((file, index) => {
    const imageUrl = file.location;
    const imageKey = file.key;

    return pool.query(
      `
      INSERT INTO ad_images
      (ad_id, image_url, image_key, is_primary)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [adId, imageUrl, imageKey, index === 0],
    );
  });

  const results = await Promise.all(queries);

  return results.map((r) => r.rows[0]);
};

// ================= GET ALL ADS =================
const getAdsService = async (queryParams, userId) => {
  const {
    page = 1,
    limit = 10,
    district,
    city,
    category_id,
    min_price,
    max_price,
    negotiable,
    search,
    status,
  } = queryParams;

  const offset = (page - 1) * limit;

  const values = [];

  // ================= BASE QUERY =================
  let baseQuery = `
    FROM ads a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;

  // ================= STATUS =================
  values.push(status || "active");
  baseQuery += ` AND a.status = $${values.length}`;

  // ================= FILTERS =================
  if (district) {
    values.push(district);
    baseQuery += ` AND a.district = $${values.length}`;
  }

  if (city) {
    values.push(city);
    baseQuery += ` AND a.city = $${values.length}`;
  }

  if (category_id) {
    values.push(category_id);
    baseQuery += ` AND a.category_id = $${values.length}`;
  }

  if (negotiable !== undefined) {
    values.push(negotiable === "true" || negotiable === true);
    baseQuery += ` AND a.negotiable = $${values.length}`;
  }

  if (min_price) {
    values.push(min_price);
    baseQuery += ` AND a.price >= $${values.length}`;
  }

  if (max_price) {
    values.push(max_price);
    baseQuery += ` AND a.price <= $${values.length}`;
  }

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

      -- images (no join duplication)
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

      -- is saved (per logged user)
      ${
        userId
          ? `
      EXISTS (
        SELECT 1
        FROM saved_ads sa2
        WHERE sa2.ad_id = a.id AND sa2.user_id = ${userId}
      ) AS is_saved,
      `
          : `
      false AS is_saved,
      `
      }

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

    ORDER BY a.is_featured DESC, a.created_at DESC

    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(dataQuery, values);

  return {
    data: result.rows,
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

// ================= GET SINGLE AD =================
const getSingleAdService = async (id, userId) => {
  // ================= MAIN AD QUERY =================
  const adQuery = `
    SELECT 
      a.*,

      json_build_object(
        'id', c.id,
        'name', c.name
      ) AS category,

      json_build_object(
        'id', u.id,
        'name', u.first_name,
        'email', u.email,
        'phone', u.phone
      ) AS user,

    
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

      -- reviews
      COALESCE(
        (
          SELECT COUNT(*)
          FROM reviews r
          WHERE r.ad_id = a.id
        ), 0
      )::int AS review_count,

      COALESCE(
        (
          SELECT ROUND(AVG(r.rating)::numeric * 2) / 2
          FROM reviews r
          WHERE r.ad_id = a.id
        ),
        0
      )::float AS avg_rating

    FROM ads a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.user_id = u.id

    WHERE a.id = $1
  `;

  const adResult = await pool.query(adQuery, [id]);

  if (adResult.rows.length === 0) {
    return null;
  }

  // ================= REVIEWS LIST =================
  const reviewsResult = await pool.query(
    `
    SELECT 
      r.id,
      r.rating::float AS rating,
      r.comment,
      r.created_at,

      json_build_object(
        'id', u.id,
        'name', u.first_name,
        'url',u.profile_image

      ) AS user

    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.ad_id = $1
    ORDER BY r.created_at DESC
    `,
    [id],
  );

  // ================= CHECK IF SAVED =================
  let is_saved = false;

  if (userId) {
    const savedCheck = await pool.query(
      `
      SELECT 1
      FROM saved_ads
      WHERE ad_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    );

    is_saved = savedCheck.rows.length > 0;
  }

  return {
    ...adResult.rows[0],
    reviews: reviewsResult.rows,
    is_saved,
  };
};

// ================= MY ADS =================
const getMyAdsService = async (queryParams, userId) => {
  const { page = 1, limit = 10, status, search } = queryParams;

  const offset = (page - 1) * limit;

  const values = [userId];

  // ================= BASE QUERY =================
  let baseQuery = `
    FROM ads a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.user_id = $1
  `;

  // ================= STATUS FILTER =================
  if (status) {
    values.push(status);
    baseQuery += ` AND a.status = $${values.length}`;
  }

  // ================= SEARCH =================
  if (search) {
    values.push(`%${search}%`);
    baseQuery += ` AND a.title ILIKE $${values.length}`;
  }

  // ================= COUNT =================
  const countQuery = `SELECT COUNT(*) ${baseQuery}`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);

  // ================= PAGINATION =================
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

    ORDER BY a.created_at DESC

    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await pool.query(dataQuery, values);

  return {
    data: result.rows,
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

// ================= UPDATE AD =================
const updateAdService = async (id, userId, data) => {
  const {
    title,
    description,
    category_id,
    sub_category,
    price,
    negotiable,
    district,
    city,
  } = data;

  const result = await pool.query(
    `UPDATE ads
     SET title=$1,
         description=$2,
         category_id=$3,
         sub_category=$4,
         price=$5,
         negotiable=$6,
         district=$7,
         city=$8,
         updated_at=NOW()
     WHERE id=$9 AND user_id=$10
     RETURNING *`,
    [
      title,
      description,
      category_id,
      sub_category,
      price,
      negotiable,
      district,
      city,
      id,
      userId,
    ],
  );

  return result.rows[0];
};

// ================= DELETE AD =================
const deleteAdService = async (adId, userId) => {
  const adCheck = await pool.query(
    "SELECT * FROM ads WHERE id=$1 AND user_id=$2",
    [adId, userId],
  );

  if (adCheck.rows.length === 0) {
    throw new Error("Ad not found or unauthorized");
  }

  // ===============================
  // GET ALL AD IMAGES
  // ===============================
  const imagesResult = await pool.query(
    `
    SELECT image_key
    FROM ad_images
    WHERE ad_id = $1
    `,
    [adId],
  );

  // ===============================
  // DELETE FROM S3
  // ===============================
  for (const image of imagesResult.rows) {
    if (image.image_key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: image.image_key,
        }),
      );
    }
  }

  // ===============================
  // DELETE DB RECORDS
  // ===============================
  await pool.query("DELETE FROM ad_images WHERE ad_id=$1", [adId]);

  await pool.query("DELETE FROM ads WHERE id=$1", [adId]);

  return true;
};

const changeStatusService = async (id, status, reason = null) => {
  let query;
  let values;

  if (status === "rejected") {
    query = `
      UPDATE ads
      SET status = $1,
          reason = $2
      WHERE id = $3
      RETURNING *
    `;
    values = [status, reason, id];
  } else {
    // clear reason for other statuses
    query = `
      UPDATE ads
      SET status = $1,
          reason = NULL
      WHERE id = $2
      RETURNING *
    `;
    values = [status, id];
  }

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ================= INCREMENT VIEWS =================
const incrementViewsService = async (id) => {
  await pool.query(`UPDATE ads SET views_count = views_count + 1 WHERE id=$1`, [
    id,
  ]);
};

const canPostAd = async (userId) => {
  const user = await getUserById(userId);

  if (isPremium(user)) return true;

  // count ads this month
  const result = await pool.query(
    `
  SELECT COUNT(*) FROM ads
  WHERE user_id = $1
    AND status NOT IN ('rejected')
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  `,
    [userId],
  );
  const count = parseInt(result.rows[0].count);

  return count < process.env.MAX_ADS_COUNT;
};

const isPremium = (user) => {
  return (
    user.subscription_type === "premium" &&
    new Date(user.subscription_expiry) > new Date()
  );
};

const getAdWithUserService = async (adId) => {
  const result = await pool.query(
    `
    SELECT a.title, u.email AS user_email, u.first_name
    FROM ads a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = $1
  `,
    [adId],
  );

  return result.rows[0];
};

module.exports = {
  createAdService,
  getAdsService,
  getSingleAdService,
  getMyAdsService,
  updateAdService,
  deleteAdService,
  changeStatusService,
  incrementViewsService,
  uploadAdImagesService,
  canPostAd,
  getAdWithUserService,
};
