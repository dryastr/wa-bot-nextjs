import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isConnected: boolean;
}

export function QRCodeDisplay({ qrCode, isConnected }: QRCodeDisplayProps) {
  if (isConnected) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            WhatsApp Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-64 h-64 bg-green-50 rounded-lg mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <p className="text-green-600 font-medium">Successfully Connected!</p>
              <p className="text-gray-500 text-sm mt-1">Your WhatsApp bot is ready to use</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          Scan QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {qrCode ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="text-left space-y-1 max-w-xs mx-auto">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Go to Settings → Linked Devices</li>
                <li>3. Tap "Link a Device"</li>
                <li>4. Scan this QR code</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-64 h-64 bg-gray-50 rounded-lg mx-auto">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Generating QR Code...</p>
              <p className="text-gray-400 text-xs mt-1">Please wait...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}