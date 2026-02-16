import { z } from 'zod';
import { checkAvailability } from './calendar';

import { supabase } from './supabase';

// --- KNOWLEDGE BASE (Dynamic with Resilient Fallback) ---
const FALLBACK_KNOWLEDGE = {
    pricing: {
        'Executive Preservation': { sedan: 120, SUV: 150, truck: 150, 'large SUV': 180 },
        'The Master Detail': { sedan: 250, SUV: 300, truck: 300, 'large SUV': 350 },
        'Signature Ceramic': { sedan: 450, SUV: 550, truck: 550, 'large SUV': 650 }
    },
    policies: {
        cancellation: "Free cancellation with 24h notice. 50% charge for late cancellations.",
        hours: "Monday-Saturday: 8 AM - 6 PM (Sunday Closed)",
        payment: "Accepted: Cash, Zelle, Venmo.",
        advance_booking: "Minimum 24-hour advance booking required."
    }
};

async function getKnowledge(topic) {
    if (!supabase) return topic === 'all' ? FALLBACK_KNOWLEDGE : FALLBACK_KNOWLEDGE[topic];

    try {
        if (topic === 'all') {
            const { data } = await supabase.from('business_knowledge').select('*');
            if (!data || data.length === 0) return FALLBACK_KNOWLEDGE;
            return data.reduce((acc, item) => ({ ...acc, [item.id]: item.content }), {});
        }

        const { data, error } = await supabase
            .from('business_knowledge')
            .select('content')
            .eq('id', topic)
            .single();

        if (error || !data) {
            console.warn(`Knowledge lookup failed for ${topic}, using fallback.`);
            return FALLBACK_KNOWLEDGE[topic];
        }
        return data.content;
    } catch (e) {
        return topic === 'all' ? FALLBACK_KNOWLEDGE : FALLBACK_KNOWLEDGE[topic];
    }
}

// --- SCHEMAS (ZOD GUARDRAILS) ---
// Strict validation prevents the LLM from sending malformed or malicious data.
const GetAvailabilitySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
});

const CalculateQuoteSchema = z.object({
    service: z.enum(['Executive Preservation', 'The Master Detail', 'Signature Ceramic']),
    vehicle_type: z.enum(['sedan', 'SUV', 'truck', 'large SUV'])
});

const QueryKnowledgeSchema = z.object({
    topic: z.enum(['pricing', 'policies', 'all'])
});

const SyncBookingSchema = z.object({
    customer_name: z.string().optional(),
    phone: z.string().optional(),
    vehicle_type: z.string().optional(),
    service: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    address: z.string().optional(),
    price: z.number().optional(),
    status: z.enum(['inquiring', 'qualified', 'confirmed']).optional()
});

export const MAYA_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_availability',
            description: 'Check available time slots for a specific date.',
            parameters: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'YYYY-MM-DD' }
                },
                required: ['date']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'calculate_quote',
            description: 'Calculate price for a service.',
            parameters: {
                type: 'object',
                properties: {
                    service: { type: 'string', enum: ['Executive Preservation', 'The Master Detail', 'Signature Ceramic'] },
                    vehicle_type: { type: 'string', enum: ['sedan', 'SUV', 'truck', 'large SUV'] }
                },
                required: ['service', 'vehicle_type']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'query_knowledge',
            description: 'Get internal business info on pricing or policies.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', enum: ['pricing', 'policies', 'all'] }
                },
                required: ['topic']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'sync_booking_state',
            description: 'Update customer data gathered during chat.',
            parameters: {
                type: 'object',
                properties: {
                    customer_name: { type: 'string' },
                    phone: { type: 'string' },
                    vehicle_type: { type: 'string' },
                    service: { type: 'string' },
                    date: { type: 'string' },
                    time: { type: 'string' },
                    address: { type: 'string' },
                    price: { type: 'number' },
                    status: { type: 'string', enum: ['inquiring', 'qualified', 'confirmed'] }
                }
            }
        }
    }
];

export async function executeTool(name, args) {
    console.log(`[Agent Tool Execution] ${name}`, args);

    try {
        switch (name) {
            case 'get_availability': {
                const validated = GetAvailabilitySchema.parse(args);
                const inputDate = new Date(validated.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (isNaN(inputDate.getTime()) || inputDate < today) {
                    return JSON.stringify({
                        error: "Invalid date. Appointments must be today or in the future."
                    });
                }

                const slots = await checkAvailability(validated.date);
                return JSON.stringify({ date: validated.date, slots });
            }

            case 'calculate_quote': {
                const validated = CalculateQuoteSchema.parse(args);
                const pricing = await getKnowledge('pricing');
                const price = pricing[validated.service][validated.vehicle_type];
                return JSON.stringify({ price, currency: 'USD' });
            }

            case 'query_knowledge': {
                const validated = QueryKnowledgeSchema.parse(args);
                const content = await getKnowledge(validated.topic);
                return JSON.stringify(content);
            }

            case 'sync_booking_state': {
                const validated = SyncBookingSchema.parse(args);
                if (validated.phone && !/^\+?[1-9]\d{1,14}$/.test(validated.phone.replace(/[\s-()]/g, ''))) {
                    console.warn("Invalid phone sync attempt:", validated.phone);
                }
                return JSON.stringify({ status: 'synced', data: validated });
            }

            default:
                return JSON.stringify({ error: 'Tool not found' });
        }
    } catch (error) {
        console.error(`Tool Validation Error (${name}):`, error);
        return JSON.stringify({
            error: "Schema validation failed. Check your arguments.",
            details: error.errors || error.message
        });
    }
}
