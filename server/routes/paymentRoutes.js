// routes/paymentRoutes.js
// Updated: No auth on /pay (public for now); /status stays public

const express = require("express");
const router = express.Router();
const { processPayment, verifyPaymentStatus } = require("../controllers/paymentController");

// Public: Create premium order (no auth for testing – add later)
router.post("/pay", processPayment);

// Public: Verify status on Cashfree redirect
router.get("/status/:orderId", verifyPaymentStatus);

module.exports = router;