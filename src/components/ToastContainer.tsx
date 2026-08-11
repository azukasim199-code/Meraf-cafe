import React, { useEffect } from 'react';
import { Bell, Utensils, X, ChevronRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  tableNumber?: string | number;
  totalPrice?: number;
  itemCount?: number;
  type?: 'NEW_ORDER' | 'ORDER_UPDATED' | 'INFO' | 'SUCCESS' | 'ALERT';
  createdAt: Date;
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onNavigateToStaff?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onNavigateToStaff,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm w-full space-y-3 pointer-events-none px-3 sm:px-0">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={() => onDismiss(t.id)}
          onNavigateToStaff={onNavigateToStaff}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: () => void;
  onNavigateToStaff?: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, onNavigateToStaff }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000); // Auto dismiss after 7 seconds
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isNewOrder = toast.type === 'NEW_ORDER';

  return (
    <div className="pointer-events-auto bg-[#141418]/95 backdrop-blur-xl border border-amber-500/50 text-slate-100 rounded-2xl p-4 shadow-2xl amber-glow animate-slide-in flex flex-col gap-2.5 transition-all transform hover:scale-[1.02]">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl shrink-0 animate-bounce">
            {isNewOrder ? <Bell className="w-5 h-5 text-amber-400" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif-luxury font-bold text-sm text-amber-300">
                {toast.title}
              </h4>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded uppercase">
                New
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">{toast.message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Order Summary Specs if available */}
      {(toast.orderNumber || toast.tableNumber) && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400">{toast.orderNumber}</span>
            {toast.tableNumber && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-extrabold text-[11px] flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                Table #{toast.tableNumber}
              </span>
            )}
          </div>

          {toast.totalPrice !== undefined && (
            <span className="font-extrabold text-amber-400 text-xs">
              {toast.totalPrice} ETB
            </span>
          )}
        </div>
      )}

      {/* Action CTA */}
      {onNavigateToStaff && (
        <button
          type="button"
          onClick={() => {
            onNavigateToStaff();
            onDismiss();
          }}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <span>Open Kitchen Display</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Animated Progress Bar */}
      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full animate-toast-progress" />
      </div>
    </div>
  );
};
