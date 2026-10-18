import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Save,
  Check,
  Clock,
  Users,
  Search,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { db } from '../../services/db';
import { AttendanceStatus } from '../../types';
import { formatDateVN, formatVND, getTodayISODate } from '../../utils/formatters';

interface AttendanceViewProps {
  initialClassId?: string | null;
  onOpenPaymentForStudent: (studentId: string) => void;
  onOpenParentMessageForStudent: (studentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  initialClassId,
  onOpenPaymentForStudent,
  onOpenParentMessageForStudent,
  onSelectStudent,
}) => {
  const classes = db.getClasses().filter((c) => c.status === 'active');
  const students = db.getStudents();
  const sessions = db.getSessions();
  const allAttendance = db.getAttendance();

  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes[0]?.id ?? '')
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayISODate());
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [studentStatuses, setStudentStatuses] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [saveSummary, setSaveSummary] = useState<{ deductions: number; total: number } | null>(null);

  // Sync initial class ID when prop changes
  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId]);

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => currentClass?.studentIds.includes(s.id));

  // Initialize or load existing attendance for selected class & date
  useEffect(() => {
    if (!currentClass) return;

    // Check if session exists for this class & date
    const existingSession = sessions.find(
      (s) => s.classId === currentClass.id && s.date === attendanceDate
    );

    if (existingSession) {
      setSessionTitle(existingSession.title);
    } else {
      // Default session title
      const existingCount = sessions.filter((s) => s.classId === currentClass.id).length;
      setSessionTitle(`Buổi ${existingCount + 1}: Chuyên đề Toán ngày ${formatDateVN(attendanceDate)}`);
    }

    // Populate statuses
    const newStatuses: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((st) => {
      const existingRec = allAttendance.find(
        (a) => a.studentId === st.id && a.classId === currentClass.id && a.date === attendanceDate
      );
      if (existingRec) {
        newStatuses[st.id] = {
          status: existingRec.status,
          note: existingRec.note || '',
        };
      } else {
        newStatuses[st.id] = {
          status: 'present', // Default to present
          note: '',
        };
      }
    });
    setStudentStatuses(newStatuses);
    setIsSavedSuccess(false);
  }, [selectedClassId, attendanceDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setIsSavedSuccess(false);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setStudentStatuses((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: 'present' };
      });
      return updated;
    });
    setIsSavedSuccess(false);
  };

  const handleSaveAttendance = () => {
    if (!currentClass || classStudents.length === 0) return;

    const attendancesToRecord = classStudents.map((st) => ({
      studentId: st.id,
      status: studentStatuses[st.id]?.status || 'present',
      note: studentStatuses[st.id]?.note || undefined,
    }));

    const result = db.recordAttendanceSession({
      classId: currentClass.id,
      date: attendanceDate,
      sessionTitle: sessionTitle.trim() || `Buổi học ngày ${attendanceDate}`,
      studentAttendances: attendancesToRecord,
    });

    setSaveSummary({
      deductions: result.deductionsApplied,
      total: attendancesToRecord.length,
    });
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 4000);
  };

  // Calculate live counts
  const liveCounts = {
    present: 0,
    excused: 0,
    unexcused: 0,
    makeup: 0,
  };
  Object.values(studentStatuses).forEach((item) => {
    if (item?.status) liveCounts[item.status]++;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Điểm danh lớp học</h2>
          <p className="text-xs text-slate-500">
            Hệ thống tự động trừ 1 buổi học phí khi có mặt hoặc không phép (có kiểm tra chống trừ 2 lần)
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('take')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'take'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Điểm danh buổi hôm nay
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử điểm danh ({sessions.length})
          </button>
        </div>
      </div>

      {activeTab === 'take' ? (
        <div className="space-y-5">
          {/* Class, Date & Session Setup Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
              {/* Select Class */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chọn lớp học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2.5 bg-white text-slate-800 outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.studentIds.length} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ngày điểm danh
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Session Title */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nội dung / Tên buổi học
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Ví dụ: Buổi 12: Bất đẳng thức Bunhiacopxki..."
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Actions & Live Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="font-semibold text-slate-900">Sĩ số: {classStudents.length} em</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">Có mặt: {liveCounts.present}</span>
                <span>·</span>
                <span className="text-blue-700 font-medium">Có phép: {liveCounts.excused}</span>
                <span>·</span>
                <span className="text-rose-700 font-medium">Không phép: {liveCounts.unexcused}</span>
                <span>·</span>
                <span className="text-purple-700 font-medium">Học bù: {liveCounts.makeup}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ✓ Đánh dấu tất cả có mặt
                </button>
              </div>
            </div>
          </div>

          {/* Success Save Banner */}
          {isSavedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold">Đã lưu điểm danh thành công!</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Hệ thống đã tự động cập nhật số buổi còn lại và lưu vết lịch sử buổi học.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 font-mono">
                {formatDateVN(attendanceDate)}
              </span>
            </div>
          )}

          {/* Student Attendance List with 4 Large Touch Buttons */}
          <div className="space-y-3">
            {classStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Lớp này hiện chưa có học sinh nào. Hãy vào mục &quot;Lớp học&quot; hoặc &quot;Học sinh&quot; để xếp học sinh vào lớp.
              </div>
            ) : (
              classStudents.map((st, index) => {
                const currentStatus = studentStatuses[st.id]?.status || 'present';
                const currentNote = studentStatuses[st.id]?.note || '';
                const summary = db.getStudentTuitionSummary(st.id);
                const rem = summary?.remainingLessons ?? 0;
                const isLow = rem <= 2;

                return (
                  <div
                    key={st.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Student Info & Remaining Lessons */}
                    <div className="flex items-start gap-3 min-w-0 md:w-1/3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectStudent(st.id)}
                            className="font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition-colors truncate text-left"
                          >
                            {st.fullName}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {st.school} · PH: {st.parentPhone}
                        </p>

                        {/* Remaining Lessons Counter badge */}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              rem <= 0
                                ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                : rem === 1
                                ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                                : rem === 2
                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Còn {rem} buổi
                          </span>
                          {isLow && (
                            <button
                              onClick={() => onOpenParentMessageForStudent(st.id)}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                              title="Nhắn nhắc học phí"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Nhắn PH</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4 Large Touch Buttons for Status Selection */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1 max-w-lg">
                      {/* Present */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'present')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 scale-102'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>Có mặt</span>
                        <span className={`text-[9px] ${currentStatus === 'present' ? 'text-emerald-100' : 'text-slate-400'}`}>
                          -1 buổi
                        </span>
                      </button>

                      {/* Excused */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'excused')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          currentStatus === 'excused'
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 scale-102'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>Có phép</span>
                        <span className={`text-[9px] ${currentStatus === 'excused' ? 'text-blue-100' : 'text-slate-400'}`}>
                          Giữ buổi
                        </span>
                      </button>

                      {/* Unexcused */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'unexcused')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          currentStatus === 'unexcused'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300 scale-102'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>Không phép</span>
                        <span className={`text-[9px] ${currentStatus === 'unexcused' ? 'text-rose-100' : 'text-slate-400'}`}>
                          -1 buổi
                        </span>
                      </button>

                      {/* Makeup */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, 'makeup')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          currentStatus === 'makeup'
                            ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300 scale-102'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>Học bù</span>
                        <span className={`text-[9px] ${currentStatus === 'makeup' ? 'text-purple-100' : 'text-slate-400'}`}>
                          Trừ bù
                        </span>
                      </button>
                    </div>

                    {/* Note input per student */}
                    <div className="w-full md:w-56 shrink-0">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => handleNoteChange(st.id, e.target.value)}
                        placeholder="Ghi chú (đến muộn, làm bài tốt...)"
                        className="w-full text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-blue-500 outline-none text-slate-800"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Save Attendance Bar */}
          {classStudents.length > 0 && (
            <div className="sticky bottom-16 md:bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 p-4 shadow-xl flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600 hidden sm:block">
                <span>
                  Sẽ trừ <strong>{liveCounts.present + liveCounts.unexcused + liveCounts.makeup} buổi</strong> từ gói học phí của học sinh.
                </span>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <span className="text-xs font-semibold text-slate-800 sm:hidden">
                  {liveCounts.present} có mặt / {classStudents.length}
                </span>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu điểm danh & Trừ buổi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Attendance History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Lịch sử các buổi điểm danh đã thực hiện
            </h3>
            <span className="text-xs text-slate-400">{sessions.length} buổi học</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sessions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có buổi học nào được ghi nhận.
              </div>
            ) : (
              sessions.map((sess) => {
                const cls = classes.find((c) => c.id === sess.classId);
                const attList = allAttendance.filter((a) => a.sessionId === sess.id);

                return (
                  <div key={sess.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-900">
                            {sess.title}
                          </h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {cls ? cls.name : 'Lớp học'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Ngày học: {formatDateVN(sess.date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700 font-medium">
                          Có mặt: {sess.attendanceCount?.present ?? 0}
                        </span>
                        <span>·</span>
                        <span className="text-blue-700 font-medium">
                          Có phép: {sess.attendanceCount?.excused ?? 0}
                        </span>
                        <span>·</span>
                        <span className="text-rose-700 font-medium">
                          Không phép: {sess.attendanceCount?.unexcused ?? 0}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClassId(sess.classId);
                            setAttendanceDate(sess.date);
                            setActiveTab('take');
                          }}
                          className="px-2.5 py-1 text-[11px] text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-medium"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
