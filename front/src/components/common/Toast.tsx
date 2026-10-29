import React from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastApi {
  success: (title: string, message?: string, duration?: number) => number;
  error: (title: string, message?: string, duration?: number) => number;
  info: (title: string, message?: string, duration?: number) => number;
  warning: (title: string, message?: string, duration?: number) => number;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const typeConfig: Record<ToastType, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  success: { icon: Check, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  error: { icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
};

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const cfg = typeConfig[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-elevated border min-w-[320px] animate-slide-up ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <div className="flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{toast.title}</p>
              {toast.message && <p className="text-sm opacity-90">{toast.message}</p>}
            </div>
            <button type="button" onClick={() => onDismiss(toast.id)} className="flex-shrink-0 p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback(
    (type: ToastType, title: string, message?: string, duration = 5000): number => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      return id;
    },
    []
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (title, message, duration) => show('success', title, message, duration),
      error: (title, message, duration) => show('error', title, message, duration),
      info: (title, message, duration) => show('info', title, message, duration),
      warning: (title, message, duration) => show('warning', title, message, duration),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Fallback silencioso si se usa fuera del provider (evita crash)
    const noop = () => 0;
    return {
      toast: { success: noop, error: noop, info: noop, warning: noop },
      success: noop,
      error: noop,
      info: noop,
      warning: noop,
      dismiss: noop,
      toasts: [] as ToastItem[],
    };
  }
  return {
    toast: ctx,
    success: ctx.success,
    error: ctx.error,
    info: ctx.info,
    warning: ctx.warning,
    dismiss: ctx.dismiss,
    toasts: [] as ToastItem[],
  };
}

export { ToastContainer };
