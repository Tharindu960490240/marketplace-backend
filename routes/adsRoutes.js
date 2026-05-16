const express = require("express");
const router = express.Router();

const { uploadAds } = require("../middlewares/upload");
const { optionalAuth, authMiddleware } = require("../middlewares/auth");

const {
  createAd,
  getAds,
  getSingleAd,
  getMyAds,
  updateAd,
  deleteAd,
  changeStatus,
  incrementViews,
  uploadAdImages,
} = require("../controllers/adsController");

router.post("/", authMiddleware, createAd);
router.post(
  "/:adId/images",
  authMiddleware,
  uploadAds.array("images", 5),
  uploadAdImages,
);
router.get("/", optionalAuth, getAds);
router.get("/my", authMiddleware, getMyAds);
router.get("/:id", optionalAuth, getSingleAd);
router.put("/:id", authMiddleware, updateAd);
router.delete("/:id", authMiddleware, deleteAd);
router.patch("/:id/status", authMiddleware, changeStatus);
router.patch("/:id/view", incrementViews);

module.exports = router;
