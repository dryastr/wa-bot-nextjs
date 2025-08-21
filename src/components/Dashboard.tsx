// src/components/Dashboard.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QRCodeDisplay } from './QRCodeDisplay';
import { CommandManager } from './CommandManager';
import { MessageSender } from './MessageSender';
import { useSocket } from '@/hooks/useSocket';

type Tab = 'overview' | 'commands' | 'messages';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [botInitializing, setBotInitializing] = useState(false);
  const { socket, isConnected, whatsappStatus, messages } = useSocket();

  const initializeBot = async () => {
    setBotInitializing(true);
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize bot');
      }
    } catch (error) {
      console.error('Error initializing bot:', error);
      alert('Failed to initialize WhatsApp bot');
    } finally {
      setBotInitializing(false);
    }
  };

  const disconnectBot = async () => {
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect bot');
      }
    } catch (error) {
      console.error('Error disconnecting bot:', error);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: '📊' },
    { id: 'commands' as Tab, label: 'Commands', icon: '⚡' },
    { id: 'messages' as Tab, label: 'Messages', icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#664ae7] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">WA</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-none">
                  WhatsApp Bot
                </h1>
                <span className="text-xs text-gray-500 font-medium">
                  Created by Daraya
                </span>
              </div>
            </div>

            {/* Socket Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                Socket: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#664ae7] text-[#664ae7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* WhatsApp Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          whatsappStatus.isConnected
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            whatsappStatus.isConnected
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        WhatsApp Status
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {whatsappStatus.isConnected
                          ? 'Connected'
                          : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Messages */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">💬</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Messages
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {messages.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Last Activity */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm">⚡</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Last Activity
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {whatsappStatus.lastSeen
                          ? new Date(whatsappStatus.lastSeen).toLocaleTimeString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code & Bot Control */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QRCodeDisplay
                qrCode={whatsappStatus.qrCode}
                isConnected={whatsappStatus.isConnected}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Bot Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {whatsappStatus.isConnected && whatsappStatus.clientInfo && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        Connected Account
                      </h4>
                      <p className="text-sm text-green-700">
                        <strong>Name:</strong>{' '}
                        {whatsappStatus.clientInfo.pushname || 'Unknown'}
                      </p>
                      <p className="text-sm text-green-700">
                        <strong>Number:</strong> +{whatsappStatus.clientInfo.number || 'Unknown'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {!whatsappStatus.isConnected ? (
                      <Button
                        onClick={initializeBot}
                        loading={botInitializing}
                        className="w-full bg-[#664ae7] hover:bg-[#523bb8]"
                      >
                        {botInitializing
                          ? 'Initializing...'
                          : 'Initialize WhatsApp Bot'}
                      </Button>
                    ) : (
                      <Button
                        onClick={disconnectBot}
                        variant="danger"
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        Disconnect Bot
                      </Button>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Bot akan otomatis merespon perintah</p>
                      <p>• QR Code berlaku selama 20 detik</p>
                      <p>• Session tersimpan otomatis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'commands' && <CommandManager />}
        {activeTab === 'messages' && <MessageSender messages={messages} />}
      </main>
    </div>
  );
}
