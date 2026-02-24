import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

// Security headers applied to all responses
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // --- Rate limiting for API routes ---
  if (pathname.startsWith("/api/")) {
    const clientIp = getClientIp(request);
    const rlKey = `api:${clientIp}`;
    const result = rateLimit(rlKey, { limit: 100, windowSeconds: 60 });

    if (!result.success) {
      const errorResponse = NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
      errorResponse.headers.set("Retry-After", String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      return applySecurityHeaders(errorResponse);
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedRoutes = ["/dashboard", "/my-content", "/purchases", "/earnings", "/settings", "/upload"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  // Seller-only routes
  const sellerRoutes = ["/upload", "/my-content", "/earnings"];
  const isSellerRoute = sellerRoutes.some((route) => pathname.startsWith(route));

  if (isSellerRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && profile.role === "user") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ["/login", "/register"];
  if (authRoutes.includes(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(supabaseResponse);
}
