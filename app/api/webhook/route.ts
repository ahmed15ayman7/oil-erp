import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'my_secure_token';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.log('❌ Webhook verification failed!');
        return new NextResponse('Verification failed', { status: 403 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    console.log('📩 Webhook Event Received:', JSON.stringify(body, null, 2));

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
