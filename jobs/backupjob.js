require("dotenv").config();

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

/* ===============================
   S3 CONFIG (same style as yours)
=============================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ===============================
   MAIN BACKUP FUNCTION
=============================== */
const backupDatabase = async () => {
  const DB_NAME = process.env.DB_NAME;
  const DB_USER = process.env.DB_USER;
  const DB_HOST = process.env.DB_HOST || "localhost";

  const fileName = `backup-${new Date().toISOString().split("T")[0]}.sql`;
  const filePath = path.join("/tmp", fileName);

  return new Promise((resolve, reject) => {
    /* ===============================
       1. CREATE POSTGRES DUMP
    =============================== */
    const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} ${DB_NAME} > ${filePath}`;

    exec(command, async (error) => {
      if (error) {
        console.error(" DB Backup failed:", error);
        return reject(error);
      }

      //   console.log(" DB backup created:", fileName);

      try {
        /* ===============================
           2. READ FILE
        =============================== */
        const fileContent = fs.readFileSync(filePath);

        /* ===============================
           3. UPLOAD TO S3
        =============================== */
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `db-backups/${fileName}`,
            Body: fileContent,
            ContentType: "application/sql",
          }),
        );

        // console.log("Backup uploaded to S3");

        /* ===============================
           4. CLEAN LOCAL FILE
        =============================== */
        fs.unlinkSync(filePath);

        resolve(true);
      } catch (uploadErr) {
        console.error("S3 upload failed:", uploadErr);
        reject(uploadErr);
      }
    });
  });
};

module.exports = backupDatabase;
