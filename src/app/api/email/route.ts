import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url: unknown): string {
  const s = String(url ?? "");
  if (/^https?:\/\//i.test(s)) return s;
  return "#";
}

interface EmailRequest {
  type: "sale_complete" | "purchase_confirmation" | "verification_complete";
  to: string;
  data: Record<string, any>;
}

const EMAIL_TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  sale_complete: (data) => ({
    subject: `Sale Complete - ${escapeHtml(data.contentTitle)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Sale Complete!</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Your content <strong>&quot;${escapeHtml(data.contentTitle)}&quot;</strong> was purchased!</p>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #059669; font-size: 24px; font-weight: bold;">+$${escapeHtml(data.sellerAmount)}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Added to your earnings</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">License: ${escapeHtml(data.licenseType)} | Buyer: ${escapeHtml(data.buyerEmail)}</p>
          <a href="${sanitizeUrl(data.dashboardUrl)}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Dashboard</a>
        </div>
      </div>
    `,
  }),
  purchase_confirmation: (data) => ({
    subject: `Purchase Confirmed - ${escapeHtml(data.contentTitle)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>You've purchased <strong>&quot;${escapeHtml(data.contentTitle)}&quot;</strong></p>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold;">Amount: $${escapeHtml(data.amount)}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">License: ${escapeHtml(data.licenseType)}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">License Key: ${escapeHtml(data.licenseKey)}</p>
          </div>
          <a href="${sanitizeUrl(data.downloadUrl)}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Download Content</a>
        </div>
      </div>
    `,
  }),
  verification_complete: (data) => ({
    subject: `Verification ${data.status === "verified" ? "Passed" : "Update"} - ${escapeHtml(data.contentTitle)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Verification ${data.status === "verified" ? "Passed!" : "Update"}</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Your content <strong>&quot;${escapeHtml(data.contentTitle)}&quot;</strong> has been ${escapeHtml(data.status)}.</p>
          ${data.status === "verified" ? '<p style="color: #059669;">Your content is now live on the marketplace!</p>' : '<p style="color: #ef4444;">Please review and re-submit if needed.</p>'}
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px;">Verification Score: <strong>${escapeHtml(data.score)}%</strong></p>
          </div>
          <a href="${sanitizeUrl(data.contentUrl)}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Content</a>
        </div>
      </div>
    `,
  }),
};

export async function POST(request: NextRequest) {
  // Auth: require either a valid user session or internal secret
  // INTERNAL_EMAIL_SECRET must be configured for internal calls to work
  const internalSecret = request.headers.get("x-internal-secret");
  const isInternalCall =
    !!process.env.INTERNAL_EMAIL_SECRET &&
    process.env.INTERNAL_EMAIL_SECRET.length >= 32 &&
    internalSecret === process.env.INTERNAL_EMAIL_SECRET;

  if (!isInternalCall) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const body: EmailRequest = await request.json();
  const { type, to, data } = body;

  // Validate email recipient format
  if (!to || typeof to !== "string" || !to.includes("@")) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  }

  const { subject, html } = template(data);

  try {
    await getResend().emails.send({
      from: "Vericum <noreply@vericum.com>",
      to,
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
