import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Maximize2,
  Wifi,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../modals/PWAInstallModal';

interface PWAInstallBannerProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = '',
  defaultExpanded = true,
}) => {
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // If dismissed by user, allow a compact re-open strip
  if (isDismissed) {
    return (
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-blue-950">
            Khu vực cài đặt ứng dụng QClass ra Desktop / Điện thoại
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(false)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Mở lại khu vực cài đặt
          </button>
        </div>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstallStatus('Đang mở hộp thoại cài đặt...');
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallStatus('Cài đặt thành công!');
        setTimeout(() => setInstallStatus(null), 3000);
      } else {
        setInstallStatus(null);
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-400/30 transition-all ${className}`}
      >
        {/* Decorative background glow rings */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top actions: Minimize & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            title="Đóng banner này"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-1">
          {/* Header row with Large App Icon & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Big Prominent Icon */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center ring-4 ring-white/20">
                <img
                  src="/icon.svg"
                  alt="QClass Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border-2 border-white">
                PWA
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 flex-1 pr-12 sm:pr-16">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-xs font-semibold text-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Khu vực cài đặt ứng dụng
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-medium text-emerald-300">
                  <Monitor className="w-3 h-3" /> Desktop PC
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-medium text-emerald-300">
                  <Smartphone className="w-3 h-3" /> iPhone & Android
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Cài đặt QClass ra Màn hình Desktop máy tính & Điện thoại
              </h3>

              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
                Cài đặt ứng dụng trực tiếp ra màn hình chính để mở tức thì 1 chạm, sử dụng toàn màn hình không vướng thanh địa chỉ trình duyệt, hoạt động mượt mà và lưu trữ dữ liệu an toàn.
              </p>
            </div>
          </div>

          {/* Expanded Section with Feature Highlights and Big Action Buttons */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-white/15 space-y-6">
              {/* 4 Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Khởi động 1 chạm</h4>
                    <p className="text-[11px] text-blue-200/90 mt-0.5">
                      Mở trực tiếp từ biểu tượng ngoài desktop hoặc màn hình điện thoại
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Toàn màn hình tiện lợi</h4>
                    <p className="text-[11px] text-blue-200/90 mt-0.5">
                      Giao diện rộng rãi không bị chiếm diện tích bởi thanh URL trình duyệt
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Hỗ trợ Offline & Cache</h4>
                    <p className="text-[11px] text-blue-200/90 mt-0.5">
                      Tải trang cực nhanh trong 0.2s, dung lượng nhẹ &lt; 2MB
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-400/20 text-purple-300 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Đồng bộ Đa thiết bị</h4>
                    <p className="text-[11px] text-blue-200/90 mt-0.5">
                      Dữ liệu điểm danh, học phí tự động liên thông PC và điện thoại
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar: Big, High-Contrast & Spacious */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
                {isInstalled ? (
                  <div className="flex-1 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-white">
                        Ứng dụng đã được cài đặt trên thiết bị của bạn!
                      </p>
                      <p className="text-xs text-emerald-200">
                        Bạn có thể mở QClass từ màn hình chính Desktop hoặc điện thoại để dùng toàn màn hình bất cứ lúc nào.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 sm:flex-none py-4 px-8 bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <span className="tracking-wide">CÀI ĐẶT RA MÀN HÌNH NGAY</span>
                    </button>

                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="py-4 px-6 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                    >
                      <span>Xem Hướng Dẫn Chi Tiết (PC / iOS / Android)</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </button>
                  </>
                )}
              </div>

              {installStatus && (
                <p className="text-xs font-semibold text-amber-300 animate-pulse">
                  {installStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Platform Installation Modal */}
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
