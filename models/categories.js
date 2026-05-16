// models/categoryModel.js
const pool = require("../config/database");

const createCategoriesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,

      name VARCHAR(100) NOT NULL UNIQUE,

      status VARCHAR(20) DEFAULT 'active'
      CHECK (status IN ('active', 'inactive')),

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating categories table:", err);
  }
};

module.exports = { createCategoriesTable };
