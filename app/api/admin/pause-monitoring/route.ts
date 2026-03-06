import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function isUserAdmin(email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("users").select("is_admin").eq("email", email).single()
  if (error || !data) return false
  return data.is_admin === true
}

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

    const { userId, pause } = await request.json()

    if (!userId || typeof pause !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("user_settings")
      .update({
        monitoring_active: !pause, // pause=true means monitoring_active=false
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      throw error
    }

    if (pause) {
      // User is being paused, check if any other users have monitoring active
      const { data: otherActiveUsers } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("monitoring_active", true)
        .neq("user_id", userId)

      // If no other users are active, trigger schedule deletion via QStash endpoint
      if (!otherActiveUsers || otherActiveUsers.length === 0) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_URL || "https://call-mail.xyz"
          await fetch(`${baseUrl}/api/qstash/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop" }),
          })
          console.log("[Admin] Triggered schedule deletion (last user paused)")
        } catch (scheduleError) {
          console.error("[Admin] Failed to trigger schedule deletion:", scheduleError)
          // Don't fail the request, just log the error
        }
      }
    }

    return NextResponse.json({ success: true, monitoring_active: !pause })
  } catch (error) {
    console.error("Admin pause monitoring error:", error)
    return NextResponse.json({ error: "Failed to update monitoring status" }, { status: 500 })
  }
}
