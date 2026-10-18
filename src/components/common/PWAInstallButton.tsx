import React, { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../modals/PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'portal' | 'button' | 'menu-item' | 'pill' | 'card';
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
  if (isInstalled && variant !== 'sidebar' && variant !== 'card') {
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
      {/* 1. Header Variant: Large, eye-catching button in TopBar */}
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Cài đặt QClass ra màn hình Desktop máy tính hoặc Điện thoại"
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 border border-blue-400/50 rounded-xl shadow-md hover:shadow-lg ring-2 ring-blue-300/40 transition-all cursor-pointer group shrink-0 ${className}`}
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Download className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden md:inline whitespace-nowrap">Cài Ra Màn Hình</span>
          <span className="inline md:hidden whitespace-nowrap">Cài App</span>
        </button>
      )}

      {/* 2. Portal Switcher Variant */}
      {variant === 'portal' && (
        <button
          onClick={handleClick}
          title="Cài đặt ứng dụng ra màn hình chính điện thoại hoặc máy tính"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-200 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/50 rounded-xl transition-all shadow-xs cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span>Cài ra Màn hình</span>
        </button>
      )}

      {/* 3. Sidebar Variant: Subtle, compact item at sidebar bottom */}
      {variant === 'sidebar' && (
        <div className="mx-3 my-2">
          {isInstalled ? (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium text-emerald-700 truncate">App đã cài trên thiết bị</span>
            </div>
          ) : (
            <button
              onClick={handleClick}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer group"
              title="Tải ứng dụng QClass về máy tính hoặc điện thoại (PWA)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Download className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-[11px]">Tải App về máy (PWA)</span>
              </div>
              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                PWA
              </span>
            </button>
          )}
        </div>
      )}

      {/* 4. Menu Item Variant (Used in Drawer / More menus) */}
      {variant === 'menu-item' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-all cursor-pointer ${className}`}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800">
              Tải App QClass về máy (PWA)
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              Mở 1 chạm toàn màn hình, không vướng trình duyệt
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      )}

      {/* 5. Pill Variant */}
      {variant === 'pill' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tải App</span>
        </button>
      )}

      {/* 6. Standard Button Variant */}
      {variant === 'button' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Tải & Cài đặt App (PWA)</span>
        </button>
      )}

      {/* 7. Full Card Variant */}
      {variant === 'card' && (
        <div className={`p-6 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-3xl border-2 border-blue-200 shadow-sm space-y-4 ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shrink-0">
                <Download className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Cài đặt QClass ra Màn hình Desktop & Điện thoại
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Mở 1 chạm tức thì, không vướng thanh địa chỉ trình duyệt, hoạt động mượt mà.
                </p>
              </div>
            </div>
            <button
              onClick={handleClick}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Cài Đặt Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* Shared Installation Modal Guide */}
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
