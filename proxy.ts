import { updateSession } from "@/lib/supabase/proxy"
import type { NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const response: NextResponse = await updateSession(request)

  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  
  // Content Security Policy - CASA Tier 2 compliant
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.stripe.com https://*.googleusercontent.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://gmail.googleapis.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ")
  response.headers.set("Content-Security-Policy", csp)

  if (response.headers.get("Access-Control-Allow-Origin") === "*") {
    response.headers.delete("Access-Control-Allow-Origin")
  }

  if (!response.headers.has("Access-Control-Allow-Origin")) {
    response.headers.set("Access-Control-Allow-Origin", "https://call-mail.xyz")
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/qstash|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
