const jwt = require("jsonwebtoken");
const constants = require("../config/const");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    constants.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Generate token for pasword reset
const generateResetToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    constants.JWT_SECRET,
    { expiresIn: "1h" },
  );
};


const verifyToken = (token) => {
  try {
    return jwt.verify(token, constants.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = { generateToken, generateResetToken, verifyToken };
