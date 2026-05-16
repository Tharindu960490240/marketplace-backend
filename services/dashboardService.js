const pool = require("../config/database");

const getDashboardStatsService = async () => {
  // Active ads
  const activeAds = await pool.query(
    `SELECT COUNT(*) FROM ads WHERE status = 'active'`,
  );

  // Total users (sellers)
  const sellers = await pool.query(
    `SELECT COUNT(*) FROM users WHERE role = 'user'`,
  );

  // Total ads
  const totalAds = await pool.query(`SELECT COUNT(*) FROM ads`);

  // Total views
  const views = await pool.query(
    `SELECT COALESCE(SUM(views_count),0) FROM ads`,
  );

  // Categories
  const categories = await pool.query(`SELECT COUNT(*) FROM categories`);

  return {
    activeCount: parseInt(activeAds.rows[0].count, 10),
    sellerCount: parseInt(sellers.rows[0].count, 10),
    totalAds: parseInt(totalAds.rows[0].count, 10),
    totalViews: parseInt(views.rows[0].coalesce, 10),
    categoryCount: parseInt(categories.rows[0].count, 10),
  };
};

const getAdminDashboardStatsService = async () => {
  const activeAds = await pool.query(
    `SELECT COUNT(*) FROM ads WHERE status = 'active'`,
  );

  const pendingAds = await pool.query(
    `SELECT COUNT(*) FROM ads WHERE status = 'pending'`,
  );

  const rejectedAds = await pool.query(
    `SELECT COUNT(*) FROM ads WHERE status = 'rejected'`,
  );

  const users = await pool.query(
    `SELECT COUNT(*) FROM users WHERE role = 'user' AND status = 'active'`,
  );

  const totalAds = await pool.query(`SELECT COUNT(*) FROM ads`);

  const views = await pool.query(
    `SELECT COALESCE(SUM(views_count), 0) AS total_views FROM ads`,
  );

  const categories = await pool.query(`SELECT COUNT(*) FROM categories`);

  // chart sample (last 6 months growth)
  const growth = await pool.query(`
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) AS month
  )
  SELECT 
    TO_CHAR(m.month, 'Mon YYYY') AS month,
    COUNT(a.id) AS ads
  FROM months m
  LEFT JOIN ads a
    ON date_trunc('month', a.created_at) = m.month
  GROUP BY m.month
  ORDER BY m.month;
`);

  // category breakdown
  const categoryStats = await pool.query(`
    SELECT c.name, COUNT(a.id)::int AS count
    FROM categories c
    LEFT JOIN ads a ON a.category_id = c.id
    GROUP BY c.name
    ORDER BY count DESC
  `);

  // recent ads
  const recentAds = await pool.query(`
    SELECT id, title, status
    FROM ads
    ORDER BY created_at DESC
    LIMIT 5
  `);

  // top users
  const topUsers = await pool.query(`
    SELECT u.id, u.first_name AS name, COUNT(a.id)::int AS ads
    FROM users u
    LEFT JOIN ads a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY ads DESC
    LIMIT 5
  `);

  // activity feed (simple version)
  const activity = await pool.query(`
    SELECT 'New ad posted: ' || title AS message
    FROM ads
    ORDER BY created_at DESC
    LIMIT 5
  `);

  return {
    activeAds: parseInt(activeAds.rows[0].count, 10),
    pendingAds: parseInt(pendingAds.rows[0].count, 10),
    rejectedAds: parseInt(rejectedAds.rows[0].count, 10),
    users: parseInt(users.rows[0].count, 10),
    totalAds: parseInt(totalAds.rows[0].count, 10),
    views: parseInt(views.rows[0].total_views, 10),
    categories: parseInt(categories.rows[0].count, 10),

    growth: growth.rows,
    categories: categoryStats.rows,
    recentAds: recentAds.rows,
    topUsers: topUsers.rows,
    activity: activity.rows,
  };
};

module.exports = {
  getDashboardStatsService,
  getAdminDashboardStatsService,
};
