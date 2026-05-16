const nodemailer = require("nodemailer");
const constants = require("../config/const");

const transporter = nodemailer.createTransport({
  host: "smtpx.zoho.com", // Switched to the transactional SMTP endpoint
  port: 465,
  secure: true, 
  auth: {
    user: constants.EMAIL_USER,
    pass: constants.EMAIL_PASS, // Keep using the App-Specific Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email service error:", error.message);
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
