import React, { useState, useEffect } from 'react';
import { CreditCard, X, Calculator, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';
import { formatVND, getTodayISODate } from '../../utils/formatters';
import { PaymentMethod } from '../../types';

interface AddPaymentModalProps {
  initialStudentId?: string | null;
  onClose: () => void;
  onSuccess?: (studentId: string) => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  initialStudentId,
  onClose,
  onSuccess,
}) => {
  const students = db.getStudents().filter((s) => s.status !== 'stopped');
  const settings = db.getSettings();

  const [studentId, setStudentId] = useState<string>(initialStudentId || (students[0]?.id ?? ''));
  const [lessonQuantity, setLessonQuantity] = useState<number>(settings.defaultPackageSize || 10);
  const [pricePerLesson, setPricePerLesson] = useState<number>(settings.defaultTuitionRate || 60000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayISODate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // When student changes, update default price per lesson
  useEffect(() => {
    if (studentId) {
      const selectedStudent = students.find((s) => s.id === studentId);
      if (selectedStudent) {
        setPricePerLesson(selectedStudent.defaultTuitionRate || settings.defaultTuitionRate || 60000);
      }
    }
  }, [studentId]);

  const calculatedAmount = lessonQuantity * pricePerLesson;
  const finalAmount = isCustomAmount && customAmount ? parseInt(customAmount, 10) || 0 : calculatedAmount;

  const currentSummary = studentId ? db.getStudentTuitionSummary(studentId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || finalAmount <= 0 || lessonQuantity <= 0) return;

    db.addPayment({
      studentId,
      lessonQuantity,
      pricePerLesson,
      amount: finalAmount,
      paymentDate,
      paymentMethod,
      note: note.trim() || undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      onSuccess?.(studentId);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Thu học phí / Đóng gói mới</h3>
              <p className="text-xs text-slate-500">Cập nhật gói học phí trả trước cho học sinh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="text-base font-semibold text-slate-900">Đã lưu học phí thành công!</h4>
            <p className="text-xs text-slate-500">
              Đã cộng <span className="font-bold text-emerald-600">+{lessonQuantity} buổi</span> vào tài khoản học sinh.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn học sinh <span className="text-rose-500">*</span>
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white text-slate-800"
              >
                {students.map((s) => {
                  const sum = db.getStudentTuitionSummary(s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.fullName} - Khối {s.grade} ({s.school}) - Còn {sum?.remainingLessons ?? 0} buổi
                    </option>
                  );
                })}
              </select>

              {currentSummary && (
                <div className="mt-2 flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500">Tình trạng hiện tại:</span>
                  <span className="font-medium text-slate-700">
                    Còn <strong className={currentSummary.remainingLessons <= 1 ? 'text-rose-600' : 'text-slate-900'}>{currentSummary.remainingLessons}</strong> buổi
                    {currentSummary.remainingLessons > 0 ? ` (sẽ cộng dồn thành ${currentSummary.remainingLessons + lessonQuantity} buổi)` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Package details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số buổi đóng <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={lessonQuantity}
                    onChange={(e) => setLessonQuantity(parseInt(e.target.value, 10) || 0)}
                    required
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-center font-mono tabular-nums focus:border-blue-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 shrink-0">buổi</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLessonQuantity(count)}
                      className={`text-[11px] py-0.5 px-2 rounded-md border font-medium ${
                        lessonQuantity === count
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Đơn giá / 1 buổi (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={pricePerLesson}
                  onChange={(e) => setPricePerLesson(parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-right font-mono tabular-nums focus:border-blue-500 outline-none"
                />
                <div className="flex gap-1 mt-1.5 justify-end">
                  {[50000, 60000, 70000, 75000].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => setPricePerLesson(price)}
                      className={`text-[10px] py-0.5 px-1.5 rounded-md border ${
                        pricePerLesson === price
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {price / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total calculated amount card */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Tổng học phí phải thu:
                </span>
                <p className="text-xs text-emerald-600">
                  {lessonQuantity} buổi × {formatVND(pricePerLesson)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
                  {formatVND(finalAmount)}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(!isCustomAmount);
                      if (!isCustomAmount) setCustomAmount(String(calculatedAmount));
                    }}
                    className="text-[11px] text-emerald-800 underline hover:text-emerald-950"
                  >
                    {isCustomAmount ? 'Tự động tính' : 'Sửa số tiền'}
                  </button>
                </div>
              </div>
            </div>

            {isCustomAmount && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhập số tiền thực thu (ghi đè):
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ví dụ: 550000"
                  className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 focus:border-blue-500 outline-none font-mono"
                />
              </div>
            )}

            {/* Payment date and method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày nộp học phí</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hình thức nộp</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú phiếu thu (nếu có)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Phụ huynh chuyển qua Vietcombank lúc 18h..."
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Xác nhận thu học phí</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
