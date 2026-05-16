const {
  createFeaturedAd,
  activateFeaturedAd,
  getMyFeaturedAds,
  deactivateExpiredAds
} = require("../services/featuredService");

// ================= REQUEST FEATURE =================
const requestFeature = async (req, res) => {
  try {
    const { adId, feature_type, days } = req.body;

    const feature = await createFeaturedAd(
      adId,
      req.user.id,
      feature_type,
      days
    );

    res.json({
      message: "Feature request created (pending payment)",
      feature
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= ACTIVATE (AFTER PAYMENT) =================
const activateFeature = async (req, res) => {
  try {
    const feature = await activateFeaturedAd(req.params.id);

    res.json({
      message: "Ad is now featured",
      feature
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= GET MY FEATURES =================
const myFeatures = async (req, res) => {
  try {
    const features = await getMyFeaturedAds(req.user.id);
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= RUN EXPIRE CHECK =================
const expireFeatures = async (req, res) => {
  try {
    const result = await deactivateExpiredAds();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  requestFeature,
  activateFeature,
  myFeatures,
  expireFeatures
};