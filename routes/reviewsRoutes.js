const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");

const {
  addReview,
  getAdReviews,
  removeReview,
} = require("../controllers/reviewsController");

// ================= USER =================
// create review
router.post("/", authMiddleware, addReview);

// get reviews for an ad
router.get("/:adId", getAdReviews);

// ================= ADMIN =================
// delete review (admin only)
router.delete("/:id", authMiddleware, removeReview);

module.exports = router;