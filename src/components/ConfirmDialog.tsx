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
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className=" border-1 border-gray max-w-md w-full"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        <div className="border-b-4 border-gray p-4 ">
          <h2 className="text-xl font-bold">■ {title}</h2>
        </div>

        <div className="p-6">
          <p className="text-sm mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 border-2 border-gray px-4 py-2 font-bold  hover:border-white text-sm"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 border-2 border-gray px-4 py-2 font-bold text-sm ${danger ? 'bg-white text-black hover:border-white' : 'bg-white hover:border-white'
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

