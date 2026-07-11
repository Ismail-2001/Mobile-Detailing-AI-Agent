# KNOWN_ISSUES.md

Issues identified during the production remediation audit that are intentionally
deferred. Each should be filed as a ticket and addressed before or shortly after
client handoff.

---

## 1. ~~Supabase anon key is public and RLS policies are too permissive~~ — RESOLVED

Tightened RLS policies: anon can only INSERT bookings/chat_sessions/usage_logs.
application_config is service-role only. SELECT on bookings is service-role only.

---

## 2. ~~Chat API route has no rate limiting~~ — RESOLVED

Added in-memory sliding window rate limiter (`lib/rate-limit.js`) — 20 requests
per minute per session ID. Chat, bookings, and auth routes all enforce limits.

---

## 3. ~~Stripe webhook secret is not validated at startup~~ — RESOLVED

Added `lib/validate-env.js` that runs at API route startup. Validates all critical
env vars (DASHBOARD_PASSWORD, DASHBOARD_SESSION_SECRET, STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

---

## 4. ~~`chat_sessions` table may not exist in Supabase~~ — RESOLVED

Added to `supabase/schema.sql` as part of Fix 4 implementation.

---

## 5. ~~Calendar availability check doesn't account for bookings table~~ — RESOLVED

Updated `lib/calendar.js` `checkAvailability` to exclude slots with non-cancelled
bookings from the Supabase bookings table.

---

## 6. ~~No CSRF protection on booking POST endpoint~~ — RESOLVED

Added `lib/csrf.js` with Origin/Referer header validation. Middleware applies
CSRF checks to all POST/PUT/DELETE routes except Stripe webhooks (which don't
send Origin headers). Defense-in-depth alongside SameSite cookies.

---

## 7. ~~Weather check is simulated~~ — RESOLVED

Integrated OpenWeatherMap API in `lib/tools.js` `check_weather` tool. Uses
real-time weather data when `OPENWEATHER_API_KEY` is set and zip code is provided.
Falls back to simulation when API key is not configured (local dev).

**Setup:** Get free API key at openweathermap.org/api (1000 calls/day free tier).
Add `OPENWEATHER_API_KEY` to Vercel env vars.

---

## 8. Rate limiter is in-memory only (no persistence across restarts)

**Severity:** LOW  
**File:** `lib/rate-limit.js`

The sliding window rate limiter stores state in a JavaScript Map. If the server
restarts, all rate limit counters reset. Acceptable for single-instance deployment
but not for multi-instance or serverless.

**Recommended fix:** For multi-instance deployments, use Redis or Supabase to store
rate limit counters.

---

## 9. Error boundaries only on dashboard and chat

**Severity:** LOW  
**File:** `components/ErrorBoundary.js`

Error boundaries are only applied to the dashboard page and chat interface. Other
client components (booking summary, etc.) may throw unhandled errors in production.

**Recommended fix:** Add error boundaries around other interactive components as needed.
