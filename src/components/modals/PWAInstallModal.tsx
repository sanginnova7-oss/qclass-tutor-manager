import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallStatus('Đang mở hộp thoại cài đặt hệ thống...');
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('Cài đặt thành công! Đang chuyển chế độ...');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (result === 'dismissed') {
      setInstallStatus('Bạn đã hủy cài đặt.');
      setTimeout(() => setInstallStatus(null), 2500);
    } else {
      setInstallStatus(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding - Roomy & Premium */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center shrink-0 ring-4 ring-white/20">
              <img src="/icon.svg" alt="QClass Icon" className="w-full h-full object-contain" />
            </div>
            <div className="pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Ứng dụng Web cấp tiến (PWA)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mt-1.5 text-white tracking-tight">
                Cài đặt QClass Tutor
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Ra Màn hình Desktop máy tính (PC/Mac) hoặc Màn hình chính Điện thoại
              </p>
            </div>
          </div>
        </div>

        {/* Status or Direct Install Prompt Button - Spacious */}
        <div className="p-6 sm:p-8 pb-0">
          {isInstalled ? (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-4 text-emerald-900">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-base text-emerald-950">
                  Ứng dụng đã được cài đặt trên thiết bị này!
                </p>
                <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                  Bạn có thể mở QClass trực tiếp từ biểu tượng ngoài màn hình chính để dùng toàn màn hình, mượt mà và không vướng thanh địa chỉ trình duyệt.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border-2 border-blue-300 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base font-extrabold text-blue-950 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Thiết bị hỗ trợ cài đặt tự động 1 chạm
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Nhấn nút bên dưới để thêm ngay biểu tượng QClass ra màn hình chính của bạn
                  </p>
                </div>
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600"></span>
                </span>
              </div>

              <button
                onClick={handleNativeInstall}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:bg-blue-800 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5 text-white" />
                <span>CÀI ĐẶT NGAY RA MÀN HÌNH</span>
              </button>

              {installStatus && (
                <p className="text-center text-xs font-bold text-blue-800 animate-pulse">
                  {installStatus}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Platform Selection Tabs - Roomy */}
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Hướng dẫn cài đặt chi tiết từng bước:
          </p>

          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Máy tính PC / Mac</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone / iPad</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Điện thoại Android</span>
            </button>
          </div>

          {/* Tab Content: Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-4 text-xs sm:text-sm bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Cách 1: Nút Cài đặt trên thanh địa chỉ URL</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Nhìn vào góc phải thanh địa chỉ (URL) của trình duyệt <strong>Chrome</strong> hoặc <strong>Microsoft Edge</strong>, bạn sẽ thấy biểu tượng <strong>Cài đặt (Install ⊕ hoặc biểu tượng máy tính 💻)</strong>. Nhấp vào đó và chọn <strong>"Cài đặt"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Cách 2: Qua Menu trình duyệt (3 dấu chấm)</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt &rarr; Chọn <strong>"Lưu và chia sẻ"</strong> (hoặc <strong>"Cài đặt QClass"</strong>) &rarr; Nhấn <strong>"Cài đặt"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Sau khi cài đặt:
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Biểu tượng <strong>QClass Tutor</strong> sẽ nằm trên màn hình Desktop và thanh Taskbar của máy tính. Mở lên sẽ chạy toàn màn hình, mượt mà và độc lập như một phần mềm Windows/macOS!
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: iOS (iPhone / iPad Safari) */}
          {activeTab === 'ios' && (
            <div className="space-y-4 text-xs sm:text-sm bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Mở bằng trình duyệt Safari</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Nhấn vào nút <strong>Chia sẻ (Share)</strong> biểu tượng ô vuông có mũi tên trỏ lên <Share2 className="w-4 h-4 inline text-blue-600 mx-1" /> ở thanh công cụ dưới đáy màn hình Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Chọn "Thêm vào MH chính"</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Cuộn bảng tùy chọn xuống và chạm vào dòng <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> có icon dấu cộng <PlusSquare className="w-4 h-4 inline text-slate-700 mx-1" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Xác nhận Thêm (Add)</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Chạm nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Trải nghiệm trên iPhone:
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ứng dụng hiển thị icon QClass chuyên nghiệp trên màn hình chính của iPhone/iPad, mở không cần Safari URL bar, hỗ trợ giáo viên và phụ huynh điểm danh, tra cứu điểm cực kỳ tiện lợi!
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4 text-xs sm:text-sm bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Mở bằng Chrome hoặc Cốc Cốc</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Nếu có thông báo <strong>"Thêm QClass vào Màn hình chính"</strong> xuất hiện ở chân trang, hãy nhấn <strong>"Cài đặt"</strong> ngay lập tức.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 text-sm">Hoặc mở Menu 3 chấm (⋮)</strong>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Chạm biểu tượng <strong>3 chấm (⋮)</strong> ở góc trên bên phải màn hình Chrome &rarr; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Trải nghiệm trên Android:
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Chạy như ứng dụng APK tải về, tự động tối ưu hóa bộ nhớ đệm, hoạt động siêu mượt và hỗ trợ thông báo tức thời.
                </p>
              </div>
            </div>
          )}

          {/* Benefits Bullet Grid - Roomy */}
          <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">Toàn màn hình</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">Mở 1 chạm tức thì</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">Tự động cập nhật</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">Siêu nhẹ &lt; 2MB</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tương thích Windows, macOS, Android & iOS
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
