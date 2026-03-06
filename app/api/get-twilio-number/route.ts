import { cookies } from "next/headers"

export async function GET() {
  // Require authenticated session
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("callmail_session")

  if (!sessionCookie?.value) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    if (!session?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const twilioNumber = process.env.TWILIO_PHONE_NUMBER

  if (!twilioNumber) {
    return Response.json({ error: "Service unavailable" }, { status: 503 })
  }

  return Response.json({ phoneNumber: twilioNumber })
}
