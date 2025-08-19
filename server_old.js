import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { whatsappBot } from './src/lib/whatsapp';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);

      // Serve the Socket.IO client-side bundle
      if (parsedUrl.pathname === '/socket.io/socket.io.js') {
        const filePath = path.resolve(
          'node_modules/socket.io-client/dist/socket.io.js'
        );
        res.setHeader('Content-Type', 'application/javascript');
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req?.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    path: '/api/socketio',
  });

  // Set the socket.io instance to the bot
  whatsappBot.setSocketIO(io);

  // Initialize the WhatsApp bot (this will start generating the QR code)
  whatsappBot.initialize();

  // Socket.IO event handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send the current status immediately to the new client
    socket.emit('whatsapp:status', whatsappBot.getStatus());

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
