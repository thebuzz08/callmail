import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Apple's verification endpoints
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt"
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt"

// Your App Store Connect shared secret (set in environment)
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET

// Your product IDs from App Store Connect
const VALID_PRODUCT_IDS = [
  "com.callmail.pro.monthly",
  "com.callmail.pro.annual",
]

interface AppleReceiptResponse {
  status: number
  environment?: string
  latest_receipt?: string
  latest_receipt_info?: Array<{
    product_id: string
    transaction_id: string
    original_transaction_id: string
    purchase_date_ms: string
    expires_date_ms?: string
    is_trial_period?: string
    cancellation_date_ms?: string
  }>
  pending_renewal_info?: Array<{
    auto_renew_status: string
    product_id: string
    original_transaction_id: string
    expiration_intent?: string
  }>
}

async function verifyReceiptWithApple(receiptData: string, useSandbox = false): Promise<AppleReceiptResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      password: APPLE_SHARED_SECRET,
      "exclude-old-transactions": true,
    }),
  })

  return response.json()
}

export async function POST(request: Request) {
  try {
    // Get user session
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = session.user_id

    // Get receipt from request
    const body = await request.json()
    const { receiptData } = body

    if (!receiptData) {
      return NextResponse.json({ error: "Receipt data required" }, { status: 400 })
    }

    if (!APPLE_SHARED_SECRET) {
      console.error("[Apple] APPLE_SHARED_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Verify with Apple - try production first
    let appleResponse = await verifyReceiptWithApple(receiptData, false)

    // Status 21007 means it's a sandbox receipt - retry with sandbox
    if (appleResponse.status === 21007) {
      appleResponse = await verifyReceiptWithApple(receiptData, true)
    }

    // Check for errors
    // Status codes: https://developer.apple.com/documentation/appstorereceipts/status
    if (appleResponse.status !== 0) {
      console.error("[Apple] Verification failed with status:", appleResponse.status)
      return NextResponse.json(
        { error: "Receipt verification failed", appleStatus: appleResponse.status },
        { status: 400 }
      )
    }

    // Get the latest subscription info
    const latestReceipt = appleResponse.latest_receipt_info?.[0]
    if (!latestReceipt) {
      return NextResponse.json({ error: "No subscription found in receipt" }, { status: 400 })
    }

    // Validate product ID
    if (!VALID_PRODUCT_IDS.includes(latestReceipt.product_id)) {
      console.error("[Apple] Invalid product ID:", latestReceipt.product_id)
      return NextResponse.json({ error: "Invalid product" }, { status: 400 })
    }

    // Determine subscription status
    const expiresDate = latestReceipt.expires_date_ms
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null
    const isCancelled = !!latestReceipt.cancellation_date_ms
    const isTrialing = latestReceipt.is_trial_period === "true"
    const isExpired = expiresDate ? expiresDate < new Date() : false

    let status: string
    if (isCancelled) {
      status = "canceled"
    } else if (isExpired) {
      status = "expired"
    } else if (isTrialing) {
      status = "trialing"
    } else {
      status = "active"
    }

    // Check pending renewal info for auto-renew status
    const renewalInfo = appleResponse.pending_renewal_info?.find(
      (r) => r.original_transaction_id === latestReceipt.original_transaction_id
    )
    const willAutoRenew = renewalInfo?.auto_renew_status === "1"

    // Upsert subscription in database
    const subscriptionData = {
      user_id: userId,
      platform: "apple" as const,
      status,
      apple_original_transaction_id: latestReceipt.original_transaction_id,
      apple_product_id: latestReceipt.product_id,
      apple_environment: appleResponse.environment || "Production",
      apple_latest_receipt: appleResponse.latest_receipt,
      apple_expires_date: expiresDate?.toISOString() || null,
      current_period_end: expiresDate?.toISOString() || null,
      cancel_at_period_end: !willAutoRenew,
      trial_end: isTrialing && expiresDate ? expiresDate.toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    // Check if subscription exists for this user
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId)
    } else {
      await supabaseAdmin
        .from("subscriptions")
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString(),
        })
    }

    // Log the event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      event_type: "apple_receipt_validated",
      event_category: "subscription",
      description: `Apple receipt validated: ${status}`,
      metadata: {
        product_id: latestReceipt.product_id,
        transaction_id: latestReceipt.transaction_id,
        environment: appleResponse.environment,
        status,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        status,
        productId: latestReceipt.product_id,
        expiresDate: expiresDate?.toISOString(),
        isTrialing,
        willAutoRenew,
      },
    })
  } catch (error) {
    console.error("[Apple] Receipt validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
