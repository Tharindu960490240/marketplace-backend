// services/categoryService.js
const pool = require("../config/database");

const createCategoryService = async (name) => {
  const query = `
    INSERT INTO categories (name)
    VALUES ($1)
    RETURNING *;
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

const getAllCategoriesAdminService = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortField = "created_at",
    sortOrder = "desc",
  } = query;

  const offset = (page - 1) * limit;

  let conditions = [];
  let values = [];
  let index = 1;

  // Search
  if (search) {
    conditions.push(`LOWER(name) LIKE LOWER($${index})`);
    values.push(`%${search}%`);
    index++;
  }

  // Status filter
  if (status) {
    conditions.push(`status = $${index}`);
    values.push(status);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Whitelist sorting fields (IMPORTANT)
  const allowedSortFields = ["name", "created_at", "status"];
  const safeSortField = allowedSortFields.includes(sortField)
    ? sortField
    : "created_at";

  const safeSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  // Count query
  const countQuery = `
    SELECT COUNT(*) FROM categories
    ${whereClause};
  `;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].count);

  // Data query
  const dataQuery = `
    SELECT * FROM categories
    ${whereClause}
    ORDER BY ${safeSortField} ${safeSortOrder}
    LIMIT $${index} OFFSET $${index + 1};
  `;

  const dataValues = [...values, limit, offset];

  const result = await pool.query(dataQuery, dataValues);

  return {
    data: result.rows,
    total,
    page,
    limit,
  };
};

const getActiveCategoriesService = async () => {
  const result = await pool.query(`
    SELECT id, name
    FROM categories
    WHERE status = 'active'
    ORDER BY name ASC;
  `);
  return result.rows;
};

const getAllCategoriesService = async () => {
  const result = await pool.query(`
    SELECT id, name, status
    FROM categories
    ORDER BY name ASC;
  `);
  return result.rows;
};

const deleteCategoryService = async (id) => {
  // Check if used in ads
  const check = await pool.query(
    `SELECT COUNT(*) FROM ads WHERE category_id = $1`,
    [id],
  );

  if (parseInt(check.rows[0].count) > 0) {
    throw new Error("Category is used in ads. Cannot delete.");
  }

  await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);

  return true;
};

const updateCategoryStatusService = async (id, status) => {
  const result = await pool.query(
    `UPDATE categories SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0];
};

module.exports = {
  createCategoryService,
  getAllCategoriesAdminService,
  getActiveCategoriesService,
  getAllCategoriesService,
  deleteCategoryService,
  updateCategoryStatusService,
};
