import { supabaseAdmin } from '@/lib/supabase-admin';

const SETTINGS_ID = 'business_settings';

const DEFAULT_SETTINGS = {
    business_name: 'Mr. Cleaner Mobile Detailing',
    location: 'Texas, USA',
    timezone: 'America/Chicago',
    twilio_phone: '+1 (507) 479-7804',
    whatsapp_number: '+1 (507) 479-7804',
    ai_personality: 'maya',
};

export async function GET() {
    if (!supabaseAdmin) {
        return Response.json({ settings: DEFAULT_SETTINGS });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('application_config')
            .select('data')
            .eq('id', SETTINGS_ID)
            .maybeSingle();

        if (error || !data?.data) {
            return Response.json({ settings: DEFAULT_SETTINGS });
        }

        return Response.json({ settings: { ...DEFAULT_SETTINGS, ...data.data } });
    } catch {
        return Response.json({ settings: DEFAULT_SETTINGS });
    }
}

export async function PUT(req) {
    if (!supabaseAdmin) {
        return Response.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return Response.json({ error: 'Invalid settings payload' }, { status: 400 });
        }

        const sanitized = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
            if (settings[key] !== undefined) {
                sanitized[key] = String(settings[key]).trim();
            }
        }

        const { error } = await supabaseAdmin.from('application_config').upsert({
            id: SETTINGS_ID,
            data: sanitized,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        if (error) {
            return Response.json({ error: 'Failed to save settings' }, { status: 500 });
        }

        return Response.json({ success: true, settings: sanitized });
    } catch (error) {
        console.error('Settings save error:', error.message);
        return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
}
