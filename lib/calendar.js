import { google } from 'googleapis';
import { supabase } from './supabase';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// --- AUTH TOKEN DRIFT FIX ---
// Listen for token refreshes and persist them to Supabase automatically
oauth2Client.on('tokens', async (tokens) => {
    console.log("Google tokens refreshed. Polling persistence...");
    if (supabase) {
        const { error } = await supabase.from('application_config').upsert({
            id: 'google_tokens',
            data: tokens,
            updated_at: new Date().toISOString()
        });
        if (error) console.error("Failed to persist refreshed tokens:", error);
        else console.log("Refreshed tokens persisted to Supabase.");
    }
});


async function getStoredTokens() {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('application_config')
        .select('data')
        .eq('id', 'google_tokens')
        .single();

    return data ? data.data : null;
}

const TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Chicago';

export async function checkAvailability(date, requestedDuration = 120) {
    const tokens = await getStoredTokens();
    if (!tokens) {
        console.warn("No Google Calendar tokens found. Using mock availability.");
        return [
            { time: '8:00 AM', status: 'available' },
            { time: '11:00 AM', status: 'available' },
            { time: '2:00 PM', status: 'available' }
        ];
    }

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const startOfDay = new Date(date + ' 08:00:00');
        const endOfDay = new Date(date + ' 18:00:00');

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];
        const busyTimes = events.map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date)
        }));

        // Generate dynamic slots every 30 mins
        const availableSlots = [];
        let currentSlot = new Date(startOfDay);

        while (currentSlot.getTime() + (requestedDuration * 60000) <= endOfDay.getTime()) {
            const slotEnd = new Date(currentSlot.getTime() + (requestedDuration * 60000));

            const isOverlap = busyTimes.some(busy => {
                return (currentSlot < busy.end && slotEnd > busy.start);
            });

            if (!isOverlap) {
                availableSlots.push({
                    time: currentSlot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    status: 'available'
                });
            }

            // Increment by 60 mins to keep choices concise but flexible
            currentSlot.setMinutes(currentSlot.getMinutes() + 60);
        }

        return availableSlots;
    } catch (error) {
        console.error("Calendar API Error:", error);
        return [];
    }
}

export async function createCalendarEvent(booking) {
    const tokens = await getStoredTokens();
    if (!tokens) {
        console.log("Mocking calendar event (no tokens).");
        return { success: true };
    }

    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(booking.booking_date + ' ' + booking.booking_time);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hour default

    const event = {
        summary: `${booking.service} - ${booking.customer_name}`,
        location: booking.address,
        description: `Vehicle: ${booking.vehicle_type}\nPhone: ${booking.phone}\nPrice: $${booking.service_price}`,
        start: { dateTime: startDateTime.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: endDateTime.toISOString(), timeZone: TIMEZONE },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return { success: true, eventId: response.data.id };
    } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, error };
    }
}

export function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
        prompt: 'consent'
    });
}

export async function handleAuthCallback(code) {
    try {
        console.log("Exchanging code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received successfully.");

        if (supabase) {
            console.log("Storing tokens in Supabase...");
            const { error } = await supabase.from('application_config').upsert({
                id: 'google_tokens',
                data: tokens,
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error("Supabase storage error:", error);
                throw new Error("Failed to store tokens in database: " + error.message);
            }
            console.log("Tokens stored in Supabase.");
        } else {
            console.warn("Supabase client not initialized. Tokens not stored.");
        }

        return tokens;
    } catch (error) {
        console.error("Authentication Callback Error Details:", error);
        throw error;
    }
}
