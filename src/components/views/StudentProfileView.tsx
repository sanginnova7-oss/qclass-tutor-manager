import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Phone,
  School,
  User,
  MapPin,
  Clock,
  BookOpen,
  Award,
  Plus,
  AlertTriangle,
  Send,
  Edit,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, formatDateTimeVN, formatVND, STUDENT_STATUS_LABELS } from '../../utils/formatters';
import { StudentStatus } from '../../types';

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onOpenPayment: (studentId: string) => void;
  onOpenParentMessage: (studentId: string) => void;
  onOpenNote: (studentId: string) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onOpenPayment,
  onOpenParentMessage,
  onOpenNote,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'tuition' | 'academic' | 'notes'>('attendance');

  const summary = db.getStudentTuitionSummary(studentId);
  const classes = db.getClasses();
  const allAttendance = db.getAttendance().filter((a) => a.studentId === studentId);
  const payments = db.getPayments().filter((p) => p.studentId === studentId);
  const packages = db.getPackages().filter((p) => p.studentId === studentId);
  const scores = db.getScores().filter((s) => s.studentId === studentId);
  const homeworkResults = db.getHomeworkResults().filter((h) => h.studentId === studentId);
  const notes = db.getNotes().filter((n) => n.studentId === studentId);
  const tests = db.getTests();
  const homeworkList = db.getHomework();

  if (!summary) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-sm">Không tìm thấy thông tin học sinh.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 text-xs font-semibold text-blue-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { student, activePackage, totalLessonsPurchased, totalLessonsUsed, remainingLessons, totalAmountPaid, lastPaymentDate } = summary;
  const assignedClass = classes.find((c) => c.studentIds.includes(student.id));

  // Attendance stats
  const presentCount = allAttendance.filter((a) => a.status === 'present').length;
  const excusedCount = allAttendance.filter((a) => a.status === 'excused').length;
  const unexcusedCount = allAttendance.filter((a) => a.status === 'unexcused').length;
  const makeupCount = allAttendance.filter((a) => a.status === 'makeup').length;
  const totalSessions = allAttendance.length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + makeupCount) / totalSessions) * 100) : 100;

  // Academic stats
  const studentScores = scores.map((s) => s.score);
  const avgScore = studentScores.length > 0 ? (studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(1) : '-';
  const latestScore = studentScores.length > 0 ? studentScores[0] : '-';
  const completedHwCount = homeworkResults.filter((h) => h.status === 'completed').length;
  const hwCompletionRate = homeworkResults.length > 0 ? Math.round((completedHwCount / homeworkResults.length) * 100) : 100;

  // Package progress calculation
  const totalPackageLessons = activePackage?.totalLessons || 10;
  const usedInActivePackage = activePackage?.usedLessons || (totalPackageLessons - remainingLessons);
  const progressPercent = Math.min(100, Math.max(0, Math.round((usedInActivePackage / totalPackageLessons) * 100)));

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Back button & Title header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách học sinh</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenParentMessage(student.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Soạn tin nhắn PH</span>
          </button>
          <button
            onClick={() => onOpenPayment(student.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Thu học phí</span>
          </button>
        </div>
      </div>

      {/* Hero Student Information Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {student.fullName.split(' ').slice(-1)[0]?.slice(0, 1) || 'H'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
                <select
                  value={student.status}
                  onChange={(e) => db.setStudentStatus(student.id, e.target.value as StudentStatus)}
                  title="Nhấn để thay đổi trạng thái học sinh"
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border outline-none cursor-pointer transition-colors ${
                    STUDENT_STATUS_LABELS[student.status]?.color || 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <option value="active">Đang học</option>
                  <option value="paused">Tạm dừng</option>
                  <option value="stopped">Thôi học</option>
                </select>
              </div>
              <p className="text-xs text-slate-600">
                Khối {student.grade} · Trường: {student.school} · Ngày nhập học:{' '}
                {formatDateVN(student.enrollmentDate)}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                Lớp hiện tại: {assignedClass ? assignedClass.name : 'Chưa xếp lớp'}
              </p>
            </div>
          </div>

          {/* Quick Contact & Address Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Phụ huynh:</span>
              <strong className="text-slate-800">{student.parentName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">SĐT phụ huynh:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-medium text-slate-900">{student.parentPhone}</span>
                <a
                  href={`tel:${student.parentPhone.replace(/\D/g, '')}`}
                  className="text-blue-600 hover:text-blue-800 p-0.5"
                  title="Gọi điện"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            {student.studentPhone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SĐT học sinh:</span>
                <span className="font-mono text-slate-700">{student.studentPhone}</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 shrink-0">Địa chỉ:</span>
                <span className="text-slate-700 text-right truncate">{student.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tuition Information Banner & Progress Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tình trạng gói học phí trả trước</h3>
            <p className="text-xs text-slate-500">
              Đơn giá theo buổi: <strong className="text-slate-800 font-mono">{formatVND(student.defaultTuitionRate)}</strong> / buổi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                remainingLessons <= 0
                  ? 'bg-rose-100 text-rose-700'
                  : remainingLessons === 1
                  ? 'bg-orange-100 text-orange-700'
                  : remainingLessons === 2
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              Còn {remainingLessons} buổi học
            </span>
          </div>
        </div>

        {/* Progress Bar Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">
              Tiến độ gói: {usedInActivePackage} / {totalPackageLessons} buổi đã dùng
            </span>
            <span className="text-slate-800 font-bold font-mono">
              Còn lại: {remainingLessons} buổi
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                remainingLessons <= 0
                  ? 'bg-rose-500'
                  : remainingLessons <= 2
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* KPI Mini Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Tổng buổi đã mua:</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{totalLessonsPurchased} buổi</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Tổng buổi đã học:</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{totalLessonsUsed} buổi</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Tổng tiền đã nộp:</span>
            <span className="font-bold text-emerald-700 text-sm font-mono">{formatVND(totalAmountPaid)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Lần đóng gần nhất:</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{formatDateVN(lastPaymentDate)}</span>
          </div>
        </div>
      </div>

      {/* Performance Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500">Tỷ lệ chuyên cần</span>
          <p className="text-xl font-bold text-blue-600 font-mono mt-1">{attendanceRate}%</p>
          <span className="text-[10px] text-slate-400">{presentCount} có mặt / {totalSessions} buổi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500">Điểm trung bình</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{avgScore}</p>
          <span className="text-[10px] text-slate-400">{scores.length} bài kiểm tra</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500">Điểm thi gần nhất</span>
          <p className="text-xl font-bold text-indigo-600 font-mono mt-1">{latestScore}</p>
          <span className="text-[10px] text-slate-400">Thang điểm 10</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500">Hoàn thành bài tập</span>
          <p className="text-xl font-bold text-purple-600 font-mono mt-1">{hwCompletionRate}%</p>
          <span className="text-[10px] text-slate-400">{completedHwCount} / {homeworkResults.length} bài</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'attendance'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lịch sử điểm danh ({allAttendance.length})
        </button>
        <button
          onClick={() => setActiveTab('tuition')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'tuition'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lịch sử học phí ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'academic'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Điểm số & Bài tập
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'notes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ghi chú ({notes.length})
        </button>
      </div>

      {/* Tab 1: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">
              Chi tiết các buổi điểm danh và trừ học phí
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-emerald-700">Có mặt: {presentCount}</span>
              <span>·</span>
              <span className="text-blue-700">Có phép: {excusedCount}</span>
              <span>·</span>
              <span className="text-rose-700">Không phép: {unexcusedCount}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Ngày học</th>
                  <th className="py-2.5 px-3">Tên buổi học</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center">Trừ học phí?</th>
                  <th className="py-2.5 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu điểm danh nào.
                    </td>
                  </tr>
                ) : (
                  allAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-medium">{formatDateVN(rec.date)}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{rec.sessionTitle}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'excused'
                              ? 'bg-blue-100 text-blue-800'
                              : rec.status === 'unexcused'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {rec.status === 'present'
                            ? 'Có mặt'
                            : rec.status === 'excused'
                            ? 'Có phép'
                            : rec.status === 'unexcused'
                            ? 'Không phép'
                            : 'Học bù'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rec.lessonDeducted ? (
                          <span className="text-emerald-700 font-mono font-semibold">-1 buổi</span>
                        ) : (
                          <span className="text-slate-400 font-mono">0 buổi (giữ nguyên)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">{rec.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tuition & Payments */}
      {activeTab === 'tuition' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-6 p-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800">
                Lịch sử các lần đóng học phí ({payments.length})
              </h4>
              <button
                onClick={() => onOpenPayment(student.id)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                + Thêm giao dịch nộp tiền
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Mã phiếu thu</th>
                    <th className="py-2.5 px-3">Ngày nộp</th>
                    <th className="py-2.5 px-3 text-center">Số buổi</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                    <th className="py-2.5 px-3 text-center">Hình thức</th>
                    <th className="py-2.5 px-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có giao dịch đóng học phí nào.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-medium text-blue-600">
                          {p.receiptNumber || p.id}
                        </td>
                        <td className="py-3 px-3 font-mono">{formatDateVN(p.paymentDate)}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          +{p.lessonQuantity} buổi
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatVND(p.pricePerLesson)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatVND(p.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            {p.paymentMethod === 'transfer'
                              ? 'Chuyển khoản'
                              : p.paymentMethod === 'cash'
                              ? 'Tiền mặt'
                              : 'Khác'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{p.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Academic */}
      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tests and Scores */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Điểm các bài kiểm tra</h4>
            <div className="divide-y divide-slate-100">
              {scores.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có điểm kiểm tra.
                </div>
              ) : (
                scores.map((sc) => {
                  const testItem = tests.find((t) => t.id === sc.testId);
                  return (
                    <div key={sc.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{testItem?.title || 'Bài kiểm tra'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatDateVN(testItem?.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {sc.score} / {testItem?.maxScore || 10}
                        </span>
                        {sc.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{sc.notes}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Homework Completion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Tình trạng nộp bài tập về nhà</h4>
            <div className="divide-y divide-slate-100">
              {homeworkResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có dữ liệu bài tập.
                </div>
              ) : (
                homeworkResults.map((hr) => {
                  const hw = homeworkList.find((h) => h.id === hr.homeworkId);
                  return (
                    <div key={hr.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{hw?.title || 'Phiếu bài tập'}</p>
                        <p className="text-[11px] text-slate-400">
                          Hạn nộp: {formatDateVN(hw?.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          hr.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : hr.status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {hr.status === 'completed'
                          ? 'Hoàn thành'
                          : hr.status === 'partial'
                          ? 'Làm một phần'
                          : 'Chưa làm'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Teacher Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">
              Ghi chú và trao đổi phụ huynh ({notes.length})
            </h4>
            <button
              onClick={() => onOpenNote(student.id)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ghi chú mới</span>
            </button>
          </div>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có ghi chú nào cho học sinh này.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-600">{n.author}</span>
                    <span className="font-mono">{formatDateTimeVN(n.createdAt)}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
