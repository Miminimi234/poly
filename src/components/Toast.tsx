'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`border-1 border-gray p-4 min-w-[300px] animate-slide-in ${toast.type === 'success' ? 'bg-gray-100' :
            toast.type === 'error' ? 'bg-gray-200' :
              toast.type === 'warning' ? 'bg-gray-100' :
                ''
            }`}
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {toast.type === 'success' ? '✓' :
                  toast.type === 'error' ? '✗' :
                    toast.type === 'warning' ? '⚠' :
                      '◆'}
              </span>
              <div className="text-sm font-bold">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xl font-bold hover:text-white-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

