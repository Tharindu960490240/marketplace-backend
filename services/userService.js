const pool = require("../config/database");
const emailService = require("./emailService");
const jwt = require("jsonwebtoken");
const constants = require("../config/const");
const moment = require("moment");

// Helper function to exclude the password from the user object
const excludePassword = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Create a new user
const createUser = async (user) => {
  const {
    first_name,
    last_name,
    email,
    password,
    user_type,
    contact_no,
    no,
    street_name,
    suburb,
    postal_code,
    state,
    latitude,
    longitude,
    full_address,
    status,
  } = user;

  const query = `
    INSERT INTO users (
      first_name, last_name, email, password, user_type, contact_no, no, street_name, suburb, postal_code, state, latitude, longitude, full_address, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;

  const values = [
    first_name,
    last_name,
    email,
    password,
    user_type,
    contact_no,
    no,
    street_name,
    suburb,
    postal_code,
    state,
    latitude,
    longitude,
    full_address,
    status,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    throw new Error("Error creating user: " + err.message);
  }
};

// Get all users
const getAllUsers = async ({
  page,
  limit,
  user_type,
  status,
  startDate,
  endDate,
}) => {
  const offset = (page - 1) * limit;
  let query = `SELECT * FROM users`;
  let countQuery = `SELECT COUNT(*) FROM users`;

  const values = [];
  let conditions = [];

  // Add status condition
  if (status) {
    conditions.push(`status = $${values.length + 1}`);
    values.push(status);
  }

  // Add user_type condition
  if (user_type) {
    conditions.push(`user_type = $${values.length + 1}`);
    values.push(user_type);
  }

  // Add startDate condition
  if (startDate) {
    conditions.push(`created_at >= $${values.length + 1}`);
    values.push(startDate);
  }

  // Add endDate condition
  if (endDate) {
    const endDateTime = endDate + " 23:59:59";
    values.push(endDateTime);
    conditions.push(`created_at <= $${values.length}`);
  }

  // Append conditions if any
  if (conditions.length > 0) {
    const conditionString = conditions.join(" AND ");
    query += ` WHERE ${conditionString}`;
    countQuery += ` WHERE ${conditionString}`;
  }

  // Pagination
  query += ` ORDER BY created_at ASC LIMIT $${values.length + 1} OFFSET $${
    values.length + 2
  }`;
  values.push(limit, offset);

  try {
    const [userResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, values.length - 2)), // Only the condition values
    ]);

    const data = userResult.rows.map(excludePassword);
    const total = parseInt(countResult.rows[0].count, 10);

    return { data, total };
  } catch (err) {
    console.error("Error fetching users:", err);
    return { data: [], total: 0 };
  }
};

// Get a user by ID
const getUserById = async (id) => {
  const query = "SELECT * FROM users WHERE id = $1;";
  const values = [id];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error retrieving user: " + err.message);
  }
};

// Update a user by ID
const updateUserById = async (id, user) => {
  const fields = [];
  const values = [];
  let query = "UPDATE users SET ";

  Object.entries(user).forEach(([key, value], index) => {
    if (value !== undefined && value !== null) {
      fields.push(`${key} = $${index + 1}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ");
  query += " WHERE id = $" + (values.length + 1) + " RETURNING *;";
  values.push(id);

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error updating user: " + err.message);
  }
};

// Delete a user by ID
const deleteUserById = async (id) => {
  const query = "DELETE FROM users WHERE id = $1 RETURNING *;";
  const values = [id];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error deleting user: " + err.message);
  }
};

// Get a user by email
const getUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1;";
  const values = [email];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    throw new Error("Error retrieving user by email: " + err.message);
  }
};

// Reset a user's password by ID
const resetPasswordById = async (id, newPassword) => {
  const query = "UPDATE users SET password = $1 WHERE id = $2 RETURNING *;";
  const values = [newPassword, id];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error resetting password: " + err.message);
  }
};

// Reset a user's password by Email
const resetPasswordByEmail = async (email, newPassword) => {
  const query = "UPDATE users SET password = $1 WHERE email = $2 RETURNING *;";
  const values = [newPassword, email];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error resetting password: " + err.message);
  }
};

const sendPasswordResetLink = async (email, type) => {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (type === "App") {
      if (user.user_type !== "Admin" && user.user_type !== "Merchant") {
        return {
          success: false,
          message: "User is not of type Admin or Merchant",
        };
      }
    }

    if (type === "Mobile") {
      if (user.user_type !== "Customer" && user.user_type !== "Driver") {
        return {
          success: false,
          message: "User is not of type Customer or Driver",
        };
      }
    }

    const token = jwt.sign({ email: user.email }, constants.SECRET_KEY, {
      expiresIn: "1h",
    });

    // Adjusted link for React web app running on localhost
    const resetLink =
      type === "App"
        ? `${constants.RESET_LINK_WEB}?token=${token}` // for web app
        : `${constants.RESET_LINK_MOBILE}?token=${token}`; // mobile app link

    const emailData = {
      email: user.email,
      subject: "Quick Drop Password Reset Request",
      text: `Please click the link to reset your password: ${resetLink}`,
      html: `<p>Please click the link below to reset your password: Link will expire after 1 hour</p><a href="${resetLink}">${resetLink}</a>`,
    };

    const emailResponse = await emailService.sendEmail(emailData);

    if (emailResponse.success) {
      return {
        success: true,
        message: "Password reset link sent successfully",
      };
    } else {
      return { success: false, message: "Failed to send password reset link" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error sending reset link: " + error.message,
    };
  }
};

// Get total approved counts for Customers, Drivers, and Merchants
const getTotalApprovedCounts = async () => {
  const query = `
    SELECT user_type, COUNT(*) AS count
    FROM users
    WHERE status = 'Approved'
    GROUP BY user_type;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching total approved counts:", error);
    throw error;
  }
};

// Get approved counts by month for a dynamic number of months
const getApprovedCountWithMonths = async (months) => {
  // First, create an array of the last X months
  const lastXMonths = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = moment().subtract(i, "months").format("MMMM");
    lastXMonths.push(month);
  }

  const query = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'FMMonth') AS month,
      user_type,
      COUNT(*) AS count
    FROM users
    WHERE status = 'Approved'
    AND created_at >= CURRENT_DATE - INTERVAL '${months} months'
    GROUP BY month, user_type
    ORDER BY MIN(created_at) DESC;
  `;

  try {
    // Execute the query
    const result = await pool.query(query);

    // Format the result into the desired structure
    const formattedResult = {};

    result.rows.forEach((row) => {
      const month = row.month.trim(); // Remove any trailing spaces from month names
      if (!formattedResult[month]) {
        formattedResult[month] = [];
      }
      formattedResult[month].push({
        user_type: row.user_type,
        count: row.count,
      });
    });

    // Now ensure that we include all months, even if no data exists for that month
    const finalResult = lastXMonths.map((month) => ({
      month,
      users: formattedResult[month] || [], // If no data, return empty array for users
    }));

    return finalResult;
  } catch (error) {
    console.error(
      `Error fetching approved counts for the last ${months} months:`,
      error
    );
    throw error;
  }
};

// Update a user's status by ID
const updateUserStatusById = async (id, status, reason) => {
  const query =
    "UPDATE users SET status = $1, reason = $2 WHERE id = $3 RETURNING *;";
  const values = [status, reason, id];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error updating user status: " + err.message);
  }
};

// Save or update FCM token for a user
const saveFcmToken = async (userId, fcmToken) => {
  const query = "UPDATE users SET fcm_token = $1 WHERE id = $2 RETURNING *;";
  const values = [fcmToken, userId];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error saving FCM token: " + err.message);
  }
};

// Remove FCM token for a user
const removeFcmToken = async (userId) => {
  const query = `
    UPDATE users 
    SET 
      fcm_token = NULL, 
      is_online = false 
    WHERE id = $1 
    RETURNING *;
  `;
  const values = [userId];

  try {
    const result = await pool.query(query, values);
    return excludePassword(result.rows[0]);
  } catch (err) {
    throw new Error("Error removing FCM token: " + err.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserByEmail,
  resetPasswordById,
  resetPasswordByEmail,
  sendPasswordResetLink,
  getTotalApprovedCounts,
  getApprovedCountWithMonths,
  updateUserStatusById,
  saveFcmToken,
  removeFcmToken,
};
