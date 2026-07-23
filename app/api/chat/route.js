import * as Sentry from '@sentry/nextjs';
import { OpenAI } from 'openai';
import { buildSystemPrompt } from '@/lib/ai-agent';
import { MAYA_TOOLS, executeTool } from '@/lib/tools';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, checkChatIpRateLimit } from '@/lib/rate-limit';
import { validateBody, ChatRequestSchema } from '@/lib/api-validation';
import { redactToolArgs } from '@/lib/pii-redact';
import { withTimeout, DEFAULT_TIMEOUT_MS } from '@/lib/timeout';
import { resolveBusinessId, getBusinessConfig } from '@/lib/tenant';

const SESSION_COOKIE_NAME = 'chat_session_id';
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

/**
 * AI CLIENT SETUP:
 * Supports Gemini (primary), DeepSeek, and OpenAI as fallbacks.
 * Gemini uses OpenAI-compatible API format via @google/generative-ai endpoint.
 *
 * WHY GEMINI:
 * - Free tier available (15 RPM, 1M tokens/day)
 * - Tool calling support (function calling)
 * - Works in Pakistan (no regional restrictions)
 */
const gemini = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'dummy',
    baseURL: 'https://api.deepseek.com',
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

const hasGemini = !!process.env.GEMINI_API_KEY;
const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasAnyAI = hasGemini || hasDeepSeek || hasOpenAI;

async function logEvent(sessionId, type, payload, requestId) {
    if (supabaseAdmin) {
        supabaseAdmin.from('usage_logs').insert([{
            session_id: sessionId,
            event_type: type,
            payload: { ...payload, request_id: requestId }
        }]).catch(err => {
            console.error(`[${requestId}] Log event failed:`, err.message);
        });
    }
}

export async function POST(req) {
    const requestId = crypto.randomUUID();

    // SESSION ID: Server-generated to prevent spoofing. A malicious client
    // previously could read another customer's data by guessing their session ID.
    // Now: (1) read from cookie, (2) if absent, generate one and set cookie,
    // (3) validate format to prevent injection.
    const cookieSessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const headerSessionId = req.headers.get('x-session-id');
    const rawSessionId = cookieSessionId || headerSessionId || 'anonymous';

    let sessionId;
    let isNewSession = false;

    if (rawSessionId === 'anonymous' || !rawSessionId) {
        // First visit — generate server-side session ID
        sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
        isNewSession = true;
    } else {
        // Validate format — reject tampered IDs
        sessionId = SESSION_ID_REGEX.test(rawSessionId) ? rawSessionId : 'anonymous';
    }

    // RATE LIMITING: Reject requests exceeding 20 per minute per session.
    const rateLimit = checkRateLimit(sessionId);
    if (rateLimit) {
        console.log(`[${requestId}] Rate limited session=${sessionId}`);
        return Response.json(
            { error: { code: 'RATE_LIMITED', message: `Try again in ${rateLimit.retryAfterSec}s.` } },
            { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSec) } }
        );
    }

    // IP-BASED BACKSTOP: 100 req/min per IP regardless of session ID.
    // Prevents session-ID-rotation attacks that bypass the per-session limit.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || '127.0.0.1';
    const ipRateLimit = checkChatIpRateLimit(ip);
    if (ipRateLimit) {
        console.log(`[${requestId}] IP rate limited ip=${ip}`);
        return Response.json(
            { error: { code: 'IP_RATE_LIMITED', message: `Too many requests from this IP. Try again in ${ipRateLimit.retryAfterSec}s.` } },
            { status: 429, headers: { 'Retry-After': String(ipRateLimit.retryAfterSec) } }
        );
    }

    try {
        // REQUEST VALIDATION: Reject oversized or malformed payloads before
        // they reach the LLM or business logic. A malicious client could send
        // a 10,000-message array to burn API credits.
        const body = await req.json();
        const validation = validateBody(ChatRequestSchema, body);
        if (!validation.success) {
            console.log(`[${requestId}] Validation failed:`, validation.data || 'invalid body');
            return validation.response;
        }
        const { messages: currentMessages } = validation.data;

        if (!hasAnyAI) {
            return Response.json({
                role: 'assistant',
                content: "Maya's AI engine is currently in simulation mode. Connect a Gemini API key to enable full autonomy.",
                mock: true
            });
        }

        // --- ORCHESTRATION LOOP ---
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // MULTI-TENANT: Resolve which business this request belongs to.
        const businessId = await resolveBusinessId(req);

        // Load business config from Supabase for dynamic prompt templating.
        // Falls back to env vars if business doesn't exist yet.
        const business = await getBusinessConfig(businessId);
        const businessOverrides = {};

        if (business?.knowledge?.service_area) {
            businessOverrides.service_area_zips = business.knowledge.service_area.zip_codes || [];
        }

        const systemPrompt = buildSystemPrompt(business || {}, businessOverrides);

        const apiMessages = [
            {
                role: "system",
                content: `${systemPrompt}\n\n# CONTEXT\nToday is ${currentDate}. Use this to calculate relative dates like 'tomorrow' or 'next week'.`
            },
            ...currentMessages
        ];

        let bookingData = null;

        // BOOKING DATA PERSISTENCE FIX: Load previously collected booking data
        // from Supabase so multi-turn conversations don't lose progress.
        if (supabaseAdmin && sessionId !== 'anonymous') {
            const { data: existingSession } = await supabaseAdmin
                .from('chat_sessions')
                .select('customer_data')
                .eq('session_id', sessionId)
                .maybeSingle();
            if (existingSession?.customer_data) {
                bookingData = { ...existingSession.customer_data };
            }
        }

        // MODEL FAILOVER: Try providers in priority order (Gemini > DeepSeek > OpenAI).
        // If one is down at runtime, fall back to the next instead of failing the request.
        const availableModels = [];
        if (hasGemini) availableModels.push({ model: "gemini-2.0-flash", client: gemini });
        if (hasDeepSeek) availableModels.push({ model: "deepseek-chat", client: deepseek });
        if (hasOpenAI) availableModels.push({ model: "gpt-4o", client: openai });

        let iteration = 0;
        const maxIterations = 5;

        while (iteration < maxIterations) {
            console.log(`[${requestId}] Iteration ${iteration + 1}/${maxIterations}`);

            let response = null;
            let lastError = null;
            for (const { model, client } of availableModels) {
                try {
                    response = await withTimeout(
                        client.chat.completions.create({
                            model: model,
                            messages: apiMessages,
                            tools: MAYA_TOOLS,
                            tool_choice: 'auto',
                        }),
                        DEFAULT_TIMEOUT_MS,
                        `AI ${model}`
                    );
                    console.log(`[${requestId}] Model ${model} succeeded`);
                    break;
                } catch (err) {
                    lastError = err;
                    console.warn(`[${requestId}] Model ${model} failed: ${err.message}, trying next...`);
                }
            }

            if (!response) {
                throw lastError || new Error("No AI models available");
            }

            const assistantMessage = response.choices[0].message;
            apiMessages.push(assistantMessage);

            if (!assistantMessage.tool_calls) {
                // Final response reached
                if (supabaseAdmin && sessionId !== 'anonymous') {
                    await supabaseAdmin.from('chat_sessions').upsert({
                        session_id: sessionId,
                        customer_data: bookingData,
                        message_history: apiMessages.filter(m => m.role !== 'system'),
                        last_active: new Date().toISOString()
                    });
                }

                logEvent(sessionId, 'chat_message', { content: assistantMessage.content }, requestId);

                const responseData = {
                    role: 'assistant',
                    content: assistantMessage.content,
                    bookingData,
                    session_id: sessionId,
                };

                // Set session cookie on first response so client can read it
                const isProduction = process.env.NODE_ENV === 'production';
                const cookieParts = [
                    `${SESSION_COOKIE_NAME}=${sessionId}`,
                    'Path=/',
                    'HttpOnly',
                    'SameSite=Lax',
                    'Max-Age=2592000', // 30 days
                ];
                if (isProduction) cookieParts.push('Secure');

                return Response.json(responseData, {
                    headers: { 'Set-Cookie': cookieParts.join('; ') },
                });
            }

            // Execute tools safely
            for (const toolCall of assistantMessage.tool_calls) {
                const name = toolCall.function.name;
                let result;

                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    result = await executeTool(name, args, businessId);

                    if (name === 'sync_booking_state') {
                        // DATA INTEGRITY: Merge from the validated result, not raw args.
                        // The raw args may contain unnormalized data (e.g., unformatted
                        // phone) or be rejected entirely (invalid phone). Only merge
                        // when executeTool returned 'synced', never on error.
                        const parsedResult = JSON.parse(result);
                        if (parsedResult.status === 'synced' && parsedResult.data) {
                            bookingData = { ...bookingData, ...parsedResult.data };
                        }
                    }
                    // PII REDACTION: Strip customer names, phones, addresses from logs
                    logEvent(sessionId, 'tool_call', { tool: name, args: redactToolArgs(args), result: redactToolArgs(result) }, requestId);
                } catch (e) {
                    console.error(`[${requestId}] Tool Error [${name}]:`, e.message);
                    result = JSON.stringify({ error: "Failed to process tool request" });
                }

                apiMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result
                });
            }

            iteration++;
        }

        // MAX ITERATIONS SAFEGUARD: If Maya hits the loop cap without producing
        // a final response, return a graceful fallback instead of crashing.
        console.error(JSON.stringify({
            code: 'MAX_ITERATIONS_EXCEEDED',
            sessionId,
            requestId,
            iterationCount: maxIterations,
            timestamp: new Date().toISOString()
        }));

        // Persist partial bookingData so the customer doesn't lose their progress
        if (supabaseAdmin && sessionId !== 'anonymous') {
            await supabaseAdmin.from('chat_sessions').upsert({
                session_id: sessionId,
                customer_data: bookingData,
                message_history: apiMessages.filter(m => m.role !== 'system'),
                last_active: new Date().toISOString()
            });
        }

        return Response.json({
            role: 'assistant',
            content: "This conversation is taking longer than expected. Let me have our team follow up with you directly to make sure everything is perfect.",
            bookingData,
            session_id: sessionId,
            error: { code: 'MAX_ITERATIONS_EXCEEDED', request_id: requestId }
        });

    } catch (error) {
        console.error(`[${requestId}] Critical Orchestrator Error:`, JSON.stringify({
            error: error.message,
            sessionId,
            requestId,
            timestamp: new Date().toISOString()
        }));
        Sentry.captureException(error, { tags: { route: 'chat', code: 'ORCHESTRATOR_ERROR', requestId, sessionId } });
        return Response.json({
            role: 'assistant',
            content: "I'm having a little trouble orchestrating my tools. Please try again or reach out to us directly!",
            error: { code: 'ORCHESTRATOR_ERROR', request_id: requestId }
        }, { status: 500 });
    }
}
