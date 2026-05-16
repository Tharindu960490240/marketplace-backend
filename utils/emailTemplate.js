const constants = require("../config/const");

const buildEmailTemplate = ({ title, content, action }) => {
  return `
    <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">

      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#2196f3 0%,#4dabf5 100%);padding:25px;text-align:center;">
          <img src="${constants.LOGO_URL || "https://via.placeholder.com/120x40?text=Logo"}"
               alt="Logo"
               style="width:120px;margin-bottom:10px;" />
          <h2 style="color:#ffffff;margin:0;font-size:22px;">
            ${title}
          </h2>
        </div>

        <!-- Body -->
        <div style="padding:30px;color:#333333;">
          ${content}

          ${
            action?.text && action?.url
              ? `
              <div style="text-align:center;margin:30px 0;">
                <a href="${action.url}"
                  style="
                    background:linear-gradient(135deg,#2196f3 0%,#4dabf5 100%);
                    color:#ffffff;
                    padding:14px 28px;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                    display:inline-block;
                    font-size:15px;">
                  ${action.text}
                </a>
              </div>

              <p style="font-size:13px;color:#888;line-height:1.6;">
                    If the button doesn’t work, copy and paste this link into your browser:
              </p>

              <p style="font-size:12px;color:#2196f3;word-break:break-all;">
                ${action.url}
              </p>
            `
              : ""
          }
        </div>

        <!-- Footer -->
        <div style="background:#f4f6f8;padding:20px;text-align:center;font-size:12px;color:#888;">
          © ${new Date().getFullYear()} Agri link services marketplace. All rights reserved.
        </div>

      </div>
    </div>
  `;
};

module.exports = { buildEmailTemplate };