const nodemailer = require("nodemailer");
const constants = require("../config/const");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: constants.EMAIL_USER,
    pass: constants.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  connectionTimeout: 10000,
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("FULL ERROR:", error);
  } else {
    console.log("Email service is ready");
  }
});

// Send email
const sendEmail = async ({ email, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"Agri Link Services Marketplace" <${constants.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email send failed:", error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  sendEmail,
};
