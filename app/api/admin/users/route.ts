import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function isUserAdmin(email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("users").select("is_admin").eq("email", email).single()
  if (error || !data) return false
  return data.is_admin === true
}

export async function GET() {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, phone_number, is_banned, is_admin, call_count, email_check_count, created_at") // Added name to select
      .order("created_at", { ascending: false })

    if (usersError) {
      throw usersError
    }

    const usersWithData = await Promise.all(
      (users || []).map(async (user) => {
        const [{ data: vipContacts }, { data: keywords }, { data: settings }, { data: costs }] = await Promise.all([
          supabase.from("vip_contacts").select("id, email, name").eq("user_id", user.id),
          supabase.from("keywords").select("id, keyword").eq("user_id", user.id),
          supabase.from("user_settings").select("monitoring_active").eq("user_id", user.id).single(),
          supabase.from("call_costs").select("estimated_cost").eq("user_id", user.id),
        ])

        const totalCost = (costs || []).reduce((sum, cost) => sum + Number(cost.estimated_cost), 0)

        return {
          ...user,
          vip_contacts: vipContacts || [],
          keywords: keywords || [],
          monitoring_active: settings?.monitoring_active ?? true,
          total_cost: totalCost,
        }
      }),
    )

    return NextResponse.json({ users: usersWithData })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
