import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyQStashSignature } from "@/lib/qstash/verify"
import { logAuditEvent } from "@/lib/audit-log"

// Refresh all users' Google access tokens
// Runs every 30 minutes to ensure tokens are always fresh
export async function POST(request: Request) {
  try {
    // Verify this is from QStash
    const isValid = await verifyQStashSignature(request)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all users with refresh tokens
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, google_refresh_token")
      .not("google_refresh_token", "is", null)

    if (usersError) {
      console.error("[TokenRefresh] Failed to fetch users:", usersError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log("[TokenRefresh] No users with refresh tokens found")
      return NextResponse.json({ success: true, refreshed: 0 })
    }

    console.log(`[TokenRefresh] Starting token refresh for ${users.length} users`)

    let refreshedCount = 0
    let failedCount = 0
    const invalidTokenUsers: string[] = []

    for (const user of users) {
      try {
        // Refresh the token using Google OAuth
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: user.google_refresh_token,
            grant_type: "refresh_token",
          }),
        })

        const responseText = await tokenResponse.text()

        let tokenData
        try {
          tokenData = JSON.parse(responseText)
        } catch {
          console.error(`[TokenRefresh] Failed to parse response for ${user.email}`)
          failedCount++
          continue
        }

        if (!tokenResponse.ok) {
          console.error(`[TokenRefresh] Token refresh failed for ${user.email}: ${tokenData.error}`)

          if (tokenData.error === "invalid_grant") {
            invalidTokenUsers.push(user.email)

            // Clear the invalid refresh token so user knows to re-authenticate
            await supabase
              .from("users")
              .update({
                google_refresh_token: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id)

            // TODO: Send email notification to user when email service is set up (e.g. Resend)
            // await sendEmail({
            //   to: user.email,
            //   subject: "CallMail: Action Required - Please Re-login",
            //   body: "Your Google connection has expired. Please log in to CallMail again to continue monitoring.",
            // })
          }

          failedCount++
          continue
        }

        const newAccessToken = tokenData.access_token

        // Update the access token in the database
        const { error: updateError } = await supabase
          .from("users")
          .update({
            google_access_token: newAccessToken,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (updateError) {
          console.error(`[TokenRefresh] Failed to save token for ${user.email}`)
          failedCount++
          continue
        }

        await logAuditEvent({
          userId: user.id,
          eventType: "token_refresh",
          eventCategory: "security",
          description: "Access token refreshed automatically",
        })

        refreshedCount++
      } catch (error) {
        console.error(`[TokenRefresh] Error refreshing token for ${user.email}:`, error)
        failedCount++
      }
    }

    console.log(`[TokenRefresh] Done: ${refreshedCount} refreshed, ${failedCount} failed`)
    if (invalidTokenUsers.length > 0) {
      console.log(`[TokenRefresh] Users needing re-auth: ${invalidTokenUsers.join(", ")}`)
    }

    return NextResponse.json({
      success: true,
      refreshed: refreshedCount,
      failed: failedCount,
      total: users.length,
      invalidTokenUsers,
    })
  } catch (error) {
    console.error("[TokenRefresh] Error:", error)
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    )
  }
}
