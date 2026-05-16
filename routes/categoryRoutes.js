// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middlewares/auth");
const {
  createCategory,
  deleteCategory,
  getActiveCategories,
  getAllCategoriesAdmin,
  updateCategoryStatus,
  getAllCategories,
} = require("../controllers/categoryController");

// Admin
router.post("/", authMiddleware, createCategory);
router.delete("/:id", authMiddleware, deleteCategory);
router.patch("/:id/status", authMiddleware, updateCategoryStatus);

router.get("/admin", authMiddleware, getAllCategoriesAdmin);
router.get("/all", getAllCategories);
router.get("/", authMiddleware, getActiveCategories);

module.exports = router;
