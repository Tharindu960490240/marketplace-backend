const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Send email
const sendEmail = async ({ email, subject, text, html }) => {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "Agri Link Services Marketplace",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: subject,
      textContent: text || "",
      htmlContent: html || "",
    });

    return {
      success: true,
      message: "Email sent successfully",
      data: response,
    };
  } catch (error) {
    console.error("Email send failed:", error.response?.body || error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendEmail,
};