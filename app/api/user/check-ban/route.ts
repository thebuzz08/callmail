import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ banned: false })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      try {
        session = JSON.parse(sessionCookie.value)
      } catch {
        return NextResponse.json({ banned: false })
      }
    }

    if (!session?.email) {
      return NextResponse.json({ banned: false })
    }

    const supabase = createAdminClient()

    const { data: user } = await supabase.from("users").select("is_banned").eq("email", session.email).single()

    return NextResponse.json({ banned: user?.is_banned || false })
  } catch (error) {
    console.error("Check ban error:", error)
    return NextResponse.json({ banned: false })
  }
}
