import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

    const { data } = await supabaseAdmin.from("processed_emails").select("email_id").eq("user_id", userId)

    const emailIds = data?.map((row) => row.email_id) || []
    return NextResponse.json({ emailIds })
  } catch (error) {
    console.error("Error fetching processed emails:", error)
    return NextResponse.json({ error: "Failed to fetch processed emails" }, { status: 500 })
  }
}
