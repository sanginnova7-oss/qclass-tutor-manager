import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  Search,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, formatDateTimeVN, formatVND } from '../../utils/formatters';

interface TuitionViewProps {
  onOpenAddPayment: (studentId?: string) => void;
  onOpenParentMessage: (studentId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const TuitionView: React.FC<TuitionViewProps> = ({
  onOpenAddPayment,
  onOpenParentMessage,
  onSelectStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'low' | 'payments' | 'packages'>('overview');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const summaries = db.getAllTuitionSummaries();
  const payments = db.getPayments();
  const packages = db.getPackages();
  const classes = db.getClasses();

  // Low lesson students
  const lowSummaries = summaries
    .filter((s) => s.student.status === 'active' && s.remainingLessons <= 2)
    .sort((a, b) => a.remainingLessons - b.remainingLessons);

  // Filtered summaries
  const filteredSummaries = summaries.filter((s) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !s.student.fullName.toLowerCase().includes(q) &&
      !s.student.parentPhone.includes(q) &&
      !s.student.parentName.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filterClass !== 'all') {
      const cls = classes.find((c) => c.id === filterClass);
      if (!cls || !cls.studentIds.includes(s.student.id)) return false;
    }
    return true;
  });

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const student = db.getStudents().find((s) => s.id === p.studentId);
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
      (student && student.fullName.toLowerCase().includes(q)) ||
      (p.note && p.note.toLowerCase().includes(q))
    );
  });

  // Total collected all time & this month
  const totalCollectedAllTime = payments.reduce((acc, p) => acc + p.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalThisMonth = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Quản lý học phí & Gói buổi học
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi gói trả trước (10 buổi/gói), số buổi còn lại và cảnh báo thu tiền
          </p>
        </div>

        <button
          onClick={() => onOpenAddPayment()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>+ Thu học phí mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Doanh thu tháng này</span>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1 tabular-nums">
            {formatVND(totalThisMonth)}
          </p>
          <span className="text-[10px] text-slate-400">Tháng {currentMonth + 1}/{currentYear}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Tổng thu lũy kế</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {formatVND(totalCollectedAllTime)}
          </p>
          <span className="text-[10px] text-slate-400">{payments.length} lượt thanh toán</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Sắp hết buổi (≤ 2 buổi)</span>
          <p className="text-xl font-bold text-rose-600 font-mono mt-1 tabular-nums">
            {lowSummaries.length} học sinh
          </p>
          <span className="text-[10px] text-rose-500 font-medium">Cần gửi tin nhắn nhắc nộp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Gói học đang hoạt động</span>
          <p className="text-xl font-bold text-blue-600 font-mono mt-1 tabular-nums">
            {packages.filter((p) => p.status === 'active').length} gói
          </p>
          <span className="text-[10px] text-slate-400">Đang học tính theo buổi</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả học sinh ({summaries.length})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'low'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sắp hết buổi ({lowSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'payments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử giao dịch ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'packages'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh sách gói học ({packages.length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Overview of Student Tuition */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3">Phụ huynh & SĐT</th>
                  <th className="py-3 px-3 text-right">Đơn giá / buổi</th>
                  <th className="py-3 px-3 text-center">Tiến độ gói</th>
                  <th className="py-3 px-3 text-center">Số buổi còn</th>
                  <th className="py-3 px-3 text-right">Lần đóng gần nhất</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSummaries.map((s) => {
                  const rem = s.remainingLessons;
                  const isRed = rem === 0;
                  const isOrange = rem === 1;
                  const isYellow = rem === 2;

                  const totalPkg = s.activePackage?.totalLessons || 10;
                  const used = s.activePackage?.usedLessons || Math.max(0, totalPkg - rem);
                  const percent = Math.min(100, Math.round((used / totalPkg) * 100));

                  return (
                    <tr
                      key={s.student.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectStudent(s.student.id)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {s.student.fullName}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Khối {s.student.grade} · {s.student.school}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <span>{s.student.parentName}</span>
                        <p className="text-[11px] font-mono text-slate-500">{s.student.parentPhone}</p>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 tabular-nums">
                        {formatVND(s.student.defaultTuitionRate)}
                      </td>

                      <td className="py-3 px-3 text-center min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{used}/{totalPkg} buổi</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rem <= 0 ? 'bg-rose-500' : rem <= 2 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            isRed
                              ? 'bg-rose-100 text-rose-700'
                              : isOrange
                              ? 'bg-orange-100 text-orange-700'
                              : isYellow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {rem} buổi
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatDateVN(s.lastPaymentDate)}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenParentMessage(s.student.id)}
                            title="Gửi tin nhắn học phí"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenAddPayment(s.student.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            Thu phí
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Students Running Low on Lessons */}
      {activeTab === 'low' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Danh sách học sinh cần thu học phí (còn 0, 1 hoặc 2 buổi)</span>
            </h4>
            <p className="mt-1 text-amber-800">
              Thầy có thể bấm nút &quot;Nhắn tin PH&quot; để gửi tin nhắn thông báo học phí mẫu qua Zalo/SMS cho phụ huynh chỉ với 1 cú chạm.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
            {lowSummaries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Tuyệt vời! Không có học sinh nào sắp hết buổi học.
              </div>
            ) : (
              lowSummaries.map((s) => {
                const rem = s.remainingLessons;
                return (
                  <div
                    key={s.student.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl font-mono font-bold text-sm flex items-center justify-center shrink-0 ${
                          rem === 0
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300'
                            : rem === 1
                            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                            : 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                        }`}
                      >
                        {rem}
                      </div>

                      <div>
                        <h4
                          onClick={() => onSelectStudent(s.student.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm"
                        >
                          {s.student.fullName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Khối {s.student.grade} · Đơn giá: {formatVND(s.student.defaultTuitionRate)}/buổi · PH:{' '}
                          {s.student.parentName} ({s.student.parentPhone})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => onOpenParentMessage(s.student.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nhắn tin PH</span>
                      </button>

                      <button
                        onClick={() => onOpenAddPayment(s.student.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thu học phí</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Payment History */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">Mã phiếu</th>
                  <th className="py-3 px-3">Học sinh</th>
                  <th className="py-3 px-3">Ngày thu</th>
                  <th className="py-3 px-3 text-center">Gói buổi</th>
                  <th className="py-3 px-3 text-right">Đơn giá</th>
                  <th className="py-3 px-3 text-right">Tổng tiền</th>
                  <th className="py-3 px-3 text-center">Phương thức</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p) => {
                  const student = db.getStudents().find((s) => s.id === p.studentId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {p.receiptNumber || p.id}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          onClick={() => student && onSelectStudent(student.id)}
                          className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {student?.fullName || 'Học sinh'}
                        </span>
                        <p className="text-[11px] text-slate-400">Khối {student?.grade}</p>
                      </td>
                      <td className="py-3 px-3 font-mono">{formatDateVN(p.paymentDate)}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        +{p.lessonQuantity} buổi
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatVND(p.pricePerLesson)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatVND(p.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                          {p.paymentMethod === 'transfer'
                            ? 'Chuyển khoản'
                            : p.paymentMethod === 'cash'
                            ? 'Tiền mặt'
                            : 'Khác'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Packages */}
      {activeTab === 'packages' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3">Ngày bắt đầu</th>
                  <th className="py-3 px-3 text-center">Tổng buổi</th>
                  <th className="py-3 px-3 text-center">Đã học</th>
                  <th className="py-3 px-3 text-center">Còn lại</th>
                  <th className="py-3 px-3 text-right">Đơn giá</th>
                  <th className="py-3 px-3 text-center">Trạng thái gói</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {packages.map((pkg) => {
                  const student = db.getStudents().find((s) => s.id === pkg.studentId);
                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span
                          onClick={() => student && onSelectStudent(student.id)}
                          className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {student?.fullName || 'Học sinh'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{formatDateVN(pkg.startDate)}</td>
                      <td className="py-3 px-3 text-center font-mono">{pkg.totalLessons}</td>
                      <td className="py-3 px-3 text-center font-mono">{pkg.usedLessons}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={pkg.remainingLessons <= 1 ? 'text-rose-600' : 'text-slate-900'}
                        >
                          {pkg.remainingLessons}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatVND(pkg.pricePerLesson)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            pkg.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pkg.status === 'active' ? 'Đang học' : 'Đã học xong'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
