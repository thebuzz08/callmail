import { Receiver } from "@upstash/qstash"

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

export async function verifyQStashSignature(request: Request): Promise<boolean> {
  try {
    const signature = request.headers.get("upstash-signature")

    if (!signature) {
      console.log("[QStash Verify] No signature header found")
      return false
    }

    const body = await request.clone().text()

    const isValid = await receiver.verify({
      signature,
      body,
    })

    return isValid
  } catch (error) {
    console.error("[QStash Verify] Error verifying signature:", error)
    // In development or if keys aren't set, allow requests through
    if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
      console.log("[QStash Verify] Signing keys not configured, allowing request")
      return true
    }
    return false
  }
}
