// src/app/api/whatsapp/commands/route.ts
// ✅ SIMPLIFIED VERSION - No circular calls, direct Laravel communication

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LARAVEL_API_URL = 'http://127.0.0.1:8000/api/whatsapp/commands';

// ✅ Simple axios client
const laravelApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/whatsapp',
  timeout: 8000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export async function GET() {
  try {
    console.log('[API] GET commands request');
    
    const response = await laravelApi.get('/commands');
    
    return NextResponse.json({ 
      commands: response.data.commands || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API] GET commands error:', error.message);
    
    let errorMessage = 'Failed to get commands';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Laravel server not reachable. Please check if Laravel is running on port 8000.';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = error.response.data?.error || error.message;
      statusCode = error.response.status;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST command request');
    const commandData = await request.json();
    
    // ✅ Direct call to Laravel, no bot reloading here
    const response = await laravelApi.post('/commands', {
      ...commandData,
      is_active: commandData.isActive
    });

    const newCommand = response.data.command;
    
    console.log(`[API] ✅ Command created: ${newCommand.trigger}`);

    return NextResponse.json({ 
      message: 'Command added successfully',
      command: newCommand,
      note: 'Command will be available within 10 seconds via auto-refresh',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API] POST command error:', error.message);
    
    let errorMessage = 'Failed to add command';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Laravel server not reachable';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = error.response.data?.error || error.message;
      statusCode = error.response.status;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[API] PUT command request');
    const { trigger, ...updates } = await request.json();
    
    // ✅ Direct call to Laravel, no bot reloading here
    const response = await laravelApi.put('/commands', {
      trigger,
      ...updates,
      is_active: updates.isActive
    });

    const updatedCommand = response.data.command;
    
    console.log(`[API] ✅ Command updated: ${updatedCommand.trigger}`);
    
    return NextResponse.json({ 
      message: 'Command updated successfully',
      command: updatedCommand,
      note: 'Changes will be available within 10 seconds via auto-refresh',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API] PUT command error:', error.message);
    
    let errorMessage = 'Failed to update command';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Laravel server not reachable';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = error.response.data?.error || error.message;
      statusCode = error.response.status;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('[API] DELETE command request');
    const { trigger } = await request.json();

    // ✅ Direct call to Laravel, no bot reloading here
    const response = await laravelApi.delete('/commands', {
      data: { trigger }
    });
    
    console.log(`[API] ✅ Command deleted: ${trigger}`);

    return NextResponse.json({ 
      message: 'Command deleted successfully',
      note: 'Changes will be available within 10 seconds via auto-refresh',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API] DELETE command error:', error.message);
    
    let errorMessage = 'Failed to delete command';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Laravel server not reachable';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = error.response.data?.error || error.message;
      statusCode = error.response.status;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}