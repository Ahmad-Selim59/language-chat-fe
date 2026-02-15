import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { userId } = await request.json();

    const response = NextResponse.json({ success: true });

    response.cookies.set({
        name: 'userId',
        value: userId,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        // No maxAge means it's a session cookie, but to make it "permanent" 
        // until logout, we'll set a very long duration (10 years)
        maxAge: 60 * 60 * 24 * 365 * 10, 
    });

    return response;
}
