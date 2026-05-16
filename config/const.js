let constants = {
  SECRET_KEY: "deliver_app",
  UPLOAD_PROFILE_PIC_FULL: "upload/profile_pic/full/",
  UPLOAD_PROFILE_PIC_THUMB: "upload/profile_pic/thumb/",

  MERCHANT_COMMISSION_PERCENT: 10,
  DRIVER_COMMISSION_PERCENT: 15,

  PORT: 3200,
  // DB_USER: "postgres",
  // DB_HOST: "localhost",
  // DB_PORT: 5432,
  // DB_PASSWORD: "9761",
  // HOST: "192.168.5.18,
  DEFAULT_DB: "postgres",

  DB_HOST: "dpg-d83sdhfaqgkc73a3qr20-a.virginia-postgres.render.com",
  DB_PORT: 5432,
  DB_NAME: "sathwa_sewana",
  DB_USER: "marketplace_user",
  DB_PASSWORD: "eXhP7g0Nq16FstcAm2XSIZEk6MwxM4Sw",

  HOST: "dpg-d83sdhfaqgkc73a3qr20-a",

  EMAIL_USER: "info@agrilinkservices.com",
  EMAIL_PASS: "AgriLinkServices@2025",

  FRONTEND_URL_2: "http://localhost:4200",

  JWT_SECRET: "dilan_sathwa_sewana_secret_key_2026",
  JWT_EXPIRES_IN: "1h",
  LOGO_URL:
    "https://marketplace-frontend-tawny.vercel.app/public/assets/logo.png",

  FRONTEND_URL: "https://marketplace-frontend-tawny.vercel.app/",

  MAX_ADS_COUNT: 5,
};

module.exports = Object.freeze(constants);


let constants = {
  SECRET_KEY: "deliver_app",
  UPLOAD_PROFILE_PIC_FULL: "upload/profile_pic/full/",
  UPLOAD_PROFILE_PIC_THUMB: "upload/profile_pic/thumb/",

  MERCHANT_COMMISSION_PERCENT: 10,
  DRIVER_COMMISSION_PERCENT: 15,

    // DB_USER: "postgres",
  // DB_HOST: "localhost",
  // DB_PORT: 5432,
  // DB_PASSWORD: "9761",
  // HOST: "192.168.5.18,
  
  // Render automatically provides PORT, fallback to 3200 for localhost
  PORT: process.env.PORT || 3200, 
  DEFAULT_DB: "postgres",

  // Database Configuration
  DB_HOST: process.env.DB_HOST || "dpg-d83sdhfaqgkc73a3qr20-a.virginia-postgres.render.com",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || "sathwa_sewana",
  DB_USER: process.env.DB_USER || "marketplace_user",
  DB_PASSWORD: process.env.DB_PASSWORD, // No fallback, must be in Render Env

  HOST: process.env.HOST || "dpg-d83sdhfaqgkc73a3qr20-a",

  // Email Configuration
  EMAIL_USER: process.env.EMAIL_USER || "info@agrilinkservices.com",
  EMAIL_PASS: process.env.EMAIL_PASS, // No fallback, must be in Render Env

  // Security & URLs
  JWT_SECRET: process.env.JWT_SECRET || "fallback_local_secret_key",
  JWT_EXPIRES_IN: "1h",
  LOGO_URL: "https://marketplace-frontend-tawny.vercel.app/public/assets/logo.png",
  FRONTEND_URL: "https://marketplace-frontend-tawny.vercel.app/",

  MAX_ADS_COUNT: 5,
};

module.exports = Object.freeze(constants);