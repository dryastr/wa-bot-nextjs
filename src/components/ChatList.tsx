// src/components/ChatList.tsx
import { Message } from '@/lib/types';
import { User, MessageSquare } from 'lucide-react';

interface ChatListProps {
  contacts: string[];
  selectedChatNumber: string | null;
  onSelectChat: (number: string) => void;
  messages: Message[];
  unreadCounts: Record<string, number>;
}

export function ChatList({
  contacts,
  selectedChatNumber,
  onSelectChat,
  messages,
  unreadCounts,
}: ChatListProps) {
  // ✅ Ambil pesan terakhir per contact (dengan sorting timestamp)
  const getLastMessage = (contactNumber: string) => {
    const relatedMessages = messages
      .filter(
        (m) =>
          m.from.replace('@c.us', '') === contactNumber ||
          m.to.replace('@c.us', '') === contactNumber
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    return relatedMessages.length > 0
      ? relatedMessages[relatedMessages.length - 1]
      : null;
  };

  return (
    <div className="flex flex-col">
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <MessageSquare size={48} className="mb-4 text-gray-400" />
          <p className="text-sm">Tidak ada riwayat chat.</p>
        </div>
      ) : (
        contacts.map((contact) => {
          const lastMessage = getLastMessage(contact);
          const contactName = contact;
          const lastMessageBody = lastMessage
            ? lastMessage.body
            : 'Mulai percakapan';
          const lastMessageTime = lastMessage
            ? new Date(lastMessage.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const unreadCount = unreadCounts[contact] || 0;

          return (
            <div
              key={contact}
              onClick={() => onSelectChat(contact)}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 border-b last:border-b-0
                ${
                  selectedChatNumber === contact
                    ? 'bg-gray-100 border-l-4 border-l-[#664ae7]'
                    : ''
                }`}
            >
              <div className="relative h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-700">
                <User size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold truncate">{contactName}</h4>
                  <span className="text-xs text-gray-400">{lastMessageTime}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {lastMessageBody}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
