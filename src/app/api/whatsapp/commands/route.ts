// src/app/api/whatsapp/commands/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappBot } from '@/lib/whatsapp';

export async function GET() {
  try {
    const commands = whatsappBot.getCommands();
    return NextResponse.json({ commands });
  } catch (error) {
    console.error('Error getting commands:', error);
    return NextResponse.json(
      { error: 'Failed to get commands' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const commandData = await request.json();
    
    const newCommand = whatsappBot.addCommand({
      trigger: commandData.trigger,
      response: commandData.response,
      description: commandData.description,
      isActive: commandData.isActive ?? true
    });

    return NextResponse.json({ 
      message: 'Command added successfully',
      command: newCommand 
    });
  } catch (error) {
    console.error('Error adding command:', error);
    return NextResponse.json(
      { error: 'Failed to add command' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { trigger, ...updates } = await request.json();
    
    const updatedCommand = whatsappBot.updateCommand(trigger, updates);
    
    if (!updatedCommand) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Command updated successfully',
      command: updatedCommand 
    });
  } catch (error) {
    console.error('Error updating command:', error);
    return NextResponse.json(
      { error: 'Failed to update command' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { trigger } = await request.json();
    
    const deleted = whatsappBot.deleteCommand(trigger);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Command deleted successfully' });
  } catch (error) {
    console.error('Error deleting command:', error);
    return NextResponse.json(
      { error: 'Failed to delete command' },
      { status: 500 }
    );
  }
}