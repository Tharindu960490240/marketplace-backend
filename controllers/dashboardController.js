const {
  getDashboardStatsService,
  getAdminDashboardStatsService,
} = require("../services/dashboardService");

const getDashboardStats = async (req, res) => {
  try {
    const data = await getDashboardStatsService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Dashboard error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats",
    });
  }
};

const geAdmintDashboardStats = async (req, res) => {
  try {
    const data = await getAdminDashboardStatsService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};

module.exports = {
  getDashboardStats,
  geAdmintDashboardStats,
};
