import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  X,
  Trash2,
  AlertTriangle,
  Clock,
  CreditCard,
  MapPin,
  Calendar,
  Save,
  Sparkles,
  Layers,
} from 'lucide-react';
import { db } from '../../services/db';
import { ClassItem, DaySchedule } from '../../types';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem | null;
  onDeleted?: () => void;
}

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classItem,
  onDeleted,
}) => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState<number>(9);
  const [defaultTuitionRate, setDefaultTuitionRate] = useState<number>(60000);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [room, setRoom] = useState('Phòng 201');
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  // Per-day schedules state
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [useCustomTimes, setUseCustomTimes] = useState<boolean>(false);
  const [uniformStartTime, setUniformStartTime] = useState<string>('18:00');
  const [uniformEndTime, setUniformEndTime] = useState<string>('19:30');

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (classItem) {
      setClassName(classItem.name);
      setSubject(classItem.subject || 'Toán học');
      setGrade(classItem.grade);
      setDefaultTuitionRate(classItem.defaultTuitionRate);
      setRoom(classItem.room || 'Phòng 201');
      setStatus(classItem.status || 'active');
      setShowConfirmDelete(false);

      const days = classItem.scheduleDays || [];
      setScheduleDays(days);

      const defStart = classItem.startTime || '18:00';
      const defEnd = classItem.endTime || '19:30';
      setUniformStartTime(defStart);
      setUniformEndTime(defEnd);

      if (classItem.schedules && classItem.schedules.length > 0) {
        setSchedules(classItem.schedules);
        // Check if times actually differ across days
        const hasDiff = classItem.schedules.some(
          (s) =>
            s.startTime !== classItem.schedules![0].startTime ||
            s.endTime !== classItem.schedules![0].endTime
        );
        setUseCustomTimes(hasDiff);
      } else {
        const initialSchedules: DaySchedule[] = days.map((d) => ({
          day: d,
          startTime: defStart,
          endTime: defEnd,
          room: classItem.room || 'Phòng 201',
        }));
        setSchedules(initialSchedules);
        setUseCustomTimes(false);
      }
    }
  }, [classItem]);

  if (!isOpen || !classItem) return null;

  const handleToggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
      setSchedules(schedules.filter((s) => s.day !== day));
    } else {
      const newDays = [...scheduleDays, day];
      setScheduleDays(newDays);
      setSchedules([
        ...schedules,
        {
          day,
          startTime: uniformStartTime,
          endTime: uniformEndTime,
          room,
        },
      ]);
    }
  };

  const handleUpdateDayTime = (
    day: string,
    field: 'startTime' | 'endTime' | 'room',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((item) => (item.day === day ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyUniformTimes = () => {
    setSchedules((prev) =>
      prev.map((item) => ({
        ...item,
        startTime: uniformStartTime,
        endTime: uniformEndTime,
      }))
    );
  };

  const handleApplyPreset = (day: string, start: string, end: string) => {
    handleUpdateDayTime(day, 'startTime', start);
    handleUpdateDayTime(day, 'endTime', end);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || scheduleDays.length === 0) return;

    // Ensure schedules has entries for all scheduleDays
    const finalSchedules: DaySchedule[] = scheduleDays.map((d) => {
      const existing = schedules.find((s) => s.day === d);
      return (
        existing || {
          day: d,
          startTime: uniformStartTime,
          endTime: uniformEndTime,
          room,
        }
      );
    });

    const primaryStartTime = finalSchedules[0]?.startTime || uniformStartTime;
    const primaryEndTime = finalSchedules[0]?.endTime || uniformEndTime;

    db.updateClass(classItem.id, {
      name: className.trim(),
      subject,
      grade: Number(grade),
      defaultTuitionRate,
      scheduleDays,
      startTime: primaryStartTime,
      endTime: primaryEndTime,
      schedules: finalSchedules,
      room,
      status,
    });

    onClose();
  };

  const handleDelete = () => {
    db.deleteClass(classItem.id);
    if (onDeleted) {
      onDeleted();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Chỉnh sửa thông tin lớp học
              </h3>
              <p className="text-[11px] text-slate-500">Mã lớp: {classItem.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showConfirmDelete ? (
          <div className="p-6 bg-rose-50 border-b border-rose-100 space-y-3 shrink-0">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Xác nhận xóa lớp học này?</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Lớp <strong>{classItem.name}</strong> hiện có{' '}
              <strong>{classItem.studentIds.length} học sinh</strong>. Khi xóa, thông tin lớp học sẽ bị gỡ bỏ khỏi hệ thống.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                Vẫn xóa lớp học này
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3.5 py-2 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Hủy, giữ lại lớp
              </button>
            </div>
          </div>
        ) : null}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên lớp học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          {/* Grade & Tuition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 bg-white"
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
                Học phí chuẩn / buổi (đ)
              </label>
              <input
                type="number"
                step="5000"
                min="0"
                value={defaultTuitionRate}
                onChange={(e) => setDefaultTuitionRate(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono text-right"
              />
            </div>
          </div>

          {/* Days of week selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Các ngày học trong tuần <span className="text-rose-500">*</span>
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
                  Cho phép đặt giờ khác nhau cho từng ngày trong tuần
                </span>
              </div>

              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomTimes(false);
                    handleApplyUniformTimes();
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    !useCustomTimes
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cùng giờ tất cả ngày
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomTimes(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    useCustomTimes
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
            {!useCustomTimes && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="time"
                    value={uniformStartTime}
                    onChange={(e) => {
                      setUniformStartTime(e.target.value);
                      setSchedules((prev) =>
                        prev.map((s) => ({ ...s, startTime: e.target.value }))
                      );
                    }}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-center font-mono bg-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="time"
                    value={uniformEndTime}
                    onChange={(e) => {
                      setUniformEndTime(e.target.value);
                      setSchedules((prev) =>
                        prev.map((s) => ({ ...s, endTime: e.target.value }))
                      );
                    }}
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
            {useCustomTimes && (
              <div className="space-y-3">
                {scheduleDays.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Vui lòng tick chọn ít nhất một ngày học ở trên.
                  </p>
                ) : (
                  scheduleDays.map((day) => {
                    const daySched = schedules.find((s) => s.day === day) || {
                      day,
                      startTime: uniformStartTime,
                      endTime: uniformEndTime,
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
                                handleUpdateDayTime(day, 'startTime', e.target.value)
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
                                handleUpdateDayTime(day, 'endTime', e.target.value)
                              }
                              className="w-full text-xs font-mono rounded-xl border border-slate-300 px-2.5 py-1.5 text-center outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 w-12 shrink-0">Phòng:</span>
                            <input
                              type="text"
                              value={daySched.room || ''}
                              onChange={(e) => handleUpdateDayTime(day, 'room', e.target.value)}
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

          {/* Status selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng học chung</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Phòng 201 - Tầng 2"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái lớp</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 bg-white"
              >
                <option value="active">Đang hoạt động</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa lớp này</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
