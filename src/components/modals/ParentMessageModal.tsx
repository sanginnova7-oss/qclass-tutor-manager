import React, { useState } from 'react';
import { Check, Copy, MessageSquare, Phone, X, Send } from 'lucide-react';
import { db } from '../../services/db';

interface ParentMessageModalProps {
  studentId: string | null;
  onClose: () => void;
  onOpenPayment?: (studentId: string) => void;
}

export const ParentMessageModal: React.FC<ParentMessageModalProps> = ({
  studentId,
  onClose,
  onOpenPayment,
}) => {
  if (!studentId) return null;

  const summary = db.getStudentTuitionSummary(studentId);
  if (!summary) return null;

  const { student, remainingLessons } = summary;
  const initialMessage = db.generateParentMessage(studentId);
  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = student.parentPhone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Soạn tin nhắn học phí</h3>
              <p className="text-xs text-slate-500">
                Gửi phụ huynh: <span className="font-medium text-slate-700">{student.parentName}</span> ({student.fullName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-600">
            <span>
              Số buổi còn lại: <strong className={remainingLessons <= 1 ? 'text-rose-600' : 'text-slate-800'}>{remainingLessons} buổi</strong>
            </span>
            <span>
              SĐT phụ huynh: <strong className="text-slate-800">{student.parentPhone}</strong>
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Nội dung tin nhắn mẫu (có thể chỉnh sửa):</label>
              <span className="text-[11px] text-slate-400">Tiếng Việt có dấu</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full text-sm rounded-xl border border-slate-300 p-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none leading-relaxed text-slate-800 font-sans"
            />
          </div>

          {/* Quick contact shortcuts */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href={`https://zalo.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium border border-blue-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mở Zalo phụ huynh</span>
            </a>
            <a
              href={`sms:${cleanPhone}?body=${encodeURIComponent(message)}`}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium border border-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Gửi tin nhắn SMS</span>
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          {onOpenPayment ? (
            <button
              onClick={() => {
                onClose();
                onOpenPayment(studentId);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Thu học phí luôn cho em
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl text-white transition-all shadow-sm ${
                copied ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Sao chép nội dung'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
