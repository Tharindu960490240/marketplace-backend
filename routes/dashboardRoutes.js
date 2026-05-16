const express = require("express");
const router = express.Router();

const { authMiddleware, isAdmin } = require("../middlewares/auth");

const {
  geAdmintDashboardStats,
  getDashboardStats,
} = require("../controllers/dashboardController");

// GET DASHBOARD STATS
router.get("/home", getDashboardStats);
router.get("/admin", authMiddleware, isAdmin, geAdmintDashboardStats);

module.exports = router;
