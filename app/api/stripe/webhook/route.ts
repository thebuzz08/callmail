// Stripe webhook handler for subscription events
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  console.log("[v0] Stripe webhook received")
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("[Stripe Webhook] Received event:", event.type)
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        
        // Get userId from session metadata OR from the subscription metadata
        let userId = session.metadata?.userId
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Fallback to subscription metadata if not on session
          if (!userId) {
            userId = subscription.metadata?.userId
          }
          
          // Also try to find user by customer ID as last resort
          if (!userId && session.customer) {
            const { data: user } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("stripe_customer_id", session.customer as string)
              .single()
            userId = user?.id
          }

          if (!userId) {
            console.error("[Webhook] No userId found for checkout session:", session.id)
            break
          }

          console.log("[Webhook] Processing checkout.session.completed for user:", userId, "status:", subscription.status)

          const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              trial_start: subscription.trial_start
                ? new Date(subscription.trial_start * 1000).toISOString()
                : null,
              trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
            { onConflict: "user_id" }
          )
          
          if (upsertError) {
            console.error("[Webhook] Failed to upsert subscription:", upsertError)
          } else {
            console.log("[Webhook] Successfully created/updated subscription for user:", userId)
          }
        }
        break
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        let userId = subscription.metadata?.userId
        
        // Try to find user by customer ID if no userId in metadata
        if (!userId && subscription.customer) {
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single()
          userId = user?.id
        }

        if (!userId) {
          console.error("[Webhook] No userId found for subscription.created:", subscription.id)
          break
        }

        console.log("[Webhook] Processing customer.subscription.created for user:", userId)

        const { error: insertError } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000).toISOString()
              : null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            trial_start: subscription.trial_start
              ? new Date(subscription.trial_start * 1000).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
          { onConflict: "user_id" }
        )

        if (insertError) {
          console.error("[Webhook] Failed to insert subscription:", insertError)
        } else {
          console.log("[Webhook] Successfully created subscription for user:", userId)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        let userId = subscription.metadata?.userId
        
        // Try to find user by customer ID if no userId in metadata
        if (!userId && subscription.customer) {
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single()
          userId = user?.id
        }

        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              trial_start: subscription.trial_start
                ? new Date(subscription.trial_start * 1000).toISOString()
                : null,
              trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Find user by subscription ID
          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single()

          if (sub) {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", sub.user_id)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error instanceof Error ? error.message : error)
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
