// src/app/api/whatsapp/send-message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappBot } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { number, message } = await request.json();

    if (!number || !message) {
      return NextResponse.json(
        { error: 'Number and message are required' },
        { status: 400 }
      );
    }

    await whatsappBot.sendMessage(number, message);

    return NextResponse.json({ 
      message: 'Message sent successfully',
      sentTo: number 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    
    let errorMessage = 'Failed to send message';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}