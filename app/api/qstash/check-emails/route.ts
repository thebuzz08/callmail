import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Receiver } from "@upstash/qstash"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TWILIO_VOICE_COST_PER_SECOND = 0.014 / 60 // $0.014 per minute = ~$0.000233 per second
const TWILIO_AMD_COST = 0.0075 // $0.0075 per AMD detection (charged per call, not per detection)

async function verifyQStashSignature(request: Request): Promise<boolean> {
  // Skip verification if keys aren't set (for local dev)
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
  // Verify QStash signature
  const isValid = await verifyQStashSignature(request.clone())
  if (!isValid) {
    console.log("[QStash] Signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  console.log("[QStash] ===== Starting background email check =====")

  const results: Array<{
    userId: string
    email: string
    status: string
    error?: string
    callTriggered?: boolean
  }> = []

  const callsToMake: Array<{
    userId: string
    userEmail: string
    phoneNumber: string
    emailData: { messageId: string; from: string; subject: string }
  }> = []

  try {
    const { data: activeSettings } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone")
      .eq("monitoring_active", true)

    if (!activeSettings || activeSettings.length === 0) {
      console.log("[QStash] No users with monitoring_active = true")
      return NextResponse.json({ message: "No users with active monitoring", usersChecked: 0 })
    }

    console.log(`[QStash] Found ${activeSettings.length} users with active monitoring`)

    const userIds = activeSettings.map((s: { user_id: string }) => s.user_id)

    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, phone_number, google_access_token, google_refresh_token, is_banned, email_check_count")
      .in("id", userIds)
      .eq("is_banned", false)

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No active users", usersChecked: 0 })
    }

    // Fetch active subscriptions for these users
    const { data: activeSubscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, current_period_end")
      .in("user_id", userIds)
      .in("status", ["active", "trialing"])

    const subscribedUserIds = new Set(
      (activeSubscriptions || [])
        .filter((sub: { status: string; current_period_end: string | null }) =>
          sub.status === "active" || sub.status === "trialing" ||
          (sub.current_period_end && new Date(sub.current_period_end) > new Date())
        )
        .map((sub: { user_id: string }) => sub.user_id)
    )

    // Process each user
    for (const user of users) {
      const userId = user.id

      // Skip users without active subscriptions
      if (!subscribedUserIds.has(userId)) {
        results.push({ userId, email: user.email, status: "skipped", error: "No active subscription" })
        continue
      }

      const newCheckCount = (user.email_check_count || 0) + 1
      await supabaseAdmin.from("users").update({ email_check_count: newCheckCount }).eq("id", userId)
      console.log(`[QStash] User ${user.email} check count: ${newCheckCount}`)

      if (!user.phone_number) {
        results.push({ userId, email: user.email, status: "skipped", error: "No phone number" })
        continue
      }

      // Get VIP contacts, domains, and keywords for this user
      const [contactsResult, domainsResult, keywordsResult] = await Promise.all([
        supabaseAdmin.from("vip_contacts").select("email").eq("user_id", userId),
        supabaseAdmin.from("vip_domains").select("domain").eq("user_id", userId),
        supabaseAdmin.from("keywords").select("keyword").eq("user_id", userId),
      ])

      const watchedEmails = contactsResult.data?.map((c) => c.email) || []
      const watchedDomains = domainsResult.data?.map((d) => d.domain) || []
      const watchedKeywords = keywordsResult.data?.map((k) => k.keyword) || []

      if (watchedEmails.length === 0 && watchedDomains.length === 0 && watchedKeywords.length === 0) {
        results.push({ userId, email: user.email, status: "skipped", error: "No VIP contacts, domains, or keywords" })
        continue
      }

      // Get a valid access token (refresh if needed)
      let accessToken = user.google_access_token

      if (user.google_refresh_token) {
        const refreshResult = await refreshGoogleToken(user.google_refresh_token)

        if (refreshResult.success && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken
          const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({
              google_access_token: accessToken,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (updateError) {
            console.error(`[QStash] User ${user.email} - Failed to save refreshed token:`, updateError)
          }
        } else if (refreshResult.error === "refresh_token_expired") {
          console.error(`[QStash] User ${user.email} - Refresh token expired, needs re-login`)
          await supabaseAdmin
            .from("users")
            .update({
              google_refresh_token: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
          results.push({
            userId,
            email: user.email,
            status: "error",
            error: "Refresh token expired - user needs to re-login",
          })
          continue
        } else {
          console.error(`[QStash] User ${user.email} - Token refresh failed: ${refreshResult.error}`)
          results.push({
            userId,
            email: user.email,
            status: "error",
            error: refreshResult.error || "Token refresh failed",
          })
          continue
        }
      } else {
        console.warn(`[QStash] User ${user.email} - No refresh token, needs re-login`)
      }

      // Check emails for this user
      const checkResult = await checkUserEmails({
        userId,
        userEmail: user.email,
        accessToken,
        refreshToken: user.google_refresh_token,
        watchedEmails,
        watchedDomains,
        watchedKeywords,
        phoneNumber: user.phone_number,
        callsToMake, // Pass array to collect calls
      })

      // Update last_email_check timestamp
      await supabaseAdmin
        .from("user_settings")
        .update({ last_email_check: new Date().toISOString() })
        .eq("user_id", userId)

      results.push({
        userId,
        email: user.email,
        status: checkResult.success ? "checked" : "error",
        error: checkResult.error,
        callTriggered: checkResult.callTriggered,
      })

      if (checkResult.newAccessToken) {
        await supabaseAdmin.from("users").update({ google_access_token: checkResult.newAccessToken }).eq("id", userId)
      }
    }

    // Filter out calls during quiet hours
    const settingsMap = new Map(
      (activeSettings || []).map((s: { user_id: string; quiet_hours_enabled: boolean; quiet_hours_start: string; quiet_hours_end: string; quiet_hours_timezone: string }) => [s.user_id, s])
    )

    const filteredCalls = callsToMake.filter((call) => {
      const settings = settingsMap.get(call.userId)
      if (!settings?.quiet_hours_enabled) return true

      try {
        const tz = settings.quiet_hours_timezone || "America/New_York"
        const now = new Date()
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        })
        const parts = formatter.formatToParts(now)
        const currentHour = parseInt(parts.find(p => p.type === "hour")?.value || "0")
        const currentMinute = parseInt(parts.find(p => p.type === "minute")?.value || "0")
        const currentMinutes = currentHour * 60 + currentMinute

        const [startH, startM] = (settings.quiet_hours_start || "23:00").split(":").map(Number)
        const [endH, endM] = (settings.quiet_hours_end || "07:00").split(":").map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        let isQuietTime: boolean
        if (startMinutes <= endMinutes) {
          // Same day range (e.g., 09:00 - 17:00)
          isQuietTime = currentMinutes >= startMinutes && currentMinutes < endMinutes
        } else {
          // Overnight range (e.g., 23:00 - 07:00)
          isQuietTime = currentMinutes >= startMinutes || currentMinutes < endMinutes
        }

        if (isQuietTime) {
          console.log(`[QStash] Skipping call to ${call.userEmail} - quiet hours active (${settings.quiet_hours_start} - ${settings.quiet_hours_end} ${tz})`)
          return false
        }
      } catch (e) {
        console.error(`[QStash] Error checking quiet hours for ${call.userEmail}:`, e)
      }
      return true
    })

    let callsTriggered = 0
    for (let i = 0; i < filteredCalls.length; i++) {
      const call = filteredCalls[i]
      console.log(`[QStash] Making call ${i + 1}/${filteredCalls.length} to ${call.userEmail}`)

      const callResult = await triggerCall(call.phoneNumber, call.userId, call.emailData)

      if (callResult.success) {
        callsTriggered++
        console.log(`[QStash] Call ${i + 1} successful: ${callResult.callSid}`)

        // Update call count and check for suspicious activity
        const { data: currentUser } = await supabaseAdmin
          .from("users")
          .select("call_count, email")
          .eq("id", call.userId)
          .single()
        
        const newCallCount = (currentUser?.call_count || 0) + 1
        await supabaseAdmin
          .from("users")
          .update({ call_count: newCallCount })
          .eq("id", call.userId)

        // Flag suspicious activity: high call volume (>20 calls/day threshold)
        if (newCallCount === 20 || newCallCount === 50 || newCallCount === 100) {
          await supabaseAdmin.from("suspicious_activity").insert({
            user_id: call.userId,
            activity_type: "high_call_volume",
            severity: newCallCount >= 100 ? "high" : newCallCount >= 50 ? "medium" : "low",
            description: `User has triggered ${newCallCount} total calls`,
            metadata: {
              call_count: newCallCount,
              user_email: currentUser?.email,
              latest_trigger: call.emailData.from,
            },
          })
          console.log(`[QStash] Flagged suspicious activity for ${call.userEmail}: ${newCallCount} total calls`)
        }
      } else {
        console.error(`[QStash] Call ${i + 1} failed: ${callResult.error}`)
      }

      if (i < filteredCalls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 second delay
      }
    }

    console.log(`[QStash] ===== Finished: Checked ${results.length} users, triggered ${callsTriggered} calls =====`)

    return NextResponse.json({
      message: `Checked ${results.length} users, triggered ${callsTriggered} calls`,
      usersChecked: results.length,
      callsTriggered,
      results,
    })
  } catch (error) {
    console.error("[QStash] Error in background job:", error)
    return NextResponse.json(
      { error: "Background job failed" },
      { status: 500 },
    )
  }
}

async function triggerCall(
  toPhone: string,
  userId: string,
  emailData: { messageId: string; from: string; subject: string },
) {
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
      // Actual cost will be updated in AMD callback with real duration
      const minimumCallSeconds = 6
      const baseCost = minimumCallSeconds * TWILIO_VOICE_COST_PER_SECOND

      await supabaseAdmin.from("call_costs").insert({
        user_id: userId,
        call_sid: data.sid,
        call_duration: minimumCallSeconds,
        amd_used: false, // Will be updated in AMD callback
        estimated_cost: baseCost,
      })

      // Create retry record for DND detection
      await supabaseAdmin.from("call_retries").insert({
        user_id: userId,
        phone_number: toPhone,
        email_id: emailData.messageId,
        from_email: emailData.from,
        subject: emailData.subject,
        call_sid: data.sid,
        status: "initial",
        retry_count: 0,
        max_retries: 1, // Only 1 retry for DND
        first_attempt_at: new Date().toISOString(),
      })

      return { success: true, callSid: data.sid }
    }

    return { success: false, error: data.message }
  } catch (error) {
    return { success: false, error: "Failed to initiate call" }
  }
}

// Helper functions below

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[QStash] Token refresh failed:", errorData)

      // Check for invalid_grant which means refresh token is expired/revoked
      if (errorData.error === "invalid_grant") {
        return { success: false, error: "refresh_token_expired" }
      }
      return { success: false, error: errorData.error || "token_refresh_failed" }
    }

    const data = await response.json()
    return { success: true, accessToken: data.access_token }
  } catch (error) {
    console.error("[QStash] Token refresh error:", error)
    return { success: false, error: "token_refresh_exception" }
  }
}

async function checkUserEmails({
  userId,
  userEmail,
  accessToken,
  refreshToken,
  watchedEmails,
  watchedDomains,
  watchedKeywords,
  phoneNumber,
  callsToMake, // Added parameter to collect calls
}: {
  userId: string
  userEmail: string
  accessToken: string
  refreshToken?: string
  watchedEmails: string[]
  watchedDomains: string[]
  watchedKeywords: string[]
  phoneNumber: string
  callsToMake: Array<{
    userId: string
    userEmail: string
    phoneNumber: string
    emailData: { messageId: string; from: string; subject: string }
  }>
}): Promise<{ success: boolean; error?: string; callTriggered?: boolean; newAccessToken?: string }> {
  try {
    // Fetch processed emails AND their thread IDs to skip entire threads
    const { data: processedEmails } = await supabaseAdmin
      .from("processed_emails")
      .select("email_id, thread_id")
      .eq("user_id", userId)

    const processedSet = new Set(processedEmails?.map((e) => e.email_id) || [])
    const processedThreads = new Set(processedEmails?.filter(e => e.thread_id).map((e) => e.thread_id) || [])

    const gmailUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=UNREAD"

    let response = await fetch(gmailUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (response.status === 401 && refreshToken) {
      const refreshResult = await refreshGoogleToken(refreshToken)
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken
        response = await fetch(gmailUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          console.error(`[QStash] ${userEmail} - Gmail API error after refresh: ${response.status}`)
          return { success: false, error: "Gmail API error after refresh", newAccessToken: accessToken }
        }
      } else {
        console.error(`[QStash] ${userEmail} - Token refresh failed: ${refreshResult.error}`)
        return { success: false, error: "Token refresh failed" }
      }
    } else if (!response.ok) {
      console.error(`[QStash] ${userEmail} - Gmail API error: ${response.status}`)
      return { success: false, error: `Gmail API error: ${response.status}` }
    }

    const messagesData = await response.json()
    const messages = messagesData.messages || []

    if (messages.length === 0) {
      return { success: true, callTriggered: false, newAccessToken: accessToken }
    }

    for (const message of messages) {
      if (processedSet.has(message.id)) continue
      
      // Skip if we've already called about this thread (prevents duplicate calls on replies)
      if (message.threadId && processedThreads.has(message.threadId)) continue

      const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Internal-Date`

      const messageResponse = await fetch(messageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!messageResponse.ok) {
        console.error(`[QStash] ${userEmail} - Failed to fetch message ${message.id}: ${messageResponse.status}`)
        continue
      }

      const messageData = await messageResponse.json()
      const headers = messageData.payload?.headers || []

      const internalDate = messageData.internalDate ? Number.parseInt(messageData.internalDate) : Date.now()
      const emailAgeMs = Date.now() - internalDate
      const retentionDays = Number.parseInt(process.env.PROCESSED_EMAILS_RETENTION_DAYS || "30", 10)
      const bufferDays = 1
      const maxAgeMs = (retentionDays - bufferDays) * 24 * 60 * 60 * 1000

      if (emailAgeMs > maxAgeMs) continue

      const fromHeader = headers.find((h: { name: string }) => h.name.toLowerCase() === "from")
      const subjectHeader = headers.find((h: { name: string }) => h.name.toLowerCase() === "subject")

      if (!fromHeader) continue

      const fromEmail = extractEmail(fromHeader.value)
      const subject = subjectHeader?.value || "No subject"

      const isWatchedSender = watchedEmails.some((watched) => watched.toLowerCase() === fromEmail.toLowerCase())
      const senderDomain = fromEmail.split("@")[1]?.toLowerCase()
      const isWatchedDomain = senderDomain && watchedDomains.some((domain) => domain.toLowerCase() === senderDomain)
      const matchedKeyword = watchedKeywords.find((keyword) => subject.toLowerCase().includes(keyword.toLowerCase()))

      if (isWatchedSender || isWatchedDomain || matchedKeyword) {
        const matchType = isWatchedSender ? `VIP: ${fromEmail}` : isWatchedDomain ? `Domain: @${senderDomain}` : `Keyword: "${matchedKeyword}"`
        console.log(`[QStash] ${userEmail} - Match found (${matchType}) - "${subject}"`)

        const { error: insertError } = await supabaseAdmin.from("processed_emails").insert({
          user_id: userId,
          email_id: message.id,
          thread_id: message.threadId || null, // Store thread ID to prevent duplicate calls on replies
        })

        if (insertError) {
          console.error(`[QStash] ${userEmail} - Failed to mark email as processed:`, insertError)
        }

        callsToMake.push({
          userId,
          userEmail,
          phoneNumber,
          emailData: {
            messageId: message.id,
            from: fromEmail,
            subject: subject,
          },
        })

        await supabaseAdmin.from("audit_logs").insert({
          user_id: userId,
          event_type: "call_triggered",
          event_category: "calls",
          description: `Call triggered for email from ${fromEmail}`,
          metadata: {
            email_id: message.id,
            from: fromEmail,
            subject: subject,
            match_type: isWatchedSender ? "vip_contact" : "keyword",
            matched_value: isWatchedSender ? fromEmail : matchedKeyword,
          },
        })

        return { success: true, callTriggered: true, newAccessToken: accessToken }
      }
    }

    return { success: true, callTriggered: false, newAccessToken: accessToken }
  } catch (error) {
    console.error(`[QStash] ${userEmail} - Error checking emails:`, error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}
