import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Store for one-time auth tokens (in production, use Redis or database)
// These tokens expire after 60 seconds
const pendingTokens = new Map<string, { userId: string; email: string; name: string; expires: number }>()

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of pendingTokens.entries()) {
    if (data.expires < now) {
      pendingTokens.delete(token)
    }
  }
}, 30000)

// POST: Create/store a one-time token after OAuth (called from auth callback)
export async function POST(request: Request) {
  try {
    const { userId, email, name, accessToken, refreshToken, token: providedToken } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use provided token or generate a new one
    const token = providedToken || randomBytes(32).toString("hex")
    
    // Store token with 60 second expiry
    pendingTokens.set(token, {
      userId,
      email,
      name,
      expires: Date.now() + 60000,
    })

    // Also store the tokens in the database for the user
    await supabaseAdmin
      .from("users")
      .update({
        google_access_token: accessToken,
        google_refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Native token creation error:", error)
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 })
  }
}

// GET: Exchange one-time token for session cookies (called from app WebView)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 })
  }

  const tokenData = pendingTokens.get(token)

  if (!tokenData) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  // Token is one-time use - delete it
  pendingTokens.delete(token)

  // Check if token is expired
  if (tokenData.expires < Date.now()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 })
  }

  // Get user data from database
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, name, google_access_token, google_refresh_token")
    .eq("id", tokenData.userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Create session cookies
  const serverSession = JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
    accessToken: user.google_access_token,
    refreshToken: user.google_refresh_token,
  })

  const clientSession = JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
  })

  const response = NextResponse.json({ 
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  })

  const ONE_YEAR = 60 * 60 * 24 * 365

  response.cookies.set("callmail_session", serverSession, {
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
}
