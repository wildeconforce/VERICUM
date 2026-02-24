import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Handle seller role upgrade
  if (body.upgrade_to_seller === true) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentProfile?.role === "seller" || currentProfile?.role === "admin") {
      return NextResponse.json({ error: "Already a seller" }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({ role: "seller" } as never)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Seller upgrade error:", error);
      return NextResponse.json({ error: "Failed to upgrade to seller" }, { status: 500 });
    }

    return NextResponse.json({ profile });
  }

  const allowedFields = ["display_name", "bio", "avatar_url", "language", "country"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
