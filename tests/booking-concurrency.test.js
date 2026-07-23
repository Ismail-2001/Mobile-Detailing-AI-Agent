import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase-admin
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
        from: vi.fn(() => ({
            insert: mockInsert,
            select: mockSelect,
            eq: mockEq,
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

// Mock tenant resolver
vi.mock('@/lib/tenant', () => ({
    resolveBusinessId: vi.fn().mockResolvedValue('00000000-0000-0000-0000-000000000001'),
    getBusinessConfig: vi.fn().mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000001',
        slug: 'mr-cleaner',
        name: 'Mr. Cleaner Mobile Detailing',
    }),
}));

import { createBooking } from '@/lib/supabase';

const BUSINESS_A_ID = '00000000-0000-0000-0000-000000000001';
const BUSINESS_B_ID = '00000000-0000-0000-0000-000000000002';

describe('multi-tenant booking slot uniqueness', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows two DIFFERENT businesses to book the same date+time slot', async () => {
        // Business A books successfully
        mockInsert.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                data: [{ id: 'booking-a-1', business_id: BUSINESS_A_ID }],
                error: null,
            }),
        });

        const bookingA = await createBooking({
            customer_name: 'Alice',
            phone: '+15550001111',
            vehicle_type: 'SUV',
            service: 'Executive Preservation',
            service_price: 150,
            booking_date: '2026-08-01',
            booking_time: '10:00:00',
        }, BUSINESS_A_ID);

        expect(bookingA.data).toBeTruthy();
        expect(bookingA.error).toBeNull();

        // Business B books the SAME slot — should succeed (different business)
        mockInsert.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                data: [{ id: 'booking-b-1', business_id: BUSINESS_B_ID }],
                error: null,
            }),
        });

        const bookingB = await createBooking({
            customer_name: 'Bob',
            phone: '+15550002222',
            vehicle_type: 'sedan',
            service: 'Executive Preservation',
            service_price: 120,
            booking_date: '2026-08-01',
            booking_time: '10:00:00',
        }, BUSINESS_B_ID);

        expect(bookingB.data).toBeTruthy();
        expect(bookingB.error).toBeNull();
    });

    it('still blocks the SAME business from double-booking the same slot', async () => {
        // First booking succeeds
        mockInsert.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                data: [{ id: 'booking-a-1', business_id: BUSINESS_A_ID }],
                error: null,
            }),
        });

        const booking1 = await createBooking({
            customer_name: 'Alice',
            phone: '+15550001111',
            vehicle_type: 'SUV',
            service: 'Executive Preservation',
            service_price: 150,
            booking_date: '2026-08-02',
            booking_time: '11:00:00',
        }, BUSINESS_A_ID);

        expect(booking1.data).toBeTruthy();

        // Second booking by SAME business at SAME time — should fail (unique constraint)
        mockInsert.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            }),
        });

        const booking2 = await createBooking({
            customer_name: 'Charlie',
            phone: '+15550003333',
            vehicle_type: 'truck',
            service: 'The Master Detail',
            service_price: 300,
            booking_date: '2026-08-02',
            booking_time: '11:00:00',
        }, BUSINESS_A_ID);

        expect(booking2.data).toBeNull();
        expect(booking2.error).toBeTruthy();
        expect(booking2.error.code).toBe('SLOT_TAKEN');
    });

    it('falls back to default business_id when none provided', async () => {
        mockInsert.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                data: [{ id: 'booking-default-1', business_id: BUSINESS_A_ID }],
                error: null,
            }),
        });

        const booking = await createBooking({
            customer_name: 'Default Customer',
            phone: '+15550004444',
            vehicle_type: 'sedan',
            service: 'Executive Preservation',
            service_price: 120,
            booking_date: '2026-08-03',
            booking_time: '09:00:00',
        });

        expect(booking.data).toBeTruthy();

        // Verify the insert was called with default business_id
        const insertCall = mockInsert.mock.calls[0][0];
        expect(insertCall[0].business_id).toBe(BUSINESS_A_ID);
    });
});

describe('buildSystemPrompt', () => {
    it('generates correct prompt with business data', async () => {
        const { buildSystemPrompt } = await import('@/lib/ai-agent');

        const business = {
            name: 'Test Business',
            location: 'Dallas, TX',
            phone: '+15550009999',
            timezone: 'America/Chicago',
            service_area: { zip_codes: ['75001', '75002'] },
            branding: { tagline: 'Best in Dallas' },
        };

        const prompt = buildSystemPrompt(business);
        expect(prompt).toContain('Test Business');
        expect(prompt).toContain('Dallas, TX');
        expect(prompt).toContain('+15550009999');
        expect(prompt).toContain('75001, 75002');
        expect(prompt).toContain('Best in Dallas');
    });

    it('uses defaults when business is empty', async () => {
        const { buildSystemPrompt } = await import('@/lib/ai-agent');

        const prompt = buildSystemPrompt({});
        expect(prompt).toContain('Mr. Cleaner Mobile Detailing');
        expect(prompt).toContain('Texas');
    });

    it('overrides take precedence over business data', async () => {
        const { buildSystemPrompt } = await import('@/lib/ai-agent');

        const business = {
            name: 'Original Business',
            location: 'Houston, TX',
        };

        const overrides = {
            business_name: 'Overridden Business',
        };

        const prompt = buildSystemPrompt(business, overrides);
        expect(prompt).toContain('Overridden Business');
        expect(prompt).toContain('Houston, TX');
    });

    it('backward-compatible generateMayaPrompt still works', async () => {
        const { generateMayaPrompt } = await import('@/lib/ai-agent');

        const prompt = generateMayaPrompt({ business_name: 'Legacy Test' });
        expect(prompt).toContain('Legacy Test');
    });
});

// ─── Category E1: Cross-Tenant Data Isolation ────────────────────────────────
// Two dummy businesses seed bookings. GET /api/bookings must never leak
// Business B's data when called with Business A's session (and vice versa).

describe('Category E1: cross-tenant booking isolation', () => {
    it('Business A GET returns only A bookings, not B', async () => {
        vi.clearAllMocks();

        const bookingsA = [
            { id: 'a-1', customer_name: 'Alice', business_id: BUSINESS_A_ID, booking_date: '2026-08-01' },
            { id: 'a-2', customer_name: 'Anita', business_id: BUSINESS_A_ID, booking_date: '2026-08-02' },
        ];
        const bookingsB = [
            { id: 'b-1', customer_name: 'Bob', business_id: BUSINESS_B_ID, booking_date: '2026-08-01' },
        ];

        // getBookings chain: from().select('*').order('created_at', {...}).eq('business_id', X)
        const mockOrderA = vi.fn().mockResolvedValue({ data: bookingsA, error: null });
        const mockOrderB = vi.fn().mockResolvedValue({ data: bookingsB, error: null });

        // After .order(), we get an object with .eq()
        const afterOrderA = { eq: vi.fn().mockResolvedValue({ data: bookingsA, error: null }) };
        const afterOrderB = { eq: vi.fn().mockResolvedValue({ data: bookingsB, error: null }) };

        // .order() is called on the select result, returns promise directly
        // But getBookings does: query = query.eq(...) AFTER order, so the chain is:
        // from().select('*').order(...) → then optionally .eq()
        // Actually looking at the code more carefully:
        // let query = db.from('bookings').select('*').order('created_at', { ascending: false });
        // if (businessId) { query = query.eq('business_id', businessId); }
        // So .order() returns an object with .eq() on it

        const mockEqA = vi.fn().mockResolvedValue({ data: bookingsA, error: null });
        const mockEqB = vi.fn().mockResolvedValue({ data: bookingsB, error: null });

        // .select('*').order() returns { eq: fn }
        const selectA = vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ eq: mockEqA }),
        });
        const selectB = vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ eq: mockEqB }),
        });

        const fromFn = vi.fn()
            .mockReturnValueOnce({ select: selectA })
            .mockReturnValueOnce({ select: selectB });

        const sa = (await import('@/lib/supabase-admin')).supabaseAdmin;
        sa.from.mockImplementation(fromFn);

        const { getBookings } = await import('@/lib/supabase');

        const resultA = await getBookings(BUSINESS_A_ID);
        const resultB = await getBookings(BUSINESS_B_ID);

        // Business A sees only its bookings
        expect(resultA.data).toHaveLength(2);
        expect(resultA.data.every(b => b.business_id === BUSINESS_A_ID)).toBe(true);

        // Business B sees only its bookings
        expect(resultB.data).toHaveLength(1);
        expect(resultB.data[0].business_id).toBe(BUSINESS_B_ID);
    });

    it('getBookings without businessId returns all (no eq filter)', async () => {
        vi.clearAllMocks();

        const allBookings = [
            { id: 'a-1', business_id: BUSINESS_A_ID },
            { id: 'b-1', business_id: BUSINESS_B_ID },
        ];

        // from().select('*').order() — no .eq() called
        const mockOrder = vi.fn().mockResolvedValue({ data: allBookings, error: null });
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

        const sa = (await import('@/lib/supabase-admin')).supabaseAdmin;
        sa.from.mockReturnValue({ select: mockSelect });

        const { getBookings } = await import('@/lib/supabase');
        const result = await getBookings();

        expect(result.data).toHaveLength(2);
        expect(mockSelect).toHaveBeenCalledWith('*');
    });
});
