import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MONTHLY_PRICE_ID = "price_1TIBrDK3zOiXqdF9ecNa1O1R"
const ANNUAL_PRICE_ID = "price_1TIBraK3zOiXqdF93K2CKrpG"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const plan = body.plan || "monthly"
    const priceId = plan === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value))
    } catch {
      session = JSON.parse(sessionCookie.value)
    }

    const userId = session.userId
    const email = session.email

    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 })
    }

    // Check if user already has a Stripe customer
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    let customerId = user?.stripe_customer_id

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      })
      customerId = customer.id

      // Save customer ID to user record
      await supabaseAdmin
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    // Create checkout session with 7-day free trial
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      success_url: `https://call-mail.xyz/app?subscription=success`,
      cancel_url: `https://call-mail.xyz/app?subscription=cancelled`,
      metadata: { userId },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to create checkout session: ${errorMessage}` }, { status: 500 })
  }
}
