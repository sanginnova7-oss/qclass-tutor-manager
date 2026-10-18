import React, { useState } from 'react';
import { Printer, X, CheckCircle2, BookOpen, Download } from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN } from '../../utils/formatters';

interface WorksheetPrintModalProps {
  worksheetId: string | null;
  onClose: () => void;
}

export const WorksheetPrintModal: React.FC<WorksheetPrintModalProps> = ({ worksheetId, onClose }) => {
  if (!worksheetId) return null;

  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const worksheet = db.getWorksheets().find((w) => w.id === worksheetId) || db.getWorksheets()[0];
  const qBank = db.getQuestionBank().slice(0, 5);
  const tenant = db.getTenant();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Xem trước bản in phiếu bài tập chuẩn</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>In kèm đáp án chi tiết</span>
            </label>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In ngay</span>
            </button>

            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Standard A4 layout) */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-900 bg-white space-y-6 font-serif">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600">{tenant.name}</p>
              <h1 className="text-lg font-extrabold uppercase mt-1">{worksheet.title}</h1>
              <p className="text-xs italic text-slate-500 mt-0.5">Chuyên đề: {worksheet.topic} · Thời gian: 45 phút</p>
            </div>

            <div className="w-48 border border-slate-400 p-2 text-xs rounded space-y-1 font-sans">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-mono">...........................</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Lớp:</span>
                <span className="font-mono">...........................</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm số:</span>
                <span className="font-mono font-bold text-sm">..... / 10</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {worksheet.instructions && (
            <div className="text-xs italic text-slate-600 border-l-2 border-blue-600 pl-3 py-1 font-sans">
              Lưu ý: {worksheet.instructions}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6 text-sm">
            {qBank.map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <p className="font-bold leading-relaxed">
                  Câu {idx + 1}. <span className="font-normal font-sans">{q.questionText}</span>
                </p>

                {q.options && (
                  <div className="grid grid-cols-2 gap-2 pl-4 text-xs font-sans">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id}>
                        <span className="font-bold">{String.fromCharCode(65 + oIdx)}. </span>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blank space for working out */}
                <div className="h-16 border-b border-dashed border-slate-300"></div>
              </div>
            ))}
          </div>

          {/* Optional Answer Key Section */}
          {showAnswerKey && (
            <div className="pt-8 border-t-2 border-dashed border-slate-400 space-y-4">
              <h3 className="font-bold text-sm uppercase text-blue-900">Đáp án & Lời giải tham khảo</h3>
              <div className="space-y-3 text-xs font-sans">
                {qBank.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="font-bold">Câu {idx + 1}:</p>
                    <p className="font-mono text-slate-700">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
