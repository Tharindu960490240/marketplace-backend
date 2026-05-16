const {
  createPayment,
  completePayment,
  getUserPayments
} = require("../services/paymentService");

// ================= CREATE PAYMENT =================
const create = async (req, res) => {
  try {
    const payment = await createPayment({
      user_id: req.user.id,
      ad_id: req.body.ad_id,
      amount: req.body.amount,
      method: req.body.method
    });

    res.json({
      message: "Payment created (pending)",
      payment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= COMPLETE PAYMENT =================
const complete = async (req, res) => {
  try {
    const payment = await completePayment(
      req.params.id,
      req.body.transactionId
    );

    res.json({
      message: "Payment completed",
      payment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET MY PAYMENTS =================
const myPayments = async (req, res) => {
  try {
    const payments = await getUserPayments(req.user.id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  create,
  complete,
  myPayments
};