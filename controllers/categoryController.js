// controllers/categoryController.js
const {
  createCategoryService,
  deleteCategoryService,
  getActiveCategoriesService,
  getAllCategoriesService,
  getAllCategoriesAdminService,
  updateCategoryStatusService,
} = require("../services/categoryService");

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await createCategoryService(name);
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const result = await getAllCategoriesAdminService({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveCategories = async (req, res) => {
  try {
    const data = await getActiveCategoriesService();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const data = await getAllCategoriesService();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryService(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateCategoryStatusService(req.params.id, status);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createCategory,
  getAllCategoriesAdmin,
  getActiveCategories,
  getAllCategories,
  deleteCategory,
  updateCategoryStatus,
};
