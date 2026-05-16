const express = require("express");
const router = express.Router();

const {authMiddleware} = require("../middlewares/auth");

const {
  save,
  remove,
  getAllSaved
} = require("../controllers/savedController");

// save ad
router.post("/", authMiddleware, save);

// remove saved ad
router.delete("/:adId", authMiddleware, remove);

// get saved ads
router.get("/", authMiddleware, getAllSaved);

module.exports = router;