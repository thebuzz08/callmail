import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Apple App Store Server Notifications V2
// https://developer.apple.com/documentation/appstoreservernotifications

interface AppleNotificationPayload {
  notificationType: string
  subtype?: string
  data: {
    environment: string
    bundleId: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
  }
  signedDate: number
}

interface DecodedTransactionInfo {
  originalTransactionId: string
  transactionId: string
  productId: string
  purchaseDate: number
  expiresDate?: number
  type: string
  environment: string
}

// In production, you should verify the JWS signature using Apple's public key
// For now, we decode the payload (base64) but skip signature verification
function decodeJWSPayload(jws: string): any {
  try {
    const parts = jws.split(".")
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], "base64url").toString("utf8")
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Apple sends a signed payload
    const { signedPayload } = body

    if (!signedPayload) {
      console.error("[Apple Webhook] No signedPayload received")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Decode the notification (in production, verify JWS signature first)
    const notification: AppleNotificationPayload = decodeJWSPayload(signedPayload)

    if (!notification) {
      console.error("[Apple Webhook] Failed to decode notification")
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 })
    }

    console.log(`[Apple Webhook] Received: ${notification.notificationType} ${notification.subtype || ""}`)

    // Decode transaction info if present
    let transactionInfo: DecodedTransactionInfo | null = null
    if (notification.data.signedTransactionInfo) {
      transactionInfo = decodeJWSPayload(notification.data.signedTransactionInfo)
    }

    if (!transactionInfo) {
      console.error("[Apple Webhook] No transaction info in notification")
      return NextResponse.json({ success: true }) // Acknowledge but don't process
    }

    const originalTransactionId = transactionInfo.originalTransactionId

    // Find the subscription by Apple's original transaction ID
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status")
      .eq("apple_original_transaction_id", originalTransactionId)
      .single()

    if (!subscription) {
      console.log(`[Apple Webhook] No subscription found for transaction: ${originalTransactionId}`)
      return NextResponse.json({ success: true }) // Acknowledge
    }

    // Determine new status based on notification type
    let newStatus: string | null = null
    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    switch (notification.notificationType) {
      case "SUBSCRIBED":
        // New subscription or resubscription
        newStatus = "active"
        if (transactionInfo.expiresDate) {
          updateData.current_period_end = new Date(transactionInfo.expiresDate).toISOString()
          updateData.apple_expires_date = new Date(transactionInfo.expiresDate).toISOString()
        }
        updateData.cancel_at_period_end = false
        break

      case "DID_RENEW":
        // Subscription successfully renewed
        newStatus = "active"
        if (transactionInfo.expiresDate) {
          updateData.current_period_end = new Date(transactionInfo.expiresDate).toISOString()
          updateData.apple_expires_date = new Date(transactionInfo.expiresDate).toISOString()
        }
        break

      case "DID_CHANGE_RENEWAL_STATUS":
        // Auto-renew preference changed
        if (notification.subtype === "AUTO_RENEW_DISABLED") {
          updateData.cancel_at_period_end = true
        } else if (notification.subtype === "AUTO_RENEW_ENABLED") {
          updateData.cancel_at_period_end = false
        }
        break

      case "EXPIRED":
        // Subscription expired
        newStatus = "expired"
        break

      case "DID_FAIL_TO_RENEW":
        // Billing issue
        if (notification.subtype === "GRACE_PERIOD") {
          newStatus = "past_due"
        }
        break

      case "GRACE_PERIOD_EXPIRED":
        // Grace period ended without successful billing
        newStatus = "expired"
        break

      case "REFUND":
        // User got a refund
        newStatus = "canceled"
        break

      case "REVOKE":
        // Family sharing access revoked or refund
        newStatus = "canceled"
        break

      case "OFFER_REDEEMED":
        // Promotional offer redeemed
        newStatus = "active"
        break

      default:
        console.log(`[Apple Webhook] Unhandled notification type: ${notification.notificationType}`)
    }

    // Update subscription if status changed
    if (newStatus) {
      updateData.status = newStatus
    }

    await supabaseAdmin
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscription.id)

    // Log the webhook event
    await supabaseAdmin.from("audit_logs").insert({
      user_id: subscription.user_id,
      event_type: "apple_webhook_received",
      event_category: "subscription",
      description: `Apple notification: ${notification.notificationType} ${notification.subtype || ""}`,
      metadata: {
        notification_type: notification.notificationType,
        subtype: notification.subtype,
        original_transaction_id: originalTransactionId,
        environment: notification.data.environment,
        new_status: newStatus,
      },
    })

    console.log(`[Apple Webhook] Updated subscription ${subscription.id} to status: ${newStatus || "unchanged"}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Apple Webhook] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
