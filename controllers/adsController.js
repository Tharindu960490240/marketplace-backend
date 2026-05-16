const {
  createAdService,
  getAdsService,
  getSingleAdService,
  getMyAdsService,
  updateAdService,
  deleteAdService,
  changeStatusService,
  incrementViewsService,
  uploadAdImagesService,
  getAdWithUserService,
} = require("../services/adsService");

const { buildEmailTemplate } = require("../utils/emailTemplate");

const { sendEmail } = require("../services/emailService");

/* ===========================
   CREATE AD
=========================== */
const createAd = async (req, res) => {
  try {
    const userId = req.user.id;

    const ad = await createAdService(req.body, userId);
    const ad_data = await getAdWithUserService(ad.id);
    // attach reason for email usage
    const reason = null;
    const status = "pending";
    // 3. Send email
    await sendAdStatusEmail(ad_data, status, reason);

    res.status(201).json({
      message: "Ad created successfully",
      ad,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ===========================
   UPLOAD IMAGES
=========================== */
const uploadAdImages = async (req, res) => {
  try {
    const adId = req.params.adId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const images = await uploadAdImagesService(adId, files);

    res.status(201).json({
      message: "Images uploaded successfully",
      images,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET ALL ADS (FILTER SUPPORT)
=========================== */
const getAds = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const ads = await getAdsService(req.query, userId);

    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   GET SINGLE AD
=========================== */
const getSingleAd = async (req, res) => {
  try {
    const adId = req.params.id;

    const userId = req.user?.id || null;

    const ad = await getSingleAdService(adId, userId);

    res.json(ad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   MY ADS
=========================== */
const getMyAds = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const ads = await getMyAdsService(req.query, userId);

    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   UPDATE AD
=========================== */
const updateAd = async (req, res) => {
  try {
    const ad = await updateAdService(req.params.id, req.user.id, req.body);

    res.json({
      message: "Ad updated successfully",
      ad,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   DELETE AD
=========================== */
const deleteAd = async (req, res) => {
  try {
    await deleteAdService(req.params.id, req.user.id);

    res.json({ message: "Ad deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   MARK AS SOLD
=========================== */
const changeStatus = async (req, res) => {
  try {
    let { status, reason } = req.body;
    const adId = req.params.id;

    if (status !== "rejected") {
      reason = null;
    } else {
      reason = reason?.trim() || null;

      // optional strict validation
      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }
    }

    // 1. Update status
    await changeStatusService(adId, status, reason);

    // 2. Get ad + user info
    const ad = await getAdWithUserService(adId);

    // attach reason for email usage
    ad.rejection_reason = reason;

    // 3. Send email
    await sendAdStatusEmail(ad, status, reason);

    res.json({ message: "Ad marked as " + status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================
   INCREMENT VIEWS
=========================== */
const incrementViews = async (req, res) => {
  try {
    await incrementViewsService(req.params.id);

    res.json({ message: "View counted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// services/adStatusEmailService.js

const sendAdStatusEmail = async (ad, status, reason) => {
  let emailTitle = "";
  let emailContent = "";
  let action = null;

  switch (status) {
    case "pending":
      emailTitle = "Your Ad is Being Reviewed";
      emailContent = `
        <p>Thank you for posting your ad <strong>${ad.title}</strong> on <strong>Agri Link Services Marketplace</strong>.</p>
        <p>Your ad is currently under review by our team to ensure it meets our quality and safety guidelines.</p>
        <p>This process usually takes a short time. We’ll notify you as soon as it is approved.</p>
      `;
      break;

    case "active":
      emailTitle = "Your Ad is Live";
      emailContent = `
        <p>Great news! Your ad <strong>${ad.title}</strong> has been approved and is now live on our platform.</p>
        <p>Buyers can now view your listing and contact you directly.</p>
        <p>Make sure to respond quickly to inquiries to increase your chances of selling.</p>
      `;
      break;

    case "sold":
      emailTitle = "Your Ad Has Been Marked as Sold";
      emailContent = `
        <p>Your ad <strong>${ad.title}</strong> has been successfully marked as <strong>sold</strong>.</p>
        <p>We’re glad you found a buyer through our platform!</p>
        <p>If you have more items to sell, feel free to post a new ad anytime.</p>
      `;
      break;

    case "rejected":
      emailTitle = "Your Ad Was Not Approved";
      emailContent = `
        <p>We regret to inform you that your ad <strong>${ad.title}</strong> was not approved.</p>
        
        <p><strong>Reason:</strong></p>
        <p style="background:#fff3f3;padding:10px;border-left:4px solid #e53935;">
          ${ad.rejection_reason || "No specific reason provided."}
        </p>

        <p>This may be due to incomplete information or not meeting our listing guidelines.</p>
        <p>Please review your ad, make the necessary changes, and submit it again.</p>
      `;
      break;

    case "deleted":
      emailTitle = "Your Ad Has Been Removed";
      emailContent = `
        <p>Your ad <strong>${ad.title}</strong> has been removed from <strong>Agri Link Services Marketplace</strong>.</p>
        <p>If you believe this was a mistake or need more information, please contact our support team.</p>
      `;
      break;

    default:
      emailTitle = "Ad Status Updated";
      emailContent = `
        <p>Your ad <strong>${ad.title}</strong> status has been updated to <strong>${status}</strong>.</p>
      `;
  }

  const html = buildEmailTemplate({
    title: emailTitle,
    content: `
      <h3 style="margin-top:0;">Hi ${ad.first_name || "there"},</h3>
      ${emailContent}
      <p style="margin-top:20px;">Thank you for using <strong>Agri Link Services Marketplace</strong>.</p>
    `,
    action,
  });

  await sendEmail({
    email: ad.user_email,
    subject: `${emailTitle} - Agri Link Services Marketplace`,
    html,
  });
};

/* ===========================
   EXPORT
=========================== */
module.exports = {
  createAd,
  getAds,
  getSingleAd,
  getMyAds,
  updateAd,
  deleteAd,
  changeStatus,
  incrementViews,
  uploadAdImages,
};
