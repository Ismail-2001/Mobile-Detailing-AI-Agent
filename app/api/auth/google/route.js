import { getAuthUrl } from '@/lib/calendar';
import { redirect } from 'next/navigation';

export async function GET() {
    const url = getAuthUrl();
    return redirect(url);
}
