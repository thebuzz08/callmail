import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export type AuditEventCategory = "auth" | "data_access" | "data_modification" | "security" | "settings" | "call"

export type AuditEventType =
  | "login"
  | "logout"
  | "token_refresh"
  | "email_check"
  | "vip_contact_add"
  | "vip_contact_remove"
  | "keyword_add"
  | "keyword_remove"
  | "settings_update"
  | "call_triggered"
  | "call_retry"
  | "account_suspend"
  | "account_restore"

interface AuditLogData {
  userId: string | null
  eventType: AuditEventType
  eventCategory: AuditEventCategory
  description: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      user_id: data.userId,
      event_type: data.eventType,
      event_category: data.eventCategory,
      description: data.description,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      metadata: data.metadata || {},
    })
  } catch (error) {
    console.error("[AuditLog] Failed to log event:", error)
    // Don't throw - logging failures shouldn't break the app
  }
}

// Helper to extract IP and user agent from request
export function getRequestMetadata(request: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  }
}
