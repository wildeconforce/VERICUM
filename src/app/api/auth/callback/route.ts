import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_REDIRECT_PREFIXES = [
  "/dashboard", "/marketplace", "/my-content", "/purchases",
  "/earnings", "/settings", "/upload", "/content/",
];

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/dashboard";
  // Must be a relative path starting with "/" and not "//" (protocol-relative)
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/dashboard";
  // Block any URL that contains a backslash (bypass via /\evil.com)
  if (redirect.includes("\\")) return "/dashboard";
  // Must match an allowed prefix
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) => redirect.startsWith(prefix));
  return isAllowed ? redirect : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = sanitizeRedirect(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
