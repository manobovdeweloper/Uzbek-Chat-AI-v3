import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastNotificationsProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 text-rose-400 flex-shrink-0" />,
  info:    <Info         className="w-4 h-4 text-sky-400 flex-shrink-0" />,
};

const colors = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error:   "border-rose-500/30 bg-rose-500/10",
  info:    "border-sky-500/30 bg-sky-500/10",
};

export function ToastNotifications({ toasts, onDismiss }: ToastNotificationsProps) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border glass-strong shadow-xl toast-in max-w-xs ${colors[t.type]}`}>
          {icons[t.type]}
          <span className="text-sm text-foreground font-medium flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
