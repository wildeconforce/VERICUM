import { createBrowserClient } from "@supabase/ssr";

// Patch navigator.locks globally before any Supabase client is created.
// The Web Locks API can deadlock when tabs are backgrounded or during
// concurrent storage uploads, causing signOut and file uploads to hang.
// This replaces it with a pass-through so that @supabase/ssr's internal
// navigatorLock adapter (which we cannot override via options) becomes a no-op.
if (typeof globalThis !== "undefined" && globalThis.navigator?.locks) {
  Object.defineProperty(globalThis.navigator, "locks", {
    value: {
      request: async (_name: string, optionsOrCb: any, maybeCb?: any) => {
        const cb = typeof maybeCb === "function" ? maybeCb : optionsOrCb;
        return cb();
      },
    },
    configurable: true,
  });
}

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
      },
    }
  );

  return client;
}
