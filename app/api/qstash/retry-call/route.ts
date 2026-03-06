// QStash endpoint to retry failed calls
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TWILIO_VOICE_COST_PER_SECOND = 0.014 / 60 // $0.014 per minute = ~$0.000233 per second
const TWILIO_AMD_COST = 0.0075 // $0.0075 per AMD detection

async function triggerCall(toPhone: string) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
  const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://call-mail.xyz"

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: "Twilio not configured" }
  }

  const formattedPhone = toPhone.startsWith("+") ? toPhone : `+1${toPhone.replace(/\D/g, "")}`

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Url: `${BASE_URL}/api/twiml`,
        MachineDetection: "Enable",
        AsyncAmd: "true",
        AsyncAmdStatusCallback: `${BASE_URL}/api/twiml/amd-callback`,
        AsyncAmdStatusCallbackMethod: "POST",
        Timeout: "10",
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, callSid: data.sid }
    } else {
      return { success: false, error: data.message || JSON.stringify(data) }
    }
  } catch (error) {
    return { success: false, error: "Failed to initiate call" }
  }
}

export async function POST(request: Request) {
  try {
    const { retryId } = await request.json()

    if (!retryId) {
      return NextResponse.json({ error: "Missing retryId" }, { status: 400 })
    }

    // Get the retry record
    const { data: retryRecord, error: fetchError } = await supabaseAdmin
      .from("call_retries")
      .select("*")
      .eq("id", retryId)
      .single()

    if (fetchError || !retryRecord) {
      return NextResponse.json({ error: "Retry record not found" }, { status: 404 })
    }

    // Check if already retried too many times
    if (retryRecord.retry_count >= retryRecord.max_retries) {
      await supabaseAdmin
        .from("call_retries")
        .update({ status: "max_retries_exceeded", updated_at: new Date().toISOString() })
        .eq("id", retryId)

      return NextResponse.json({ message: "Max retries exceeded" }, { status: 200 })
    }

    // Check if it's time to retry
    if (retryRecord.next_retry_at && new Date(retryRecord.next_retry_at) > new Date()) {
      return NextResponse.json({ message: "Not yet time for retry" }, { status: 200 })
    }

    // Make the retry call
    const callResult = await triggerCall(retryRecord.phone_number)

    if (callResult.success) {
      // Update retry record
      await supabaseAdmin
        .from("call_retries")
        .update({
          call_sid: callResult.callSid,
          retry_count: retryRecord.retry_count + 1,
          last_retry_at: new Date().toISOString(),
          status: "retried",
          updated_at: new Date().toISOString(),
        })
        .eq("id", retryId)

      if (retryRecord.user_id && callResult.callSid) {
        const estimatedSeconds = 6
        const minimumCost = estimatedSeconds * TWILIO_VOICE_COST_PER_SECOND + TWILIO_AMD_COST
        await supabaseAdmin.from("call_costs").insert({
          user_id: retryRecord.user_id,
          call_sid: callResult.callSid,
          call_duration: estimatedSeconds, // Will be updated by AMD callback with real duration
          amd_used: true,
          estimated_cost: minimumCost,
        })
        console.log(`[Retry] Created cost record for retry call ${callResult.callSid}: $${minimumCost.toFixed(4)}`)
      }

      // Increment user's call count
      if (retryRecord.user_id) {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("call_count")
          .eq("id", retryRecord.user_id)
          .single()

        const newCount = (user?.call_count || 0) + 1
        await supabaseAdmin.from("users").update({ call_count: newCount }).eq("id", retryRecord.user_id)
      }

      return NextResponse.json({ success: true, message: "Retry call made" }, { status: 200 })
    } else {
      // Update with failed status
      await supabaseAdmin
        .from("call_retries")
        .update({
          status: "retry_failed",
          last_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", retryId)

      return NextResponse.json({ error: "Call retry failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Retry] Error in retry-call endpoint:", error)
    return NextResponse.json({ error: "Call retry failed" }, { status: 500 })
  }
}
