/**
 * Motologix - Rate Limiter
 *
 * Simple in-memory rate limiter for API requests.
 * Limits to 1000 requests per day (RPD) to protect Gemini API quota.
 */

// ============================================
// CONFIGURATION
// ============================================

const MAX_REQUESTS_PER_DAY = 1000;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// IN-MEMORY STORAGE
// ============================================

interface RateLimitState {
  count: number;
  resetAt: number;
}

// Global state (persists across requests in same server instance)
let rateLimitState: RateLimitState = {
  count: 0,
  resetAt: Date.now() + RESET_INTERVAL_MS,
};

// ============================================
// RATE LIMITER FUNCTIONS
// ============================================

/**
 * Check if rate limit has been exceeded
 */
export function isRateLimited(): boolean {
  checkAndReset();
  return rateLimitState.count >= MAX_REQUESTS_PER_DAY;
}

/**
 * Get remaining requests for the day
 */
export function getRemainingRequests(): number {
  checkAndReset();
  return Math.max(0, MAX_REQUESTS_PER_DAY - rateLimitState.count);
}

/**
 * Get time until rate limit resets (in ms)
 */
export function getResetTime(): number {
  return Math.max(0, rateLimitState.resetAt - Date.now());
}

/**
 * Increment the request counter
 * Returns true if request is allowed, false if rate limited
 */
export function incrementRequestCount(): boolean {
  checkAndReset();

  if (rateLimitState.count >= MAX_REQUESTS_PER_DAY) {
    return false;
  }

  rateLimitState.count++;
  return true;
}

/**
 * Check if we should reset the counter (new day)
 */
function checkAndReset(): void {
  const now = Date.now();
  if (now >= rateLimitState.resetAt) {
    rateLimitState = {
      count: 0,
      resetAt: now + RESET_INTERVAL_MS,
    };
  }
}

/**
 * Get rate limit status summary
 */
export function getRateLimitStatus(): {
  remaining: number;
  total: number;
  resetInMs: number;
  isLimited: boolean;
} {
  checkAndReset();
  return {
    remaining: getRemainingRequests(),
    total: MAX_REQUESTS_PER_DAY,
    resetInMs: getResetTime(),
    isLimited: isRateLimited(),
  };
}

/**
 * Format reset time as human-readable string
 */
export function formatResetTime(): string {
  const ms = getResetTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
