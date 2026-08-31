import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null | undefined

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    browserClient = null
    return browserClient
  }

  browserClient = createClient(url, publishableKey, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}

export type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>
