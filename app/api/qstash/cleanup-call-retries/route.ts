import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Receiver } from "@upstash/qstash"

// Cleanup route for call retries - removes old retry records to keep the table performant
// Only keeps records for active/pending retries, deletes completed/failed retries
// Runs on a scheduled basis (daily recommended)
export async function POST(request: Request) {
  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    })

    const body = await request.text()
    const signature = request.headers.get("upstash-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const isValid = await receiver
      .verify({
        signature,
        body,
        url: `${process.env.NEXT_PUBLIC_URL}/api/qstash/cleanup-call-retries`,
      })
      .catch(() => false)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const retentionDays = Number.parseInt(process.env.CALL_RETRIES_RETENTION_DAYS || "7", 10)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    console.log(
      `[Cleanup] Cleanup: Deleting call_retries records older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
    )

    const supabase = createAdminClient()

    // Delete old call_retries records that are completed, failed, or exhausted
    const { error } = await supabase
      .from("call_retries")
      .delete()
      .lt("updated_at", cutoffDate.toISOString())
      .in("status", ["completed", "failed", "exhausted"])

    if (error) {
      console.error("[Cleanup] Cleanup error:", error)
      return NextResponse.json({ error: "Failed to cleanup call_retries" }, { status: 500 })
    }

    console.log(`[Cleanup] Cleanup complete: Deleted old call_retries records before ${cutoffDate.toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `Cleanup successful - removed completed/failed call_retries older than ${retentionDays} days`,
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
