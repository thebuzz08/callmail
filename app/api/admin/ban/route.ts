import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logAuditEvent, getRequestMetadata } from "@/lib/audit-log"

async function isUserAdmin(email: string) {
  const supabase = createAdminClient()
  const { data } = await supabase.from("users").select("is_admin").eq("email", email).single()
  return data?.is_admin === true
}

export async function POST(request: NextRequest) {
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

    const isAdmin = await isUserAdmin(session.email)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, ban } = await request.json()

    if (!userId || typeof ban !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: targetUser } = await supabase.from("users").select("email").eq("id", userId).single()

    const { error } = await supabase.from("users").update({ is_banned: ban }).eq("id", userId)

    if (error) {
      throw error
    }

    const metadata = getRequestMetadata(request)
    await logAuditEvent({
      userId,
      eventType: ban ? "account_suspend" : "account_restore",
      eventCategory: "security",
      description: `Account ${ban ? "suspended" : "restored"} by admin ${session.email}`,
      ...metadata,
      metadata: {
        admin_email: session.email,
        target_user_email: targetUser?.email,
        action: ban ? "ban" : "unban",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ban user error:", error)
    return NextResponse.json({ error: "Failed to update ban status" }, { status: 500 })
  }
}
