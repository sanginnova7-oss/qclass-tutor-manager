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
} from 'lucide-react';
import { db } from '../../services/db';
import { ClassItem } from '../../types';

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
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [room, setRoom] = useState('Phòng 201');
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (classItem) {
      setClassName(classItem.name);
      setSubject(classItem.subject || 'Toán học');
      setGrade(classItem.grade);
      setDefaultTuitionRate(classItem.defaultTuitionRate);
      setScheduleDays(classItem.scheduleDays || []);
      setStartTime(classItem.startTime || '18:00');
      setEndTime(classItem.endTime || '19:30');
      setRoom(classItem.room || 'Phòng 201');
      setStatus(classItem.status || 'active');
      setShowConfirmDelete(false);
    }
  }, [classItem]);

  if (!isOpen || !classItem) return null;

  const handleToggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || scheduleDays.length === 0) return;

    db.updateClass(classItem.id, {
      name: className.trim(),
      subject,
      grade: Number(grade),
      defaultTuitionRate,
      scheduleDays,
      startTime,
      endTime,
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
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Chỉnh sửa thông tin lớp học</h3>
              <p className="text-[11px] text-slate-400">Mã lớp: {classItem.id}</p>
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
          <div className="p-6 bg-rose-50 border-b border-rose-100 space-y-3">
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
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Schedule Days Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng học</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Phòng 201 - Tầng 2"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa lớp học này</span>
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
