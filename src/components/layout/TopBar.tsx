import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Calendar, CreditCard, UserPlus, AlertCircle, Sparkles, FileSpreadsheet, Radio } from 'lucide-react';
import { NavTab } from './Sidebar';
import { db } from '../../services/db';
import { formatDateVN } from '../../utils/formatters';
import { realtimeService, RealtimeState } from '../../services/realtimeService';
import { RealtimeStatusModal } from '../modals/RealtimeStatusModal';

interface TopBarProps {
  currentTab: NavTab;
  onOpenSearch: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenAddPayment: () => void;
  onOpenAddStudent: () => void;
  onSelectStudent: (studentId: string) => void;
  onOpenCopilot?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenSearch,
  onOpenCommandPalette,
  onOpenGoogleSheets,
  onOpenAddPayment,
  onOpenAddStudent,
  onSelectStudent,
  onOpenCopilot,
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [isRealtimeModalOpen, setIsRealtimeModalOpen] = useState(false);
  const [rtStatus, setRtStatus] = useState<RealtimeState>(() => realtimeService.getState());

  useEffect(() => {
    return realtimeService.subscribeStatus((state) => {
      setRtStatus(state);
    });
  }, []);

  const todayStr = formatDateVN(new Date());

  const summaries = db.getAllTuitionSummaries();
  const lowLessonsStudents = summaries.filter((s) => s.remainingLessons <= 2);

  const TAB_TITLES: Record<NavTab, string> = {
    dashboard: 'Tổng quan hoạt động',
    'ai-workspace': 'AI Workspace V4 · Soạn giáo án & Sinh đề thi',
    adaptive: 'Bản đồ kiến thức & Lộ trình thích ứng',
    students: 'Danh sách học sinh',
    classes: 'Quản lý lớp học',
    attendance: 'Điểm danh buổi học',
    tuition: 'Quản lý học phí & Gói học',
    academic: 'Học tập & Điểm số',
    enrollment: 'Tuyển sinh & Học thử CRM',
    questions: 'Ngân hàng đề thi & Trắc nghiệm',
    centers: 'Cơ sở, Phòng học & Giáo viên',
    tasks: 'Nhiệm vụ & Tự động hóa',
    reports: 'Báo cáo & Tăng trưởng',
    settings: 'Cài đặt hệ thống',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Current Page Title & Date */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap truncate">
            {TAB_TITLES[currentTab]}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hôm nay: {todayStr}</span>
            </span>
            <span>·</span>
            <span className="text-blue-600 font-medium">Toán Thầy Quang</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Global Search & Command Palette Trigger Button */}
      <div className="flex-1 max-w-md mx-2">
        <button
          onClick={onOpenCommandPalette || onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            <span className="truncate">Lệnh nhanh (Ctrl+K), tìm học sinh, lớp, đề thi...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600 bg-white rounded border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
              /
            </kbd>
          </div>
        </button>
      </div>

      {/* Zone 3: Quick Action & Alerts */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tuition Alert Notification Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            title="Cảnh báo học phí"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {lowLessonsStudents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showAlertsDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Cảnh báo học phí ({lowLessonsStudents.length})
                </span>
                <span className="text-[11px] text-slate-400">Còn ≤ 2 buổi</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {lowLessonsStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tất cả học sinh đều còn đủ buổi học.
                  </div>
                ) : (
                  lowLessonsStudents.map((item) => (
                    <div
                      key={item.student.id}
                      className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                    >
                      <button
                        onClick={() => {
                          onSelectStudent(item.student.id);
                          setShowAlertsDropdown(false);
                        }}
                        className="text-left min-w-0 flex-1"
                      >
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {item.student.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Khối {item.student.grade} · PH: {item.student.parentPhone}
                        </p>
                      </button>
                      <span
                        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                          item.remainingLessons <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : item.remainingLessons === 1
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.remainingLessons === 0 ? 'Hết 0 buổi' : `Còn ${item.remainingLessons} b`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Realtime Status Indicator Badge */}
        <button
          onClick={() => setIsRealtimeModalOpen(true)}
          title="Trạng thái đồng bộ Real-time & Kết nối đa thiết bị"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
            rtStatus.status === 'connected'
              ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100'
              : 'text-amber-700 bg-amber-50/90 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {rtStatus.status === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                rtStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="hidden sm:inline font-mono text-[11px]">
            {rtStatus.status === 'connected'
              ? `Realtime (${rtStatus.connectedClientsCount})`
              : 'Realtime'}
          </span>
        </button>

        {/* Realtime Status Modal */}
        <RealtimeStatusModal
          isOpen={isRealtimeModalOpen}
          onClose={() => setIsRealtimeModalOpen(false)}
        />

        {/* Google Sheets Sync Button */}
        {onOpenGoogleSheets && (
          <button
            onClick={onOpenGoogleSheets}
            title="Đồng bộ Google Sheets & Google Drive"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Google Sheets</span>
          </button>
        )}

        {/* AI Copilot Button */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        {/* Quick Add Student Button (Desktop) */}
        <button
          onClick={onOpenAddStudent}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 text-slate-600" />
          <span>+ Học sinh</span>
        </button>

        {/* Primary CTA: Collect Tuition */}
        <button
          onClick={onOpenAddPayment}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <CreditCard className="w-4 h-4" />
          <span>Thu học phí</span>
        </button>
      </div>
    </header>
  );
};
