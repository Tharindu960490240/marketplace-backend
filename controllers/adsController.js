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
      emailTitle =
        "Your Ad is Being Reviewed | ඔබේ වෙළඳ දැන්වීම පරීක්ෂා කරමින් පවතී";
      emailContent = `
      <!-- English Section -->
      <p>Thank you for posting your ad <strong>${ad.title}</strong> on <strong>Agri Link Services Marketplace</strong>.</p>
      <p>Your ad is currently under review by our team to ensure it meets our quality and safety guidelines.</p>
      <p>This process usually takes a short time. We’ll notify you as soon as it is approved.</p>
      
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      
      <!-- Sinhala Section -->
      <p>ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීම <strong>Agri Link Services Marketplace</strong> වෙත ඇතුළත් කිරීම පිළිබඳව ස්තුතියි.</p>
      <p>ඔබේ දැන්වීම අපගේ මාර්ගෝපදේශවලට අනුකූලදැයි තහවුරු කර ගැනීමට අපගේ කණ්ඩායම විසින් මේ වන විට පරීක්ෂා කරමින් පවතී.</p>
      <p>මේ සඳහා ගතවන්නේ කෙටි කාලයකි. එය අනුමත වූ වහාම අපි ඔබට දන්වන්නෙමු.</p>
    `;
      break;

    case "active":
      emailTitle = "Your Ad is Live | ඔබේ වෙළඳ දැන්වීම දැන් සක්‍රීයයි";
      emailContent = `
      <!-- English Section -->
      <p>Great news! Your ad <strong>${ad.title}</strong> has been approved and is now live on our platform.</p>
      <p>Buyers can now view your listing and contact you directly.</p>
      <p>Make sure to respond quickly to inquiries to increase your chances of selling.</p>
      
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      
      <!-- Sinhala Section -->
      <p>සුභ ආරංචියක්! ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීම අනුමත කර ඇති අතර එය දැන් අපගේ වෙබ් අඩවියේ සක්‍රීයව පවතී.</p>
      <p>මිලදී ගන්නන්ට දැන් ඔබේ දැන්වීම දැක බලා ගත හැකි අතර ඔබව සෘජුවම සම්බන්ධ කර ගත හැක.</p>
      <p>විකිණීමේ අවස්ථාව වැඩි කර ගැනීමට ඔබට ලැබෙන පණිවිඩවලට ඉක්මනින් පිළිතුරු සපයන්න.</p>
    `;
      break;

    case "sold":
      emailTitle =
        "Your Ad Has Been Marked as Sold | ඔබේ භාණ්ඩය විකුණා ඇති ලෙස සලකුණු කර ඇත";
      emailContent = `
      <!-- English Section -->
      <p>Your ad <strong>${ad.title}</strong> has been successfully marked as <strong>sold</strong>.</p>
      <p>We’re glad you found a buyer through our platform!</p>
      <p>If you have more items to sell, feel free to post a new ad anytime.</p>
      
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      
      <!-- Sinhala Section -->
      <p>ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීම <strong>විකුණා ඇති ලෙස</strong> සාර්ථකව සලකුණු කර ඇත.</p>
      <p>අපගේ වෙබ් අඩවිය හරහා ඔබට ගැනුම්කරුවෙකු සොයා ගැනීමට ලැබීම පිළිබඳව අපි සතුටු වෙමු!</p>
      <p>ඔබට විකිණීමට වෙනත් භාණ්ඩ තිබේ නම්, ඕනෑම වේලාවක නව දැන්වීමක් ඇතුළත් කළ හැක.</p>
    `;
      break;

    case "rejected":
      emailTitle = "Your Ad Was Not Approved | ඔබේ වෙළඳ දැන්වීම අනුමත නොකෙරුණි";
      emailContent = `
      <!-- English Section -->
      <p>We regret to inform you that your ad <strong>${ad.title}</strong> was not approved.</p>
      <p><strong>Reason / හේතුව:</strong></p>
      <p style="background:#fff3f3;padding:10px;border-left:4px solid #e53935;">
        ${ad.rejection_reason || "No specific reason provided. / නිශ්චිත හේතුවක් දක්වා නොමැත."}
      </p>
      <p>This may be due to incomplete information or not meeting our listing guidelines.</p>
      <p>Please review your ad, make the necessary changes, and submit it again.</p>
      
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      
      <!-- Sinhala Section -->
      <p>කණගාටුයි, ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීම අනුමත කිරීමට අපට නොහැකි වී ඇත.</p>
      <p>දැන්වීමේ තොරතුරු අසම්පූර්ණ වීම හෝ අපගේ මාර්ගෝපදේශවලට පටහැනි වීම මීට හේතුව විය හැක.</p>
      <p>කරුණාකර ඔබේ දැන්වීම නැවත පරීක්ෂා කර, අවශ්‍ය වෙනස්කම් සිදු කර නැවත ඉදිරිපත් කරන්න.</p>
    `;
      break;

    case "deleted":
      emailTitle = "Your Ad Has Been Removed | ඔබේ වෙළඳ දැන්වීම ඉවත් කර ඇත";
      emailContent = `
      <!-- English Section -->
      <p>Your ad <strong>${ad.title}</strong> has been removed from <strong>Agri Link Services Marketplace</strong>.</p>
      <p>If you believe this was a mistake or need more information, please contact our support team.</p>
      
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      
      <!-- Sinhala Section -->
      <p>ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීම <strong>Agri Link Services Marketplace</strong> වෙතින් ඉවත් කර ඇත.</p>
      <p>මෙය වැරදීමකින් සිදුවූවක් යැයි ඔබ සිතන්නේ නම් හෝ වැඩිදුර තොරතුරු අවශ්‍ය නම්, කරුණාකර අපගේ සහාය කණ්ඩායම සම්බන්ධ කර ගන්න.</p>
    `;
      break;

    default:
      emailTitle =
        "Ad Status Updated | වෙළඳ දැන්වීමේ තත්ත්වය යාවත්කාලීන කරන ලදී";
      emailContent = `
      <p>Your ad <strong>${ad.title}</strong> status has been updated to <strong>${status}</strong>.</p>
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      <p>ඔබේ <strong>${ad.title}</strong> වෙළඳ දැන්වීමේ තත්ත්වය <strong>${status}</strong> ලෙස යාවත්කාලීන කර ඇත.</p>
    `;
  }

  const html = buildEmailTemplate({
    title: emailTitle,
    content: `
    <h3 style="margin-top:0;">Hi ${ad.first_name || "there"} / ආයුබෝවන්,</h3>
    ${emailContent}
    <p style="margin-top:30px; font-size: 13px; color: #666;">
      Thank you for using <strong>Agri Link Services Marketplace</strong>.<br>
      <strong>Agri Link Services Marketplace</strong> භාවිතා කිරීම පිළිබඳව ඔබට ස්තුතියි.
    </p>
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
