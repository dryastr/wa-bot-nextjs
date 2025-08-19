// src/app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappBot } from '@/lib/whatsapp';

export async function GET() {
  try {
    const status = whatsappBot.getStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'initialize':
        await whatsappBot.initialize();
        return NextResponse.json({ message: 'WhatsApp bot initialized' });

      case 'disconnect':
        await whatsappBot.disconnect();
        return NextResponse.json({ message: 'WhatsApp bot disconnected' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing WhatsApp action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}