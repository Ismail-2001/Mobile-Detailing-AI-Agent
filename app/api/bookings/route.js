import { createBooking, getBookings } from '@/lib/supabase';
import { createCalendarEvent } from '@/lib/calendar';
import { triggerLeadAlerts } from '@/lib/twilio';

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
    return Response.json(data);
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

