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
