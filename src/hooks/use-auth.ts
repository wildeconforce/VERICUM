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

  const signOut = async () => {
    const supabase = createClient();
    reset();
    window.location.href = "/";
    await supabase.auth.signOut({ scope: "local" });
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
