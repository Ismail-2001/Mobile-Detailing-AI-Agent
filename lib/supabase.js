import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Memory store acts as a high-availability fallback
const memoryStore = {
    bookings: [
        {
            id: '1',
            customer_name: 'John Smith (Local)',
            phone: '555-0123',
            vehicle_type: 'SUV',
            service: 'Premium Detail',
            service_price: 225,
            booking_date: '2026-02-16',
            booking_time: '08:00 AM',
            address: '123 Austin Way, Dallas, TX',
            status: 'confirmed',
            created_at: new Date().toISOString()
        }
    ]
};

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export async function createBooking(bookingData) {
    if (supabase) {
        console.log("Saving booking to Supabase Project: bdtrqiauxszcnzklunxz");
        const scheduledAt = new Date(`${bookingData.date || bookingData.booking_date} ${bookingData.time || bookingData.booking_time}`).toISOString();

        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                customer_name: bookingData.customer_name,
                phone: bookingData.phone,
                vehicle_type: bookingData.vehicle_type,
                service: bookingData.service,
                service_price: bookingData.service_price || bookingData.price,
                scheduled_at: scheduledAt,
                address: bookingData.address,
                zip_code: bookingData.zip || bookingData.zip_code,
                status: 'pending'
            }])
            .select();


        if (!error) return { data, error: null };
        console.error("Supabase Error, falling back to local memory:", error);
    }

    // Fallback to memory store
    const newBooking = { id: 'local-' + Math.random().toString(36).substr(2, 9), ...bookingData, created_at: new Date().toISOString(), status: 'pending' };
    memoryStore.bookings.unshift(newBooking);
    return { data: [newBooking], error: null };
}

export async function getBookings() {
    if (supabase) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) return { data, error: null };
        console.error("Supabase Fetch Error, falling back to local memory:", error);
    }

    return { data: memoryStore.bookings, error: null };
}
