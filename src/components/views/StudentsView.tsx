import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  CreditCard,
  Eye,
  MessageSquare,
  MoreVertical,
  CalendarCheck,
  Phone,
  AlertCircle,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db';
import { Student, StudentStatus } from '../../types';
import { formatVND, STUDENT_STATUS_LABELS } from '../../utils/formatters';
import { ExcelImportModal } from '../modals/ExcelImportModal';

interface StudentsViewProps {
  onSelectStudent: (studentId: string) => void;
  onOpenAddStudent: () => void;
  onOpenPayment: (studentId: string) => void;
  onOpenParentMessage: (studentId: string) => void;
  onOpenNote: (studentId: string) => void;
  onTakeAttendanceForStudent: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onSelectStudent,
  onOpenAddStudent,
  onOpenPayment,
  onOpenParentMessage,
  onOpenNote,
  onTakeAttendanceForStudent,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [actionMenuStudentId, setActionMenuStudentId] = useState<string | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const students = db.getStudents();
  const classes = db.getClasses();
  const summaries = db.getAllTuitionSummaries();

  // Filter students
  const filteredStudents = students.filter((student) => {
    // Search query
    const q = search.toLowerCase().trim();
    if (
      q &&
      !student.fullName.toLowerCase().includes(q) &&
      !student.parentName.toLowerCase().includes(q) &&
      !student.parentPhone.includes(q) &&
      !(student.studentPhone && student.studentPhone.includes(q)) &&
      !student.school.toLowerCase().includes(q)
    ) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && student.status !== selectedStatus) {
      return false;
    }

    // Grade filter
    if (selectedGrade !== 'all' && student.grade !== Number(selectedGrade)) {
      return false;
    }

    // Class filter
    if (selectedClassId !== 'all') {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (!cls || !cls.studentIds.includes(student.id)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-10">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quản lý học sinh</h2>
          <p className="text-xs text-slate-500">
            Hiển thị {filteredStudents.length} / {students.length} học sinh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>📋 Nhập từ Excel (Copy-Paste)</span>
          </button>

          <button
            onClick={onOpenAddStudent}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Thêm học sinh mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search text input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, trường, SĐT hoặc phụ huynh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Class filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 outline-none shrink-0"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Grade filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 outline-none shrink-0"
            >
              <option value="all">Tất cả khối</option>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={String(g)}>
                  Khối {g}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 outline-none shrink-0"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="paused">Tạm dừng</option>
              <option value="stopped">Thôi học</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Lớp & Khối</th>
                <th className="py-3 px-3">Trường</th>
                <th className="py-3 px-3">Phụ huynh & SĐT</th>
                <th className="py-3 px-3 text-right">Đơn giá / buổi</th>
                <th className="py-3 px-3 text-center">Buổi còn lại</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const summary = summaries.find((s) => s.student.id === student.id);
                  const rem = summary?.remainingLessons ?? 0;
                  const isRed = rem === 0;
                  const isOrange = rem === 1;
                  const isYellow = rem === 2;

                  // Find assigned class
                  const assignedClass = classes.find((c) => c.studentIds.includes(student.id));

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectStudent(student.id)}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {student.fullName.split(' ').slice(-1)[0]?.slice(0, 1) || 'H'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {student.fullName}
                            </span>
                            {student.studentPhone && (
                              <p className="text-[11px] text-slate-400 font-mono">
                                {student.studentPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class & Grade */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-medium text-slate-900">
                            {assignedClass ? assignedClass.name : 'Chưa xếp lớp'}
                          </span>
                          <p className="text-[11px] text-slate-400">Khối {student.grade}</p>
                        </div>
                      </td>

                      {/* School */}
                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[150px]">
                        {student.school}
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <span className="font-medium text-slate-900">{student.parentName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-500">
                              {student.parentPhone}
                            </span>
                            <button
                              onClick={() => onOpenParentMessage(student.id)}
                              title="Gửi tin nhắn học phí"
                              className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Tuition Rate */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800 tabular-nums">
                        {formatVND(student.defaultTuitionRate)}
                      </td>

                      {/* Remaining Lessons Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[70px] px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                            isRed
                              ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                              : isOrange
                              ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                              : isYellow
                              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          }`}
                        >
                          {rem} buổi
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                            STUDENT_STATUS_LABELS[student.status]?.color || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {STUDENT_STATUS_LABELS[student.status]?.label || student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPayment(student.id)}
                            title="Thu học phí"
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Thu phí</span>
                          </button>

                          <button
                            onClick={() => onSelectStudent(student.id)}
                            title="Xem hồ sơ chi tiết"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
};
