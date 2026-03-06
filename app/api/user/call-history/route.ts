import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const userId = session.userId

    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 })
    }

    // Get call retries (which contain the email info that triggered each call)
    const { data: callRetries, error: retriesError } = await supabaseAdmin
      .from("call_retries")
      .select("id, from_email, subject, status, retry_count, created_at, call_sid")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (retriesError) {
      console.error("Error fetching call history:", retriesError)
      return NextResponse.json({ error: "Failed to fetch call history" }, { status: 500 })
    }

    // Get call costs to match with retries
    const callSids = (callRetries || []).map(r => r.call_sid).filter(Boolean)
    
    let costs: Record<string, number> = {}
    if (callSids.length > 0) {
      const { data: costData } = await supabaseAdmin
        .from("call_costs")
        .select("call_sid, estimated_cost")
        .in("call_sid", callSids)

      if (costData) {
        costs = Object.fromEntries(costData.map(c => [c.call_sid, c.estimated_cost]))
      }
    }

    const history = (callRetries || []).map(retry => ({
      id: retry.id,
      from_email: retry.from_email,
      subject: retry.subject,
      status: retry.status,
      retry_count: retry.retry_count,
      created_at: retry.created_at,
      cost: costs[retry.call_sid] || null,
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json({ error: "Failed to fetch call history" }, { status: 500 })
  }
}
