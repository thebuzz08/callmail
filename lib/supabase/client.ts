import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null
let initPromise: Promise<void> | null = null

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  if (!initPromise) {
    initPromise = client.auth.getSession().then(() => {
      // Auth initialized, subsequent calls use cached state
    })
  }

  return client
}
