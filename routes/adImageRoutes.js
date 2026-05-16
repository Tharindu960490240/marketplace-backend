const express = require("express");
const router = express.Router();

const {authMiddleware} = require("../middlewares/auth");
const { uploadAds } = require("../middlewares/upload");

const {
  getAdImages,
  uploadImages,
  removeImage,
  makePrimary,
} = require("../controllers/adImageController");

// ================= ROUTES =================

// get images for ad
router.get("/ad/:adId", getAdImages);

// upload more images
router.post("/ad/:adId", authMiddleware, uploadAds.array("images", 5), uploadImages);

// delete image
router.delete("/:id", authMiddleware, removeImage);

// set primary image
router.patch("/:id/primary", authMiddleware, makePrimary);

module.exports = router;
