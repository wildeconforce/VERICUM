import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latencyMs: number };
    storage: { status: string };
    email: { configured: boolean };
    stripe: { configured: boolean };
    aiDetectors: { configured: string[] };
    c2pa: { available: boolean };
  };
  env: { missing: string[] };
}

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const OPTIONAL_ENV: Record<string, string> = {
  RESEND_API_KEY: "Email notifications",
  STRIPE_SECRET_KEY: "Stripe payments",
  STRIPE_WEBHOOK_SECRET: "Stripe webhooks",
  HIVE_API_KEY: "Hive AI detection",
  OPTIC_API_KEY: "Optic AI detection",
  ILLUMINARTY_API_KEY: "Illuminarty AI detection",
  INTERNAL_EMAIL_SECRET: "Internal API auth",
  NEXT_PUBLIC_APP_URL: "App URL",
};

export async function GET() {
  const checks: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "VTL-1.0.0",
    checks: {
      database: { status: "unknown", latencyMs: 0 },
      storage: { status: "unknown" },
      email: { configured: !!process.env.RESEND_API_KEY },
      stripe: { configured: !!process.env.STRIPE_SECRET_KEY },
      aiDetectors: {
        configured: [
          process.env.HIVE_API_KEY ? "hive" : null,
          process.env.OPTIC_API_KEY ? "optic" : null,
          process.env.ILLUMINARTY_API_KEY ? "illuminarty" : null,
        ].filter(Boolean) as string[],
      },
      c2pa: { available: false },
    },
    env: {
      missing: REQUIRED_ENV.filter((key) => !process.env[key]),
    },
  };

  // Check required env
  if (checks.env.missing.length > 0) {
    checks.status = "unhealthy";
  }

  // Database check
  try {
    const start = Date.now();
    const admin = createAdminClient();
    await admin.from("profiles").select("id").limit(1);
    checks.checks.database = {
      status: "connected",
      latencyMs: Date.now() - start,
    };
  } catch {
    checks.checks.database = { status: "disconnected", latencyMs: 0 };
    checks.status = "unhealthy";
  }

  // C2PA check — use eval require to avoid build-time bundling of native module
  try {
    const c2pa = eval('require')("c2pa-node");
    checks.checks.c2pa.available = !!c2pa?.createC2pa;
  } catch {
    checks.checks.c2pa.available = false;
  }

  // Determine overall status
  if (checks.status !== "unhealthy") {
    const hasPayments = checks.checks.stripe.configured;
    const hasEmail = checks.checks.email.configured;
    if (!hasPayments || !hasEmail) {
      checks.status = "degraded";
    }
  }

  const statusCode = checks.status === "healthy" ? 200 : checks.status === "degraded" ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
