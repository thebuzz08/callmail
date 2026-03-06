// TwiML endpoint for Twilio calls
// This returns TwiML instructions for the call

export async function POST() {
  // Simple TwiML - pause briefly then hangup
  // The AMD callback will handle hanging up if voicemail is detected
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="2"/>
  <Hangup/>
</Response>`

  return new Response(twiml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}

export async function GET() {
  return POST()
}
