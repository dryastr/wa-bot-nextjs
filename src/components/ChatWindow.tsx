// src/components/ChatWindow.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Send, User, MessageSquare, AlertCircle, CheckCircle, Clock, ArrowLeft, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';

interface ChatWindowProps {
  selectedChatNumber: string | null;
  messages: Message[];
  onBackClick: () => void;
  onCloseChat: () => void; 
}

interface AlertState {
  type: 'success' | 'error' | 'info';
  message: string;
  show: boolean;
}

export function ChatWindow({ selectedChatNumber, messages, onBackClick, onCloseChat }: ChatWindowProps) {
  const [formData, setFormData] = useState({ number: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: 'success', message: '', show: false });
  const [botStatus, setBotStatus] = useState({ isReady: false, isConnected: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const primaryColor = '#664ae7';

  // Filter dan urutkan pesan agar yang terbaru ada di bawah
  const sortedMessages = [...messages.filter(
    (m) =>
      m.from.replace('@c.us', '') === selectedChatNumber ||
      m.to.replace('@c.us', '') === selectedChatNumber
  )].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages]);

  // Check bot status
  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/send-message');
        if (response.ok) {
          const data = await response.json();
          setBotStatus(data.status);
        }
      } catch (error) {
        console.error('Error checking bot status:', error);
      }
    };

    checkBotStatus();
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message, show: true });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim() || !selectedChatNumber) return;

    if (!botStatus.isConnected) {
      showAlert('error', 'Bot WhatsApp belum siap. Silakan scan QR code terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          number: selectedChatNumber, 
          message: formData.message.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      showAlert('success', `Pesan berhasil dikirim ke ${selectedChatNumber}`);
      setFormData({ number: '', message: '' });
      
    } catch (error) {
      let errorMessage = 'Gagal mengirim pesan';
      
      if (error instanceof Error) {
        if (error.message.includes('not connected')) {
          errorMessage = 'Bot WhatsApp belum siap. Silakan scan QR code terlebih dahulu.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout - pesan mungkin terlalu lama untuk dikirim.';
        } else if (error.message.includes('not initialized')) {
          errorMessage = 'Bot WhatsApp belum diinisialisasi. Silakan restart aplikasi.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      showAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!selectedChatNumber) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 bg-gray-50">
        <MessageSquare size={64} className="mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Pilih sebuah chat untuk memulai percakapan</h3>
        <p className="text-sm max-w-xs">
          Riwayat pesan Anda dengan kontak akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {alert.show && (
        <div className={`p-3 border-l-4 ${
          alert.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
          alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
          'bg-blue-50 border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center">
            {alert.type === 'success' && <CheckCircle size={16} className="mr-2" />}
            {alert.type === 'error' && <AlertCircle size={16} className="mr-2" />}
            {alert.type === 'info' && <Clock size={16} className="mr-2" />}
            <span className="text-sm">{alert.message}</span>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white shadow-sm">
        {/* Tombol Back (mobile) */}
        <Button onClick={onBackClick} className="md:hidden p-0 h-10 w-10 bg-transparent text-gray-700 hover:bg-gray-200">
          <ArrowLeft size={24} />
        </Button>
        {/* Tombol Close (desktop) */}
        <Button onClick={onCloseChat} className="hidden md:flex items-center justify-center p-0 h-10 w-10 bg-transparent text-gray-700 hover:bg-gray-200">
          <X size={24} />
        </Button>
        <div className="relative h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-md font-semibold text-gray-700">
          <User size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{selectedChatNumber}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              botStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <p className={`text-sm ${
              botStatus.isConnected ? 'text-green-500' : 'text-red-500'
            }`}>
              {botStatus.isConnected ? 'Bot Ready' : 'Bot Not Ready'}
            </p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare size={48} className="mb-4 text-gray-400" />
            <p>Belum ada pesan dalam chat ini</p>
          </div>
        ) : (
          sortedMessages.map((message) => {
            const isOutgoing = message.type === 'outgoing';
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                    isOutgoing
                      ? 'bg-[#664ae7] text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <div className="flex flex-col">
                    <p className="text-sm leading-relaxed break-words">{message.body}</p>
                    <span
                      className={`mt-1 text-[10px] self-end ${
                        isOutgoing ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex items-center gap-4">
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            onKeyDown={handleKeyPress}
            placeholder={
              botStatus.isConnected 
                ? "Ketik pesan Anda..." 
                : "Bot tidak siap. Silakan scan QR code terlebih dahulu."
            }
            rows={1}
            disabled={loading || !botStatus.isConnected}
            className="flex-1 resize-none rounded-2xl border border-gray-300 focus:border-[#664ae7] focus:ring-0 p-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={loading || !formData.message.trim() || !botStatus.isConnected}
            className="h-10 w-10 p-0 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 rounded-full border-2 border-t-white border-gray-400" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}