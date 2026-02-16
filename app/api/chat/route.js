import { OpenAI } from 'openai';
import { MAYA_SYSTEM_PROMPT } from '@/lib/ai-agent';
import { MAYA_TOOLS, executeTool } from '@/lib/tools';
import { supabase } from '@/lib/supabase';

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : undefined;

const openai = new OpenAI({
    apiKey: apiKey || 'dummy-key',
    baseURL: baseURL,
});

async function logEvent(sessionId, type, payload) {
    if (supabase) {
        await supabase.from('usage_logs').insert([{
            session_id: sessionId,
            event_type: type,
            payload
        }]);
    }
}

export async function POST(req) {
    const sessionId = req.headers.get('x-session-id') || 'anonymous';

    try {
        const { messages: currentMessages } = await req.json();

        if (!apiKey) {
            return Response.json({
                role: 'assistant',
                content: "Maya's AI engine is currently in simulation mode. Connect an API key to enable full autonomy.",
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

        let apiMessages = [
            {
                role: "system",
                content: `${MAYA_SYSTEM_PROMPT}\n\n# CONTEXT\nToday is ${currentDate}. Use this to calculate relative dates like 'tomorrow' or 'next week'.`
            },
            ...currentMessages
        ];


        let bookingData = null;
        let iteration = 0;
        const maxIterations = 5;

        while (iteration < maxIterations) {
            // Check for images to decide on vision model
            const hasImages = apiMessages.some(m =>
                Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
            );

            const model = hasImages
                ? "gpt-4o" // Force vision model
                : (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o");

            const response = await openai.chat.completions.create({
                model: model,
                messages: apiMessages,
                tools: MAYA_TOOLS,
                tool_choice: 'auto',
            });

            const assistantMessage = response.choices[0].message;
            apiMessages.push(assistantMessage);

            if (!assistantMessage.tool_calls) {
                // Final response reached
                // PERSIST: Update session history and data in Supabase
                if (supabase && sessionId !== 'anonymous') {
                    await supabase.from('chat_sessions').upsert({
                        session_id: sessionId,
                        customer_data: bookingData,
                        message_history: apiMessages.filter(m => m.role !== 'system'),
                        last_active: new Date().toISOString()
                    });
                }

                await logEvent(sessionId, 'chat_message', { content: assistantMessage.content });
                return Response.json({
                    role: 'assistant',
                    content: assistantMessage.content,
                    bookingData
                });
            }

            // Execute tools safely
            for (const toolCall of assistantMessage.tool_calls) {
                const name = toolCall.function.name;
                let result;

                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    result = await executeTool(name, args);

                    if (name === 'sync_booking_state') {
                        bookingData = { ...bookingData, ...args };
                    }
                    await logEvent(sessionId, 'tool_call', { tool: name, args, result });
                } catch (e) {
                    console.error(`Tool Execution Error [${name}]:`, e);
                    result = JSON.stringify({ error: "Failed to process tool request", details: e.message });
                }

                apiMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result
                });
            }

            iteration++;
        }

        throw new Error("Maximum agent iterations exceeded");

    } catch (error) {
        console.error("Critical Orchestrator Error:", error);
        return Response.json({
            role: 'assistant',
            content: "I'm having a little trouble orchestrating my tools. Please try again or reach out to us directly!"
        }, { status: 500 });
    }
}
