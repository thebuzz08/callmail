import { NextResponse } from "next/server"
import { getQStashClient } from "@/lib/qstash/client"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

// Now manages a single global schedule that checks all active users

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { action, intervalMinutes = 5 } = await request.json()

    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json(
        { error: "QStash not configured", details: "QSTASH_TOKEN environment variable is missing" },
        { status: 500 },
      )
    }

    const qstash = getQStashClient()
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://call-mail.xyz"

    const emailCheckScheduleId = "global-email-monitoring"
    const cleanupScheduleId = "cleanup-processed-emails"
    const cleanupAuditLogsScheduleId = "cleanup-audit-logs"
    const cleanupCallRetriesScheduleId = "cleanup-call-retries"

    if (action === "start") {
      const clampedInterval = Math.max(1, Math.min(5, intervalMinutes))
      const cronExpression = `*/${clampedInterval} * * * *`

      try {
        await qstash.schedules.get(emailCheckScheduleId)
      } catch {
        // Schedule doesn't exist, create it
        await qstash.schedules.create({
          scheduleId: emailCheckScheduleId,
          destination: `${baseUrl}/api/qstash/check-emails`,
          cron: cronExpression,
        })
        console.log("[Schedule] Created global monitoring schedule")
      }

      // Create cleanup schedule for processed_emails (runs daily)
      try {
        await qstash.schedules.get(cleanupScheduleId)
      } catch {
        await qstash.schedules.create({
          scheduleId: cleanupScheduleId,
          destination: `${baseUrl}/api/qstash/cleanup-processed-emails`,
          cron: "0 2 * * *", // Run daily at 2 AM UTC
        })
        console.log("[Schedule] Created cleanup schedule")
      }

      // Create cleanup schedule for audit_logs (runs daily)
      try {
        await qstash.schedules.get(cleanupAuditLogsScheduleId)
      } catch {
        await qstash.schedules.create({
          scheduleId: cleanupAuditLogsScheduleId,
          destination: `${baseUrl}/api/qstash/cleanup-audit-logs`,
          cron: "0 3 * * *", // Run daily at 3 AM UTC (after processed_emails cleanup)
        })
        console.log("[Schedule] Created audit logs cleanup schedule")
      }

      // Create cleanup schedule for call_retries (runs daily)
      try {
        await qstash.schedules.get(cleanupCallRetriesScheduleId)
      } catch {
        await qstash.schedules.create({
          scheduleId: cleanupCallRetriesScheduleId,
          destination: `${baseUrl}/api/qstash/cleanup-call-retries`,
          cron: "0 4 * * *", // Run daily at 4 AM UTC (after audit logs cleanup)
        })
        console.log("[Schedule] Created call retries cleanup schedule")
      }

      const supabase = createAdminClient()
      await supabase
        .from("user_settings")
        .update({ check_interval_minutes: clampedInterval })
        .eq("user_id", session.userId)

      return NextResponse.json({
        success: true,
        message: `Background monitoring started (every ${clampedInterval} minute${clampedInterval > 1 ? "s" : ""})`,
        scheduleId: emailCheckScheduleId,
        scheduleType: "global",
      })
    } else if (action === "stop") {
      const supabase = createAdminClient()

      // Check if any other users still have monitoring active
      const { data: otherActiveUsers } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("monitoring_active", true)
        .neq("user_id", session.userId)

      // Only delete global schedule if no other users are monitoring
      if (!otherActiveUsers || otherActiveUsers.length === 0) {
        try {
          await qstash.schedules.delete(emailCheckScheduleId)
          console.log("[Schedule] Deleted global monitoring schedule (no active users)")
        } catch (e) {
          console.log("[Schedule] Failed to delete schedule:", e)
        }
      } else {
        console.log(`[Schedule] Keeping global schedule (${otherActiveUsers.length} other active users)`)
      }

      return NextResponse.json({
        success: true,
        message: "Background monitoring stopped",
        globalScheduleActive: otherActiveUsers && otherActiveUsers.length > 0,
      })
    } else if (action === "update") {
      const clampedInterval = Math.max(1, Math.min(5, intervalMinutes))
      const cronExpression = `*/${clampedInterval} * * * *`

      try {
        await qstash.schedules.delete(emailCheckScheduleId)
      } catch (e) {
        console.log("[Schedule] Schedule didn't exist, creating new one")
      }

      await qstash.schedules.create({
        scheduleId: emailCheckScheduleId,
        destination: `${baseUrl}/api/qstash/check-emails`,
        cron: cronExpression,
      })

      const supabase = createAdminClient()
      await supabase
        .from("user_settings")
        .update({ check_interval_minutes: clampedInterval })
        .eq("user_id", session.userId)

      return NextResponse.json({
        success: true,
        message: `Check interval updated to ${clampedInterval} minute${clampedInterval > 1 ? "s" : ""} (global schedule)`,
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Schedule] QStash Schedule error:", error)
    return NextResponse.json(
      { error: "Failed to manage schedule" },
      { status: 500 },
    )
  }
}

// Get current schedule status
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json({
        active: false,
        error: "QStash not configured",
        intervalMinutes: 5,
      })
    }

    const qstash = getQStashClient()
    const emailCheckScheduleId = "global-email-monitoring"
    const cleanupScheduleId = "cleanup-processed-emails"
    const cleanupAuditLogsScheduleId = "cleanup-audit-logs"
    const cleanupCallRetriesScheduleId = "cleanup-call-retries"

    const supabase = createAdminClient()
    const { data: settings } = await supabase
      .from("user_settings")
      .select("check_interval_minutes, monitoring_active")
      .eq("user_id", session.userId)
      .single()

    try {
      const emailCheckSchedule = await qstash.schedules.get(emailCheckScheduleId)
      const cleanupSchedule = await qstash.schedules.get(cleanupScheduleId)
      const cleanupAuditLogsSchedule = await qstash.schedules.get(cleanupAuditLogsScheduleId)
      const cleanupCallRetriesSchedule = await qstash.schedules.get(cleanupCallRetriesScheduleId)

      return NextResponse.json({
        active: emailCheckSchedule !== null && settings?.monitoring_active === true,
        emailCheckSchedule,
        cleanupSchedule,
        cleanupAuditLogsSchedule,
        cleanupCallRetriesSchedule,
        intervalMinutes: settings?.check_interval_minutes || 5,
        scheduleType: "global",
        userMonitoringActive: settings?.monitoring_active || false,
      })
    } catch {
      return NextResponse.json({
        active: false,
        intervalMinutes: settings?.check_interval_minutes || 5,
        scheduleType: "global",
        userMonitoringActive: settings?.monitoring_active || false,
      })
    }
  } catch (error) {
    console.error("[Schedule] QStash Get schedule error:", error)
    return NextResponse.json({ active: false, error: "Failed to get schedule status", intervalMinutes: 5 })
  }
}
