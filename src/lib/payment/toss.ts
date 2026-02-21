// Toss Payments integration (Korean market) - Post-MVP
// This is a placeholder for future implementation

export interface TossPaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  successUrl: string;
  failUrl: string;
}

export async function createTossPayment(request: TossPaymentRequest) {
  if (!process.env.TOSS_SECRET_KEY) {
    throw new Error("Toss Payments is not configured");
  }

  const response = await fetch("https://api.tosspayments.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to create Toss payment");
  }

  return response.json();
}

export async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
  const response = await fetch(`https://api.tosspayments.com/v1/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    throw new Error("Failed to confirm Toss payment");
  }

  return response.json();
}
