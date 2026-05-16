const nodemailer = require("nodemailer");
const constants = require("../config/const");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 587,
  secure: false, // must be false for 587
  auth: {
    user: constants.EMAIL_USER,
    pass: constants.EMAIL_PASS,
  },
  requireTLS: true,
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
    console.error("Email send failed:", error);
    throw new Error(error.message);
  }
};

module.exports = {
  sendEmail,
};


