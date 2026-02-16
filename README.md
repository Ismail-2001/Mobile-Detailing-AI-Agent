# Mr. Cleaner Mobile Detailing Agent

## Executive Overview
Mr. Cleaner is an **Intelligence-First, Vision-Capable AI Agent platform** designed for elite mobile detailing enterprises. The system leverages a **Multi-Model Orchestrator** (DeepSeek-V3/GPT-4o) to handle visual vehicle inspections, qualify luxury leads, and automate complex appointment scheduling. 

This is not a chatbot; it is a **Visionary Concierge** that uses computer vision to inspect photos and business intelligence to drive revenue.

## Key Features
*   **Maya Vision**: Computer-vision enabled vehicle inspection. Customers upload photos, and Maya automatically identifies body types and surface issues.
*   **Cinematic Luxury UI**: A high-end, glassmorphism-based interface designed to match the aesthetics of luxury automotive brands.
*   **Dynamic Knowledge Orchestrator**: Real-time pricing and policy management via Supabase, allowing business owners to update agent logic without code.
*   **Intelligence Dashboard**: Advanced ROI reporting, lead quality scoring, and live transparency into Maya's "Reasoning Paths."
*   **Google Calendar Sync**: Real-time bidirectional synchronization with business availability.
*   **Resilient Persistence**: Dual-layer failover using Supabase and localized memory stores for 99.9% agent uptime.

## Architecture Overview
The system follows a **Decoupled Orchestration Architecture**:

1.  **Reasoning Layer**: DeepSeek-V3 or GPT-4o processes natural language and manages the "ReAct" (Reasoning + Acting) loop.
2.  **Orchestration Layer**: A Next.js backend loop that receives reasoning intent, executes validated tools, and persists state before returning a response.
3.  **Persistence Layer**: Supabase handles relational data and session state, while a memory-backed store act as a circuit breaker for fault tolerance.
4.  **Integration Layer**: Tool abstractions for third-party services (Google, Twilio) include pre-validation guards to prevent non-deterministic agent outputs.

## Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **AI Engine**: DeepSeek-V3 / OpenAI (Native Function Calling)
*   **Database**: Supabase (PostgreSQL)
*   **Authentication**: Google OAuth 2.0 (for Calendar Sync)
*   **Communication**: Twilio SMS API
*   **Styling**: Vanilla CSS (Modular) with Premium Design Tokens

## Installation

### Prerequisites
*   Node.js 18.x or higher
*   Supabase Project
*   Google Cloud Console Project (with Calendar API enabled)

### Steps
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd mobile-detailing-agent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   Apply the migrations found in `/supabase/migrations` to your Supabase project.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration
Create a `.env.local` file in the root directory and populate it with the following keys:

```ini
# AI Provider
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
```

## Folder Structure
```text
├── app/
│   ├── api/            # Serverless Route Handlers (Orchestrator, Auth, Bookings)
│   ├── dashboard/      # Admin Management Interface
│   └── page.js         # Customer Landing Page
├── components/
│   ├── dashboard/      # Analytics, Bookings Table, Live Calendar Grid
│   └── ChatInterface/  # Agentic interaction UI
├── lib/
│   ├── ai-agent.js     # System Prompts & Agent Personality
│   ├── tools.js        # Executable definitions for Maya's tools
│   ├── calendar.js     # Google API Abstraction
│   └── supabase.js     # Data Access Layer & Resilience Logic
└── public/             # Static Assets
```

## Security & Scalability
*   **State Management**: Session data is serialized and stored on the server to prevent client-side manipulation.
*   **Tool Guarding**: Semantic validation in `lib/tools.js` prevents the LLM from executing invalid business logic.
*   **RLS Policies**: Supabase Row Level Security is configured to partition data between public interactions and management activities.
*   **Horizontal Scaling**: The stateless nature of the Route Handlers allows for seamless deployment on Vercel or Kubernetes environments.

## Performance
*   **Latency Mitigation**: Implementation of optimistic UI updates for chat and localized caching for calendar slots.
*   **Model Agnostic**: Easily switch between DeepSeek and OpenAI to optimize for cost or reasoning speed.

## License
MIT License - Developed by Advanced Agentic Systems Engineers.
