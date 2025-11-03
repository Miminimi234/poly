'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  danger = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-4 border-black max-w-md w-full"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        <div className="border-b-4 border-black p-4 bg-white">
          <h2 className="text-xl font-bold">■ {title}</h2>
        </div>
        
        <div className="p-6">
          <p className="text-sm mb-6 leading-relaxed">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 text-sm"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 border-2 border-black px-4 py-2 font-bold text-sm ${
                danger ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

