'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Message } from '@/lib/types';
import { MessageCircle } from 'lucide-react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';

interface MessageSenderProps {
  messages: Message[];
}

export function MessageSender({ messages }: MessageSenderProps) {
  const [selectedChatNumber, setSelectedChatNumber] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lastMessageCountRef = useRef(messages.length);

  // Load unread counts + siapkan audio notif
  useEffect(() => {
    const savedCounts = sessionStorage.getItem('unreadCounts');
    if (savedCounts) {
      setUnreadCounts(JSON.parse(savedCounts));
    }

    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }
  }, []);

  // Simpan unread counts ke session storage
  useEffect(() => {
    sessionStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // 🔥 Buat daftar kontak unik + ambil lastMessage per contact
  const uniqueContacts = Array.from(
    new Set(
      messages.map((m) =>
        m.type === 'outgoing' ? m.to.replace('@c.us', '') : m.from.replace('@c.us', '')
      )
    )
  );

  const contactsWithLastMessage = uniqueContacts.map((contact) => {
    const relatedMessages = messages.filter(
      (m) =>
        m.from.replace('@c.us', '') === contact ||
        m.to.replace('@c.us', '') === contact
    );
    const lastMessage =
      relatedMessages.length > 0
        ? relatedMessages[relatedMessages.length - 1]
        : null;
    return { contact, lastMessage };
  });

  const sortedContacts = contactsWithLastMessage.sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  // 🔔 Logika NOTIFIKASI + badge
  useEffect(() => {
    const currentMessageCount = messages.length;

    if (currentMessageCount > lastMessageCountRef.current) {
      const newMessages = messages.slice(lastMessageCountRef.current);

      newMessages.forEach((m) => {
        const contactNumber = m.from.replace('@c.us', '');

        if (m.type === 'incoming') {
          if (contactNumber !== selectedChatNumber) {
            setUnreadCounts((prev) => ({
              ...prev,
              [contactNumber]: (prev[contactNumber] || 0) + 1,
            }));
          }

          if (audioRef.current) {
            audioRef.current
              .play()
              .catch((e) => console.error('Error playing sound:', e));
          }
        }
      });
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages, selectedChatNumber]);

  // Reset unread saat chat dibuka
  useEffect(() => {
    if (selectedChatNumber) {
      messages.forEach((m) => {
        const contactNumber = m.from.replace('@c.us', '');
        if (m.type === 'incoming' && contactNumber === selectedChatNumber) {
          sessionStorage.setItem(`message_${m.id}_read`, 'true');
        }
      });
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedChatNumber]: 0,
      }));
    }
  }, [selectedChatNumber, messages]);

  const handleSelectChat = (number: string) => {
    setSelectedChatNumber(number);
    setIsChatWindowOpen(true);
  };

  const handleBackClick = () => {
    setSelectedChatNumber(null);
    setIsChatWindowOpen(false);
  };

  const handleCloseChat = () => {
    setSelectedChatNumber(null);
    setIsChatWindowOpen(false);
  };

  return (
    <div className="flex h-[80vh] w-full max-w-7xl mx-auto rounded-xl shadow-2xl overflow-hidden bg-white">
      {/* Kolom Kiri: Daftar Chat */}
      <Card
        className={`w-full max-w-sm md:flex-shrink-0 border-r-0 rounded-r-none h-full overflow-y-auto custom-scrollbar 
          ${isChatWindowOpen ? 'hidden md:flex flex-col' : 'flex flex-col'}`}
      >
        <CardHeader className="py-4 border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={24} className="text-[#664ae7]" />
            Daftar Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ChatList
            contacts={sortedContacts.map(c => c.contact)}
            selectedChatNumber={selectedChatNumber}
            onSelectChat={handleSelectChat}
            unreadCounts={unreadCounts}
            messages={messages} 
          />
        </CardContent>
      </Card>

      {/* Kolom Kanan: Jendela Chat */}
      <div
        className={`flex-1 h-full flex flex-col 
          ${isChatWindowOpen ? 'block' : 'hidden md:flex'}`}
      >
        <ChatWindow
          selectedChatNumber={selectedChatNumber}
          messages={messages}
          onBackClick={handleBackClick}
          onCloseChat={handleCloseChat}
        />
      </div>
    </div>
  );
}
