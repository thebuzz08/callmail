import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Check if current user is admin
async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) return false

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const userId = session.userId

    if (!userId) return false

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single()

    return user?.is_admin === true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch suspicious activity with user info
    const { data: activities, error } = await supabaseAdmin
      .from("suspicious_activity")
      .select(`
        *,
        users:user_id (
          email,
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching suspicious activity:", error)
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error("Error in suspicious activity route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Resolve a suspicious activity alert
export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")
    const session = JSON.parse(decodeURIComponent(sessionCookie!.value))
    const adminUserId = session.userId

    const { activityId, action } = await request.json()

    if (action === "resolve") {
      const { error } = await supabaseAdmin
        .from("suspicious_activity")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: adminUserId,
        })
        .eq("id", activityId)

      if (error) {
        console.error("Error resolving activity:", error)
        return NextResponse.json({ error: "Failed to resolve activity" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in suspicious activity route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
