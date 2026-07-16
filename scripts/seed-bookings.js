import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('Run: node --env-file=.env.local scripts/seed-bookings.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_BOOKINGS = [
    {
        customer_name: 'Marcus Thompson',
        phone: '+1 (512) 555-0142',
        vehicle_type: 'SUV',
        service: 'Executive Preservation',
        service_price: 150,
        booking_date: '2026-07-18',
        booking_time: '08:00:00',
        address: '1200 Congress Ave, Austin, TX 78701',
        zip_code: '78701',
        status: 'confirmed',
        notes: 'Demo booking — referred by Google listing',
    },
    {
        customer_name: 'Jennifer Reyes',
        phone: '+1 (512) 555-0187',
        vehicle_type: 'sedan',
        service: 'The Master Detail',
        service_price: 250,
        booking_date: '2026-07-19',
        booking_time: '11:00:00',
        address: '4501 Duval St, Austin, TX 78751',
        zip_code: '78751',
        status: 'confirmed',
        notes: 'Demo booking — returning customer',
    },
    {
        customer_name: 'David Chen',
        phone: '+1 (737) 555-0234',
        vehicle_type: 'large SUV',
        service: 'Signature Ceramic',
        service_price: 650,
        booking_date: '2026-07-20',
        booking_time: '08:00:00',
        address: '8701 Research Blvd, Austin, TX 78758',
        zip_code: '78758',
        status: 'pending',
        notes: 'Demo booking — new luxury SUV',
    },
    {
        customer_name: 'Ashley Martinez',
        phone: '+1 (512) 555-0098',
        vehicle_type: 'truck',
        service: 'Executive Preservation',
        service_price: 150,
        booking_date: '2026-07-21',
        booking_time: '14:00:00',
        address: '2304 Lake Austin Blvd, Austin, TX 78703',
        zip_code: '78703',
        status: 'pending',
        notes: 'Demo booking — F-150 pickup',
    },
    {
        customer_name: 'Robert Kim',
        phone: '+1 (512) 555-0321',
        vehicle_type: 'SUV',
        service: 'The Master Detail',
        service_price: 300,
        booking_date: '2026-07-22',
        booking_time: '08:00:00',
        address: '6800 Bee Caves Rd, Austin, TX 78746',
        zip_code: '78746',
        status: 'confirmed',
        notes: 'Demo booking — weekend detail',
    },
    {
        customer_name: 'Sofia Patel',
        phone: '+1 (737) 555-0456',
        vehicle_type: 'sedan',
        service: 'Executive Preservation',
        service_price: 120,
        booking_date: '2026-07-23',
        booking_time: '11:00:00',
        address: '3001 S Congress Ave, Austin, TX 78704',
        zip_code: '78704',
        status: 'pending',
        notes: 'Demo booking — first-time customer',
    },
];

async function seed() {
    console.log('Seeding demo bookings...\n');

    for (const booking of DEMO_BOOKINGS) {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                ...booking,
                sms_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select('id, customer_name, booking_date, booking_time, status');

        if (error) {
            console.error(`  FAILED: ${booking.customer_name} (${booking.booking_date} ${booking.booking_time})`);
            console.error(`  Error: ${error.message}\n`);
        } else {
            console.log(`  INSERTED: ${booking.customer_name} — ${booking.service} on ${booking.booking_date} at ${booking.booking_time} [${booking.status}]`);
        }
    }

    console.log('\nDone. Bookings seeded successfully.');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});
