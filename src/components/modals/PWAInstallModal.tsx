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
    setInstallStatus('Đang mở hộp thoại cài đặt...');
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('Cài đặt thành công!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (result === 'dismissed') {
      setInstallStatus('Bạn đã hủy cài đặt.');
      setTimeout(() => setInstallStatus(null), 2500);
    } else {
      // Manual fallback instructions
      setInstallStatus(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="QClass Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Ứng dụng Web cấp tiến (PWA)
              </div>
              <h2 className="text-xl font-bold mt-1 text-white tracking-tight">
                Cài đặt QClass Tutor
              </h2>
              <p className="text-xs text-blue-100">
                Ra màn hình Desktop máy tính hoặc Màn hình chính Điện thoại
              </p>
            </div>
          </div>
        </div>

        {/* Status or Direct Install Prompt Button */}
        <div className="p-5 pb-0">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Ứng dụng đã được cài đặt trên thiết bị này!</p>
                <p className="text-emerald-700">
                  Bạn có thể mở QClass trực tiếp từ biểu tượng ngoài màn hình chính để dùng toàn màn hình.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900">Thiết bị hỗ trợ cài đặt tự động</p>
                  <p className="text-[11px] text-blue-700">Nhấn nút bên dưới để thêm ngay biểu tượng ra màn hình</p>
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                <span>Cài Đặt Ngay Ra Màn Hình</span>
              </button>
              {installStatus && (
                <p className="text-center text-xs font-medium text-blue-800 animate-pulse">
                  {installStatus}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Platform Selection Tabs */}
        <div className="p-5">
          <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
            Hướng dẫn chi tiết theo thiết bị của bạn:
          </p>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Máy tính PC</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
          </div>

          {/* Tab Content: Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Cách 1: Nút Cài đặt trên thanh địa chỉ</strong>
                  <p className="text-slate-600 mt-0.5">
                    Nhìn vào góc phải thanh địa chỉ (URL) của trình duyệt Chrome hoặc Edge, tìm biểu tượng <strong>Cài đặt (Install ⊕ / 💻)</strong> và nhấp vào.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900">Cách 2: Qua Menu trình duyệt</strong>
                  <p className="text-slate-600 mt-0.5">
                    Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt &rarr; Chọn <strong>"Lưu và chia sẻ"</strong> (hoặc <strong>"Cài đặt QClass"</strong>) &rarr; Nhấn <strong>"Cài đặt"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Sau khi cài đặt:
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Biểu tượng <strong>QClass Tutor</strong> sẽ nằm trên màn hình Desktop và thanh Taskbar của máy tính. Mở lên sẽ chạy toàn màn hình, mượt mà và độc lập như một phần mềm Windows/macOS!
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: iOS (iPhone / iPad Safari) */}
          {activeTab === 'ios' && (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Mở bằng trình duyệt Safari</strong>
                  <p className="text-slate-600 mt-0.5">
                    Nhấn vào nút <strong>Chia sẻ (Share)</strong> biểu tượng ô vuông có mũi tên trỏ lên <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> ở thanh công cụ dưới đáy màn hình Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900">Chọn "Thêm vào MH chính"</strong>
                  <p className="text-slate-600 mt-0.5">
                    Cuộn bảng tùy chọn xuống và chạm vào dòng <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> có icon <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-900">Xác nhận Thêm (Add)</strong>
                  <p className="text-slate-600 mt-0.5">
                    Chạm nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Trải nghiệm trên iPhone:
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Ứng dụng hiển thị icon QClass chuyên nghiệp trên màn hình chính của iPhone/iPad, mở không cần Safari URL bar, hỗ trợ giáo viên và phụ huynh điểm danh, tra cứu điểm cực kỳ tiện lợi!
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Android */}
          {activeTab === 'android' && (
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900">Mở bằng Chrome hoặc Cốc Cốc</strong>
                  <p className="text-slate-600 mt-0.5">
                    Nếu có banner <strong>"Thêm QClass vào Màn hình chính"</strong> xuất hiện ở chân trang, hãy nhấn <strong>"Cài đặt"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900">Hoặc mở Menu 3 chấm (⋮)</strong>
                  <p className="text-slate-600 mt-0.5">
                    Chạm biểu tượng <strong>3 chấm (⋮)</strong> ở góc trên bên phải màn hình Chrome &rarr; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Trải nghiệm trên Android:
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Chạy như ứng dụng APK tải về, tự động tối ưu hóa bộ nhớ đệm và hỗ trợ thông báo tức thời.
                </p>
              </div>
            </div>
          )}

          {/* Benefits Bullet Grid */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Toàn màn hình không viền</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Khởi động tức thì không độ trễ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Tự động cập nhật bản mới nhất</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Dung lượng siêu nhẹ (&lt; 2MB)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Hỗ trợ Windows, macOS, Android & iOS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
