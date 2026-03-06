import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { logAuditEvent, getRequestMetadata } from "@/lib/audit-log"
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidKeyword,
  isValidUUID,
  sanitizeString,
  validateSettingsData,
} from "@/lib/validation"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Get user data
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const userId = session.userId

    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 })
    }

    // Fetch all user data
    const [userResult, settingsResult, contactsResult, domainsResult, keywordsResult, subscriptionResult] = await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", userId).single(),
      supabaseAdmin.from("user_settings").select("*").eq("user_id", userId).single(),
      supabaseAdmin.from("vip_contacts").select("*").eq("user_id", userId),
      supabaseAdmin.from("vip_domains").select("*").eq("user_id", userId),
      supabaseAdmin.from("keywords").select("*").eq("user_id", userId),
      supabaseAdmin.from("subscriptions").select("*").eq("user_id", userId).single(),
    ])

    return NextResponse.json({
      user: userResult.data,
      settings: settingsResult.data,
      contacts: contactsResult.data || [],
      domains: domainsResult.data || [],
      keywords: keywordsResult.data || [],
      subscription: subscriptionResult.data,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}

// Update user data
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("callmail_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const userId = session.userId

    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 })
    }

    // Rate limit mutations
    const rl = await rateLimit(`mutation:${userId}`, RATE_LIMITS.mutation)
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const body = await request.json()
    const { action, data } = body

    const metadata = getRequestMetadata(request)

    switch (action) {
      case "update_phone":
        if (!data.phoneNumber || !isValidPhoneNumber(data.phoneNumber)) {
          return NextResponse.json({ error: "Invalid phone number format. Use E.164 format (e.g. +14155551234)" }, { status: 400 })
        }
        await supabaseAdmin
          .from("users")
          .update({ phone_number: data.phoneNumber, updated_at: new Date().toISOString() })
          .eq("id", userId)
        await supabaseAdmin
          .from("user_settings")
          .update({ phone_setup_completed: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "settings_update",
          eventCategory: "settings",
          description: "User updated phone number",
          ...metadata,
          metadata: { phone_number: data.phoneNumber },
        })
        break

      case "add_contact":
        if (!data.email || !isValidEmail(data.email)) {
          return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
        }
        await supabaseAdmin.from("vip_contacts").insert({
          user_id: userId,
          email: sanitizeString(data.email, 254),
          name: data.name ? sanitizeString(data.name, 100) : null,
        })

        await logAuditEvent({
          userId,
          eventType: "vip_contact_add",
          eventCategory: "data_modification",
          description: `Added VIP contact: ${data.email}`,
          ...metadata,
          metadata: { contact_email: data.email, contact_name: data.name },
        })
        break

      case "remove_contact":
        if (!data.contactId || !isValidUUID(data.contactId)) {
          return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 })
        }
        await supabaseAdmin.from("vip_contacts").delete().eq("id", data.contactId).eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "vip_contact_remove",
          eventCategory: "data_modification",
          description: `Removed VIP contact`,
          ...metadata,
          metadata: { contact_id: data.contactId },
        })
        break

      case "add_domain": {
        // Validate domain format (simple check for domain pattern)
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
        if (!data.domain || !domainRegex.test(data.domain)) {
          return NextResponse.json({ error: "Invalid domain format (e.g., company.com)" }, { status: 400 })
        }
        const cleanDomain = data.domain.toLowerCase().trim()
        await supabaseAdmin.from("vip_domains").insert({
          user_id: userId,
          domain: cleanDomain,
        })

        await logAuditEvent({
          userId,
          eventType: "vip_domain_add",
          eventCategory: "data_modification",
          description: `Added VIP domain: @${cleanDomain}`,
          ...metadata,
          metadata: { domain: cleanDomain },
        })
        break
      }

      case "remove_domain":
        if (!data.domainId || !isValidUUID(data.domainId)) {
          return NextResponse.json({ error: "Invalid domain ID" }, { status: 400 })
        }
        await supabaseAdmin.from("vip_domains").delete().eq("id", data.domainId).eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "vip_domain_remove",
          eventCategory: "data_modification",
          description: `Removed VIP domain`,
          ...metadata,
          metadata: { domain_id: data.domainId },
        })
        break

      case "add_keyword":
        if (!data.keyword || !isValidKeyword(data.keyword)) {
          return NextResponse.json({ error: "Invalid keyword. Use letters, numbers, spaces, and basic punctuation." }, { status: 400 })
        }
        await supabaseAdmin.from("keywords").insert({
          user_id: userId,
          keyword: sanitizeString(data.keyword, 100),
        })

        await logAuditEvent({
          userId,
          eventType: "keyword_add",
          eventCategory: "data_modification",
          description: `Added keyword: ${data.keyword}`,
          ...metadata,
          metadata: { keyword: data.keyword },
        })
        break

      case "remove_keyword":
        if (!data.keywordId || !isValidUUID(data.keywordId)) {
          return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 })
        }
        await supabaseAdmin.from("keywords").delete().eq("id", data.keywordId).eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "keyword_remove",
          eventCategory: "data_modification",
          description: `Removed keyword`,
          ...metadata,
          metadata: { keyword_id: data.keywordId },
        })
        break

      case "update_settings": {
        const validatedSettings = validateSettingsData(data)
        if (!validatedSettings) {
          return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
        }
        await supabaseAdmin
          .from("user_settings")
          .update({ ...validatedSettings, updated_at: new Date().toISOString() })
          .eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "settings_update",
          eventCategory: "settings",
          description: "User updated settings",
          ...metadata,
          metadata: { settings_changed: Object.keys(validatedSettings) },
        })
        break
      }

      case "complete_tutorial":
        await supabaseAdmin
          .from("user_settings")
          .update({ tutorial_completed: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
        break

      case "update_monitoring":
        await supabaseAdmin
          .from("user_settings")
          .update({
            monitoring_active: data.monitoring_active,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        await logAuditEvent({
          userId,
          eventType: "settings_update",
          eventCategory: "settings",
          description: `Monitoring ${data.monitoring_active ? "enabled" : "disabled"}`,
          ...metadata,
          metadata: { monitoring_active: data.monitoring_active },
        })
        break

      case "add_processed_email":
        await supabaseAdmin.from("processed_emails").insert({
          user_id: userId,
          email_id: data.emailId,
        })
        break

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user data:", error)
    return NextResponse.json({ error: "Failed to update user data" }, { status: 500 })
  }
}
