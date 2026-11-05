// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/auth");
const {
  createCategory,
  deleteCategory,
  getActiveCategories,
  getAllCategoriesAdmin,
  updateCategoryStatus,
  getAllCategories,
} = require("../controllers/categoryController");

// Admin (admin role required — deleting a category cascades to its ads)
router.post("/", authMiddleware, isAdmin, createCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
router.patch("/:id/status", authMiddleware, isAdmin, updateCategoryStatus);
router.get("/admin", authMiddleware, isAdmin, getAllCategoriesAdmin);

// Public / any signed-in user
router.get("/all", getAllCategories);
router.get("/", authMiddleware, getActiveCategories);

module.exports = router;
