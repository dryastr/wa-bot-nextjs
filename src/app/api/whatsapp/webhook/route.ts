// src/app/api/whatsapp/webhook/route.ts
// ✅ FIXED - Better webhook handling dengan immediate sync

import { NextRequest, NextResponse } from 'next/server';
import { whatsappBot } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    console.log('[WEBHOOK] 📨 Received webhook from Laravel');
    
    const body = await request.json();
    const { action, source, data, timestamp } = body;
    
    console.log('[WEBHOOK] Webhook data:', { 
      action, 
      source, 
      trigger: data?.trigger,
      action_type: data?.action_type,
      timestamp 
    });
    
    // ✅ Handle commands_changed dari Laravel
    if (action === 'commands_changed' && source === 'laravel') {
      console.log('[WEBHOOK] 🔄 Commands changed, triggering IMMEDIATE reload...');
      
      try {
        // ✅ Force immediate reload dengan timeout protection
        const reloadPromise = whatsappBot.reloadCommands();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reload timeout after 10s')), 10000)
        );
        
        const success = await Promise.race([reloadPromise, timeoutPromise]);
        
        if (success) {
          const commands = whatsappBot.getCommands();
          const activeCount = commands.filter(c => c.isActive).length;
          
          console.log(`[WEBHOOK] ✅ Commands reloaded: ${commands.length} total, ${activeCount} active`);
          console.log(`[WEBHOOK] ✅ Active commands: [${commands.filter(c => c.isActive).map(c => c.trigger).join(', ')}]`);
          
          // Notify all connected socket clients
          const io = whatsappBot.getSocketIO();
          if (io) {
            io.emit('whatsapp:webhook-update', {
              action,
              trigger: data?.trigger,
              action_type: data?.action_type,
              success: true,
              commandCount: commands.length,
              activeCount: activeCount,
              commands: commands.filter(c => c.isActive).map(c => c.trigger),
              timestamp: new Date()
            });
          }
          
          return NextResponse.json({ 
            success: true,
            message: 'Commands reloaded successfully via webhook',
            commandCount: commands.length,
            activeCount: activeCount,
            trigger: data?.trigger,
            action_type: data?.action_type,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error('Reload returned false');
        }
        
      } catch (error: any) {
        console.error('[WEBHOOK] ❌ Failed to reload commands:', error.message);
        
        // Still notify clients about the attempt
        const io = whatsappBot.getSocketIO();
        if (io) {
          io.emit('whatsapp:webhook-update', {
            action,
            trigger: data?.trigger,
            success: false,
            error: error.message,
            timestamp: new Date()
          });
        }
        
        return NextResponse.json({ 
          success: false,
          error: `Failed to reload commands: ${error.message}`,
          trigger: data?.trigger,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
    // ✅ Handle sync_commands dari Laravel
    if (action === 'sync_commands' && source === 'laravel') {
      console.log('[WEBHOOK] 🔄 Sync commands requested via webhook...');
      
      try {
        const success = await whatsappBot.reloadCommands();
        const commands = whatsappBot.getCommands();
        
        return NextResponse.json({ 
          success: !!success,
          message: `Sync completed: ${commands.length} commands loaded`,
          commandCount: commands.length,
          receivedCount: data?.count || 0,
          timestamp: new Date().toISOString()
        });
        
      } catch (error: any) {
        console.error('[WEBHOOK] ❌ Sync failed:', error.message);
        return NextResponse.json({ 
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
    // ✅ Handle test webhook
    if (action === 'test_webhook') {
      console.log('[WEBHOOK] 🧪 Test webhook received');
      
      const status = whatsappBot.getStatus();
      const commands = whatsappBot.getCommands();
      
      return NextResponse.json({ 
        success: true,
        message: 'Test webhook received successfully',
        botStatus: {
          isConnected: status.isConnected,
          commandCount: commands.length,
          activeCount: commands.filter(c => c.isActive).length,
          lastSyncTime: status.lastSyncTime
        },
        receivedData: data,
        timestamp: new Date().toISOString()
      });
    }
    
    // ✅ Default response for unknown actions
    console.log(`[WEBHOOK] ⚠️ Unknown action: ${action}`);
    
    return NextResponse.json({ 
      success: true,
      message: `Webhook received for action: ${action}`,
      action,
      source,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[WEBHOOK] ❌ Error processing webhook:', error.message);
    
    return NextResponse.json({ 
      success: false,
      error: `Webhook processing failed: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ✅ GET method untuk testing dan info
export async function GET() {
  try {
    const status = whatsappBot.getStatus();
    const commands = whatsappBot.getCommands();
    
    return NextResponse.json({
      status: 'Webhook endpoint active',
      botStatus: {
        isConnected: status.isConnected,
        isInitialized: whatsappBot.isInitialized,
        commandCount: commands.length,
        activeCommandCount: commands.filter(c => c.isActive).length,
        lastSyncTime: status.lastSyncTime,
        refreshInterval: status.refreshInterval
      },
      supportedActions: [
        'commands_changed',
        'sync_commands',
        'test_webhook'
      ],
      activeCommands: commands.filter(c => c.isActive).map(c => ({
        trigger: c.trigger,
        updated_at: c.updated_at
      })),
      usage: 'POST to this endpoint from Laravel when commands change',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Webhook endpoint active but bot error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}