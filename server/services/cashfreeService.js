// services/cashfreeService.js
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  "TEST430329ae80e0f32e41a393d78b923034",
  "TESTaf195616268bd6202eeb3bf8dc458956e7192a85"
);

const createOrder = async (
  orderId,
  orderAmount,
  orderCurrency = "INR",
  customerID,
  customerPhone
) => {
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
  const formattedExpiryDate = expiryDate.toISOString();

  const request = {
    order_amount: orderAmount,
    order_currency: orderCurrency,
    order_id: orderId,
    customer_details: {
      customer_id: customerID,
      customer_phone: customerPhone,
    },
    order_meta: {
      // ← FIXED: Direct to backend (port 5000) – Express serves /dashboard.html with query params
      return_url: `http://localhost:5000/dashboard.html?order_id=${orderId}`,
      payment_methods: "cc,upi,nb",
    },
    order_expiry_time: formattedExpiryDate,
  };

  try {
    const response = await cashfree.PGCreateOrder(request);
    return response.data.payment_session_id;
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    throw new Error(error.response?.data?.message || "Failed to create order");
  }
};

const getPaymentStatus = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    const getOrderResponse = response.data;

    let orderStatus = "Failure";
    for (const transaction of getOrderResponse) {
      if (transaction.payment_status === "SUCCESS") {
        orderStatus = "Success";
        break;
      } else if (transaction.payment_status === "PENDING") {
        orderStatus = "Pending";
      }
    }

    return { orderStatus };
  } catch (error) {
    console.error("Error fetching payment status:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch payments");
  }
};

module.exports = {
  createOrder,
  getPaymentStatus,
};