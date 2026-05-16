const sgMail = require("@sendgrid/mail");

const constants = require("../config/const");

sgMail.setApiKey(constants.SENDGRID_API_KEY);

const sendEmail = async ({ email, subject, text, html }) => {
  try {
    const msg = {
      from: constants.EMAIL_USER,
      to: email,
      subject,
      text,
      html,
    };

    const response = await sgMail.send(msg);

    return {
      success: true,
      message: "Email sent successfully",
      response,
    };
  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error.message);
    throw new Error("Email failed");
  }
};

module.exports = { sendEmail };
