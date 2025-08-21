// src/app/api/whatsapp/sync-commands/route.ts
// ✅ SIMPLIFIED - Manual sync trigger only, no automatic calls

import { NextRequest, NextResponse } from 'next/server';
import { whatsappBot } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC] 🔄 Manual sync requested');
    
    // ✅ Simple reload with timeout
    const success = await Promise.race([
      whatsappBot.reloadCommands(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 15000)
      )
    ]);
    
    const commands = whatsappBot.getCommands();
    const status = whatsappBot.getStatus();
    
    console.log(`[SYNC] ${success ? '✅' : '❌'} Sync result: ${success}, Commands: ${commands.length}`);

    return NextResponse.json({ 
      success: !!success,
      message: success ? 'Commands synced successfully' : 'Failed to sync commands',
      commandCount: commands.length,
      botConnected: status.isConnected,
      timestamp: new Date().toISOString()
    }, { 
      status: success ? 200 : 500
    });
    
  } catch (error: any) {
    console.error('[SYNC] ❌ Sync error:', error.message);
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const commands = whatsappBot.getCommands();
    const status = whatsappBot.getStatus();
    
    return NextResponse.json({
      status: 'ok',
      botStatus: {
        isConnected: status.isConnected,
        hasClient: !!status.clientInfo,
        lastSeen: status.lastSeen,
        // clientNumber: status.clientInfo?.number
      },
      commandCount: commands.length,
      commands: commands.map(cmd => ({
        trigger: cmd.trigger,
        isActive: cmd.isActive
      })),
      autoRefreshEnabled: true,
      refreshInterval: '10 seconds',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[SYNC] ❌ Status error:', error.message);
    
    return NextResponse.json({ 
      error: 'Failed to get bot status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}