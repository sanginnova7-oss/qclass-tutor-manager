import React from 'react';
import {
  Users,
  GraduationCap,
  CreditCard,
  AlertTriangle,
  CalendarCheck,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Phone,
  MessageSquare,
  TrendingUp,
  Sparkles,
  BrainCircuit,
  Building2,
  CheckSquare,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateTimeVN, formatDateVN, formatVND } from '../../utils/formatters';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenAttendanceForClass: (classId: string) => void;
  onOpenPaymentForStudent: (studentId: string) => void;
  onOpenParentMessageForStudent: (studentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAttendanceForClass,
  onOpenPaymentForStudent,
  onOpenParentMessageForStudent,
  onSelectStudent,
}) => {
  const students = db.getStudents();
  const classes = db.getClasses().filter((c) => c.status === 'active');
  const payments = db.getPayments();
  const activities = db.getActivities();
  const summaries = db.getAllTuitionSummaries();
  const settings = db.getSettings();

  const activeStudents = students.filter((s) => s.status === 'active');
  const teacherGreeting = settings.teacherName || 'Thầy Nguyễn Văn Sang';

  // Revenue this month (e.g. October 2026)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRevenue = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Low lessons students: remaining <= 2
  const lowLessonSummaries = summaries
    .filter((s) => s.student.status === 'active' && s.remainingLessons <= 2)
    .sort((a, b) => a.remainingLessons - b.remainingLessons);

  // Today's classes simulation:
  // Map day of week (e.g., 0 = Chủ nhật, 1 = Thứ 2, 2 = Thứ 3, etc.)
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayDayName = dayNames[new Date().getDay()];
  const todayClasses = classes.filter((c) =>
    c.scheduleDays.some((day) => day.toLowerCase().includes(todayDayName.toLowerCase()))
  );

  // If none scheduled on this exact day, fallback to showing active upcoming classes so user can test immediately
  const displayClasses = todayClasses.length > 0 ? todayClasses : classes.slice(0, 2);

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-xs mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayDayName}, ngày {formatDateVN(new Date())}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Chào {teacherGreeting}! Chúc thầy buổi dạy hiệu quả.
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Hệ thống đang quản lý <strong className="text-white">{activeStudents.length} học sinh</strong> trong <strong className="text-white">{classes.length} lớp học</strong>. Có <strong className="text-amber-200">{lowLessonSummaries.length} học sinh</strong> sắp hết buổi cần thu học phí chu kỳ mới.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Điểm danh lớp ngay</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Học sinh đang học</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {activeStudents.length}
            </span>
            <span className="text-xs text-slate-400">/ {students.length} tổng số</span>
          </div>
          <p className="text-[11px] text-blue-600 group-hover:underline mt-2 flex items-center gap-1 font-medium">
            <span>Xem danh sách</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Classes */}
        <div
          onClick={() => onNavigateTab('classes')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Lớp đang hoạt động</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {classes.length}
            </span>
            <span className="text-xs text-slate-400">lớp Toán</span>
          </div>
          <p className="text-[11px] text-indigo-600 group-hover:underline mt-2 flex items-center gap-1 font-medium">
            <span>Quản lý lịch học</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Monthly Revenue */}
        <div
          onClick={() => onNavigateTab('tuition')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Doanh thu tháng này</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatVND(monthRevenue)}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 group-hover:underline mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Xem lịch sử thu</span>
          </p>
        </div>

        {/* Low lesson alert count */}
        <div
          onClick={() => onNavigateTab('tuition')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sắp hết buổi (≤ 2b)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              {lowLessonSummaries.length}
            </span>
            <span className="text-xs text-rose-500 font-medium">em cần thu phí</span>
          </div>
          <p className="text-[11px] text-rose-600 group-hover:underline mt-2 flex items-center gap-1 font-medium">
            <span>Thu học phí & nhắn PH</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* V4 AI-Native Operating Console Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white border border-indigo-900/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">QClass AI Operating System V4</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Bản đồ năng lực thích ứng, soạn bài 90 phút, sinh đề thi chuẩn ma trận & quản lý chuỗi cơ sở
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('ai-workspace')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mở AI Workspace</span>
            </button>
            <button
              onClick={() => onNavigateTab('adaptive')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lộ trình thích ứng</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <button
            onClick={() => onNavigateTab('ai-workspace')}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold text-white">Soạn giáo án 90p</span>
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Khởi động, ví dụ, bẫy sai lầm</p>
          </button>

          <button
            onClick={() => onNavigateTab('adaptive')}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold text-white">Sổ tay sai sót</span>
              <BrainCircuit className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Phân loại 6 nhóm lỗi thường gặp</p>
          </button>

          <button
            onClick={() => onNavigateTab('centers')}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold text-white">Hệ thống cơ sở</span>
              <Building2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Cầu Giấy, Đống Đa & Phòng học</p>
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold text-white">Nhiệm vụ & Tự động</span>
              <CheckSquare className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">Quy trình tự động hóa & Audit log</p>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Today Schedule & Tuition Alerts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Lịch học các lớp hôm nay</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {displayClasses.length} lớp học
              </span>
            </div>

            <div className="space-y-3">
              {displayClasses.map((c) => {
                const todaySched = c.schedules?.find(
                  (s) => s.day.toLowerCase() === todayDayName.toLowerCase()
                ) || c.schedules?.[0];
                const displayStart = todaySched?.startTime || c.startTime;
                const displayEnd = todaySched?.endTime || c.endTime;
                const displayRoom = todaySched?.room || c.room || 'Phòng học chính';
                const hasCustomSchedule =
                  c.schedules &&
                  c.schedules.length > 1 &&
                  c.schedules.some(
                    (s) =>
                      s.startTime !== c.schedules![0].startTime ||
                      s.endTime !== c.schedules![0].endTime
                  );

                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900">{c.name}</h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                          Khối {c.grade}
                        </span>
                        {hasCustomSchedule && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded border border-indigo-100">
                            Giờ riêng từng ngày
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="font-mono tabular-nums font-medium text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          🕒 {displayStart} – {displayEnd}
                        </span>
                        <span>·</span>
                        <span>👥 {c.studentIds.length} học sinh</span>
                        <span>·</span>
                        <span>📍 {displayRoom}</span>
                      </div>
                    </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenAttendanceForClass(c.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Điểm danh</span>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Tuition Alerts List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Cảnh báo học sinh sắp hết buổi ({lowLessonSummaries.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('tuition')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Xem tất cả
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Quy tắc cảnh báo: <span className="text-rose-600 font-medium">0 buổi (đỏ)</span>,{' '}
              <span className="text-orange-600 font-medium">1 buổi (cam)</span>,{' '}
              <span className="text-amber-600 font-medium">2 buổi (vàng)</span>.
            </p>

            <div className="divide-y divide-slate-100">
              {lowLessonSummaries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Không có học sinh nào sắp hết buổi học.
                </div>
              ) : (
                lowLessonSummaries.slice(0, 6).map((item) => {
                  const rem = item.remainingLessons;
                  const isRed = rem === 0;
                  const isOrange = rem === 1;

                  return (
                    <div
                      key={item.student.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                    >
                      <button
                        onClick={() => onSelectStudent(item.student.id)}
                        className="text-left flex items-center gap-3 min-w-0"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl font-mono font-bold flex items-center justify-center text-xs shrink-0 ${
                            isRed
                              ? 'bg-rose-100 text-rose-700'
                              : isOrange
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {rem}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-semibold text-slate-900 hover:text-blue-600 truncate">
                            {item.student.fullName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            Khối {item.student.grade} · PH: {item.student.parentName} ({item.student.parentPhone})
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => onOpenParentMessageForStudent(item.student.id)}
                          className="px-2.5 py-1.5 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg font-medium flex items-center gap-1 transition-colors"
                          title="Nhắn tin học phí"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Nhắn PH</span>
                        </button>
                        <button
                          onClick={() => onOpenPaymentForStudent(item.student.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thu tiền</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Recent Activity Feed & Fast Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Hoạt động lớp học gần đây</h3>
              <span className="text-xs text-slate-400">Nhật ký</span>
            </div>

            <div className="space-y-3.5">
              {activities.slice(0, 8).map((act) => {
                const isPayment = act.type === 'payment';
                const isAttendance = act.type === 'attendance';
                const isScore = act.type === 'score';

                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isPayment
                          ? 'bg-emerald-100 text-emerald-700'
                          : isAttendance
                          ? 'bg-blue-100 text-blue-700'
                          : isScore
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isPayment ? (
                        <CreditCard className="w-3.5 h-3.5" />
                      ) : isAttendance ? (
                        <CalendarCheck className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                      <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                        {act.description}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5 font-mono">
                        {formatDateTimeVN(act.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher Quick Info & Bank Account Preview */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông tin chuyển khoản học phí
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-medium text-white">{db.getSettings().teacherBankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {db.getSettings().teacherBankAccount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-medium text-white">{db.getSettings().teacherBankHolder}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              Thông tin này được tự động chèn vào tin nhắn Zalo/SMS khi gửi phụ huynh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
