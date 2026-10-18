import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
  UserPlus,
  Layers,
  BrainCircuit,
  Building2,
  CheckSquare,
} from 'lucide-react';
import { db } from '../../services/db';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type NavTab =
  | 'dashboard'
  | 'ai-workspace'
  | 'adaptive'
  | 'students'
  | 'classes'
  | 'attendance'
  | 'tuition'
  | 'academic'
  | 'enrollment'
  | 'questions'
  | 'centers'
  | 'tasks'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const summaries = db.getAllTuitionSummaries();
  const lowLessonsCount = summaries.filter((s) => s.remainingLessons <= 2).length;
  const newLeadsCount = db.getLeads().filter((l) => l.stage === 'new').length;
  const pendingTasksCount = db.getTasks('today').length;

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    {
      id: 'ai-workspace',
      label: 'AI Workspace V4',
      icon: Sparkles,
      badgeColor: 'bg-indigo-600 text-white',
    },
    { id: 'adaptive', label: 'Học tập thích ứng', icon: BrainCircuit },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'classes', label: 'Lớp học', icon: GraduationCap },
    { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
    {
      id: 'tuition',
      label: 'Học phí',
      icon: CreditCard,
      badge: lowLessonsCount > 0 ? lowLessonsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'academic', label: 'Học tập & Bài tập', icon: BookOpen },
    {
      id: 'enrollment',
      label: 'Tuyển sinh & Học thử',
      icon: UserPlus,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
    },
    { id: 'questions', label: 'Ngân hàng đề thi', icon: Layers },
    { id: 'centers', label: 'Cơ sở & Giáo viên', icon: Building2 },
    {
      id: 'tasks',
      label: 'Nhiệm vụ & Tự động',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    { id: 'reports', label: 'Báo cáo & Tăng trưởng', icon: BarChart3 },
    { id: 'settings', label: 'Thiết lập hệ thống', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30">
          Q
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            QClass Tutor
          </h1>
          <p className="text-[11px] text-slate-500 truncate">Quản Lý Dạy Thêm Toán</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                    item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* PWA Install Desktop/Phone Button */}
      <PWAInstallButton variant="sidebar" />

      {/* Teacher Profile Card */}
      <div 
        onClick={() => onTabChange('settings')}
        className="p-3.5 border-t border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 m-3 rounded-2xl cursor-pointer transition-colors group"
        title="Nhấn để xem hoặc cập nhật thông tin Quản trị viên"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            NS
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-700">
              {db.getSettings().teacherName || 'Thầy Nguyễn Văn Sang'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {db.getSettings().teacherSubject || 'Toán học'} · {db.getSettings().teacherPhone || '0386493786'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
