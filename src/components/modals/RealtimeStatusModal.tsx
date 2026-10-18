import React, { useEffect, useState } from 'react';
import {
  realtimeService,
  RealtimeState,
} from '../../services/realtimeService';
import { db } from '../../services/db';
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Users,
  Activity,
  CheckCircle,
  Send,
  X,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RealtimeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RealtimeStatusModal: React.FC<RealtimeStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rtState, setRtState] = useState<RealtimeState>(() => realtimeService.getState());
  const [isPulling, setIsPulling] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = realtimeService.subscribeStatus((state) => {
      setRtState(state);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForcePull = async () => {
    setIsPulling(true);
    await realtimeService.forcePullFromServer();
    setTimeout(() => {
      setIsPulling(false);
    }, 600);
  };

  const handleForcePush = () => {
    realtimeService.broadcastLocalChange(db.exportFullStateObject(), {
      id: `evt-manual-${Date.now()}`,
      type: 'system',
      title: 'Đồng bộ toàn bộ dữ liệu',
      description: 'Giáo viên vừa phát gói đồng bộ toàn diện sang các thiết bị',
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestBroadcast = () => {
    setTestSent(true);
    realtimeService.dispatchEvent({
      type: 'system',
      title: 'Kiểm tra kết nối Real-time',
      description: 'Tín hiệu đồng bộ đa thiết bị và đa tab hoạt động hoàn hảo!',
      badge: 'Thành công',
    });
    setTimeout(() => setTestSent(false), 2000);
  };

  const isConnected = rtState.status === 'connected';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400">
              <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Trạng thái Cập nhật Real-time
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isConnected ? 'Trực tuyến' : 'Đang kết nối lại'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Đồng bộ hóa tức thì giữa Giáo viên, Học sinh và Phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                )}
                Kết nối WS
              </span>
              <div className="mt-2">
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {isConnected ? 'Hoạt động' : 'Chờ mạng'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Độ trễ: {rtState.latencyMs}ms
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Thiết bị online
              </span>
              <div className="mt-2">
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {rtState.connectedClientsCount} máy
                </span>
                <span className="text-[10px] text-slate-400">Đa cổng & Đa tab</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Lần đồng bộ
              </span>
              <div className="mt-2">
                <span className="text-sm font-bold text-slate-900 block truncate font-mono">
                  {rtState.lastSyncTime
                    ? new Date(rtState.lastSyncTime).toLocaleTimeString('vi-VN')
                    : 'Mới khởi động'}
                </span>
                <span className="text-[10px] text-slate-400">Tự động 100%</span>
              </div>
            </div>
          </div>

          {/* Real-time Architecture Highlights */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs text-blue-900">
            <div className="font-semibold flex items-center gap-1.5 text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Cơ chế Hoạt động Real-time Thông minh
            </div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <strong className="text-slate-800">WebSocket 2 chiều:</strong> Khi giáo viên điểm danh hoặc thu học phí, Cổng Phụ huynh & Học sinh cập nhật ngay lập tức không cần F5.
              </li>
              <li>
                <strong className="text-slate-800">BroadcastChannel liên tab:</strong> Đồng bộ tức thời 0ms giữa các tab trình duyệt cùng lúc.
              </li>
              <li>
                <strong className="text-slate-800">Thông báo & Chuông âm thanh:</strong> Phát tín hiệu chuông nhẹ và hiển thị thẻ thông báo nổi khi có sự kiện mới.
              </li>
            </ul>
          </div>

          {/* Sound Preferences & Controls */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              {rtState.soundEnabled ? (
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Volume2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-200 text-slate-500">
                  <VolumeX className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-800">Âm thanh thông báo sự kiện</p>
                <p className="text-[11px] text-slate-500">Phát tiếng chuông thanh khi có dữ liệu mới</p>
              </div>
            </div>
            <button
              onClick={() => realtimeService.toggleSound()}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                rtState.soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {rtState.soundEnabled ? 'Đang bật' : 'Đang tắt'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <button
              onClick={handleTestBroadcast}
              disabled={testSent}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              {testSent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Đã phát tín hiệu!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Thử nghiệm Real-time
                </>
              )}
            </button>

            <button
              onClick={handleForcePull}
              disabled={isPulling}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin text-blue-600' : ''}`} />
              Đồng bộ ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
