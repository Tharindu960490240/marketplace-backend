const { Pool } = require('pg');

const constants = require("../config/const");

// Default pool connects to the default database (like postgres)
const defaultPool = new Pool({
  user: constants.DB_USER,
  host: constants.DB_HOST,
  database: constants.DEFAULT_DB, 
  password: constants.DB_PASSWORD,
  port: constants.DB_PORT,
});

// Function to create a new database if it doesn't exist
const createDatabase = async () => {
  try {
    // Check if the target database exists
    const res = await defaultPool.query(
      `SELECT 1 FROM pg_database WHERE datname = '${constants.DB_NAME}'`
    );

    if (res.rowCount === 0) {
      // Database does not exist, create it
      await defaultPool.query(`CREATE DATABASE ${constants.DB_NAME}`);
      console.log(`Database ${constants.DB_NAME} created successfully!`);
    } else {
      // console.log(`Database ${constants.DB_NAME} already exists.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
    throw err; 
  } finally {
    await defaultPool.end();
  }
};

// Create a new pool for connecting to the desired database
const pool = new Pool({
  user: constants.DB_USER,
  host: constants.DB_HOST,
  database: constants.DB_NAME, 
  password: constants.DB_PASSWORD,
  port: constants.DB_PORT,
});

// Log when connected to the database
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

// Utility function to handle database queries with optional error logging
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

module.exports = {
  createDatabase,
  query,
  pool
};
