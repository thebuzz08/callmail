import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { logAuditEvent, getRequestMetadata } from "@/lib/audit-log"
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    // Rate limit destructive actions
    const ip = getClientIP(request)
    const rl = await rateLimit(`delete:${ip}`, { limit: 3, window: 3600 })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

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

    const metadata = getRequestMetadata(request)

    // Log the deletion event before deleting data
    await logAuditEvent({
      userId,
      eventType: "account_delete",
      eventCategory: "security",
      description: "User requested account deletion - all data will be removed",
      ...metadata,
    })

    // Delete all user data in order (respecting foreign key constraints)
    const tablesToDelete = [
      "call_costs",
      "call_retries",
      "processed_emails",
      "vip_contacts",
      "keywords",
      "subscriptions",
      "user_settings",
      "audit_logs",
    ]

    for (const table of tablesToDelete) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("user_id", userId)

      if (error) {
        console.error(`Failed to delete from ${table}:`, error)
      }
    }

    // Finally delete the user record
    const { error: userDeleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId)

    if (userDeleteError) {
      console.error("Failed to delete user:", userDeleteError)
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    // Clear both session cookies
    const response = NextResponse.json({ success: true, message: "Account deleted successfully" })
    response.cookies.set("callmail_session", "", { path: "/", maxAge: 0 })
    response.cookies.set("callmail_client", "", { path: "/", maxAge: 0 })

    return response
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

// Export user data (GDPR data export)
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

    // Fetch all user data
    const [
      userResult,
      settingsResult,
      contactsResult,
      keywordsResult,
      callCostsResult,
      callRetriesResult,
      processedEmailsResult,
      auditLogsResult,
    ] = await Promise.all([
      supabaseAdmin.from("users").select("id, email, name, phone_number, created_at, updated_at, email_check_count, call_count").eq("id", userId).single(),
      supabaseAdmin.from("user_settings").select("*").eq("user_id", userId).single(),
      supabaseAdmin.from("vip_contacts").select("id, email, name, created_at").eq("user_id", userId),
      supabaseAdmin.from("keywords").select("id, keyword, created_at").eq("user_id", userId),
      supabaseAdmin.from("call_costs").select("call_sid, call_duration, amd_used, estimated_cost, created_at").eq("user_id", userId),
      supabaseAdmin.from("call_retries").select("phone_number, from_email, subject, status, retry_count, created_at").eq("user_id", userId),
      supabaseAdmin.from("processed_emails").select("email_id, processed_at").eq("user_id", userId),
      supabaseAdmin.from("audit_logs").select("event_type, event_category, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userResult.data,
      settings: settingsResult.data ? {
        theme: settingsResult.data.theme,
        check_interval_minutes: settingsResult.data.check_interval_minutes,
        monitoring_active: settingsResult.data.monitoring_active,
        quiet_hours_enabled: settingsResult.data.quiet_hours_enabled,
        quiet_hours_start: settingsResult.data.quiet_hours_start,
        quiet_hours_end: settingsResult.data.quiet_hours_end,
        quiet_hours_timezone: settingsResult.data.quiet_hours_timezone,
      } : null,
      vip_contacts: contactsResult.data || [],
      keywords: keywordsResult.data || [],
      call_history: callCostsResult.data || [],
      call_retries: callRetriesResult.data || [],
      processed_emails: processedEmailsResult.data || [],
      recent_activity: auditLogsResult.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="callmail-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
