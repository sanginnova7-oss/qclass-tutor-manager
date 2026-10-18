import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  Globe,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Radio,
} from 'lucide-react';
import { PortalType, UserProfile } from '../../types';
import { db } from '../../services/db';
import { realtimeService, RealtimeState } from '../../services/realtimeService';
import { RealtimeStatusModal } from '../modals/RealtimeStatusModal';

interface PortalSwitcherProps {
  currentPortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  onOpenCopilot?: () => void;
}

export const PortalSwitcher: React.FC<PortalSwitcherProps> = ({
  currentPortal,
  onPortalChange,
  currentUser,
  onUserChange,
  onOpenCopilot,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isRtModalOpen, setIsRtModalOpen] = useState(false);
  const [rtState, setRtState] = useState<RealtimeState>(() => realtimeService.getState());

  React.useEffect(() => {
    return realtimeService.subscribeStatus((state) => {
      setRtState(state);
    });
  }, []);

  const users = db.getAllUsers();
  const students = db.getStudents();

  const portals: Array<{
    id: PortalType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }> = [
    { id: 'teacher', label: 'Cổng Giáo Viên', icon: GraduationCap, desc: 'Quản trị toàn diện lớp & tài chính' },
    { id: 'student', label: 'Cổng Học Sinh', icon: Users, desc: 'Lịch học, bài tập & kiểm tra online' },
    { id: 'parent', label: 'Cổng Phụ Huynh', icon: HeartHandshake, desc: 'Chuyên cần, học phí & quét mã QR' },
    { id: 'public', label: 'Cổng Tuyển Sinh', icon: Globe, desc: 'Trang đăng ký học thử trực tuyến' },
  ];

  const handleSelectUser = (u: UserProfile) => {
    onUserChange(u);
    setShowUserDropdown(false);
    // Auto-switch portal matching user role
    if (u.role === 'student') {
      onPortalChange('student');
    } else if (u.role === 'parent') {
      onPortalChange('parent');
    } else {
      onPortalChange('teacher');
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs px-4 md:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
      {/* 4 Portal Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mr-2 hidden sm:inline">
          Không gian trải nghiệm V3:
        </span>
        {portals.map((p) => {
          const Icon = p.icon;
          const isActive = currentPortal === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPortalChange(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role & Persona Switcher */}
      <div className="flex items-center gap-3">
        {currentPortal === 'teacher' && onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Copilot V3</span>
          </button>
        )}

        {/* Realtime Live Pulse Badge */}
        <button
          onClick={() => setIsRtModalOpen(true)}
          title="Trạng thái Đồng bộ Real-time đa thiết bị"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
            rtState.status === 'connected'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/80'
              : 'bg-amber-950/60 border-amber-500/30 text-amber-300 hover:bg-amber-900/80'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {rtState.status === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                rtState.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="hidden sm:inline">
            {rtState.status === 'connected' ? `Live (${rtState.connectedClientsCount})` : 'Connecting...'}
          </span>
        </button>

        <RealtimeStatusModal isOpen={isRtModalOpen} onClose={() => setIsRtModalOpen(false)} />

        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors cursor-pointer border border-slate-700"
          >
            <div className="w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold flex items-center justify-center text-white">
              {currentUser.avatar || 'U'}
            </div>
            <span className="font-semibold text-slate-100 max-w-[130px] truncate">
              {currentUser.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 uppercase font-mono">
              {currentUser.role === 'admin'
                ? 'Admin'
                : currentUser.role === 'teacher'
                ? 'Giáo viên'
                : currentUser.role === 'assistant'
                ? 'Trợ giảng'
                : currentUser.role === 'student'
                ? 'Học sinh'
                : 'Phụ huynh'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-1 w-64 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chuyển đổi vai trò người dùng (Demo):
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {u.avatar || u.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
