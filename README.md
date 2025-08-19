# WhatsApp Bot dengan Next.js

Bot WhatsApp yang dibangun menggunakan Next.js, whatsapp-web.js, dan Socket.IO dengan interface web yang user-friendly.

## 🚀 Fitur

- ✅ **QR Code Scanner** - Scan QR code langsung di web interface
- ✅ **Dashboard Real-time** - Monitor status bot secara real-time
- ✅ **Command Manager** - Kelola perintah bot melalui web interface
- ✅ **Message Sender** - Kirim pesan manual ke nomor WhatsApp
- ✅ **Session Management** - Session WhatsApp tersimpan otomatis
- ✅ **Responsive Design** - Tampilan responsif dengan Tailwind CSS
- ✅ **TypeScript** - Full TypeScript support
- ✅ **Socket.IO** - Real-time communication

## 📋 Persyaratan

- Node.js 18+
- npm atau yarn
- Chrome/Chromium (untuk Puppeteer)

## 🛠️ Instalasi

### 1. Clone atau buat project baru

```bash
# Buat folder project
mkdir wa-bot-nextjs
cd wa-bot-nextjs

# Inisialisasi Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2. Install dependencies

```bash
npm install whatsapp-web.js@1.32.0 qrcode socket.io socket.io-client uuid
npm install -D @types/qrcode @types/uuid
```

### 3. Buat struktur folder

```bash
mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/app/api/whatsapp
mkdir -p src/app/api/socket
mkdir -p public/sessions
```

### 4. Salin semua file

Salin semua file yang sudah dibuat ke dalam folder yang sesuai.

### 5. Setup environment variables

```bash
cp .env.example .env.local
```

### 6. Jalankan development server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🎯 Cara Penggunaan

1. **Akses Dashboard**
   - Buka browser dan akses `http://localhost:3000`
2. **Initialize Bot**
   - Klik tombol "Initialize WhatsApp Bot"
   - QR code akan muncul di dashboard
3. **Scan QR Code**
   - Buka WhatsApp di HP
   - Masuk ke Settings → Linked Devices
   - Tap "Link a Device"
   - Scan QR code yang muncul
4. **Bot Siap Digunakan**
   - Status akan berubah menjadi "Connected"
   - Bot akan otomatis merespon perintah
5. **Kelola Commands**
   - Masuk ke tab "Commands"
   - Tambah, edit, atau hapus perintah bot
6. **Kirim Pesan Manual**
   - Masuk ke tab "Messages"
   - Masukkan nomor dan pesan
   - Klik "Send Message"

## 📱 Default Commands

Bot sudah dilengkapi dengan beberapa perintah default:

- `!ping` - Test responsiveness bot
- `!help` - Tampilkan daftar perintah
- `!info` - Informasi tentang bot

## 🔧 Kustomisasi

### Menambah Command Baru

Melalui web interface:

1. Masuk ke tab "Commands"
2. Klik "Add Command"
3. Isi form dengan:
   - **Trigger**: Perintah (contoh: `!weather`)
   - **Description**: Deskripsi perintah
   - **Response**: Respon bot
   - **Active**: Status aktif/non-aktif

### Modifikasi Tampilan

Edit file di folder `src/components/` untuk mengubah tampilan:

- `Dashboard.tsx` - Layout utama
- `QRCodeDisplay.tsx` - Tampilan QR code
- `CommandManager.tsx` - Kelola perintah
- `MessageSender.tsx` - Kirim pesan

## 🚀 Deployment

### Untuk Production

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm start
```

### Dengan Custom Server (Recommended)

```bash
# Development dengan custom server
npm run dev:server

# Production dengan custom server
npm run start:server
```

## 🔒 Keamanan

- Session WhatsApp tersimpan di `public/sessions/`
- Jangan commit folder `sessions/` ke git
- Gunakan `.env.local` untuk konfigurasi sensitif
- Pastikan server aman jika deploy ke production

## 🐛 Troubleshooting

### QR Code tidak muncul

- Pastikan port 3000 tidak digunakan aplikasi lain
- Check console browser untuk error
- Restart aplikasi dengan `npm run dev`

### Bot tidak merespon

- Pastikan status "Connected" di dashboard
- Check session di folder `public/sessions/`
- Coba disconnect dan connect ulang

### Error saat install dependencies

```bash
# Clear npm cache
npm cache clean --force

# Install ulang
rm -rf node_modules package-lock.json
npm install
```

## 📚 API Endpoints

### WhatsApp Bot

- `GET /api/whatsapp` - Get bot status
- `POST /api/whatsapp` - Initialize/disconnect bot

### Commands

- `GET /api/whatsapp/commands` - Get all commands
- `POST /api/whatsapp/commands` - Add new command
- `PUT /api/whatsapp/commands` - Update command
- `DELETE /api/whatsapp/commands` - Delete command

### Messages

- `POST /api/whatsapp/send-message` - Send message

### Socket Events

- `whatsapp:status` - Bot status updates
- `whatsapp:qr` - QR code updates
- `whatsapp:ready` - Bot ready
- `whatsapp:message` - New messages
- `whatsapp:disconnected` - Bot disconnected

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail lengkap.

## ⚠️ Disclaimer

Bot ini dibuat untuk tujuan pembelajaran dan automasi personal. Pastikan penggunaan sesuai dengan Terms of Service WhatsApp.
