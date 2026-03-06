import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ isAdmin: false, error: "No session" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      try {
        session = JSON.parse(sessionCookie.value)
      } catch {
        return NextResponse.json({ isAdmin: false, error: "Invalid session" }, { status: 401 })
      }
    }

    if (!session?.email) {
      return NextResponse.json({ isAdmin: false, error: "No email in session" }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.from("users").select("is_admin").eq("email", session.email).single()

    if (error || !data) {
      return NextResponse.json({ isAdmin: false, email: session.email, error: "User not found" }, { status: 403 })
    }

    const isAdmin = data.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false, email: session.email }, { status: 403 })
    }

    return NextResponse.json({ isAdmin: true, email: session.email })
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ isAdmin: false, error: "Server error" }, { status: 500 })
  }
}
