import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  MoreHorizontal,
  BookOpen,
  BarChart3,
  Settings,
  X,
  UserPlus,
  Layers,
  Sparkles,
  BrainCircuit,
  Building2,
  CheckSquare,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { db } from '../../services/db';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const summaries = db.getAllTuitionSummaries();
  const lowCount = summaries.filter((s) => s.remainingLessons <= 2).length;

  const primaryTabs: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'tuition', label: 'Học phí', icon: CreditCard, badge: lowCount > 0 ? lowCount : undefined },
  ];

  const moreTabs: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }> = [
    { id: 'ai-workspace', label: 'AI Workspace V4', icon: Sparkles, desc: 'Soạn giáo án, sinh đề & phiếu' },
    { id: 'adaptive', label: 'Lộ trình AI Thích ứng', icon: BrainCircuit, desc: 'Bản đồ kiến thức & sai sót' },
    { id: 'classes', label: 'Quản lý lớp học', icon: GraduationCap, desc: 'Lịch học, danh sách lớp' },
    { id: 'academic', label: 'Học tập & Điểm số', icon: BookOpen, desc: 'Kiểm tra, bài tập, nhận xét' },
    { id: 'enrollment', label: 'Tuyển sinh CRM', icon: UserPlus, desc: 'Lead, học thử, chuyển đổi' },
    { id: 'questions', label: 'Ngân hàng đề thi', icon: Layers, desc: 'Câu hỏi trắc nghiệm & đề thi online' },
    { id: 'centers', label: 'Cơ sở & Giáo viên', icon: Building2, desc: 'Chi nhánh, phòng học, nhân sự' },
    { id: 'tasks', label: 'Nhiệm vụ & Tự động', icon: CheckSquare, desc: 'Task tự động & audit log' },
    { id: 'reports', label: 'Báo cáo & Tăng trưởng', icon: BarChart3, desc: 'Thống kê tài chính, điểm danh' },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, desc: 'Đơn giá, quy tắc trừ buổi, sao lưu' },
  ];

  const isMoreTabActive = [
    'ai-workspace',
    'adaptive',
    'classes',
    'academic',
    'enrollment',
    'questions',
    'centers',
    'tasks',
    'reports',
    'settings',
  ].includes(currentTab);

  return (
    <>
      {/* More Options Drawer Modal */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end p-4 animate-in fade-in duration-150"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 shadow-2xl space-y-3 mb-16 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-800">Các tính năng khác</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Install to Desktop/Mobile shortcut in drawer */}
            <PWAInstallButton variant="menu-item" />

            <div className="grid grid-cols-2 gap-2.5">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex flex-col items-start p-3 rounded-2xl text-left border transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
                    <span className="font-semibold text-xs leading-tight">{tab.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{tab.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setShowMoreMenu(false);
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isMoreTabActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Thêm</span>
        </button>
      </div>
    </>
  );
};
