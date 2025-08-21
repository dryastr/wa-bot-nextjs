// src/lib/whatsapp.js
// ✅ FIXED VERSION - Proper command sync dengan debugging lebih detail

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const axios = require('axios');

const LARAVEL_API_URL = 'http://127.0.0.1:8000/api/whatsapp/commands';
const MESSAGE_API_URL = 'http://127.0.0.1:8000/api/messages';

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
    this.isInitialized = false;
    
    // ✅ Auto-refresh mechanism
    this.autoRefreshInterval = null;
    this.refreshIntervalMs = 8000; // 8 seconds - lebih cepat
    this.lastCommandHash = '';
    this.lastSyncTime = null;
    this.commandLoadCount = 0;
  }

  setSocketIO(io) {
    this.io = io;
  }

  getSocketIO() {
    if (!this.io && typeof global !== 'undefined' && global.io) {
      this.io = global.io;
    }
    return this.io;
  }

  // ✅ Improved hash function
  hashCommands(commands) {
    if (!commands || !Array.isArray(commands)) return '';
    
    const commandStr = commands
      .filter(c => c && c.trigger) // Filter valid commands only
      .map(c => `${c.trigger.toLowerCase()}:${c.response}:${c.is_active ? '1' : '0'}`)
      .sort()
      .join('|');
    
    return Buffer.from(commandStr).toString('base64');
  }

  // ✅ FIXED: Improved load commands dengan better error handling
  async loadCommandsFromApi(forceReload = false) {
    try {
      this.commandLoadCount++;
      const loadId = this.commandLoadCount;
      
      console.log(`[BOT] #${loadId} Loading commands from Laravel API... ${forceReload ? '(FORCED)' : ''}`);
      
      const response = await axios.get(LARAVEL_API_URL, {
        timeout: 10000, // Increase timeout
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // ✅ Add timestamp to prevent caching
        params: {
          _t: Date.now()
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Laravel API returned status ${response.status}`);
      }

      const responseData = response.data;
      console.log(`[BOT] #${loadId} API Response:`, {
        success: responseData.success,
        commandCount: responseData.commands?.length || 0,
        timestamp: responseData.timestamp
      });

      const apiCommands = responseData.commands;
      
      if (!apiCommands || !Array.isArray(apiCommands)) {
        console.warn(`[BOT] #${loadId} ⚠️ No valid commands received from API`);
        return false;
      }

      // ✅ FIXED: Better command change detection
      const newHash = this.hashCommands(apiCommands);
      const commandsChanged = forceReload || newHash !== this.lastCommandHash || this.commands.size === 0;

      console.log(`[BOT] #${loadId} Command comparison:`, {
        oldHash: this.lastCommandHash.substring(0, 10) + '...',
        newHash: newHash.substring(0, 10) + '...',
        changed: commandsChanged,
        oldCount: this.commands.size,
        newCount: apiCommands.length
      });

      if (!commandsChanged) {
        console.log(`[BOT] #${loadId} ✅ Commands unchanged, skipping update`);
        return true;
      }

      // ✅ FIXED: Clear and rebuild commands map properly
      const oldCommands = Array.from(this.commands.keys());
      this.commands.clear();
      
      let validCommandCount = 0;
      apiCommands.forEach((cmd, index) => {
        if (cmd && cmd.trigger && cmd.response) {
          const triggerKey = cmd.trigger.toLowerCase().trim();
          
          this.commands.set(triggerKey, {
            id: cmd.id,
            trigger: cmd.trigger,
            response: cmd.response,
            description: cmd.description || '',
            isActive: Boolean(cmd.is_active),
            updated_at: cmd.updated_at || cmd.created_at
          });
          validCommandCount++;
          
          console.log(`[BOT] #${loadId} Added command [${index+1}]: "${triggerKey}" -> Active: ${cmd.is_active}`);
        } else {
          console.warn(`[BOT] #${loadId} ⚠️ Invalid command [${index+1}]:`, cmd);
        }
      });
      
      this.lastCommandHash = newHash;
      this.lastSyncTime = new Date();
      
      console.log(`[BOT] #${loadId} ✅ COMMANDS UPDATED!`);
      console.log(`[BOT] #${loadId} Old commands: [${oldCommands.join(', ')}]`);
      console.log(`[BOT] #${loadId} New commands: [${Array.from(this.commands.keys()).join(', ')}]`);
      console.log(`[BOT] #${loadId} Total active: ${validCommandCount}/${apiCommands.length}`);
      
      // ✅ Emit detailed update ke socket
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:commands-updated', {
          loadId,
          count: this.commands.size,
          validCount: validCommandCount,
          totalReceived: apiCommands.length,
          commands: Array.from(this.commands.keys()),
          activeCommands: Array.from(this.commands.values()).filter(c => c.isActive).map(c => c.trigger),
          timestamp: new Date(),
          hash: newHash.substring(0, 16),
          changed: commandsChanged
        });
      }
      
      return true;
      
    } catch (error) {
      console.error(`[BOT] #${this.commandLoadCount} ❌ Error loading commands:`, {
        message: error.message,
        code: error.code,
        response: error.response?.status
      });
      return false;
    }
  }

  // ✅ Start auto-refresh dengan immediate load
  async startAutoRefresh() {
    if (this.autoRefreshInterval) {
      console.log('[BOT] Auto-refresh already running');
      return;
    }

    console.log(`[BOT] 🔄 Starting auto-refresh every ${this.refreshIntervalMs/1000}s`);
    
    // ✅ Load immediately when starting
    await this.loadCommandsFromApi(true);
    
    this.autoRefreshInterval = setInterval(async () => {
      try {
        await this.loadCommandsFromApi(false);
      } catch (error) {
        console.error('[BOT] Auto-refresh error:', error.message);
      }
    }, this.refreshIntervalMs);
  }

  // ✅ Stop auto-refresh
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log('[BOT] 🛑 Auto-refresh stopped');
    }
  }

  async initialize() {
    if (this.client && this.isInitialized) {
      console.log('[BOT] Client already initialized');
      return this.client;
    }

    console.log('[BOT] Initializing WhatsApp client...');
    
    // ✅ Start auto-refresh BEFORE initializing client
    await this.startAutoRefresh();

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
    
    try {
      await this.client.initialize();
      this.isInitialized = true;
      console.log('[BOT] WhatsApp client initialized successfully');
      return this.client;
    } catch (error) {
      console.error('[BOT] Failed to initialize WhatsApp client:', error);
      this.stopAutoRefresh();
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', async (qr) => {
      try {
        console.log('[BOT] QR code received');
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
        
        console.log('[BOT] QR code generated and sent to clients');
      } catch (error) {
        console.error('[BOT] Error generating QR code:', error);
      }
    });

    this.client.on('ready', async () => {
      console.log('[BOT] 🎉 WhatsApp client is ready!');
      
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

      // ✅ FORCE reload commands when ready
      console.log('[BOT] 🔄 FORCE reloading commands after ready...');
      await this.loadCommandsFromApi(true);
      
      // ✅ Log current commands for debugging
      console.log('[BOT] 📋 Current commands after ready:', Array.from(this.commands.keys()));
    });

    this.client.on('message', async (message) => {
      try {
        // Skip messages from groups or broadcast
        if (message.from.includes('@g.us') || message.from.includes('@broadcast')) {
          return;
        }

        // Skip messages from self
        if (message.fromMe) {
          return;
        }

        this.status.lastSeen = new Date();
        
        // Buat objek data pesan untuk dikirim ke API
        const messageData = {
          id: message.id._serialized,
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: new Date(message.timestamp * 1000).toISOString(), // ✅ Ubah ke format ISO
          type: 'incoming'
        };
        
        const io = this.getSocketIO();
        if (io) {
          io.emit('whatsapp:message', messageData);
        }
        
        console.log(`[BOT] 📨 Received message: "${message.body}" from ${message.from}`);
        
        // ✅ LOGIKA BARU UNTUK MENGIRIM DATA KE API LARAVEL
        try {
            console.log('[BOT] 💾 Attempting to save message to Laravel API...');
            console.log('[BOT] ➡️ Sending payload:', messageData); // Log payload yang dikirim

            const response = await axios.post(MESSAGE_API_URL, messageData, {
                timeout: 5000 // Timeout 5 detik untuk mencegah hang
            });

            if (response.status === 201) {
                console.log('[BOT] ✅ Message successfully saved to database. Response:', response.data);
            } else {
                console.warn(`[BOT] ⚠️ API returned non-201 status: ${response.status}`, response.data);
            }
        } catch (apiError) {
            console.error('[BOT] ❌ FAILED to send message to Laravel API!');
            if (apiError.response) {
                // Server merespon, tapi dengan status error (4xx, 5xx)
                console.error('[BOT] Error details:', {
                    status: apiError.response.status,
                    data: apiError.response.data,
                    message: apiError.message
                });
            } else if (apiError.request) {
                // Request terkirim tapi tidak ada respon
                console.error('[BOT] No response from API. Is Laravel server running?');
            } else {
                // Error saat menyiapkan request
                console.error('[BOT] Request setup error:', apiError.message);
            }
        }
        
        // Process command
        await this.processCommand(message);
      } catch (error) {
        console.error('[BOT] Error processing message:', error);
      }
    });

    this.client.on('disconnected', (reason) => {
      console.log('[BOT] Client was logged out:', reason);
      
      this.status = {
        isConnected: false,
        qrCode: null,
        clientInfo: null,
        lastSeen: null
      };
      
      this.isInitialized = false;
      this.stopAutoRefresh();
      
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:disconnected', reason);
        io.emit('whatsapp:status', this.status);
      }
      
      this.client = null;
    });

    this.client.on('auth_failure', (message) => {
      console.error('[BOT] Authentication failed:', message);
      this.isInitialized = false;
      this.stopAutoRefresh();
      
      const io = this.getSocketIO();
      if (io) {
        io.emit('whatsapp:auth_failure', message);
        io.emit('whatsapp:status', this.status);
      }
    });
  }

  // ✅ FIXED: Improved command processing dengan detailed logging
  async processCommand(message) {
    if (!message.body || typeof message.body !== 'string') {
      return;
    }

    const messageText = message.body.trim().toLowerCase();
    
    console.log(`[BOT] 🔍 Checking command: "${messageText}"`);
    console.log(`[BOT] Available commands: ${Array.from(this.commands.keys()).join(', ')}`);
    
    const command = this.commands.get(messageText);
    
    if (command) {
      console.log(`[BOT] ✅ Found command: ${command.trigger} (Active: ${command.isActive})`);
      
      if (command.isActive) {
        try {
          console.log(`[BOT] ⚡ Executing: ${command.trigger} -> "${command.response}"`);
          await message.reply(command.response);
          console.log(`[BOT] ✅ Sent reply for: ${command.trigger}`);
          
          // Emit command execution event
          const io = this.getSocketIO();
          if (io) {
            io.emit('whatsapp:command-executed', {
              trigger: command.trigger,
              response: command.response,
              from: message.from,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('[BOT] ❌ Command execution error:', error);
        }
      } else {
        console.log(`[BOT] ⚠️ Command "${command.trigger}" is INACTIVE`);
      }
    } else {
      console.log(`[BOT] ❌ No active command found for: "${messageText}"`);
    }
    
    // ✅ Debug info
    console.log(`[BOT] 📊 Command stats: Total=${this.commands.size}, Active=${Array.from(this.commands.values()).filter(c => c.isActive).length}`);
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
      
      console.log(`[BOT] Message sent to ${number}: ${message}`);
      return sentMessage;
    } catch (error) {
      console.error('[BOT] Error sending message:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      ...this.status,
      commandCount: this.commands.size,
      activeCommandCount: Array.from(this.commands.values()).filter(c => c.isActive).length,
      lastSyncTime: this.lastSyncTime,
      refreshInterval: this.refreshIntervalMs
    };
  }

  async disconnect() {
    console.log('[BOT] 🛑 Disconnecting...');
    this.stopAutoRefresh();
    
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isInitialized = false;
    }
  }

  // ✅ Manual reload with force refresh
  async reloadCommands() {
    console.log('[BOT] 🔄 Manual reload requested');
    const result = await this.loadCommandsFromApi(true);
    return result;
  }

  // Method untuk mendapatkan daftar commands
  getCommands() {
    return Array.from(this.commands.values());
  }

  // ✅ Set refresh interval
  setRefreshInterval(ms) {
    this.refreshIntervalMs = ms;
    if (this.autoRefreshInterval) {
      this.stopAutoRefresh();
      this.startAutoRefresh();
    }
    console.log(`[BOT] Refresh interval set to ${ms/1000}s`);
  }

  // ✅ Debug method
  debugCommands() {
    console.log('[BOT] 🐛 DEBUG - Current commands:');
    this.commands.forEach((cmd, trigger) => {
      console.log(`  "${trigger}" -> "${cmd.response.substring(0, 30)}..." (Active: ${cmd.isActive})`);
    });
    console.log(`[BOT] 🐛 Total: ${this.commands.size} commands, Hash: ${this.lastCommandHash.substring(0, 16)}`);
  }
}


const whatsappBot = new WhatsAppBot();
module.exports = { whatsappBot };