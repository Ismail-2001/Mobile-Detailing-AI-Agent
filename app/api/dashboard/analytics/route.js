import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    if (!supabaseAdmin) {
        return Response.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const [logsResult, inspectionsResult, bookingsCountResult, revenueResult, bookingData] = await Promise.all([
            supabaseAdmin.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(5),
            supabaseAdmin.from('usage_logs').select('id', { count: 'exact', head: true }).eq('event_type', 'tool_call'),
            supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('bookings').select('service_price').not('status', 'eq', 'cancelled'),
            supabaseAdmin.from('bookings').select('*').order('created_at', { ascending: false }),
        ]);

        // REVENUE INTEGRITY: Only sum bookings with a known service_price.
        // A null/zero price means the real price was never synced from the chat
        // session — treating it as $0 would silently undercount revenue.
        const revenue = revenueResult.data?.reduce((sum, b) => {
            if (b.service_price !== null && b.service_price > 0) {
                return sum + b.service_price;
            }
            return sum;
        }, 0) || 0;

        const revenueByDay = (bookingData.data || []).reduce((acc, b) => {
            if (!b.booking_date) return acc;
            const day = new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'short' });
            const existing = acc.find(d => d.day === day);
            const dayRevenue = (b.service_price !== null && b.service_price > 0) ? b.service_price : 0;
            if (existing) existing.revenue += dayRevenue;
            else acc.push({ day, revenue: dayRevenue });
            return acc;
        }, []);

        const serviceDistribution = (bookingData.data || []).reduce((acc, b) => {
            const existing = acc.find(s => s.name === b.service);
            if (existing) existing.value++;
            else acc.push({ name: b.service, value: 1 });
            return acc;
        }, []);

        return Response.json({
            logs: logsResult.data || [],
            stats: {
                revenue,
                inspections: inspectionsResult.count || 0,
                bookings: bookingsCountResult.count || 0,
            },
            revenueByDay,
            serviceDistribution,
            bookings: bookingData.data || [],
        }, {
            headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
        });
    } catch (error) {
        console.error('Analytics API error:', error.message);
        return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
