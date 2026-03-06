import { createClient } from "@supabase/supabase-js"
import { getQStashClient } from "@/lib/qstash/client"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const DND_DETECTION_THRESHOLD_SECONDS = Number.parseInt(process.env.DND_DETECTION_THRESHOLD || "3", 10)

const TWILIO_VOICE_COST_PER_SECOND = 0.014 / 60 // $0.014 per minute = ~$0.000233 per second
const TWILIO_AMD_COST = 0.0075 // $0.0075 per AMD detection - charged per call when AMD is enabled

export async function POST(request: Request) {
  const formData = await request.formData()

  const callSid = formData.get("CallSid") as string
  const answeredBy = formData.get("AnsweredBy") as string
  const callDuration = Number.parseInt((formData.get("CallDuration") as string) || "0")
  const dialCallDuration = Number.parseInt((formData.get("DialCallDuration") as string) || "0")
  const duration = Math.max(callDuration, dialCallDuration)

  console.log("[AMD] Full form data:")
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`)
  }

  console.log(
    `[AMD] Call ${callSid} answered by: ${answeredBy}, CallDuration: ${callDuration}s, DialCallDuration: ${dialCallDuration}s, using: ${duration}s`,
  )

  try {
    const { data: retryRecord, error: retryError } = await supabaseAdmin
      .from("call_retries")
      .select("user_id, id")
      .eq("call_sid", callSid)
      .single()

    if (retryError && retryError.code !== "PGRST116") {
      console.error(`[AMD] Error fetching retry record for ${callSid}:`, retryError)
    }

    if (retryRecord?.user_id) {
      const billableSeconds = Math.max(1, duration) // Minimum 1 second
      const voiceCost = billableSeconds * TWILIO_VOICE_COST_PER_SECOND

      const amdCost = TWILIO_AMD_COST
      const totalCost = voiceCost + amdCost

      const { data: existingCost, error: findError } = await supabaseAdmin
        .from("call_costs")
        .select("id")
        .eq("call_sid", callSid)
        .single()

      if (existingCost) {
        const { error: updateError } = await supabaseAdmin
          .from("call_costs")
          .update({
            call_duration: duration,
            amd_used: true,
            estimated_cost: totalCost,
          })
          .eq("call_sid", callSid)

        if (updateError) {
          console.error(`[AMD] Error updating call cost:`, updateError)
        } else {
          console.log(
            `[AMD] Updated cost for ${callSid}: $${totalCost.toFixed(4)} (${duration}s = ${billableSeconds} billable sec + AMD)`,
          )
        }
      } else {
        const { error: insertError } = await supabaseAdmin.from("call_costs").insert({
          user_id: retryRecord.user_id,
          call_sid: callSid,
          call_duration: duration,
          amd_used: true,
          estimated_cost: totalCost,
        })

        if (insertError) {
          console.error(`[AMD] Error inserting call cost:`, insertError)
        } else {
          console.log(
            `[AMD] Inserted cost for ${callSid}: $${totalCost.toFixed(4)} (${duration}s = ${billableSeconds} billable sec + AMD)`,
          )
        }
      }
    } else {
      console.log(`[AMD] No retry record found for call_sid ${callSid} - cost may not be tracked`)
    }
  } catch (error) {
    console.error(`[AMD] Error in cost tracking:`, error)
  }

  let callStatus = "answered"
  let shouldRetry = false

  if (
    answeredBy === "machine_start" ||
    answeredBy === "machine_end_beep" ||
    answeredBy === "machine_end_silence" ||
    answeredBy === "machine_end_other" ||
    answeredBy === "fax"
  ) {
    const isImmediateVoicemail = duration < DND_DETECTION_THRESHOLD_SECONDS

    if (isImmediateVoicemail) {
      console.log(
        `[AMD] IMMEDIATE voicemail detected (${duration}s < ${DND_DETECTION_THRESHOLD_SECONDS}s - DND likely ON) for ${callSid} - WILL RETRY`,
      )
      callStatus = "dnd_suspected"
      shouldRetry = true
    } else {
      console.log(`[AMD] Normal voicemail after ringing ${duration}s for ${callSid} - NOT retrying (DND OFF)`)
      callStatus = "voicemail"
      shouldRetry = false
    }

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            Status: "completed",
          }),
        })
        console.log(`[AMD] Successfully hung up call ${callSid}`)
      } catch (error) {
        console.error(`[AMD] Failed to hang up call ${callSid}:`, error)
      }
    }
  } else if (answeredBy === "no_answer") {
    console.log(`[AMD] No-answer after ${duration}s for ${callSid} - NOT retrying (DND likely OFF)`)
    callStatus = "no_answer"
    shouldRetry = false
  } else if (answeredBy === "busy") {
    console.log(`[AMD] Busy signal for ${callSid} - NOT retrying`)
    callStatus = "busy"
    shouldRetry = false
  } else if (answeredBy === "human") {
    console.log(`[AMD] Human answered call ${callSid}`)
    callStatus = "human_answered"
  }

  if (shouldRetry) {
    try {
      const { data: retryRecord } = await supabaseAdmin
        .from("call_retries")
        .select("*")
        .eq("call_sid", callSid)
        .single()

      if (retryRecord) {
        const alreadyRetried = retryRecord.retry_count >= 1

        if (alreadyRetried) {
          console.log(`[AMD] Already retried once for ${callSid} - NOT retrying again (max 2 calls total)`)
          await supabaseAdmin
            .from("call_retries")
            .update({
              status: "max_retries_reached",
              updated_at: new Date().toISOString(),
            })
            .eq("id", retryRecord.id)
        } else {
          const nextRetryTime = new Date(Date.now() + 3 * 1000)

          await supabaseAdmin
            .from("call_retries")
            .update({
              status: callStatus,
              next_retry_at: nextRetryTime.toISOString(),
              last_retry_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", retryRecord.id)

          try {
            const qstash = getQStashClient()
            await qstash.publishJSON({
              url: `${process.env.NEXT_PUBLIC_URL}/api/qstash/retry-call`,
              body: {
                retryId: retryRecord.id,
              },
              delay: 3,
            })
            console.log(`[AMD] Scheduled DND-breaking retry for ${callSid} in 3 seconds`)
          } catch (error) {
            console.error(`[AMD] Failed to schedule retry:`, error)
          }
        }
      } else {
        console.log(`[AMD] No retry record found for ${callSid}`)
      }
    } catch (error) {
      console.error(`[AMD] Error handling retry:`, error)
    }
  } else {
    try {
      await supabaseAdmin
        .from("call_retries")
        .update({
          status: callStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("call_sid", callSid)
    } catch (error) {
      console.error(`[AMD] Error updating call status:`, error)
    }
  }

  return new Response("OK", { status: 200 })
}
