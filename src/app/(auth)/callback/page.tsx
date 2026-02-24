"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const ALLOWED_REDIRECT_PREFIXES = [
  "/dashboard", "/marketplace", "/my-content", "/purchases",
  "/earnings", "/settings", "/upload", "/content/",
];

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/dashboard";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/dashboard";
  if (redirect.includes("\\")) return "/dashboard";
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) => redirect.startsWith(prefix));
  return isAllowed ? redirect : "/dashboard";
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    const supabase = createClient();

    // Handle PKCE code exchange (from URL query params)
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.push(redirect);
          router.refresh();
        }
      });
    }

    // Fallback: listen for auth state change (covers implicit flow & token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push(redirect);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, redirect, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
