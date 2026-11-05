const { Pool } = require("pg");
require("dotenv").config();

// Default pool connects to the default database (like postgres)
const defaultPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DEFAULT_DB,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

// Function to create a new database if it doesn't exist
const createDatabase = async () => {
  try {
    const dbName = process.env.DB_NAME;

    // A database name can't be parameterised, so validate it to avoid any
    // injection via the env value before interpolating it into DDL.
    if (!dbName || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(dbName)) {
      throw new Error(`Invalid DB_NAME: ${dbName}`);
    }

    // Check if the target database exists (parameterised)
    const res = await defaultPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );

    if (res.rowCount === 0) {
      // Database does not exist, create it (name already validated above)
      await defaultPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully!`);
    } else {
      // console.log(`Database ${process.env.DB_NAME} already exists.`);
    }
  } catch (err) {
    console.error("Error checking/creating database:", err);
    throw err;
  } finally {
    await defaultPool.end();
  }
};

// Create a new pool for connecting to the desired database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

// Log when connected to the database
pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

// Utility function to handle database queries with optional error logging
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("Database query error:", err);
    throw err;
  }
};

module.exports = {
  createDatabase,
  query,
  pool,
};
