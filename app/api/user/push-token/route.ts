import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pushToken, platform } = await request.json()

    if (!pushToken) {
      return NextResponse.json({ error: "Push token required" }, { status: 400 })
    }

    // Save the push token to the user's record
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        push_token: pushToken,
        push_token_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("[Push Token] Failed to save:", error)
      return NextResponse.json({ error: "Failed to save push token" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Push Token] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
