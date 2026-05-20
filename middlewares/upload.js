require("dotenv").config();

const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const { S3Client } = require("@aws-sdk/client-s3");

/* ===============================
   VALIDATE ENV (DEBUG SAFE)
=============================== */
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET_NAME
) {
  console.warn("Missing AWS environment variables");
}

/* ===============================
   AWS S3 CONFIG
=============================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ===============================
   FILE FILTER
=============================== */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed"), false);
  }
};

/* ===============================
   CREATE UPLOADER FACTORY
=============================== */
const createUploader = (folder) => {
  return multer({
    storage: multerS3({
      s3,

      bucket: process.env.AWS_BUCKET_NAME,


      contentType: multerS3.AUTO_CONTENT_TYPE,

      metadata: (req, file, cb) => {
        cb(null, {
          fieldName: file.fieldname,
        });
      },

      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        let filePath = "";

        /* ===============================
           PROFILE IMAGE
        =============================== */
        if (folder === "profile_pic") {
          const userId = req.user?.id || "temp";
          filePath = `profile_pic/${userId}/profile-${Date.now()}${ext}`;
        }

        /* ===============================
           ADS IMAGES
        =============================== */
        else if (folder === "ads") {
          const adId = req.params.adId || "temp";

          const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

          filePath = `ads/${adId}/${uniqueName}${ext}`;
        }

        /* ===============================
           DEFAULT
        =============================== */
        else {
          const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

          filePath = `${folder}/${uniqueName}${ext}`;
        }

        cb(null, filePath);
      },
    }),

    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
};

/* ===============================
   UPLOADERS
=============================== */
const uploadAds = createUploader("ads");
const uploadProfile = createUploader("profile_pic");

/* ===============================
   EXPORTS
=============================== */
module.exports = {
  uploadAds,
  uploadProfile,
  s3,
};