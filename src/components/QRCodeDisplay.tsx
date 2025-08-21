import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface QRCodeDisplayProps {
  qrCode: string | null;
  isConnected: boolean;
}

export function QRCodeDisplay({ qrCode, isConnected }: QRCodeDisplayProps) {
  const primaryColor = '#664ae7';
  const primaryColorLight = '#ede7ff';

  if (isConnected) {
    return (
      <Card className="text-center">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-center gap-2 text-gray-800">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Status Koneksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center`} style={{ backgroundColor: primaryColorLight }}>
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24" style={{ color: primaryColor }}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Berhasil Terhubung!
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Bot WhatsApp Anda sudah aktif dan siap digunakan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-center gap-2 text-gray-800">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          Pindai Kode QR
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {qrCode ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64 border-4 p-2 rounded-xl transition-all duration-300"
                style={{ borderColor: primaryColor, imageRendering: 'pixelated' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">Langkah-langkah:</p>
              <ol className="text-left space-y-2 max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: primaryColor }}>1</div>
                  <span>Buka **WhatsApp** di ponsel Anda.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: primaryColor }}>2</div>
                  <span>Pilih menu **Perangkat Tertaut**.</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: primaryColor }}>3</div>
                  <span>Ketuk **"Tautkan Perangkat"** dan pindai kode ini.</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full min-h-[256px] rounded-lg border border-dashed p-8" style={{ borderColor: primaryColor, backgroundColor: primaryColorLight + '30' }}>
            <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderTopColor: primaryColor, borderColor: primaryColorLight }}></div>
            <p className="text-gray-700 font-medium">Menghasilkan Kode QR...</p>
            <p className="text-gray-500 text-sm mt-1">Harap tunggu sebentar...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}