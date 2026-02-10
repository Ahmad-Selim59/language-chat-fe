import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { user_id, session_id, user_message, settings } = body;

    try {
        const payload = {
            user_id,
            session_id,
            user_message,
            settings,
        };
        console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Backend error response:', errorText);
            return new NextResponse(JSON.stringify({ error: `Backend error: ${res.status}`, details: errorText }), { 
                status: res.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy send failed', error);
        return new NextResponse(JSON.stringify({ error: 'Error forwarding message' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
