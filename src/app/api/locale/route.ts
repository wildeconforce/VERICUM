import { NextRequest, NextResponse } from "next/server";

const VALID_LOCALES = ["en", "ko", "es", "fr", "ja", "zh", "de", "ar", "pt", "hi"];

export async function POST(request: NextRequest) {
  const { locale } = await request.json();

  if (!locale || typeof locale !== "string" || !VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Needs JS access for client-side i18n
  });
  return response;
}
