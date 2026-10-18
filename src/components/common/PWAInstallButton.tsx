import React, { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../modals/PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'portal' | 'button' | 'menu-item' | 'pill';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode on the user's desktop/phone, we can hide or show small badge
  if (isInstalled && variant !== 'sidebar') {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInstallable) {
      const outcome = await install();
      if (outcome !== 'accepted') {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Cài đặt QClass ra màn hình Desktop máy tính hoặc Điện thoại"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs group ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Cài App</span>
          <span className="inline sm:hidden">Cài</span>
        </button>
      )}

      {variant === 'portal' && (
        <button
          onClick={handleClick}
          title="Cài đặt ứng dụng ra màn hình chính điện thoại hoặc máy tính"
          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Cài ra Màn hình</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div className="mx-3 my-2">
          {isInstalled ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-[11px] text-emerald-900 truncate">Đã cài đặt App</p>
                <p className="text-[10px] text-emerald-700">Chế độ Desktop / Mobile</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClick}
              className={`w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl flex items-center justify-between text-left shadow-xs transition-all cursor-pointer group ${className}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate">Cài ra Màn hình</p>
                  <p className="text-[10px] text-blue-100 truncate">Desktop / Điện thoại</p>
                </div>
              </div>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                PWA
              </span>
            </button>
          )}
        </div>
      )}

      {variant === 'menu-item' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border border-blue-100 bg-blue-50/80 hover:bg-blue-100 text-left transition-colors cursor-pointer ${className}`}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>Cài ứng dụng ra Màn hình</span>
              <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                MỚI
              </span>
            </div>
            <div className="text-[11px] text-blue-700 truncate">
              Màn hình chính Desktop máy tính / Điện thoại
            </div>
          </div>
        </button>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Cài đặt ứng dụng</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Cài Đặt Ra Màn Hình</span>
        </button>
      )}

      {/* Shared Installation Modal Guide */}
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
