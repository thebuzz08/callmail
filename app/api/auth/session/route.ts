import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// Verify session using httpOnly cookie (tokens never sent to client)
export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ valid: false, error: "No session" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      try {
        session = JSON.parse(sessionCookie.value)
      } catch {
        return NextResponse.json({ valid: false, error: "Invalid session" }, { status: 401 })
      }
    }

    const refreshToken = session.refreshToken
    if (!refreshToken) {
      return NextResponse.json({ valid: false, error: "No refresh token" }, { status: 401 })
    }

    // Try to get a new access token using the refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json({ valid: false, error: tokenData.error }, { status: 401 })
    }

    // Get user info with new access token
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // Update the httpOnly session cookie with the new access token
    const updatedSession = JSON.stringify({
      ...session,
      accessToken: tokenData.access_token,
    })

    // Update client cookie too (for UI display)
    const clientSession = JSON.stringify({
      userId: session.userId,
      email: userData.email,
      name: userData.name,
    })

    const response = NextResponse.json({
      valid: true,
      email: userData.email,
      name: userData.name,
    })

    // Set cookies to 1 year - refreshed on each successful validation
    const ONE_YEAR = 60 * 60 * 24 * 365

    response.cookies.set("callmail_session", updatedSession, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    response.cookies.set("callmail_client", clientSession, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ valid: false, error: "Session check failed" }, { status: 500 })
  }
}
