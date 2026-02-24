import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

export async function createCheckoutSession({
  contentId,
  contentTitle,
  amount,
  currency,
  buyerId,
  buyerEmail,
  licenseType,
  sellerStripeAccountId,
  commissionAmount,
  successUrl,
  cancelUrl,
}: {
  contentId: string;
  contentTitle: string;
  amount: number;
  currency: string;
  buyerId: string;
  buyerEmail: string;
  licenseType: string;
  sellerStripeAccountId: string | null;
  commissionAmount: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: contentTitle,
          description: `Verified content from Vericum`,
          metadata: { content_id: contentId },
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    },
  ];
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: buyerEmail,
    client_reference_id: buyerId,
    metadata: {
      content_id: contentId,
      commission_amount: commissionAmount.toString(),
      license_type: licenseType,
    },
  };
  if (sellerStripeAccountId) {
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: sellerStripeAccountId,
        amount: Math.round((amount - commissionAmount) * 100),
      },
    };
  }
  return stripe.checkout.sessions.create(sessionParams);
}

export async function createConnectAccount(email: string, country: string = "US") {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    email,
    country,
    capabilities: {
      transfers: { requested: true },
    },
  });
}

export async function createConnectOnboardingLink(accountId: string, returnUrl: string) {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export function constructWebhookEvent(body: string | Buffer, signature: string) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
}