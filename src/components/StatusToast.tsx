import { useEffect } from 'react';

interface Toast {
  id: string;
  status: 'sending' | 'success' | 'failure';
  message: string;
}

interface Props {
  toasts: readonly Toast[];
  onRemove: (id: string) => void;
}

const icons = {
  sending: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  ),
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  failure: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const colors = {
  sending: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  success: 'bg-green-500/10 border-green-500/20 text-green-400',
  failure: 'bg-red-500/10 border-red-500/20 text-red-400',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    if (toast.status === 'sending') return;
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.status]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[toast.status]} transition-all`}>
      {icons[toast.status]}
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export default function StatusToast({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}