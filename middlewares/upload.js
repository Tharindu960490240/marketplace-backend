const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* ===============================
   CREATE UPLOADER FACTORY
=============================== */
const createUploader = (folder, type = "multi") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let finalPath = `uploads/${folder}`;

      // PROFILE: uploads/profile_pic/{userId}
      if (folder === "profile_pic") {
        const userId = req.user?.id || "temp";
        finalPath = `uploads/profile_pic/${userId}`;
      }

      // ADS: uploads/ads/{adId}
      // inside multer destination
      if (folder === "ads") {
        const adId = req.params.adId || "temp";
        finalPath = `uploads/ads/${adId}`;
      }

      // create folder if not exists
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }

      cb(null, finalPath);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      // ================= PROFILE IMAGE (overwrite style)
      if (folder === "profile_pic") {
        cb(null, "profile" + ext);
      }

      // ================= ADS IMAGES (unique names)
      else {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, uniqueName + ext);
      }
    },
  });

  return multer({ storage });
};

/* ===============================
   UPLOADERS
=============================== */
const uploadAds = createUploader("ads");
const uploadProfile = createUploader("profile_pic");

module.exports = {
  uploadAds,
  uploadProfile,
};
