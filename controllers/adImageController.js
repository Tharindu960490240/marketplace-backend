const {
  getImagesByAd,
  deleteImage,
  setPrimaryImage,
  addImages
} = require("../services/adImageService");

// ================= GET IMAGES =================
const getAdImages = async (req, res) => {
  try {
    const images = await getImagesByAd(req.params.adId);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= ADD IMAGES =================
const uploadImages = async (req, res) => {
  try {
    const images = await addImages(
      req.params.adId,
      req.files,
      req.user.id
    );

    res.json({
      message: "Images uploaded",
      images
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE IMAGE =================
const removeImage = async (req, res) => {
  try {
    const image = await deleteImage(req.params.id, req.user.id);

    res.json({
      message: "Image deleted",
      image
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= SET PRIMARY =================
const makePrimary = async (req, res) => {
  try {
    const image = await setPrimaryImage(req.params.id, req.user.id);

    res.json({
      message: "Primary image updated",
      image
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAdImages,
  uploadImages,
  removeImage,
  makePrimary
};