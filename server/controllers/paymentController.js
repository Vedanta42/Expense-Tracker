// controllers/paymentController.js
// Updated: verifyPaymentStatus now returns a nice HTML success page + redirects to dashboard

const Order = require("../models/Order");
const User = require("../models/User");
const { getPaymentStatus } = require("../services/cashfreeService");

const processPayment = async (req, res) => {
  const { userId, amount = 199.00, customerPhone } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "User ID required" });
  }

  const orderId = `ORDER-${Date.now()}`;
  const customerID = userId.toString();

  try {
    const paymentSessionId = await require("../services/cashfreeService").createOrder(
      orderId,
      amount,
      "INR",
      customerID,
      customerPhone || "9999999999"
    );

    await Order.create({
      orderId,
      paymentSessionId,
      amount,
      status: "PENDING",
      userId: parseInt(userId),
    });

    res.json({ paymentSessionId, orderId });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

const verifyPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).send("Order ID required");
  }

  try {
    const { orderStatus } = await getPaymentStatus(orderId);

    const order = await Order.findOne({ where: { orderId } });
    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (orderStatus === "Success") {
      await order.update({ status: "SUCCESSFUL" });

      const user = await User.findByPk(order.userId);
      if (user && !user.isPremium) {
        await user.update({ isPremium: true });
      }

      // ← NICE SUCCESS PAGE + auto redirect to dashboard
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 60px; background: #f0f8f0; }
            .card { background: white; max-width: 400px; margin: 0 auto; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #28a745; }
            .check { font-size: 80px; color: #28a745; }
            p { font-size: 18px; color: #333; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">✓</div>
            <h1>Payment Successful!</h1>
            <p>Congratulations! You are now a Premium member.</p>
            <p>Redirecting to dashboard...</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = "http://127.0.0.1:5500/dashboard.html";
            }, 3000);
          </script>
        </body>
        </html>
      `);
    } else if (orderStatus === "Pending") {
      await order.update({ status: "PENDING" });
      res.send(`<h2>Payment is still Pending. Refresh in a few seconds.</h2>`);
    } else {
      await order.update({ status: "FAILED" });
      res.send(`<h2>Payment Failed. Please try again.</h2>`);
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).send("Verification failed");
  }
};

module.exports = {
  processPayment,
  verifyPaymentStatus,
};