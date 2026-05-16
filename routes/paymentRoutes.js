const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middlewares/auth");

const {
  create,
  complete,
  myPayments,
} = require("../controllers/paymentController");

// create payment
router.post("/", authMiddleware, create);

// complete payment (after gateway callback)
router.patch("/:id/complete", authMiddleware, complete);

// get user payments
router.get("/my", authMiddleware, myPayments);

module.exports = router;
