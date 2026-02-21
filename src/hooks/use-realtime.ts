"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtime(
  table: string,
  filter: string | undefined,
  callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    if (filter) {
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter },
          (payload) => callback(payload as never)
        )
        .subscribe();
    } else {
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => callback(payload as never)
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
}
