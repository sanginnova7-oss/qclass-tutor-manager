import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  GraduationCap,
  CreditCard,
  CalendarCheck,
  Sparkles,
  BrainCircuit,
  Building2,
  CheckSquare,
  Layers,
  ArrowRight,
  BookOpen,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatVND } from '../../utils/formatters';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectStudent: (studentId: string) => void;
  onOpenPayment: (studentId?: string) => void;
  onOpenAddStudent: () => void;
  onOpenGoogleSheets?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectStudent,
  onOpenPayment,
  onOpenAddStudent,
  onOpenGoogleSheets,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const students = db.getStudents();
  const classes = db.getClasses();
  const questions = db.getQuestionBank();
  const worksheets = db.getWorksheets();
  const summaries = db.getAllTuitionSummaries();

  useEffect(() => {
    inputRef.current?.focus();
  }, [isOpen]);

  const qLower = query.toLowerCase().trim();

  // Filter Quick Commands
  const COMMANDS = [
    {
      id: 'cmd-google-sheets',
      title: 'Đồng bộ Google Sheets & Google Drive (Tự động lưu trữ đám mây)',
      category: 'Đám mây & Dữ liệu',
      icon: FileSpreadsheet,
      action: () => {
        if (onOpenGoogleSheets) {
          onOpenGoogleSheets();
        } else {
          onNavigateTab('settings');
        }
        onClose();
      },
    },
    {
      id: 'cmd-attendance',
      title: 'Điểm danh buổi học',
      category: 'Hành động nhanh',
      icon: CalendarCheck,
      action: () => {
        onNavigateTab('attendance');
        onClose();
      },
    },
    {
      id: 'cmd-payment',
      title: 'Thu học phí gói mới',
      category: 'Hành động nhanh',
      icon: CreditCard,
      action: () => {
        onOpenPayment();
        onClose();
      },
    },
    {
      id: 'cmd-ai-workspace',
      title: 'Mở AI Workspace V4 (Soạn bài, sinh đề, chấm điểm)',
      category: 'Trí tuệ nhân tạo',
      icon: Sparkles,
      action: () => {
        onNavigateTab('ai-workspace');
        onClose();
      },
    },
    {
      id: 'cmd-adaptive',
      title: 'Học tập cá nhân hóa & Bản đồ tri thức (Adaptive Learning)',
      category: 'Học thuật',
      icon: BrainCircuit,
      action: () => {
        onNavigateTab('adaptive');
        onClose();
      },
    },
    {
      id: 'cmd-centers',
      title: 'Quản lý cơ sở, phòng học & đội ngũ giáo viên',
      category: 'Vận hành chuỗi',
      icon: Building2,
      action: () => {
        onNavigateTab('centers');
        onClose();
      },
    },
    {
      id: 'cmd-tasks',
      title: 'Nhiệm vụ nội bộ & Luồng kịch bản tự động',
      category: 'Vận hành',
      icon: CheckSquare,
      action: () => {
        onNavigateTab('tasks');
        onClose();
      },
    },
    {
      id: 'cmd-low-tuition',
      title: 'Lọc học sinh còn dưới 2 buổi học phí',
      category: 'Tìm kiếm thông minh',
      icon: CreditCard,
      action: () => {
        onNavigateTab('tuition');
        onClose();
      },
    },
    {
      id: 'cmd-add-student',
      title: 'Thêm học sinh mới vào hệ thống',
      category: 'Quản lý',
      icon: User,
      action: () => {
        onOpenAddStudent();
        onClose();
      },
    },
  ];

  const filteredCommands = COMMANDS.filter((c) =>
    !qLower ? true : c.title.toLowerCase().includes(qLower) || c.category.toLowerCase().includes(qLower)
  );

  // Filter Students
  const filteredStudents = qLower
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(qLower) ||
          s.parentPhone.includes(qLower) ||
          s.school.toLowerCase().includes(qLower)
      ).slice(0, 4)
    : [];

  // Filter Classes
  const filteredClasses = qLower
    ? classes.filter((c) => c.name.toLowerCase().includes(qLower)).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ lệnh hoặc tìm học sinh, lớp, câu hỏi... (VD: Điểm danh, AI, còn dưới 2 buổi)"
            className="w-full text-sm font-medium bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Commands */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Lệnh hệ thống & Điều hướng nhanh
            </div>
            <div className="space-y-1">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full p-2.5 rounded-2xl hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{cmd.title}</p>
                        <p className="text-[10px] text-slate-400">{cmd.category}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Students Matched */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                Học sinh tìm thấy
              </div>
              <div className="space-y-1">
                {filteredStudents.map((st) => {
                  const summary = summaries.find((s) => s.student.id === st.id);
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        onSelectStudent(st.id);
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-2xl hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {st.avatar || st.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{st.fullName}</p>
                          <p className="text-[10px] text-slate-400">Khối {st.grade} · {st.school}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Còn {summary?.remainingLessons ?? 0} buổi
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Classes Matched */}
          {filteredClasses.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                Lớp học tìm thấy
              </div>
              <div className="space-y-1">
                {filteredClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => {
                      onNavigateTab('attendance');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-2xl hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{cls.name}</p>
                        <p className="text-[10px] text-slate-400">{cls.studentIds.length} học sinh · {cls.scheduleDays.join(', ')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
