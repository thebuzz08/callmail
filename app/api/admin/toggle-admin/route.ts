import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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

    const { userId, makeAdmin } = await request.json()

    if (!userId || typeof makeAdmin !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get current user's ID to prevent self-demotion
    const { data: currentUser } = await supabase.from("users").select("id").eq("email", session.email).single()

    if (currentUser?.id === userId && !makeAdmin) {
      return NextResponse.json({ error: "Cannot remove your own admin status" }, { status: 400 })
    }

    const { error } = await supabase.from("users").update({ is_admin: makeAdmin }).eq("id", userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Toggle admin error:", error)
    return NextResponse.json({ error: "Failed to update admin status" }, { status: 500 })
  }
}
