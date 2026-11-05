const express = require("express");
const router = express.Router();

const { authMiddleware, isAdmin } = require("../middlewares/auth");

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

// admin trigger (was unauthenticated — anyone could run it)
router.post("/expire", authMiddleware, isAdmin, expireFeatures);

module.exports = router;
