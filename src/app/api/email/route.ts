import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  type: "sale_complete" | "purchase_confirmation" | "verification_complete";
  to: string;
  data: Record<string, any>;
}

const EMAIL_TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  sale_complete: (data) => ({
    subject: `Sale Complete - ${data.contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Sale Complete!</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Your content <strong>"${data.contentTitle}"</strong> was purchased!</p>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #059669; font-size: 24px; font-weight: bold;">+$${data.sellerAmount}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Added to your earnings</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">License: ${data.licenseType} | Buyer: ${data.buyerEmail}</p>
          <a href="${data.dashboardUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Dashboard</a>
        </div>
      </div>
    `,
  }),
  purchase_confirmation: (data) => ({
    subject: `Purchase Confirmed - ${data.contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>You've purchased <strong>"${data.contentTitle}"</strong></p>
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold;">Amount: $${data.amount}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">License: ${data.licenseType}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">License Key: ${data.licenseKey}</p>
          </div>
          <a href="${data.downloadUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Download Content</a>
        </div>
      </div>
    `,
  }),
  verification_complete: (data) => ({
    subject: `Verification ${data.status === "verified" ? "Passed" : "Update"} - ${data.contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Verification ${data.status === "verified" ? "Passed!" : "Update"}</h1>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Your content <strong>"${data.contentTitle}"</strong> has been ${data.status}.</p>
          ${data.status === "verified" ? '<p style="color: #059669;">Your content is now live on the marketplace!</p>' : '<p style="color: #ef4444;">Please review and re-submit if needed.</p>'}
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px;">Verification Score: <strong>${data.score}%</strong></p>
          </div>
          <a href="${data.contentUrl}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Content</a>
        </div>
      </div>
    `,
  }),
};

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const body: EmailRequest = await request.json();
  const { type, to, data } = body;

  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  }

  const { subject, html } = template(data);

  try {
    await resend.emails.send({
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
