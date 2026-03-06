import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Receiver } from "@upstash/qstash"

async function verifyQStashSignature(request: Request): Promise<boolean> {
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    console.warn("[QStash] Signing keys not configured, skipping verification")
    return true
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    })

    const signature = request.headers.get("upstash-signature")
    if (!signature) {
      console.error("[QStash] No signature header")
      return false
    }

    const body = await request.text()
    const isValid = await receiver.verify({
      signature,
      body,
    })

    return isValid
  } catch (error) {
    console.error("[QStash] Signature verification error:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const isValid = await verifyQStashSignature(request.clone())
    if (!isValid) {
      console.log("[QStash] Signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const retentionDays = Number.parseInt(process.env.PROCESSED_EMAILS_RETENTION_DAYS || "30", 10)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    console.log(
      `[Cleanup] Cleanup: Deleting processed_emails records older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
    )

    const supabase = createAdminClient()

    const { data: deletedData, error } = await supabase
      .from("processed_emails")
      .delete()
      .lt("processed_at", cutoffDate.toISOString())

    if (error) {
      console.error("[Cleanup] Cleanup error:", error)
      return NextResponse.json({ error: "Failed to cleanup processed_emails" }, { status: 500 })
    }

    console.log(`[Cleanup] Cleanup complete: Deleted old processed_emails records before ${cutoffDate.toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `Cleanup successful - removed records older than ${retentionDays} days`,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error("[Cleanup] Cleanup route error:", error)
    return NextResponse.json(
      {
        error: "Failed to run cleanup",
      },
      { status: 500 },
    )
  }
}
