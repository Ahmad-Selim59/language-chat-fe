import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { user_id, session_id, user_message } = body;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id,
                session_id,
                user_message,
            }),
        });

        const text = await res.text();
        return new NextResponse(text);
    } catch (error) {
        console.error('Proxy send failed', error);
        return new NextResponse('Error forwarding message', { status: 500 });
    }
}
