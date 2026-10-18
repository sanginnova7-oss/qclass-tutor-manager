import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { db } from '../../services/db';
import { getTodayISODate } from '../../utils/formatters';

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess?: (studentId: string) => void;
  preselectedClassId?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  onClose,
  onSuccess,
  preselectedClassId,
}) => {
  const classes = db.getClasses().filter((c) => c.status === 'active');
  const settings = db.getSettings();

  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<number>(9);
  const [school, setSchool] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(getTodayISODate());
  const [defaultTuitionRate, setDefaultTuitionRate] = useState<number>(settings.defaultTuitionRate || 60000);
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClassId || classes[0]?.id || '');
  const [initialPackageSize, setInitialPackageSize] = useState<number>(10);
  const [createInitialPackage, setCreateInitialPackage] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !parentPhone.trim()) return;

    const newStudent = db.addStudent(
      {
        fullName: fullName.trim(),
        grade: Number(grade),
        school: school.trim() || 'Chưa cập nhật',
        studentPhone: studentPhone.trim() || undefined,
        parentName: parentName.trim() || 'Phụ huynh',
        parentPhone: parentPhone.trim(),
        address: address.trim() || undefined,
        enrollmentDate,
        defaultTuitionRate,
        status: 'active',
        notes: notes.trim() || undefined,
      },
      createInitialPackage ? initialPackageSize : 0
    );

    // Assign to selected class if chosen
    if (selectedClassId) {
      db.assignStudentToClass(selectedClassId, newStudent.id);
    }

    onSuccess?.(newStudent.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Thêm học sinh mới</h3>
              <p className="text-xs text-slate-500">Nhập thông tin hồ sơ và xếp lớp học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Full Name & Grade */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 bg-white"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* School & Student Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trường đang học</label>
              <input
                type="text"
                placeholder="Ví dụ: THCS Giảng Võ"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT học sinh</label>
              <input
                type="tel"
                placeholder="098..."
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Parent Name & Parent Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên phụ huynh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Bác Dũng (Bố)"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SĐT phụ huynh (nhận Zalo/SMS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="091..."
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Class assignment & Default Tuition Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Xếp vào lớp</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Chưa xếp lớp --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Học phí riêng của em (VNĐ/buổi)
              </label>
              <input
                type="number"
                step="5000"
                value={defaultTuitionRate}
                onChange={(e) => setDefaultTuitionRate(Number(e.target.value))}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 font-mono text-right"
              />
            </div>
          </div>

          {/* Initial package checkbox */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-900">
              <input
                type="checkbox"
                checked={createInitialPackage}
                onChange={(e) => setCreateInitialPackage(e.target.checked)}
                className="rounded border-blue-400 text-blue-600 focus:ring-blue-500"
              />
              Tạo và ghi nhận gói học phí ban đầu ngay
            </label>
            {createInitialPackage && (
              <div className="flex items-center justify-between text-xs text-blue-800 pl-5">
                <span>Số buổi trong gói:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={initialPackageSize}
                    onChange={(e) => setInitialPackageSize(Number(e.target.value))}
                    className="w-16 text-center text-xs border border-blue-300 rounded px-1.5 py-0.5 bg-white font-mono"
                  />
                  <span>buổi</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú học lực / gia đình</label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Cần rèn thêm hình học, phụ huynh mong muốn học nâng cao..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
            >
              Lưu học sinh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
