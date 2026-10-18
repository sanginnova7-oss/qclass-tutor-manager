import React, { useState } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Plus,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  X,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  UserPlus,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { ClassItem, DaySchedule } from '../../types';
import { formatDateVN, formatVND } from '../../utils/formatters';
import { EditClassModal } from '../modals/EditClassModal';
import { ExcelImportModal } from '../modals/ExcelImportModal';
import { realtimeService } from '../../services/realtimeService';

interface ClassesViewProps {
  onOpenAttendanceForClass: (classId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export const ClassesView: React.FC<ClassesViewProps> = ({
  onOpenAttendanceForClass,
  onSelectStudent,
}) => {
  const classes = db.getClasses();
  const students = db.getStudents();
  const sessions = db.getSessions();
  const settings = db.getSettings();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<{ classId: string; studentId: string; studentName: string } | null>(null);

  // Excel bulk import state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelTargetClassId, setExcelTargetClassId] = useState<string | null>(null);

  // Form states for creating a new class
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState<number>(9);
  const [defaultTuitionRate, setDefaultTuitionRate] = useState<number>(
    settings.defaultTuitionRate || 60000
  );
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Thứ 2', 'Thứ 4']);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [room, setRoom] = useState('Phòng 201');

  // Per-day schedule state for creating new class
  const [useCustomCreateTimes, setUseCustomCreateTimes] = useState(false);
  const [createSchedules, setCreateSchedules] = useState<DaySchedule[]>([
    { day: 'Thứ 2', startTime: '18:00', endTime: '19:30', room: 'Phòng 201' },
    { day: 'Thứ 4', startTime: '18:00', endTime: '19:30', room: 'Phòng 201' },
  ]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleToggleDay = (day: string) => {
    let newDays: string[];
    if (scheduleDays.includes(day)) {
      newDays = scheduleDays.filter((d) => d !== day);
      setScheduleDays(newDays);
      setCreateSchedules((prev) => prev.filter((s) => s.day !== day));
    } else {
      newDays = [...scheduleDays, day];
      setScheduleDays(newDays);
      setCreateSchedules((prev) => [
        ...prev,
        {
          day,
          startTime,
          endTime,
          room,
        },
      ]);
    }
  };

  const handleUpdateCreateDayTime = (
    day: string,
    field: 'startTime' | 'endTime' | 'room',
    value: string
  ) => {
    setCreateSchedules((prev) =>
      prev.map((item) => (item.day === day ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyPreset = (day: string, start: string, end: string) => {
    handleUpdateCreateDayTime(day, 'startTime', start);
    handleUpdateCreateDayTime(day, 'endTime', end);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || scheduleDays.length === 0) return;

    const finalSchedules: DaySchedule[] = scheduleDays.map((d) => {
      const existing = createSchedules.find((s) => s.day === d);
      return (
        existing || {
          day: d,
          startTime,
          endTime,
          room,
        }
      );
    });

    const primaryStartTime = finalSchedules[0]?.startTime || startTime;
    const primaryEndTime = finalSchedules[0]?.endTime || endTime;

    db.addClass({
      name: className.trim(),
      subject,
      grade: Number(grade),
      defaultTuitionRate,
      scheduleDays,
      startTime: primaryStartTime,
      endTime: primaryEndTime,
      schedules: finalSchedules,
      room,
      studentIds: [],
      status: 'active',
    });

    setShowAddClassModal(false);
    setClassName('');
    setUseCustomCreateTimes(false);
  };

  const handleConfirmDeleteClass = () => {
    if (classToDelete) {
      db.deleteClass(classToDelete.id);
      if (selectedClassId === classToDelete.id) {
        setSelectedClassId(null);
      }
      setClassToDelete(null);
    }
  };

  const handleRemoveStudent = (classId: string, studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    setStudentToRemove({
      classId,
      studentId,
      studentName: st?.fullName || 'Học sinh',
    });
  };

  const handleConfirmRemoveStudent = () => {
    if (studentToRemove) {
      db.removeStudentFromClass(studentToRemove.classId, studentToRemove.studentId);
      realtimeService.dispatchEvent({
        type: 'student',
        title: 'Đã xóa học sinh khỏi lớp',
        description: `Đã xóa học sinh ${studentToRemove.studentName} khỏi danh sách lớp học.`,
        badge: 'Lớp học',
      });
      setStudentToRemove(null);
    }
  };

  const handleOpenExcelForClass = (classId?: string) => {
    setExcelTargetClassId(classId || null);
    setIsExcelModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quản lý lớp học</h2>
          <p className="text-xs text-slate-500">
            Tổng cộng {classes.length} lớp học dạy thêm Toán đang hoạt động
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Import CTA */}
          <button
            onClick={() => handleOpenExcelForClass()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>📋 Nhập HS từ Excel (Copy-Paste)</span>
          </button>

          {/* Create New Class */}
          <button
            onClick={() => setShowAddClassModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo lớp học mới</span>
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const classStudents = students.filter((s) => cls.studentIds.includes(s.id));
          const hasCustomPerDay =
            cls.schedules &&
            cls.schedules.length > 0 &&
            cls.schedules.some(
              (s) =>
                s.startTime !== cls.schedules![0].startTime ||
                s.endTime !== cls.schedules![0].endTime
            );

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header row with badges and action icons */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Khối {cls.grade}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
                      {cls.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit class button */}
                    <button
                      onClick={() => setEditingClass(cls)}
                      title="Chỉnh sửa thông tin lớp"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete class button */}
                    <button
                      onClick={() => setClassToDelete(cls)}
                      title="Xóa lớp học này"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {/* Schedule display: Single row or multi-day list */}
                  {hasCustomPerDay ? (
                    <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lịch học (Giờ riêng từng ngày):</span>
                        </span>
                      </div>
                      <div className="divide-y divide-slate-200/60 font-mono text-[11px]">
                        {cls.schedules!.map((s) => (
                          <div
                            key={s.day}
                            className="py-1 flex items-center justify-between text-slate-700"
                          >
                            <span className="font-sans font-semibold text-blue-900">{s.day}:</span>
                            <span className="font-semibold text-slate-800">
                              {s.startTime} - {s.endTime}
                              {s.room && s.room !== cls.room ? ` (${s.room})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {cls.scheduleDays.join(', ')} ·{' '}
                        <strong className="font-mono text-slate-800">
                          {cls.startTime} - {cls.endTime}
                        </strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Sĩ số: <strong className="font-mono text-slate-800">{classStudents.length}</strong> học sinh
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenExcelForClass(cls.id)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>+ Nhập Excel</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Đơn giá chuẩn:{' '}
                      <strong className="font-mono text-slate-800">{formatVND(cls.defaultTuitionRate)}</strong> / buổi
                    </span>
                  </div>

                  {cls.room && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{cls.room}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setSelectedClassId(cls.id)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={() => onOpenAttendanceForClass(cls.id)}
                  className="py-2 px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Điểm danh</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Class Confirmation Dialog */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Xác nhận xóa lớp học này?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lớp <strong className="text-slate-800">{classToDelete.name}</strong> (Khối {classToDelete.grade}) có{' '}
                <strong className="text-slate-800">{classToDelete.studentIds.length} học sinh</strong>.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Hồ sơ học sinh và học phí đã đóng vẫn được bảo toàn trong hệ thống, chỉ liên kết lớp học này sẽ bị xóa bỏ.
              </span>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Đồng ý xóa lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student from Class Confirmation Dialog */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Xóa học sinh khỏi lớp học?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc muốn xóa em <strong className="text-slate-800">{studentToRemove.studentName}</strong> khỏi danh sách lớp này?
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              Hồ sơ học sinh, điểm danh cũ và lịch sử học phí của em vẫn được lưu trữ nguyên vẹn trên hệ thống.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Detail Drawer / Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                      Khối {selectedClass.grade}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg">{selectedClass.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Phòng: {selectedClass.room || 'Chưa cập nhật'} · {selectedClass.scheduleDays.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingClass(selectedClass)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa lớp</span>
                </button>

                <button
                  onClick={() => setClassToDelete(selectedClass)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xóa lớp học"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedClassId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Detailed schedule bar */}
              <div className="p-4 bg-slate-50 rounded-2xl text-xs border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Lịch học chi tiết theo ngày:</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {formatVND(selectedClass.defaultTuitionRate)} / buổi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedClass.schedules && selectedClass.schedules.length > 0 ? (
                    selectedClass.schedules.map((s) => (
                      <div
                        key={s.day}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-0.5"
                      >
                        <span className="font-bold text-blue-700 block text-xs">{s.day}</span>
                        <p className="font-mono text-slate-800 font-semibold">
                          {s.startTime} – {s.endTime}
                        </p>
                        {s.room && (
                          <p className="text-[10px] text-slate-400 truncate">{s.room}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">
                        {selectedClass.scheduleDays.join(', ')}
                      </span>
                      <p className="font-mono text-slate-600 mt-0.5">
                        {selectedClass.startTime} – {selectedClass.endTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Student roster */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-sm text-slate-900">
                    Danh sách học sinh trong lớp ({selectedClass.studentIds.length})
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenExcelForClass(selectedClass.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Nhập thêm từ Excel</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedClassId(null);
                        onOpenAttendanceForClass(selectedClass.id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Điểm danh</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Học sinh</th>
                        <th className="py-2.5 px-3">Phụ huynh & SĐT</th>
                        <th className="py-2.5 px-3 text-right">Đơn giá</th>
                        <th className="py-2.5 px-3 text-center">Buổi còn lại</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClass.studentIds.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Chưa có học sinh nào trong lớp này. Hãy bấm{' '}
                            <strong className="text-emerald-700 font-semibold">
                              "+ Nhập thêm từ Excel"
                            </strong>{' '}
                            để thêm nhanh!
                          </td>
                        </tr>
                      ) : (
                        selectedClass.studentIds.map((stdId) => {
                          const student = students.find((s) => s.id === stdId);
                          if (!student) return null;
                          const summary = db.getStudentTuitionSummary(stdId);
                          const rem = summary?.remainingLessons ?? 0;

                          return (
                            <tr key={stdId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {student.fullName}
                                </span>
                                <p className="text-[11px] text-slate-400">{student.school}</p>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-slate-800">{student.parentName}</span>
                                <p className="text-[11px] font-mono text-slate-500">
                                  {student.parentPhone}
                                </p>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                                {formatVND(
                                  student.defaultTuitionRate || selectedClass.defaultTuitionRate
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                    rem <= 1
                                      ? 'bg-rose-100 text-rose-700'
                                      : rem === 2
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {rem} buổi
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedClassId(null);
                                    onSelectStudent(student.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] cursor-pointer"
                                >
                                  Hồ sơ
                                </button>
                                <button
                                  onClick={() => handleRemoveStudent(selectedClass.id, student.id)}
                                  className="text-rose-500 hover:text-rose-700 font-semibold text-[11px] cursor-pointer"
                                  title="Xóa học sinh khỏi lớp này"
                                >
                                  Xóa khỏi lớp
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedClassId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={!!editingClass}
        classItem={editingClass}
        onClose={() => setEditingClass(null)}
        onDeleted={() => {
          if (selectedClassId === editingClass?.id) {
            setSelectedClassId(null);
          }
          setEditingClass(null);
        }}
      />

      {/* Excel Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        defaultClassId={excelTargetClassId}
      />

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tạo lớp học mới</h3>
                  <p className="text-[11px] text-slate-500">Thiết lập thông tin và giờ học linh hoạt</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Toán 9 - Luyện thi vào 10 Chuyên (Nhóm B)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 bg-white"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Học phí mặc định (VNĐ/buổi)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={defaultTuitionRate}
                    onChange={(e) => setDefaultTuitionRate(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 font-mono text-right"
                  />
                </div>
              </div>

              {/* Schedule Days */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Lịch học trong tuần <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = scheduleDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Mode Selector: Same time vs Custom time per day */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Khung giờ học theo buổi
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cho phép giờ học mỗi ngày khác nhau
                    </span>
                  </div>

                  <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUseCustomCreateTimes(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        !useCustomCreateTimes
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cùng giờ các ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomCreateTimes(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        useCustomCreateTimes
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Giờ riêng từng ngày</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1: Uniform Times for all days */}
                {!useCustomCreateTimes && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Bắt đầu
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-center font-mono bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Kết thúc
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-center font-mono bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Phòng học chung
                      </label>
                      <input
                        type="text"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Phòng 201"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Mode 2: Custom Per-Day Schedule (Different time for each day) */}
                {useCustomCreateTimes && (
                  <div className="space-y-3">
                    {scheduleDays.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Vui lòng tick chọn ít nhất một ngày học ở trên.
                      </p>
                    ) : (
                      scheduleDays.map((day) => {
                        const daySched = createSchedules.find((s) => s.day === day) || {
                          day,
                          startTime,
                          endTime,
                          room,
                        };

                        return (
                          <div
                            key={day}
                            className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{day}</span>
                              </span>

                              {/* Quick presets for this specific day */}
                              <div className="flex items-center gap-1 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(day, '08:00', '09:30')}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                  Sáng 8h-9h30
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(day, '14:30', '16:00')}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                  Chiều 14h30-16h
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(day, '18:00', '19:30')}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                  Tối 18h-19h30
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPreset(day, '19:30', '21:00')}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                  Tối muộn 19h30-21h
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 w-10 shrink-0">Từ:</span>
                                <input
                                  type="time"
                                  required
                                  value={daySched.startTime}
                                  onChange={(e) =>
                                    handleUpdateCreateDayTime(day, 'startTime', e.target.value)
                                  }
                                  className="w-full text-xs font-mono rounded-xl border border-slate-300 px-2.5 py-1.5 text-center outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 w-10 shrink-0">Đến:</span>
                                <input
                                  type="time"
                                  required
                                  value={daySched.endTime}
                                  onChange={(e) =>
                                    handleUpdateCreateDayTime(day, 'endTime', e.target.value)
                                  }
                                  className="w-full text-xs font-mono rounded-xl border border-slate-300 px-2.5 py-1.5 text-center outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 w-12 shrink-0">Phòng:</span>
                                <input
                                  type="text"
                                  value={daySched.room || ''}
                                  onChange={(e) =>
                                    handleUpdateCreateDayTime(day, 'room', e.target.value)
                                  }
                                  placeholder={room || 'Phòng học'}
                                  className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
