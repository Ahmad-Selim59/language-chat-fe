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
        maxAge: 60 * 60 * 24 * 90, // 90 days
    });

    return response;
}
