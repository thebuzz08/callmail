import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This runs once per week (Sunday at 10am) via Vercel Cron
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 10 * * 0" }] }
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all users with their call stats from the last 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get call costs (which track individual calls) from the past week
    const { data: callsData, error: callsError } = await supabaseAdmin
      .from("call_costs")
      .select("user_id, created_at")
      .gte("created_at", oneWeekAgo.toISOString())

    if (callsError) {
      console.error("[Weekly Digest] Error fetching calls:", callsError)
      return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 })
    }

    // Group calls by user
    const callsByUser: Record<string, number> = {}
    for (const call of callsData || []) {
      callsByUser[call.user_id] = (callsByUser[call.user_id] || 0) + 1
    }

    // Get all active users with push tokens (we'll add this field)
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, push_token")
      .not("push_token", "is", null)

    if (usersError) {
      console.error("[Weekly Digest] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Send push notifications
    const results = []
    for (const user of users || []) {
      const callCount = callsByUser[user.id] || 0
      
      // Skip users with no calls
      if (callCount === 0) continue

      try {
        // Send push notification via Firebase Cloud Messaging or similar
        // For now, we'll log the notification that would be sent
        const notification = {
          userId: user.id,
          title: "Your Weekly CallMail Summary",
          body: callCount === 1 
            ? "You received 1 call this week for an important email."
            : `You received ${callCount} calls this week for important emails.`,
          data: {
            type: "weekly_digest",
            callCount: callCount.toString(),
          },
        }

        // If push_token exists, send to FCM
        if (user.push_token) {
          await sendPushNotification(user.push_token, notification)
        }

        results.push({ userId: user.id, callCount, sent: true })
      } catch (error) {
        console.error(`[Weekly Digest] Failed to send to user ${user.id}:`, error)
        results.push({ userId: user.id, callCount, sent: false, error: String(error) })
      }
    }

    // Log summary
    const totalSent = results.filter(r => r.sent).length
    console.log(`[Weekly Digest] Sent ${totalSent} notifications to users`)

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      notificationsSent: totalSent,
      results,
    })
  } catch (error) {
    console.error("[Weekly Digest] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Send push notification via Apple Push Notification service (APNs)
// This is a simplified implementation - in production, use a service like Firebase or OneSignal
async function sendPushNotification(
  pushToken: string,
  notification: {
    title: string
    body: string
    data?: Record<string, string>
  }
) {
  // For Capacitor apps, we typically use Firebase Cloud Messaging
  // which works for both iOS and Android
  
  // If using Firebase:
  // const message = {
  //   notification: {
  //     title: notification.title,
  //     body: notification.body,
  //   },
  //   data: notification.data,
  //   token: pushToken,
  // }
  // await admin.messaging().send(message)

  // For now, log the notification (implement actual sending when FCM is set up)
  console.log(`[Push] Would send to ${pushToken.substring(0, 20)}...:`, notification)
  
  return { success: true }
}
