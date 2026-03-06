// Input validation and sanitization for CASA/OWASP compliance

// Strip HTML tags and dangerous characters
export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"]/g, "") // Remove dangerous chars
    .trim()
    .slice(0, maxLength)
}

// Validate email format
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false
  return EMAIL_REGEX.test(email) && email.length <= 254
}

// Validate phone number (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/
export function isValidPhoneNumber(phone: string): boolean {
  if (typeof phone !== "string") return false
  return PHONE_REGEX.test(phone)
}

// Validate keyword (alphanumeric, spaces, hyphens, basic punctuation)
const KEYWORD_REGEX = /^[a-zA-Z0-9\s\-_.@!?&]+$/
export function isValidKeyword(keyword: string): boolean {
  if (typeof keyword !== "string") return false
  const trimmed = keyword.trim()
  return trimmed.length >= 1 && trimmed.length <= 100 && KEYWORD_REGEX.test(trimmed)
}

// Validate UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isValidUUID(id: string): boolean {
  if (typeof id !== "string") return false
  return UUID_REGEX.test(id)
}

// Validate theme
export function isValidTheme(theme: string): boolean {
  return ["light", "dark", "system"].includes(theme)
}

// Validate check interval
export function isValidCheckInterval(minutes: number): boolean {
  return typeof minutes === "number" && [1, 2, 3, 5].includes(minutes)
}

// Validate time format (HH:MM)
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
export function isValidTime(time: string): boolean {
  if (typeof time !== "string") return false
  return TIME_REGEX.test(time)
}

// Validate timezone
export function isValidTimezone(tz: string): boolean {
  if (typeof tz !== "string" || tz.length > 50) return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Allowlisted settings fields that can be updated
const ALLOWED_SETTINGS_FIELDS: Record<string, (value: unknown) => boolean> = {
  theme: (v) => typeof v === "string" && isValidTheme(v),
  check_interval_minutes: (v) => typeof v === "number" && isValidCheckInterval(v),
  monitoring_active: (v) => typeof v === "boolean",
  tutorial_completed: (v) => typeof v === "boolean",
  phone_setup_completed: (v) => typeof v === "boolean",
  quiet_hours_enabled: (v) => typeof v === "boolean",
  quiet_hours_start: (v) => typeof v === "string" && isValidTime(v),
  quiet_hours_end: (v) => typeof v === "string" && isValidTime(v),
  quiet_hours_timezone: (v) => typeof v === "string" && isValidTimezone(v),
}

// Validate and filter settings data to only allowed fields with valid values
export function validateSettingsData(data: Record<string, unknown>): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null

  const validated: Record<string, unknown> = {}
  let hasValid = false

  for (const [key, value] of Object.entries(data)) {
    const validator = ALLOWED_SETTINGS_FIELDS[key]
    if (validator && validator(value)) {
      validated[key] = value
      hasValid = true
    }
  }

  return hasValid ? validated : null
}
