// src/app/api/socketio/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO handled by custom server on /api/socket',
    endpoint: '/api/socket'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use Socket.IO endpoint /api/socket for real-time communication' 
  });
}