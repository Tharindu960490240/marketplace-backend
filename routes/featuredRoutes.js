const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");

const {
  requestFeature,
  activateFeature,
  myFeatures,
  expireFeatures,
} = require("../controllers/featuredController");

// request feature (user)
router.post("/", authMiddleware, requestFeature);

// activate (after payment)
router.patch("/:id/activate", authMiddleware, activateFeature);

// get my featured ads
router.get("/my", authMiddleware, myFeatures);

// admin / cron trigger
router.post("/expire", expireFeatures);

module.exports = router;
