<div align="center">

# Mr. Cleaner — Maya AI Concierge
### Turn website visitors into confirmed, paid bookings — without hiring a single person

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-Primary_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Persistence-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![Google Calendar](https://img.shields.io/badge/Google_Calendar-Real--Time_Sync-4285F4?style=for-the-badge&logo=google-calendar&logoColor=white)](https://calendar.google.com)
[![Twilio](https://img.shields.io/badge/Twilio-Lead_Alerts-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://twilio.com)

<br/>

</div>

## What This Does for Your Detailing Business

You lose money every time a potential customer visits your site and doesn't book. Maybe they got distracted. Maybe you were too slow to reply. Maybe they didn't want to make a phone call.

**Maya is a 24/7 AI booking agent that:** 

- Answers customer questions instantly — any time, day or night
- Quotes exact prices for your services based on vehicle type and condition
- Checks your calendar and schedules appointments in real time
- Collects deposits via Stripe before you lift a finger
- Texts you lead alerts so you know what's booked and when
- Stores everything in a dashboard — revenue, bookings, customer history

All of this happens **without you hiring a receptionist, a dispatcher, or a customer service person.**

---

## Why Detailing Owners Switch to Maya

### 1. Never Lose a Lead to Slow Response Again

Most detailing websites get 3-10 visits per day. If you're busy detailing a car (which you should be), you're not answering your chat or returning voicemails. That customer moves to the next detailer on Google.

Maya responds in under 2 seconds. She tells them your service area, quotes a price, checks your calendar, and sends them a deposit link — all while you're hands-free with a buffer and polish.

### 2. No More "I'll Call You Back" Bookings

A customer says "I'll book later" and never does. Maya converts them on the spot by asking exactly three things: **what service, what vehicle, what date**. She handles the rest. Deposits lock the slot so no-shows don't burn your time.

### 3. Increase Average Ticket Value

Maya knows your pricing inside out. When a customer asks about a basic wash, she automatically quotes the right package for their vehicle type (sedan vs. SUV vs. truck). Pet hair? Heavy soil? Luxury upcharge? She calculates it all — no awkward phone upsells, no forgotten add-ons.

### 4. Stop Double-Booking Your Calendar

Maya writes directly to Google Calendar. When a slot is taken, it's gone. No more "did I write that down?" moments. She works 8 AM to 6 PM, Monday through Saturday, and knows your exact service duration.

### 5. See Your Numbers Without Spreadsheets

The Owner Dashboard shows:
- **Revenue this month** (from real stripe payments, not guesses)
- **Number of bookings** and their status
- **Tool execution logs** — see how many quotes Maya generated
- **System health** — is everything running?

No accounting degree required.

---

## What's Included

| What you get | What it replaces |
|---|---|
| 24/7 AI chat agent (Maya) | Receptionist, customer service, after-hours support |
| Instant quote calculator | Manual pricing lookup, "let me calculate that" delays |
| Google Calendar sync | Paper calendar, mental scheduling, double-bookings |
| Stripe deposit collection | Venmo/CashApp tracking, unpaid bookings, no-shows |
| Owner dashboard | Spreadsheets, guessing your revenue, missed insights |
| Twilio SMS alerts | "Did the customer confirm?" anxiety |
| Security & rate limiting | Spam bookings, brute-force attacks, data leaks |

---

## Live Example

See Maya in action at [your-site.com] — type *"I need a ceramic coating for my F-150 next Saturday"* and watch her check the calendar, quote the price, and send a payment link.

---

## Tech Stack

| Layer | What it uses |
|---|---|
| **Frontend** | Next.js 16 — fast, SEO-friendly landing page with dark mode |
| **AI Engine** | Gemini 2.0 Flash primary, DeepSeek & OpenAI as fallback |
| **Database** | Supabase (PostgreSQL) — bookings, sessions, logs |
| **Payments** | Stripe Checkout + webhook verification |
| **Calendar** | Google Calendar API — read/write availability |
| **Alerts** | Twilio SMS — new booking notifications |
| **Auth** | JWT sessions with server-side revocation |
| **Rate Limiting** | Per-session + per-IP to prevent abuse |
| **Validation** | Zod on every input |

No monthly SaaS fees. No per-seat licenses. You own the entire stack.

---

## What You Need to Get Started

1. **A domain** — where your website lives (or use a subdomain)
2. **A Google account** — for Calendar sync
3. **A Stripe account** — to collect deposits
4. **A Supabase account** — free tier works
5. **A Twilio number** — for SMS alerts (~$1/month)
6. **A Gemini API key** — free tier gives 15 requests per minute

That's it. No development team. No agency. Fork the repo, add your keys, and deploy.

---

## Quick Setup

```bash
git clone https://github.com/Ismail-2001/Mr-Cleaner-AI-Agent.git
cd Mr-Cleaner-AI-Agent
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your API keys (Gemini, Supabase, Stripe, Google Calendar, Twilio).

Run the database schema from `supabase/schema.sql` in Supabase SQL Editor.

```bash
npm run dev
```

Deploy to Vercel in one click — zero server management.

---

## Security Built In

- Dashboard login: 5 attempts per 15 minutes per IP
- Chat API: 20 requests per minute per session + 100 per minute per IP
- All customer names, phones, and addresses stripped from logs
- Stripe webhooks verified by cryptographic signature
- Zod validation rejects malformed requests before they reach business logic
- Rate limiting prevents spam bookings that waste your Twilio credits

Your customer data stays yours. No third-party AI training on your conversations.

---

## How It Compares

| | Maya AI | Generic chatbot | Phone-only | Spreadsheet + Venmo |
|---|---|---|---|---|
| Answers 24/7 | ✅ Instant | ✅ Shallow replies | ❌ Missed calls | ❌ |
| Quotes exact prices | ✅ Yes | ❌ No | ❌ Takes minutes | ❌ |
| Books on calendar | ✅ Auto | ❌ | ❌ Manual entry | ❌ |
| Collects deposits | ✅ Stripe | ❌ | ❌ | ⚠️ Venmo trust |
| Shows you revenue | ✅ Dashboard | ❌ | ❌ | ❌ |
| SMS alerts | ✅ Twilio | ❌ | ❌ | ❌ |
| One-time setup | ✅ Yes | ❌ Monthly fees | ❌ | ❌ |

---

## Who Built This

Built by [Ismail Sajid](https://github.com/Ismail-2001) — a developer who works with US detailing businesses to replace manual booking workflows with autonomous AI agents.

No ongoing retainers. No per-booking fees. You take the code and run it.

---

<div align="center">

**Stop losing customers to slow responses. Let Maya book while you work.**

Star the repo if this solves a problem for your business.

</div>
