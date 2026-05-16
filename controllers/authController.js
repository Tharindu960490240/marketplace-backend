const {
  registerUser,
  loginUser,
  verifyUser,
  getUserById,
  updateProfile,
  updateProfileImage,
  changePassword,
  resendVerification,
  getAllUsers,
  updateUserStatus,
  getUserByEmail,
  resetPasswordByToken,
  deleteUser,
} = require("../services/authService");

const {
  generateToken,
  generateResetToken,
  verifyToken,
} = require("../utils/jwt");

const { buildEmailTemplate } = require("../utils/emailTemplate");

const { sendEmail } = require("../services/emailService");

const constants = require("../config/const");

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { user, verificationToken } = await registerUser(req.body);

    const verifyUrl = `${constants.FRONTEND_URL}/verify/${verificationToken}`;

    const html = buildEmailTemplate({
      title: "Verify your account",
      content: `<h3 style="margin-top:0;">Hi ${req.body.first_name || "there"},</h3>
      <p style="font-size:15px;line-height:1.6;color:#555;">
      Thank you for joining <strong>Agri link services marketplace</strong> - Sri Lanka’s trusted animal marketplace.
      We are excited to have you onboard!</p>
      <p style="font-size:15px;line-height:1.6;color:#555;">
      To complete your registration, please verify your email address by clicking the button below.</p>`,
      action: {
        text: "Verify My Account",
        url: verifyUrl,
      },
    });

    await sendEmail({
      email: req.body.email,
      subject: "Verify your account - Agri link services marketplace",
      html: html,
    });

    res.status(201).json({
      message: "User registered. Verify email.",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const user = await loginUser(req.body.email, req.body.password);

    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

// ================= VERIFY =================
const verifyUserController = async (req, res) => {
  try {
    const result = await verifyUser(req.params.token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= GET PROFILE =================
const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE PROFILE =================
const updateUserProfile = async (req, res) => {
  try {
    const user = await updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE PROFILE IMAGE =================
const updateUserImage = async (req, res) => {
  try {
    const user = await updateProfileImage(req.user.id, req.file);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= CHANGE PASSWORD =================
const changeUserPassword = async (req, res) => {
  try {
    const result = await changePassword(
      req.user.id,
      req.body.oldPassword,
      req.body.newPassword,
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= RESEND VERIFICATION =================
const resendVerificationController = async (req, res) => {
  try {
    const { user, token } = await resendVerification(req.body.email);

    const verifyUrl = `${constants.FRONTEND_URL}/verify/${token}`;

    const html = buildEmailTemplate({
      title: "Verify your account",
      content: `<h3 style="margin-top:0;">Hi ${user.first_name || "there"},</h3>
      <p style="font-size:15px;line-height:1.6;color:#555;">
      Thank you for joining <strong>Agri link services marketplace</strong> - Sri Lanka’s trusted animal marketplace.
      We are excited to have you onboard!</p>
      <p style="font-size:15px;line-height:1.6;color:#555;">
      To complete your registration, please verify your email address by clicking the button below.</p>`,
      action: {
        text: "Verify My Account",
        url: verifyUrl,
      },
    });

    await sendEmail({
      email: user.email,
      subject: "Verify your account - Agri link services marketplace",
      html: html,
    });

    res.json({ message: "Verification email sent again" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= ADMIN: GET USERS =================
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, role } = req.query;

    const result = await getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
      role,
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ================= ADMIN: UPDATE STATUS =================
const updateUserStatusController = async (req, res) => {
  try {
    const user = await updateUserStatus(req.params.id, req.body.status);

    const saved_user = await getUserByEmail(req.body.email);

    if (req.body.status == "suspended" || req.body.status == "active") {
      const html = buildEmailTemplate({
        title:
          req.body.status === "suspended"
            ? "Account Suspended"
            : "Account Activated",
        content:
          req.body.status === "suspended"
            ? `
      <h3 style="margin-top:0;">Hi ${saved_user.first_name || "there"},</h3>

      <p style="font-size:15px;line-height:1.6;color:#555;">
        Your Agri link services marketplace account has been <strong>suspended</strong> due to a violation of our platform policies.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#555;">
        If you believe this was a mistake or need further clarification, please contact our support team.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#555;">
         Email: support@sathwasewana.com
      </p>

      <p style="margin-top:20px;color:#999;">
        Thank you for your understanding.
      </p>
    `
            : `
      <h3 style="margin-top:0;">Hi ${saved_user.first_name || "there"},</h3>

      <p style="font-size:15px;line-height:1.6;color:#555;">
        Great news!  Your Agri link services marketplace account is now <strong>active</strong>.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#555;">
        You can now access all features of the platform and continue using our services without any restrictions.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#555;">
        If you have any questions or need assistance, feel free to contact our support team anytime.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#555;">
         Email: support@sathwasewana.com
      </p>

      <p style="margin-top:20px;color:#999;">
        Thank you for being part of Agri link services marketplace.
      </p>
    `,
      });

      await sendEmail({
        email: saved_user.email,
        subject: "Account Suspended",
        html: html,
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendPasswordResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    const token = generateResetToken(user);

    const resetUrl = `${constants.FRONTEND_URL}/reset-password?token=${token}`;

    const html = buildEmailTemplate({
      title: "Password Reset Request",
      content: `
              <h3 style="margin-top:0;">Hi ${user.first_name || "there"},</h3>
              <p style="font-size:15px;line-height:1.6;color:#555;">
              We received a request to reset your password for your <strong>Agri link services marketplace</strong> account</p>
              <p style="font-size:15px;line-height:1.6;color:#555;">
              Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>`,
      action: {
        text: "Reset My Password",
        url: resetUrl,
      },
    });

    await sendEmail({
      email: user.email,
      subject: "Reset Your Password - Agri link services marketplace",
      html: html,
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetPasswordFromLink = async (req, res) => {
  try {
    const { token, password } = req.body;

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(400).json({
        error: "Invalid or expired token",
      });
    }

    const result = await resetPasswordByToken(decoded.id, password);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================= DELETE ACCOUNT =================
const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await deleteUser(userId);

    // Send farewell email AFTER deletion
    const html = buildEmailTemplate({
      title: "Account Deleted",
      content: `
        <h3 style="margin-top:0;">Goodbye ${deletedUser.first_name || "there"},</h3>

        <p style="font-size:15px;line-height:1.6;color:#555;">
          Your <strong>Agri link services marketplace</strong> account has been permanently deleted as requested.
        </p>

        <p style="font-size:15px;line-height:1.6;color:#555;">
          We’re sorry to see you go. All your data has been removed from our system.
        </p>

        <p style="font-size:15px;line-height:1.6;color:#555;">
          If this was a mistake or you change your mind, you can always create a new account.
        </p>

        <p style="margin-top:20px;color:#999;">
          Thank you for being part of our platform.
        </p>
      `,
    });

    await sendEmail({
      email: deletedUser.email,
      subject: "Your Account Has Been Deleted - Agri link services marketplace",
      html,
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  verifyUser: verifyUserController,
  getProfile,
  updateUserProfile,
  updateUserImage,
  changeUserPassword,
  resendVerification: resendVerificationController,
  getUsers,
  updateUserStatus: updateUserStatusController,
  sendPasswordResetLink,
  resetPasswordFromLink,
  deleteUserAccount,
};

// await pool.query(`
//   UPDATE users
//   SET subscription_type = 'premium',
//       subscription_expiry = NOW() + INTERVAL '30 days'
//   WHERE id = $1
// `, [userId]);
