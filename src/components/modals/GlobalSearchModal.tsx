import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, BookOpen, CreditCard, ArrowRight } from 'lucide-react';
import { db } from '../../services/db';
import { formatVND } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (studentId: string) => void;
  onSelectClass: (classId: string) => void;
  onOpenPayment: (studentId: string) => void;
  onOpenParentMessage: (studentId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectClass,
  onOpenPayment,
  onOpenParentMessage,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();
  const students = db.getStudents();
  const classes = db.getClasses();

  const matchedStudents = cleanQuery
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(cleanQuery) ||
          s.parentName.toLowerCase().includes(cleanQuery) ||
          (s.parentPhone && s.parentPhone.includes(cleanQuery)) ||
          (s.studentPhone && s.studentPhone.includes(cleanQuery)) ||
          s.school.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedClasses = cleanQuery
    ? classes.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.subject.toLowerCase().includes(cleanQuery) ||
          `khối ${c.grade}`.includes(cleanQuery)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm theo tên học sinh, phụ huynh, SĐT hoặc lớp..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100">
          {!cleanQuery ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>Gõ tên học sinh, số điện thoại hoặc tên lớp để tìm kiếm tức thì.</p>
            </div>
          ) : matchedStudents.length === 0 && matchedClasses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy kết quả phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Classes Matches */}
              {matchedClasses.length > 0 && (
                <div className="pb-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Lớp học ({matchedClasses.length})
                  </div>
                  <div className="space-y-1">
                    {matchedClasses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectClass(c.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {c.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {c.scheduleDays.join(', ')} · {c.startTime} - {c.endTime} · {c.studentIds.length} học sinh
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Matches */}
              {matchedStudents.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Học sinh ({matchedStudents.length})
                  </div>
                  <div className="space-y-1">
                    {matchedStudents.map((s) => {
                      const summary = db.getStudentTuitionSummary(s.id);
                      const rem = summary?.remainingLessons ?? 0;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                        >
                          <button
                            onClick={() => {
                              onSelectStudent(s.id);
                              onClose();
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-xs">
                              {s.fullName.slice(0, 1)}
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {s.fullName}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                Khối {s.grade} ({s.school}) · PH: {s.parentName} ({s.parentPhone})
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            <span
                              className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${
                                rem <= 1 ? 'bg-rose-100 text-rose-700' : rem === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Còn {rem} buổi
                            </span>
                            <button
                              title="Thu học phí"
                              onClick={() => {
                                onClose();
                                onOpenPayment(s.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
