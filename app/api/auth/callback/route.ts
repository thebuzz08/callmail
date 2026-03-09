import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { logAuditEvent, getRequestMetadata } from "@/lib/audit-log"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `https://call-mail.xyz/api/auth/callback`

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json(
        { error: "Failed to exchange authorization code" },
        { status: 400 },
      )
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // Store tokens in httpOnly cookie, return only non-sensitive data
    const serverSession = JSON.stringify({
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    })

    const response = NextResponse.json({
      email: userData.email,
      name: userData.name,
    })

    // Set cookies to 1 year (like YouTube/Google)
    const ONE_YEAR = 60 * 60 * 24 * 365
    
    response.cookies.set("callmail_session", serverSession, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    response.cookies.set("callmail_client", JSON.stringify({
      userId: userData.id,
      email: userData.email,
      name: userData.name,
    }), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const state = url.searchParams.get("state")

  if (error) {
    return NextResponse.redirect(new URL(`/app?error=${encodeURIComponent(error)}`, "https://call-mail.xyz"))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/app?error=no_code", "https://call-mail.xyz"))
  }

  // Validate OAuth state parameter to prevent CSRF attacks
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/app?error=invalid_state", "https://call-mail.xyz"))
  }

  // Clear the state cookie after validation
  cookieStore.delete("oauth_state")

  try {
    // Exchange code for tokens server-side
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect(new URL("/app?error=token_exchange_failed", "https://call-mail.xyz"))
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    // First, check if user exists
    const { data: existingUsers } = await supabaseAdmin.from("users").select("id").eq("email", userData.email).limit(1)

    let userId: string
    let isNewUser = false

    if (existingUsers && existingUsers.length > 0) {
      // User exists, update their tokens
      userId = existingUsers[0].id
      // This ensures we always have a valid refresh token
      await supabaseAdmin
        .from("users")
        .update({
          google_access_token: tokenData.access_token,
          // Only update refresh token if we got one (prompt=consent should always give us one)
          ...(tokenData.refresh_token && { google_refresh_token: tokenData.refresh_token }),
          name: userData.name, // Update name in case it changed
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      const metadata = getRequestMetadata(request)
      await logAuditEvent({
        userId,
        eventType: "login",
        eventCategory: "auth",
        description: `User ${userData.email} logged in`,
        ...metadata,
        metadata: { refresh_token_updated: !!tokenData.refresh_token },
      })
    } else {
      isNewUser = true

      // Create new user in auth.users first
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          avatar_url: userData.picture,
        },
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        return NextResponse.redirect(new URL("/app?error=auth_failed", "https://call-mail.xyz"))
      }

      userId = authData.user.id

      // Create user record in public.users
      await supabaseAdmin.from("users").insert({
        id: userId,
        email: userData.email,
        name: userData.name, // Store user name from Google
        google_access_token: tokenData.access_token,
        google_refresh_token: tokenData.refresh_token || null,
      })

      // Create default settings
      await supabaseAdmin.from("user_settings").insert({
        user_id: userId,
        monitoring_active: true,
        theme: "system",
        tutorial_completed: false,
        phone_setup_completed: false,
      })

      // Create default free subscription
      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        status: "free",
        plan: "free",
      })

      const metadata = getRequestMetadata(request)
      await logAuditEvent({
        userId,
        eventType: "login",
        eventCategory: "auth",
        description: `New user ${userData.email} registered`,
        ...metadata,
        metadata: { is_new_user: true },
      })
    }

    // Server-side session: store sensitive tokens in httpOnly cookie
    const serverSession = JSON.stringify({
      userId,
      email: userData.email,
      name: userData.name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    })

    // Client-readable session: only non-sensitive info for UI display
    const clientSession = JSON.stringify({
      userId,
      email: userData.email,
      name: userData.name,
    })

    const redirectUrl = new URL("https://call-mail.xyz/app")
    redirectUrl.searchParams.set("auth", "success")

    const response = NextResponse.redirect(redirectUrl)

    // Set cookies to 1 year (like YouTube/Google)
    const ONE_YEAR = 60 * 60 * 24 * 365
    
    // httpOnly cookie with tokens - not accessible by JavaScript
    response.cookies.set("callmail_session", serverSession, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    // Client-readable cookie - no sensitive data, just for UI
    response.cookies.set("callmail_client", clientSession, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL("/app?error=auth_failed", "https://call-mail.xyz"))
  }
}
