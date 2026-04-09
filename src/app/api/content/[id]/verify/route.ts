import { NextRequest, NextResponse } from "next/server";

// Redirect to the main verify endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Forward to /api/verify with content_id
  const verifyResponse = await fetch(new URL("/api/verify", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    body: JSON.stringify({
      content_id: id,
      file_key: body.file_key,
    }),
  });

  const data = await verifyResponse.json();
  return NextResponse.json(data, { status: verifyResponse.status });
}
