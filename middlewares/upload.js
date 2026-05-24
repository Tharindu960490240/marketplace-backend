require("dotenv").config();

const multer = require("multer");
const multerS3 = require("multer-s3-transform");
const path = require("path");
const sharp = require("sharp");

const { S3Client } = require("@aws-sdk/client-s3");

/* ===============================
   VALIDATE ENV
=============================== */
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET_NAME ||
  !process.env.AWS_REGION
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

    // iPhone formats
    "image/heic",
    "image/heif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("Blocked file type:", file.mimetype);

    cb(
      new Error(
        "Only JPG, PNG, WEBP, HEIC and HEIF images are allowed"
      ),
      false
    );
  }
};

/* ===============================
   GENERATE FILE PATH
=============================== */
const generateFilePath = (folder, req) => {
  const ext = ".jpg";

  if (folder === "profile_pic") {
    const userId = req.user?.id || "temp";

    return `profile_pic/${userId}/profile-${Date.now()}${ext}`;
  }

  if (folder === "ads") {
    const adId = req.params.adId || "temp";

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    return `ads/${adId}/${uniqueName}${ext}`;
  }

  const uniqueName =
    Date.now() + "-" + Math.round(Math.random() * 1e9);

  return `${folder}/${uniqueName}${ext}`;
};

/* ===============================
   CREATE UPLOADER FACTORY
=============================== */
const createUploader = (folder) => {
  return multer({
    storage: multerS3({
      s3,

      bucket: process.env.AWS_BUCKET_NAME,

      /* ===============================
         FORCE JPEG CONTENT TYPE
      =============================== */
      contentType: (req, file, cb) => {
        cb(null, "image/jpeg");
      },

      /* ===============================
         METADATA
      =============================== */
      metadata: (req, file, cb) => {
        cb(null, {
          fieldName: file.fieldname,
        });
      },

      /* ===============================
         ORIGINAL KEY
      =============================== */
      key: (req, file, cb) => {
        cb(null, generateFilePath(folder, req));
      },

      /* ===============================
         ENABLE TRANSFORM
      =============================== */
      shouldTransform: true,

      /* ===============================
         IMAGE TRANSFORMS
      =============================== */
      transforms: [
        {
          id: "compressed",

          key: (req, file, cb) => {
            cb(null, generateFilePath(folder, req));
          },

          transform: (req, file, cb) => {
            let size = 1200;
            let quality = 85;

            // Profile pictures
            if (folder === "profile_pic") {
              size = 400;
              quality = 70;
            }

            cb(
              null,

              sharp()

                // Fix iPhone rotation
                .rotate()

                // Resize
                .resize({
                  width: size,
                  withoutEnlargement: true,
                })

                // Convert to optimized JPEG
                .jpeg({
                  quality,
                  mozjpeg: true,
                })
            );
          },
        },
      ],
    }),

    fileFilter,

    limits: {
      // 15MB max
      fileSize: 15 * 1024 * 1024,
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