import { createBooking, getBookings } from '@/lib/supabase';
import { createCalendarEvent } from '@/lib/calendar';
import { triggerLeadAlerts } from '@/lib/twilio';
import { supabase } from '@/lib/supabase';

import { checkAvailability } from '@/lib/calendar';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
        const availability = await checkAvailability(date);
        return Response.json({ availability });
    }

    const { data, error } = await getBookings();
    if (error) return Response.json({ error }, { status: 500 });

    // Check if calendar is connected by verifying tokens exist
    let isCalendarConnected = false;
    try {
        const { data: config } = await supabase
            .from('application_config')
            .select('data')
            .eq('id', 'google_tokens')
            .single();
        isCalendarConnected = !!config;
    } catch (e) {
        console.error("Config check failed:", e);
    }

    return Response.json({
        bookings: data || [],
        isCalendarConnected
    });
}


export async function POST(req) {
    try {
        const bookingData = await req.json();
        console.log("Creating booking:", bookingData);

        // 1. Save to Database
        const { data, error } = await createBooking(bookingData);
        if (error) {
            console.error("DB Error:", error);
            return Response.json({ error }, { status: 500 });
        }

        // 2. Create Calendar Event
        console.log("Creating calendar event...");
        await createCalendarEvent(bookingData);

        // 3. Trigger Expert Dual Alerts (Owner + Client)
        console.log("Triggering lead alerts...");
        await triggerLeadAlerts(bookingData);

        return Response.json(data);
    } catch (error) {
        console.error("Booking POST Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

