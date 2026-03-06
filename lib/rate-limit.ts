import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Sliding window rate limiter using Upstash Redis.
 * Returns whether the request is allowed and remaining quota.
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window

  try {
    // Use a sorted set with timestamps as scores for sliding window
    const pipeline = redis.pipeline()
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart)
    // Count current entries
    pipeline.zcard(key)
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}:${Math.random().toString(36).slice(2)}` })
    // Set expiry on the key
    pipeline.expire(key, config.window)

    const results = await pipeline.exec()
    const currentCount = (results[1] as number) || 0

    if (currentCount >= config.limit) {
      return {
        success: false,
        remaining: 0,
        reset: now + config.window,
      }
    }

    return {
      success: true,
      remaining: config.limit - currentCount - 1,
      reset: now + config.window,
    }
  } catch (error) {
    // If Redis is down, allow the request (fail open) but log
    console.error("[RateLimit] Redis error:", error)
    return {
      success: true,
      remaining: config.limit,
      reset: now + config.window,
    }
  }
}

/** Extract client IP from request */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

// Pre-configured rate limits
export const RATE_LIMITS = {
  // Auth: 10 requests per 5 minutes per IP
  auth: { limit: 10, window: 300 },
  // API: 60 requests per minute per user
  api: { limit: 60, window: 60 },
  // Data mutations: 30 per minute per user
  mutation: { limit: 30, window: 60 },
  // Admin: 30 per minute per IP
  admin: { limit: 30, window: 60 },
} as const
