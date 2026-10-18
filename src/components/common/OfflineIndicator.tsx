import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-400 animate-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
      <span>Chế độ ngoại tuyến (Offline) — Dữ liệu đã lưu trên máy vẫn dùng bình thường.</span>
    </div>
  );
};
