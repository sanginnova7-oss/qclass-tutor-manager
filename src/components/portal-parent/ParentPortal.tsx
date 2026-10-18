import React, { useState } from 'react';
import {
  HeartHandshake,
  CalendarCheck,
  CreditCard,
  QrCode,
  Award,
  BookOpen,
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ChevronDown,
  User,
  Phone,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, formatDateTimeVN, formatVND } from '../../utils/formatters';
import { getVietQRUrl } from '../../utils/vietqr';
import { UserProfile } from '../../types';

interface ParentPortalProps {
  currentUser: UserProfile;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ currentUser }) => {
  const students = db.getStudents();
  const settings = db.getSettings();

  // Determine children linked to parent
  const parentChildren =
    currentUser.studentIds && currentUser.studentIds.length > 0
      ? students.filter((s) => currentUser.studentIds!.includes(s.id))
      : [students[0]];

  const [selectedChildId, setSelectedChildId] = useState<string>(parentChildren[0]?.id || students[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'academic' | 'tuition' | 'reports' | 'notifications'>('overview');
  const [copiedMemo, setCopiedMemo] = useState(false);

  const activeChild = students.find((s) => s.id === selectedChildId) || parentChildren[0] || students[0];
  const summary = db.getStudentTuitionSummary(activeChild?.id || '');
  const learningProfile = db.getStudentLearningProfile(activeChild?.id || '');
  const classes = db.getClasses().filter((c) => c.studentIds.includes(activeChild?.id || ''));
  const attendance = db.getAttendance().filter((a) => a.studentId === activeChild?.id);
  const payments = db.getPayments().filter((p) => p.studentId === activeChild?.id);
  const scores = db.getScores().filter((s) => s.studentId === activeChild?.id);
  const homework = db.getHomeworkResults().filter((h) => h.studentId === activeChild?.id);
  const notes = db.getNotes().filter((n) => n.studentId === activeChild?.id);
  const tests = db.getTests();

  const remainingLessons = summary?.remainingLessons ?? 0;
  const isLow = remainingLessons <= 2;

  // Next package cost
  const nextPackageCost = (settings.defaultPackageSize || 10) * (activeChild?.defaultTuitionRate || settings.defaultTuitionRate || 60000);
  const transferMemo = `HP ${activeChild?.fullName || ''} LOP ${activeChild?.grade || ''}`;

  // VietQR generation
  const qrUrl = getVietQRUrl({
    bankCode: settings.bankCode || 'MB',
    accountNo: settings.teacherBankAccount || '0386493786',
    accountName: settings.teacherBankHolder || 'NGUYEN VAN SANG',
    amount: nextPackageCost,
    memo: transferMemo,
  });

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(transferMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Welcome & Child Switcher Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
            Sổ Liên Lạc Điện Tử · QClass Parent
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Kính chào phụ huynh em {activeChild?.fullName}!
          </h2>
          <p className="text-xs text-slate-500">
            Khối {activeChild?.grade} ({activeChild?.school}) · Giáo viên phụ trách: {settings.teacherName}
          </p>
        </div>

        {/* Child Selector (if multiple children) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-500 font-medium">Chọn con:</span>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 outline-none focus:border-blue-500"
          >
            {students.slice(0, 5).map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.fullName} - Khối {ch.grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {[
          { id: 'overview', label: 'Tổng quan học tập', icon: HeartHandshake },
          { id: 'attendance', label: 'Chuyên cần & Điểm danh', icon: CalendarCheck, badge: attendance.length },
          { id: 'academic', label: 'Điểm số & Bài tập', icon: Award },
          { id: 'tuition', label: 'Học phí & Quét mã QR', icon: CreditCard, highlight: isLow },
          { id: 'reports', label: 'Báo cáo & Nhận xét', icon: FileText, badge: notes.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tuition Alert Banner if Low */}
          {isLow && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold">Nhắc nhở học phí chu kỳ mới</h4>
                  <p className="text-amber-800 mt-0.5">
                    Học sinh {activeChild?.fullName} hiện còn{' '}
                    <strong className="text-rose-600 font-mono text-sm">{remainingLessons} buổi học</strong>. Kính mong phụ huynh chuyển khoản hoàn tất học phí trước buổi học tiếp theo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('tuition')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                Quét mã QR thanh toán
              </button>
            </div>
          )}

          {/* 4 Core Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500">Số buổi còn lại</span>
              <p
                className={`text-2xl font-bold font-mono mt-1 ${
                  remainingLessons <= 1 ? 'text-rose-600' : remainingLessons === 2 ? 'text-amber-600' : 'text-emerald-700'
                }`}
              >
                {remainingLessons} buổi
              </p>
              <span className="text-[10px] text-slate-400">Gói 10 buổi trả trước</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500">Tỷ lệ chuyên cần</span>
              <p className="text-2xl font-bold text-blue-600 font-mono mt-1">
                {learningProfile.attendanceRate}%
              </p>
              <span className="text-[10px] text-slate-400">Đi học đúng giờ</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500">Điểm trung bình</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                {learningProfile.averageScore} / 10
              </p>
              <span className="text-[10px] text-slate-400">Khảo sát & Kiểm tra</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500">Hoàn thành bài tập</span>
              <p className="text-2xl font-bold text-indigo-600 font-mono mt-1">
                {learningProfile.homeworkRate}%
              </p>
              <span className="text-[10px] text-slate-400">Bài tập về nhà</span>
            </div>
          </div>

          {/* Next Class & Teacher Note */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Lớp học của con</span>
              </h3>
              {classes.map((cls) => (
                <div key={cls.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{cls.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Khối {cls.grade}
                    </span>
                  </div>

                  {cls.schedules && cls.schedules.length > 0 ? (
                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      {cls.schedules.map((s) => (
                        <div key={s.day} className="flex items-center justify-between text-slate-700">
                          <span className="font-semibold text-blue-800">{s.day}:</span>
                          <span className="font-mono font-medium">
                            🕒 {s.startTime} – {s.endTime}
                            {s.room && s.room !== cls.room ? ` (${s.room})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">
                      Lịch học: <strong>{cls.scheduleDays.join(', ')}</strong> ({cls.startTime} - {cls.endTime})
                    </p>
                  )}

                  <p className="text-slate-500 text-[11px] pt-1">
                    Địa điểm: {cls.room || 'Phòng học chính'}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Nhận xét gần nhất từ Thầy Quang</span>
              </h3>
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Chưa có nhận xét riêng.</p>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{notes[0].author}</span>
                    <span className="font-mono">{formatDateVN(notes[0].createdAt)}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">{notes[0].content}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Chi tiết các buổi điểm danh</h3>
              <p className="text-xs text-slate-500">Phụ huynh có thể kiểm tra từng buổi học và trừ tiền học phí</p>
            </div>
            <span className="text-xs font-bold text-blue-600">{attendance.length} buổi học</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Ngày học</th>
                  <th className="py-2.5 px-3">Tên buổi học</th>
                  <th className="py-2.5 px-3 text-center">Tình trạng</th>
                  <th className="py-2.5 px-3 text-center">Trừ học phí</th>
                  <th className="py-2.5 px-4">Ghi chú giáo viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium">{formatDateVN(rec.date)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{rec.sessionTitle}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'excused'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status === 'present' ? 'Có mặt' : rec.status === 'excused' ? 'Có phép' : 'Không phép'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {rec.lessonDeducted ? (
                        <span className="text-emerald-700">-1 buổi</span>
                      ) : (
                        <span className="text-slate-400">Giữ nguyên</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">{rec.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Kết quả bài kiểm tra của con</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {scores.map((sc) => {
                const test = tests.find((t) => t.id === sc.testId);
                return (
                  <div key={sc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{test?.title || 'Bài kiểm tra'}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{formatDateVN(test?.date)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {sc.score} / {test?.maxScore || 10} điểm
                      </span>
                      {sc.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{sc.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TUITION & VIETQR PAYMENT */}
      {activeTab === 'tuition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* VietQR Payment Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                Thanh toán học phí nhanh qua VietQR
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Gói học phí tiếp theo: {formatVND(nextPackageCost)}
              </h3>
              <p className="text-xs text-slate-500">
                Gói chuẩn {settings.defaultPackageSize || 10} buổi (Đơn giá: {formatVND(activeChild?.defaultTuitionRate || 60000)}/buổi)
              </p>
            </div>

            {/* QR Box & Bank Transfer Info */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
                <img
                  src={qrUrl}
                  alt="Mã QR nộp học phí VietQR"
                  className="w-44 h-44 object-contain"
                />
                <span className="block text-[10px] text-center text-slate-400 mt-1">Quét bằng mọi App Ngân hàng</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 w-full">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngân hàng:</span>
                  <strong className="text-slate-900">{settings.teacherBankName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số tài khoản:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{settings.teacherBankAccount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Chủ tài khoản:</span>
                  <strong className="text-slate-900">{settings.teacherBankHolder}</strong>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[11px]">Nội dung chuyển khoản (bắt buộc):</span>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mt-0.5">
                    <span className="font-mono font-bold text-blue-700">{transferMemo}</span>
                    <button
                      onClick={handleCopyMemo}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMemo ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Sau khi chuyển khoản, thầy Quang sẽ kiểm tra và xác nhận phiếu thu điện tử gửi về sổ liên lạc của phụ huynh trong vòng 24h.
            </p>
          </div>

          {/* Payment History (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch sử các lần đóng học phí ({payments.length})
            </h4>

            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-blue-600">{p.receiptNumber || p.id}</span>
                    <p className="text-[11px] text-slate-400 font-mono">{formatDateVN(p.paymentDate)}</p>
                    <p className="text-[10px] text-slate-500">{p.note || 'Đóng học phí'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 block">{formatVND(p.amount)}</span>
                    <span className="text-[10px] text-slate-500">+{p.lessonQuantity} buổi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Báo cáo học tập & Lời khuyên giáo viên</h3>
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <strong className="text-slate-700">{n.author}</strong>
                  <span className="font-mono">{formatDateTimeVN(n.createdAt)}</span>
                </div>
                <p className="text-slate-800 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
