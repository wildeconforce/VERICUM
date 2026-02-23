"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function getSession() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email! });
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (profileData) setProfile(profileData);
      }
      setLoading(false);
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, reset]);

  const signOut = () => {
    // Clear local state immediately so the UI reacts before any async work.
    reset();

    // Fire-and-forget: supabase.auth.signOut can hang when the browser's
    // navigator.locks API is unavailable or deadlocked. Using scope:"local"
    // avoids the network call; we don't await to guarantee the redirect fires.
    const supabase = createClient();
    supabase.auth.signOut({ scope: "local" }).catch(() => {});

    // Hard redirect clears any remaining in-memory state.
    window.location.href = "/";
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isSeller: !!user,
    isAdmin: profile?.role === "admin",
    signOut,
  };
}
