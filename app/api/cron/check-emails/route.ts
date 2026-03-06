import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Verify the request is from Vercel Cron
function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }
  // Also allow in development
  if (process.env.NODE_ENV === "development") {
    return true
  }
  return false
}

export async function GET(request: Request) {
  // Verify cron secret
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Array<{
    userId: string
    email: string
    status: string
    error?: string
    callTriggered?: boolean
  }> = []

  try {
    // Get all users with monitoring_active = true who are not banned
    const { data: activeSettings, error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, last_email_check")
      .eq("monitoring_active", true)

    if (settingsError) {
      console.error("[Cron] Error fetching active settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch active users" }, { status: 500 })
    }

    if (!activeSettings || activeSettings.length === 0) {
      return NextResponse.json({ message: "No users with active monitoring", usersChecked: 0 })
    }

    console.log(`[Cron] Found ${activeSettings.length} users with active monitoring`)

    // Process each user
    for (const settings of activeSettings) {
      const userId = settings.user_id

      // Get user details
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, phone_number, google_access_token, google_refresh_token, is_banned")
        .eq("id", userId)
        .single()

      if (userError || !user) {
        results.push({ userId, email: "unknown", status: "error", error: "User not found" })
        continue
      }

      if (user.is_banned) {
        results.push({ userId, email: user.email, status: "skipped", error: "User is banned" })
        continue
      }

      if (!user.phone_number) {
        results.push({ userId, email: user.email, status: "skipped", error: "No phone number" })
        continue
      }

      // Get VIP contacts and keywords for this user
      const [contactsResult, keywordsResult] = await Promise.all([
        supabaseAdmin.from("vip_contacts").select("email").eq("user_id", userId),
        supabaseAdmin.from("keywords").select("keyword").eq("user_id", userId),
      ])

      const watchedEmails = contactsResult.data?.map((c) => c.email) || []
      const watchedKeywords = keywordsResult.data?.map((k) => k.keyword) || []

      if (watchedEmails.length === 0 && watchedKeywords.length === 0) {
        results.push({ userId, email: user.email, status: "skipped", error: "No VIP contacts or keywords" })
        continue
      }

      // Get a valid access token (refresh if needed)
      let accessToken = user.google_access_token

      if (!accessToken && user.google_refresh_token) {
        // Try to refresh the token
        const refreshResult = await refreshGoogleToken(user.google_refresh_token)
        if (refreshResult.success && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken
          // Update the user's access token in the database
          await supabaseAdmin.from("users").update({ google_access_token: accessToken }).eq("id", userId)
        } else {
          results.push({ userId, email: user.email, status: "error", error: "Failed to refresh token" })
          continue
        }
      }

      if (!accessToken) {
        results.push({ userId, email: user.email, status: "error", error: "No access token" })
        continue
      }

      // Check emails for this user
      const checkResult = await checkUserEmails({
        userId,
        accessToken,
        refreshToken: user.google_refresh_token,
        watchedEmails,
        watchedKeywords,
        phoneNumber: user.phone_number,
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

      // If token was refreshed, update it
      if (checkResult.newAccessToken) {
        await supabaseAdmin.from("users").update({ google_access_token: checkResult.newAccessToken }).eq("id", userId)
      }
    }

    const callsTriggered = results.filter((r) => r.callTriggered).length

    return NextResponse.json({
      message: `Checked ${results.length} users, triggered ${callsTriggered} calls`,
      usersChecked: results.length,
      callsTriggered,
      results,
    })
  } catch (error) {
    console.error("[Cron] Error in cron job:", error)
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 },
    )
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string }> {
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
      console.error("[Cron] Token refresh failed:", await response.text())
      return { success: false }
    }

    const data = await response.json()
    return { success: true, accessToken: data.access_token }
  } catch (error) {
    console.error("[Cron] Token refresh error:", error)
    return { success: false }
  }
}

async function checkUserEmails({
  userId,
  accessToken,
  refreshToken,
  watchedEmails,
  watchedKeywords,
  phoneNumber,
}: {
  userId: string
  accessToken: string
  refreshToken?: string
  watchedEmails: string[]
  watchedKeywords: string[]
  phoneNumber: string
}): Promise<{ success: boolean; error?: string; callTriggered?: boolean; newAccessToken?: string }> {
  try {
    // Get processed email IDs
    const { data: processedEmails } = await supabaseAdmin
      .from("processed_emails")
      .select("email_id")
      .eq("user_id", userId)

    const processedSet = new Set(processedEmails?.map((e) => e.email_id) || [])

    // Fetch recent unread emails
    let response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // If token expired, try to refresh
    if (response.status === 401 && refreshToken) {
      const refreshResult = await refreshGoogleToken(refreshToken)
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken
        response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          return { success: false, error: "Gmail API error after refresh", newAccessToken: accessToken }
        }
      } else {
        return { success: false, error: "Token refresh failed" }
      }
    } else if (!response.ok) {
      return { success: false, error: `Gmail API error: ${response.status}` }
    }

    const messagesData = await response.json()
    const messages = messagesData.messages || []

    for (const message of messages) {
      if (processedSet.has(message.id)) continue

      // Get message details
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!messageResponse.ok) continue

      const messageData = await messageResponse.json()
      const headers = messageData.payload?.headers || []

      const fromHeader = headers.find((h: { name: string }) => h.name.toLowerCase() === "from")
      const subjectHeader = headers.find((h: { name: string }) => h.name.toLowerCase() === "subject")

      if (!fromHeader) continue

      const fromEmail = extractEmail(fromHeader.value)
      const subject = subjectHeader?.value || "No subject"

      // Check for VIP match
      const isWatchedSender = watchedEmails.some((watched) => watched.toLowerCase() === fromEmail.toLowerCase())
      const matchedKeyword = watchedKeywords.find((keyword) => subject.toLowerCase().includes(keyword.toLowerCase()))

      if (isWatchedSender || matchedKeyword) {
        // Store processed email
        await supabaseAdmin.from("processed_emails").insert({
          user_id: userId,
          email_id: message.id,
        })

        // Trigger call
        const callResult = await triggerCall(phoneNumber)

        if (callResult.success) {
          // Increment call count
          const { data: currentUser } = await supabaseAdmin.from("users").select("call_count").eq("id", userId).single()

          await supabaseAdmin
            .from("users")
            .update({ call_count: (currentUser?.call_count || 0) + 1 })
            .eq("id", userId)

          return { success: true, callTriggered: true, newAccessToken: accessToken }
        }
      }
    }

    return { success: true, callTriggered: false, newAccessToken: accessToken }
  } catch (error) {
    console.error("[Cron] Error checking emails for user:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}

async function triggerCall(toPhone: string) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: "Twilio not configured" }
  }

  const formattedPhone = toPhone.startsWith("+") ? toPhone : `+1${toPhone.replace(/\D/g, "")}`
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="1"/><Hangup/></Response>`

  const makeCall = async () => {
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
          Twiml: twiml,
          Timeout: "10",
        }),
      })

      const data = await response.json()
      return { success: response.ok, callSid: data.sid, error: data.message }
    } catch (error) {
      return { success: false, error: "Failed to initiate call" }
    }
  }

  // First call
  const firstCall = await makeCall()
  // Wait 3 seconds then call again
  await new Promise((resolve) => setTimeout(resolve, 3000))
  const secondCall = await makeCall()

  return { success: firstCall.success || secondCall.success }
}
