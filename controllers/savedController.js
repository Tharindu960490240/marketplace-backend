const {
  saveAd,
  removeSavedAd,
  getSavedAds,
} = require("../services/savedService");

// ================= SAVE =================
const save = async (req, res) => {
  try {
    const result = await saveAd(req.user.id, req.body.ad_id);

    res.json({
      message: "Ad saved",
      result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= REMOVE =================
const remove = async (req, res) => {
  try {
    const result = await removeSavedAd(req.user.id, req.params.adId);

    res.json({
      message: "Removed from saved",
      result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= GET SAVED =================
const getAllSaved = async (req, res) => {
  try {
    const result = await getSavedAds(req.query, req.user.id);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  save,
  remove,
  getAllSaved,
};
