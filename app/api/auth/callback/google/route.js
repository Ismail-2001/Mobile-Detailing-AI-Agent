import { handleAuthCallback } from '@/lib/calendar';
import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        await handleAuthCallback(code);
        return new Response('Authentication successful! You can close this window.', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (error) {
        console.error('Auth Callback Route Error:', error);
        return new Response(`Authentication Failed: ${error.message}. Please check your server logs.`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
