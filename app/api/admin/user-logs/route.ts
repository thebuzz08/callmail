import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

async function isUserAdmin(email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("users").select("is_admin").eq("email", email).single()
  if (error || !data) return false
  return data.is_admin === true
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      try {
        session = JSON.parse(sessionCookie.value)
      } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }
    }

    if (!session?.email) {
      return NextResponse.json({ error: "No email in session" }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(session.email)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Not an admin" }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category") // added category filter parameter
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    let query = supabase.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("event_category", category)
    }

    const { data: logs, error } = await query.limit(limit)

    if (error) throw error

    // Enrich call-related logs with cost data from call_costs table
    if (logs && logs.length > 0) {
      const callLogs = logs.filter(
        (log: { event_type: string }) => log.event_type === "call_triggered" || log.event_type === "call_retry"
      )

      if (callLogs.length > 0) {
        // Get all call costs for this user to match by timestamp proximity
        const { data: callCosts } = await supabase
          .from("call_costs")
          .select("estimated_cost, call_duration, amd_used, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(200)

        if (callCosts && callCosts.length > 0) {
          for (const log of callLogs) {
            const logTime = new Date(log.created_at).getTime()
            // Find the closest call_cost entry within 30 seconds of the audit log
            const matchedCost = callCosts.find((cost: { created_at: string }) => {
              const costTime = new Date(cost.created_at).getTime()
              return Math.abs(costTime - logTime) < 30000
            })

            if (matchedCost) {
              log.metadata = {
                ...log.metadata,
                call_cost: matchedCost.estimated_cost,
                call_duration: matchedCost.call_duration,
                amd_used: matchedCost.amd_used,
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("Error fetching user logs:", error)
    return NextResponse.json({ error: "Failed to fetch user logs" }, { status: 500 })
  }
}
