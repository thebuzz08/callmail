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

    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user info for audit log before deletion
    const { data: targetUser } = await supabase
      .from("users")
      .select("email, name, phone_number")
      .eq("id", userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete all user data in order (respecting foreign key constraints)
    // 1. Delete VIP contacts
    await supabase.from("vip_contacts").delete().eq("user_id", userId)
    
    // 2. Delete keywords
    await supabase.from("keywords").delete().eq("user_id", userId)
    
    // 3. Delete domain VIPs
    await supabase.from("domain_vips").delete().eq("user_id", userId)
    
    // 4. Delete processed emails
    await supabase.from("processed_emails").delete().eq("user_id", userId)
    
    // 5. Delete call costs
    await supabase.from("call_costs").delete().eq("user_id", userId)
    
    // 6. Delete call retries
    await supabase.from("call_retries").delete().eq("user_id", userId)
    
    // 7. Delete suspicious activity records
    await supabase.from("suspicious_activity").delete().eq("user_id", userId)
    
    // 8. Keep audit logs for compliance (don't delete)
    
    // 9. Finally delete the user
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      throw deleteError
    }

    // Log the termination
    const metadata = getRequestMetadata(request)
    await logAuditEvent({
      userId,
      eventType: "account_terminate",
      eventCategory: "security",
      description: `Account permanently terminated by admin ${session.email}. Reason: ${reason || "Not specified"}`,
      ...metadata,
      metadata: {
        admin_email: session.email,
        target_user_email: targetUser.email,
        target_user_name: targetUser.name,
        reason: reason || "Not specified",
        action: "terminate",
        data_deleted: [
          "vip_contacts",
          "keywords", 
          "domain_vips",
          "processed_emails",
          "call_costs",
          "call_retries",
          "suspicious_activity",
          "user_record"
        ]
      },
    })

    return NextResponse.json({ success: true, message: "Account terminated and all data deleted" })
  } catch (error) {
    console.error("Terminate user error:", error)
    return NextResponse.json({ error: "Failed to terminate account" }, { status: 500 })
  }
}
