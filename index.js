require("dotenv").config();

const express = require("express");
const cors = require("cors");

const cron = require("node-cron");
const downgradeExpiredUsers = require("./jobs/subscriptionJob.js");

// ================= ROUTES =================
const authRoutes = require("./routes/authRouts.js");
const adRoutes = require("./routes/adsRoutes.js");
const adImageRoutes = require("./routes/adImageRoutes.js");
const featuredRoutes = require("./routes/featuredRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const savedRoutes = require("./routes/savedRoutes.js");
const reviewsRoutes = require("./routes/reviewsRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes.js");
const supportRoutes = require("./routes/supportRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");

// ================= DB =================
const { createDatabase } = require("./config/database.js");
const { createUserTable } = require("./models/users.js");

// (future models - keep ready)
const { createAdTable } = require("./models/ads.js");
const { createAdImagesTable } = require("./models/adImages");
const { createFeaturedAdsTable } = require("./models/featureAds.js");
const { createPaymentsTable } = require("./models/payments.js");
const { createSavedAdsTable } = require("./models/savedAds.js");
const { createReviewsTable } = require("./models/reviews.js");
const { createCategoriesTable } = require("./models/categories.js");
const { createSubscriptionsTable } = require("./models/subscriptions.js");
const { createSupportTables } = require("./models/support.js");
const { createNotificationTable } = require("./models/notification.js");

const app = express();
const PORT = process.env.PORT || 3200;

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://52.221.196.150",
      "http://ec2-52-221-196-150.ap-southeast-1.compute.amazonaws.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ================= STATIC FILES =================
// for uploaded images
app.use("/uploads", express.static("uploads"));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Marketplace API is running...");
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/ad-images", adImageRoutes);
app.use("/api/featured", featuredRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= SERVER START =================
const startServer = async () => {
  try {
    // DB setup
    await createDatabase();

    // Core tables
    await createUserTable();
    await createAdTable();
    await createAdImagesTable();
    await createFeaturedAdsTable();
    await createPaymentsTable();
    await createSavedAdsTable();
    await createReviewsTable();
    await createCategoriesTable();
    await createSubscriptionsTable();
    await createSupportTables();
    await createNotificationTable();

    console.log("Database & tables ready");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });

    // ================= GRACEFUL SHUTDOWN =================
    process.on("SIGINT", () => {
      console.log("Shutting down server...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      console.log("Process terminated");
      server.close(() => {
        console.log("Server closed");
      });
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
};

startServer();

// runs every day at 12 AM
cron.schedule("0 0 * * *", () => {
  console.log("Running subscription cleanup...");
  downgradeExpiredUsers();
});
