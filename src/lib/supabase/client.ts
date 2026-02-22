import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createSupabaseClient> | null = null;

// Use @supabase/supabase-js directly instead of @supabase/ssr's createBrowserClient.
// createBrowserClient internally overwrites the user-provided `lock` option with its
// own navigatorLock implementation, which causes uploads and signOut to hang in
// environments where navigator.locks is unreliable.
export function createClient() {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        detectSessionInUrl: true,
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return fn();
        },
      },
    }
  );

  return client;
}
