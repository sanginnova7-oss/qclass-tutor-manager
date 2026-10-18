import React, { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { db } from '../../services/db';

interface AddNoteModalProps {
  studentId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  studentId,
  onClose,
  onSuccess,
}) => {
  const students = db.getStudents();
  const [selectedId, setSelectedId] = useState(studentId || students[0]?.id || '');
  const [content, setContent] = useState('');

  if (!studentId && students.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !content.trim()) return;

    db.addStudentNote(selectedId, content.trim());
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Thêm nhận xét / ghi chú giáo viên</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Học sinh</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} - Khối {s.grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung ghi chú</label>
            <textarea
              rows={4}
              required
              placeholder="Ghi chú về thái độ học, bài tập, tiến độ hoặc trao đổi với phụ huynh..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Lưu ghi chú
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
