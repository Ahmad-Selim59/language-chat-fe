import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => {
        const [key, ...v] = c.split('=');
        return [key, decodeURIComponent(v.join('='))];
    }));

    const userId = cookies['userId'] ?? null;

    return NextResponse.json({ userId });
}
