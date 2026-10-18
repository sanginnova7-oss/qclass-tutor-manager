import React, { useEffect, useState } from 'react';
import { realtimeService, RealtimeEvent } from '../../services/realtimeService';
import {
  CreditCard,
  CheckCircle2,
  GraduationCap,
  Award,
  UserCheck,
  Bell,
  X,
  Radio,
} from 'lucide-react';

interface ToastItem extends RealtimeEvent {
  dismissed?: boolean;
}

export const RealtimeToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeEvents((event) => {
      setToasts((prev) => [event, ...prev.slice(0, 4)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'attendance':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'student':
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case 'test':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'lead':
        return <UserCheck className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBorderColor = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'payment':
        return 'border-emerald-200 bg-emerald-50/90 text-emerald-950';
      case 'attendance':
        return 'border-blue-200 bg-blue-50/90 text-blue-950';
      case 'student':
        return 'border-purple-200 bg-purple-50/90 text-purple-950';
      case 'test':
        return 'border-amber-200 bg-amber-50/90 text-amber-950';
      case 'lead':
        return 'border-rose-200 bg-rose-50/90 text-rose-950';
      default:
        return 'border-slate-200 bg-white/95 text-slate-900';
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl backdrop-blur-md border ${getBorderColor(
            toast.type
          )} animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all`}
        >
          <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-white text-slate-700 shadow-2xs">
                  <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                  Realtime
                </span>
                <span className="text-xs font-bold truncate">{toast.title}</span>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {toast.description}
            </p>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>{new Date(toast.timestamp).toLocaleTimeString('vi-VN')}</span>
              {toast.badge && (
                <span className="font-semibold text-slate-700">{toast.badge}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
