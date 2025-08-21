// src/components/ui/Toast.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const typeColors = {
  success: {
    bg: 'bg-green-500',
    icon: <CheckCircle className="h-5 w-5 text-white" />,
    title: 'Berhasil',
  },
  error: {
    bg: 'bg-red-500',
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
    title: 'Gagal',
  },
  info: {
    bg: 'bg-blue-500',
    icon: <X className="h-5 w-5 text-white" />,
    title: 'Info',
  },
};

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to complete before calling onClose
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const { bg, icon, title } = typeColors[type];

  const handleCloseClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Tunggu animasi keluar selesai
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-6 right-6 z-50 rounded-lg p-4 shadow-lg flex items-center gap-4 text-white ${bg}`}
          role="alert"
        >
          {icon}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs">{message}</p>
          </div>
          <button onClick={handleCloseClick} className="self-start p-1 -m-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}