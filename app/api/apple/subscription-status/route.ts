import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("status, platform, current_period_end, trial_end, cancel_at_period_end, apple_product_id, apple_expires_date")
      .eq("user_id", session.user_id)
      .single()

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: "none",
      })
    }

    // Check if subscription is still valid
    const isActive = subscription.status === "active" || subscription.status === "trialing"
    const expiresDate = subscription.apple_expires_date || subscription.current_period_end

    return NextResponse.json({
      hasSubscription: isActive,
      status: subscription.status,
      platform: subscription.platform,
      productId: subscription.apple_product_id,
      expiresDate,
      trialEnd: subscription.trial_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error("[Apple] Subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
