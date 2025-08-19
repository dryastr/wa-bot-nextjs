// src/lib/whatsapp.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.io = null;
    this.status = {
      isConnected: false,
      qrCode: null,
      clientInfo: null,
      lastSeen: null
    };
    this.commands = new Map();
    this.initializeDefaultCommands();
  }

  setSocketIO(io) {
    this.io = io;
  }

  getSocketIO() {
    // Try to get from global if not set
    if (!this.io && typeof global !== 'undefined' && global.io) {
      this.io = global.io;
    }
    return this.io;
  }

  initializeDefaultCommands() {
    const defaultCommands = [
      {
        id: '1',
        trigger: '!ping',
        response: 'Pong! Bot is working 🤖',
        description: 'Test bot responsiveness',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        trigger: '!help',
        response: 'Available commands:\n!ping - Test bot\n!help - Show this help\n!info - Bot information',
        description: 'Show available commands',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        trigger: '!info',
        response: 'WhatsApp Bot v1.0\nPowered by whatsapp-web.js & Next.js',
        description: 'Show bot information',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultCommands.forEach(cmd => {
      this.commands.set(cmd.trigger, cmd);
    });
  }

  async initialize() {
    if (this.client) {
      return this.client;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './public/sessions'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
    await this.client.initialize();
    return this.client;
  }

  setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2
        });
        
        this.status.qrCode = qrCodeDataURL;
        this.status.isConnected = false;
        
        const io = this.getSocketIO();
        if (io) {
          io.emit('whatsapp:qr', qrCodeDataURL);
          io.emit('whatsapp:status', this.status);
        }
        
        console.log('QR code generated and sent to clients');
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      
      const clientInfo = this.client?.info;
      this.status = {
        isConnected: true,
        qrCode: null,
        clientInfo: {
          pushname: clientInfo?.pushname,
          number: clientInfo?.wid?.user
        },
        lastSeen: new Date()
      };
      
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:ready', clientInfo);
        io.emit('whatsapp:status', this.status);
      }
    });

    this.client.on('message', async (message) => {
      try {
        this.status.lastSeen = new Date();
        
        const messageData = {
          id: message.id._serialized,
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          type: 'incoming'
        };
        
        const io = this.getSocketIO();
        if (io) {
          io.emit('whatsapp:message', messageData);
        }
        
        // Process commands
        await this.processCommand(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.client.on('disconnected', (reason) => {
      console.log('Client was logged out:', reason);
      
      this.status = {
        isConnected: false,
        qrCode: null,
        clientInfo: null,
        lastSeen: null
      };
      
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:disconnected');
        io.emit('whatsapp:status', this.status);
      }
      
      this.client = null;
    });

    this.client.on('auth_failure', (message) => {
      console.error('Authentication failed:', message);
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:status', this.status);
      }
    });
  }

  async processCommand(message) {
    const command = this.commands.get(message.body);
    
    if (command && command.isActive) {
      try {
        await message.reply(command.response);
        console.log(`Command executed: ${command.trigger}`);
      } catch (error) {
        console.error('Error executing command:', error);
      }
    }
  }

  async sendMessage(number, message) {
    if (!this.client) {
      throw new Error('WhatsApp client not initialized');
    }

    if (!this.status.isConnected) {
      throw new Error('WhatsApp client not connected');
    }

    try {
      const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
      const sentMessage = await this.client.sendMessage(chatId, message);
      
      const messageData = {
        id: sentMessage.id._serialized,
        from: sentMessage.from,
        to: sentMessage.to,
        body: message,
        timestamp: new Date(),
        type: 'outgoing'
      };
      
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:message', messageData);
      }
      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  getStatus() {
    return this.status;
  }

  getCommands() {
    return Array.from(this.commands.values());
  }

  addCommand(command) {
    const newCommand = {
      ...command,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.commands.set(command.trigger, newCommand);
    return newCommand;
  }

  updateCommand(trigger, updates) {
    const command = this.commands.get(trigger);
    if (command) {
      const updatedCommand = {
        ...command,
        ...updates,
        updatedAt: new Date()
      };
      this.commands.set(trigger, updatedCommand);
      return updatedCommand;
    }
    return null;
  }

  deleteCommand(trigger) {
    return this.commands.delete(trigger);
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
  }
}

// Singleton instance
const whatsappBot = new WhatsAppBot();
module.exports = { whatsappBot };