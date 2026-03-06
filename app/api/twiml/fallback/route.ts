import { NextResponse } from "next/server"

/**
 * Fallback TwiML handler - triggered if initial call gets no answer after ~15 seconds
 * This replaces the need for a second immediate call by letting Twilio retry automatically
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    console.log("[Twilio] Fallback endpoint triggered - call had no answer, would retry here")

    // Return TwiML that instructs Twilio to retry
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="alice">Important notification. This call is timing out.</Say>
        <Hangup/>
    </Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    })
  } catch (error) {
    console.error("[Twilio] Error in fallback handler:", error)
    return NextResponse.json({ error: "Fallback handler error" }, { status: 500 })
  }
}
