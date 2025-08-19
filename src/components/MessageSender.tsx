// src/components/MessageSender.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Message } from '@/lib/types';

interface MessageSenderProps {
  messages: Message[];
}

export function MessageSender({ messages }: MessageSenderProps) {
  const [formData, setFormData] = useState({
    number: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ number: '', message: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      return '62' + cleaned;
    }
    
    return cleaned;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, number: formatted });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Send Message Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone Number"
              value={formData.number}
              onChange={handleNumberChange}
              placeholder="628123456789"
              required
            />
            <Textarea
              label="Message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Type your message here..."
              rows={4}
              required
            />
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                Message sent successfully!
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet</p>
            ) : (
              messages.slice(0, 10).map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.type === 'outgoing'
                      ? 'bg-whatsapp-primary text-white ml-4'
                      : 'bg-gray-100 mr-4'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs opacity-75">
                      {message.type === 'outgoing' ? 'To' : 'From'}: {
                        message.type === 'outgoing' 
                          ? message.to.replace('@c.us', '') 
                          : message.from.replace('@c.us', '')
                      }
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.body}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}