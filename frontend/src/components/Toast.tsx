import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3500 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-amber-600" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50/90';
      case 'info':
        return 'border-amber-200 bg-amber-50/90';
      case 'success':
      default:
        return 'border-green-200 bg-green-50/90';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border ${getBorderColor()} shadow-lg text-slate-850 text-xs font-semibold max-w-sm`}>
      <div className="flex-shrink-0">{renderIcon()}</div>
      <div className="flex-grow font-sans text-slate-700">{message}</div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default Toast;
