import { createBrowserClient } from "@supabase/ssr";

// Patch navigator.locks globally before any Supabase client is created.
// The Web Locks API can deadlock when tabs are backgrounded or during
// concurrent operations. This replaces it with a pass-through so that
// any code path using navigator.locks directly becomes a no-op.
if (typeof globalThis !== "undefined" && globalThis.navigator?.locks) {
  Object.defineProperty(globalThis.navigator, "locks", {
    value: {
      request: async (_name: string, optionsOrCb: any, maybeCb?: any) => {
        const cb = typeof maybeCb === "function" ? maybeCb : optionsOrCb;
        return cb({ name: _name, mode: "exclusive" });
      },
    },
    configurable: true,
  });
}

// No-op lock function that just runs the callback immediately.
// Passed directly to GoTrueClient via settings.lock (highest priority).
const lockNoOp = async (
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<any>
) => {
  return fn();
};

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        lock: lockNoOp,
      },
    }
  );

  return client;
}
