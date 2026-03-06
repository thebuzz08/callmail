import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const REDIRECT_URI = `https://call-mail.xyz/api/auth/callback`

// Scopes needed for Gmail metadata access (headers only, no email body)
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ")

export async function GET(request: Request) {
  // Rate limit auth requests
  const ip = getClientIP(request)
  const rl = await rateLimit(`auth:${ip}`, RATE_LIMITS.auth)
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  // Generate cryptographically random state parameter for CSRF protection
  const stateBytes = new Uint8Array(32)
  crypto.getRandomValues(stateBytes)
  const state = Array.from(stateBytes, (b) => b.toString(16).padStart(2, "0")).join("")

  // Store state in httpOnly cookie for validation in callback
  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  })

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", SCOPES)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("state", state)
  // Google only returns refresh_token on first auth OR when prompt=consent is used
  authUrl.searchParams.set("prompt", "consent")

  return NextResponse.json({
    url: authUrl.toString(),
  })
}
