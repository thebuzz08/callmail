import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get metrics from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentMetrics, error } = await supabaseAdmin
      .from("queue_metrics")
      .select("*")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin] Failed to fetch queue metrics:", error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }

    if (!recentMetrics || recentMetrics.length === 0) {
      return NextResponse.json({
        longestProcessingTimeMs: 0,
        longestProcessingTimeSec: 0,
        avgProcessingTimeMs: 0,
        avgProcessingTimeSec: 0,
        totalJobsLast24h: 0,
        totalCallsLast24h: 0,
        totalUsersCheckedLast24h: 0,
        recentJobs: [],
        percentOfLimit: 0,
      })
    }

    const longestProcessingTimeMs = Math.max(...recentMetrics.map(m => m.processing_time_ms))
    const avgProcessingTimeMs = Math.round(
      recentMetrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / recentMetrics.length
    )
    const totalCallsLast24h = recentMetrics.reduce((sum, m) => sum + m.calls_triggered, 0)
    const totalUsersCheckedLast24h = recentMetrics.reduce((sum, m) => sum + m.users_checked, 0)

    // 5 minutes = 300,000ms is the limit
    const FIVE_MINUTES_MS = 5 * 60 * 1000
    const percentOfLimit = Math.round((longestProcessingTimeMs / FIVE_MINUTES_MS) * 100)

    return NextResponse.json({
      longestProcessingTimeMs,
      longestProcessingTimeSec: Math.round(longestProcessingTimeMs / 1000),
      avgProcessingTimeMs,
      avgProcessingTimeSec: Math.round(avgProcessingTimeMs / 1000),
      totalJobsLast24h: recentMetrics.length,
      totalCallsLast24h,
      totalUsersCheckedLast24h,
      percentOfLimit,
      recentJobs: recentMetrics.slice(0, 10).map(m => ({
        id: m.id,
        usersChecked: m.users_checked,
        callsTriggered: m.calls_triggered,
        processingTimeMs: m.processing_time_ms,
        processingTimeSec: Math.round(m.processing_time_ms / 1000),
        createdAt: m.created_at,
      })),
    })
  } catch (error) {
    console.error("[Admin] Error fetching queue metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
