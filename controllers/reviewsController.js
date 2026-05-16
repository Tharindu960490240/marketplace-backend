const {
  createReview,
  getReviewsByAd,
  deleteReview,
} = require("../services/reviewsService");

// ================= CREATE REVIEW =================
const addReview = async (req, res) => {
  try {
    const { ad_id, rating, comment } = req.body;

    const review = await createReview(req.user.id, ad_id, rating, comment);

    res.json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= GET REVIEWS FOR AD =================
const getAdReviews = async (req, res) => {
  try {
    const reviews = await getReviewsByAd(req.params.adId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE REVIEW (ADMIN ONLY) =================
const removeReview = async (req, res) => {
  try {
    const review = await deleteReview(req.user, req.params.id);

    res.json({
      message: "Review deleted successfully",
      review,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addReview,
  getAdReviews,
  removeReview,
};
