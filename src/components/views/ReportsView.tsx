import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  Filter,
  TrendingUp,
  Users,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, formatVND } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const payments = db.getPayments();
  const students = db.getStudents();
  const classes = db.getClasses();
  const attendance = db.getAttendance();
  const packages = db.getPackages();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Revenue calculations
  const revenueToday = payments
    .filter((p) => p.paymentDate === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue this week (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const revenueThisWeek = payments
    .filter((p) => new Date(p.paymentDate) >= oneWeekAgo)
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue this month
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const revenueThisMonth = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue this year
  const revenueThisYear = payments
    .filter((p) => new Date(p.paymentDate).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered payments based on selected options
  const filteredPayments = payments.filter((p) => {
    // Payment method
    if (selectedMethod !== 'all' && p.paymentMethod !== selectedMethod) {
      return false;
    }

    // Class filter
    if (selectedClassId !== 'all') {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (!cls || !cls.studentIds.includes(p.studentId)) return false;
    }

    // Date filter
    const pDate = new Date(p.paymentDate);
    if (dateFilter === 'today') {
      return p.paymentDate === todayStr;
    }
    if (dateFilter === 'week') {
      return pDate >= oneWeekAgo;
    }
    if (dateFilter === 'month') {
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    }
    if (dateFilter === 'year') {
      return pDate.getFullYear() === currentYear;
    }
    return true;
  });

  const filteredTotal = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Attendance statistics
  const totalAtt = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const excusedCount = attendance.filter((a) => a.status === 'excused').length;
  const unexcusedCount = attendance.filter((a) => a.status === 'unexcused').length;
  const makeupCount = attendance.filter((a) => a.status === 'makeup').length;
  const overallAttendanceRate = totalAtt > 0 ? Math.round(((presentCount + makeupCount) / totalAtt) * 100) : 100;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã phiếu', 'Học sinh', 'Ngày thu', 'Số buổi', 'Đơn giá', 'Tổng tiền', 'Hình thức', 'Ghi chú'];
    const rows = filteredPayments.map((p) => {
      const st = students.find((s) => s.id === p.studentId);
      return [
        p.receiptNumber || p.id,
        st?.fullName || 'Học sinh',
        p.paymentDate,
        p.lessonQuantity,
        p.pricePerLesson,
        p.amount,
        p.paymentMethod === 'transfer' ? 'Chuyển khoản' : p.paymentMethod === 'cash' ? 'Tiền mặt' : 'Khác',
        p.note || '',
      ];
    });

    const formatCell = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvRows = [
      headers.map(formatCell).join(','),
      ...rows.map((r) => r.map(formatCell).join(',')),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_doanh_thu_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Báo cáo tài chính & Hiệu quả lớp học
          </h2>
          <p className="text-xs text-slate-500">
            Thống kê doanh thu học phí, tỷ lệ chuyên cần và số liệu vận hành
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In báo cáo</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Revenue Period Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Hôm nay</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {formatVND(revenueToday)}
          </p>
          <span className="text-[10px] text-slate-400">Doanh thu trong ngày</span>
        </div>

        {/* This Week */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Tuần này (7 ngày)</span>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1 tabular-nums">
            {formatVND(revenueThisWeek)}
          </p>
          <span className="text-[10px] text-slate-400">7 ngày gần nhất</span>
        </div>

        {/* This Month */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Tháng {currentMonth + 1}/{currentYear}</span>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1 tabular-nums">
            {formatVND(revenueThisMonth)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Doanh thu tháng hiện tại</span>
        </div>

        {/* This Year */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Cả năm {currentYear}</span>
          <p className="text-xl font-bold text-indigo-700 font-mono mt-1 tabular-nums">
            {formatVND(revenueThisYear)}
          </p>
          <span className="text-[10px] text-slate-400">Lũy kế năm {currentYear}</span>
        </div>
      </div>

      {/* Attendance & Growth Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-800">Tỷ lệ chuyên cần chung</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600 font-mono">{overallAttendanceRate}%</span>
            <span className="text-xs text-slate-500">tổng số buổi</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <span>CM: {presentCount}</span>
            <span>·</span>
            <span>CP: {excusedCount}</span>
            <span>·</span>
            <span className="text-rose-600">KP: {unexcusedCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-800">Quy mô học sinh</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600 font-mono">
              {students.filter((s) => s.status === 'active').length}
            </span>
            <span className="text-xs text-slate-500">đang theo học</span>
          </div>
          <p className="text-xs text-slate-400">
            {students.filter((s) => s.status === 'paused').length} em tạm dừng · {students.filter((s) => s.status === 'stopped').length} em thôi học
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold text-slate-800">Gói học hoàn thành</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-600 font-mono">
              {packages.filter((p) => p.status === 'completed').length}
            </span>
            <span className="text-xs text-slate-500">gói đã học xong</span>
          </div>
          <p className="text-xs text-slate-400">
            {packages.filter((p) => p.status === 'active').length} gói đang hoạt động
          </p>
        </div>
      </div>

      {/* Revenue Filter & Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Chi tiết doanh thu học phí</h3>
            <p className="text-xs text-slate-500">
              Tổng số tiền theo bộ lọc: <strong className="text-emerald-700 font-mono">{formatVND(filteredTotal)}</strong> ({filteredPayments.length} giao dịch)
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="month">Tháng này</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="year">Năm nay</option>
              <option value="all">Tất cả thời gian</option>
            </select>

            {/* Class filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Method filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="cash">Tiền mặt</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Mã phiếu</th>
                <th className="py-2.5 px-3">Học sinh</th>
                <th className="py-2.5 px-3">Ngày thu</th>
                <th className="py-2.5 px-3 text-center">Gói buổi</th>
                <th className="py-2.5 px-3 text-right">Đơn giá</th>
                <th className="py-2.5 px-3 text-right">Số tiền</th>
                <th className="py-2.5 px-3 text-center">Hình thức</th>
                <th className="py-2.5 px-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không có giao dịch nào trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const student = students.find((s) => s.id === p.studentId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-medium text-blue-600">
                        {p.receiptNumber || p.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {student?.fullName || 'Học sinh'}
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
                      <td className="py-3 px-3 text-slate-500 italic">{p.note || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
