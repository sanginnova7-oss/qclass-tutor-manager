import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  ArrowRight,
  Info,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatVND } from '../../utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string | null;
  onSuccess?: (count: number) => void;
}

interface ParsedStudentRow {
  fullName: string;
  grade: number;
  school: string;
  parentName: string;
  parentPhone: string;
  studentPhone: string;
  defaultTuitionRate: number;
  initialPackageLessons: number;
  isValid: boolean;
  error?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
  onSuccess,
}) => {
  const classes = db.getClasses();
  const settings = db.getSettings();

  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || '');
  const [rawText, setRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null);

  if (!isOpen) return null;

  // Parser function that parses TSV (Excel/Google Sheets copy paste) or CSV
  const handleParseText = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const parsed: ParsedStudentRow[] = [];

    // Check if first line is a header (contains "tên" or "họ" or "name")
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLineLower = lines[0].toLowerCase();
      if (
        firstLineLower.includes('tên') ||
        firstLineLower.includes('họ') ||
        firstLineLower.includes('name') ||
        firstLineLower.includes('khối') ||
        firstLineLower.includes('sđt') ||
        firstLineLower.includes('phone')
      ) {
        startIndex = 1;
      }
    }

    const targetClass = classes.find((c) => c.id === selectedClassId);
    const defaultRate = targetClass?.defaultTuitionRate || settings.defaultTuitionRate || 60000;
    const defaultGrade = targetClass?.grade || 9;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect separator: Tab (\t) is default for Excel copy/paste, fallback to comma or semicolon
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      } else if (line.includes(';') && !line.includes(',')) {
        cols = line.split(';').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      } else {
        cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }

      // Column mapping heuristics:
      // Col 0: Full Name
      // Col 1: Grade or School or Phone
      // Col 2: School or Parent Name
      // Col 3: Parent Name or Parent Phone
      // Col 4: Parent Phone
      // Col 5: Student Phone
      // Col 6: Tuition Rate
      // Col 7: Initial Package Lessons

      const fullName = cols[0] || '';
      if (!fullName) continue;

      let grade = defaultGrade;
      let school = 'Chưa cập nhật';
      let parentName = 'Phụ huynh';
      let parentPhone = '';
      let studentPhone = '';
      let tuitionRate = defaultRate;
      let initialLessons = 10;

      // Extract remaining cols
      if (cols.length > 1) {
        // Try to parse grade if numeric <= 12
        const col1Num = parseInt(cols[1].replace(/\D/g, ''), 10);
        if (col1Num >= 1 && col1Num <= 12) {
          grade = col1Num;
          if (cols[2]) school = cols[2];
          if (cols[3]) parentName = cols[3];
          if (cols[4]) parentPhone = cols[4];
          if (cols[5]) studentPhone = cols[5];
          if (cols[6]) {
            const r = parseInt(cols[6].replace(/\D/g, ''), 10);
            if (r > 1000) tuitionRate = r;
          }
          if (cols[7]) {
            const l = parseInt(cols[7].replace(/\D/g, ''), 10);
            if (l >= 0 && l <= 100) initialLessons = l;
          }
        } else {
          // Col 1 might be phone or school
          if (/^0\d{8,10}$/.test(cols[1].replace(/\s/g, ''))) {
            parentPhone = cols[1];
            if (cols[2]) parentName = cols[2];
            if (cols[3]) school = cols[3];
          } else {
            school = cols[1];
            if (cols[2]) parentName = cols[2];
            if (cols[3]) parentPhone = cols[3];
            if (cols[4]) studentPhone = cols[4];
            if (cols[5]) {
              const r = parseInt(cols[5].replace(/\D/g, ''), 10);
              if (r > 1000) tuitionRate = r;
            }
          }
        }
      }

      const isValid = fullName.trim().length >= 2;
      parsed.push({
        fullName,
        grade,
        school,
        parentName,
        parentPhone,
        studentPhone,
        defaultTuitionRate: tuitionRate,
        initialPackageLessons: initialLessons,
        isValid,
        error: !isValid ? 'Tên học sinh không hợp lệ' : undefined,
      });
    }

    setParsedRows(parsed);
  };

  const handleInsertSample = () => {
    const sample = `Họ và tên\tKhối\tTrường\tTên phụ huynh\tSĐT phụ huynh\tHọc phí\tGói buổi
Nguyễn Hoàng Nam\t9\tTHCS Giảng Võ\tBác Dũng\t0912345671\t60000\t10
Trần Thảo Linh\t9\tTHCS Cầu Giấy\tCô Hương\t0987654321\t60000\t10
Lê Quốc Bảo\t9\tTHCS Archimedes\tAnh Tuấn\t0904123890\t60000\t12
Phạm Quỳnh Anh\t9\tTHCS Ngô Sĩ Liên\tChị Mai\t0913567899\t60000\t10
Đỗ Minh Khang\t9\tTHCS Trưng Vương\tBác Thành\t0978901234\t60000\t10`;
    handleParseText(sample);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);

    const importData = validRows.map((r) => ({
      fullName: r.fullName,
      grade: r.grade,
      school: r.school,
      parentName: r.parentName,
      parentPhone: r.parentPhone,
      studentPhone: r.studentPhone,
      defaultTuitionRate: r.defaultTuitionRate,
      initialPackageLessons: r.initialPackageLessons,
      classId: selectedClassId || undefined,
      notes: `Nhập từ bảng tính Excel ngày ${new Date().toLocaleDateString('vi-VN')}`,
    }));

    const result = db.bulkAddStudents(importData);

    setIsImporting(false);
    setImportResult({ success: true, count: result.count });

    if (onSuccess) {
      onSuccess(result.count);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-emerald-400 border border-white/10">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Nhập danh sách học sinh từ Excel / Google Sheets
              </h3>
              <p className="text-xs text-slate-300">
                Chỉ cần bôi đen, copy từ bảng tính Excel rồi dán (Ctrl+V) vào ô bên dưới
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {importResult ? (
          <div className="p-10 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              Nhập thành công {importResult.count} học sinh!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Danh sách học sinh, tài khoản Cổng học sinh & Cổng phụ huynh, gói học phí ban đầu và phân lớp đã được cập nhật Real-time toàn hệ thống.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setImportResult(null);
                  setRawText('');
                  setParsedRows([]);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Nhập thêm đợt khác
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Target Class Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Xếp học sinh vào lớp học:
                </span>
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs rounded-xl border border-blue-200 bg-white px-3 py-2 text-slate-800 font-semibold outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="">-- Chưa xếp lớp (Chỉ thêm vào danh sách chung) --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Khối {cls.grade} · {formatVND(cls.defaultTuitionRate)}/b)
                  </option>
                ))}
              </select>
            </div>

            {/* Paste Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Dán dữ liệu từ bảng tính (Copy & Paste):</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (Hỗ trợ các cột: Họ tên, Khối, Trường, Phụ huynh, SĐT, Học phí)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dán mẫu thử nghiệm</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => handleParseText(e.target.value)}
                placeholder="Ví dụ dán từ Excel:
Nguyễn Hoàng Nam	9	THCS Giảng Võ	Bác Dũng	0912345671	60000	10
Trần Thảo Linh	9	THCS Cầu Giấy	Cô Hương	0987654321	60000	10"
                className="w-full text-xs font-mono rounded-2xl border border-slate-300 p-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 leading-relaxed shadow-inner"
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Bản xem trước dữ liệu trích xuất ({validCount}/{parsedRows.length} học sinh hợp lệ):
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Đã tự động nhận diện các cột
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Họ và tên</th>
                        <th className="py-2 px-3 text-center">Khối</th>
                        <th className="py-2 px-3">Trường</th>
                        <th className="py-2 px-3">Phụ huynh & SĐT</th>
                        <th className="py-2 px-3 text-right">Học phí</th>
                        <th className="py-2 px-3 text-center">Gói ban đầu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {parsedRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 ${
                            !r.isValid ? 'bg-rose-50/60 text-rose-900' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {r.fullName}
                            {r.error && (
                              <span className="block text-[10px] text-rose-600">{r.error}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                            {r.school}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-800">{r.parentName}</span>
                            <span className="block font-mono text-[11px] text-slate-400">
                              {r.parentPhone || 'Chưa có SĐT'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-emerald-700">
                            {formatVND(r.defaultTuitionRate)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                              {r.initialPackageLessons} buổi
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!importResult && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              {validCount > 0 ? (
                <span>
                  Sẵn sàng thêm <strong className="text-blue-600 font-bold">{validCount}</strong> học sinh
                  {selectedClassId
                    ? ` vào ${classes.find((c) => c.id === selectedClassId)?.name}`
                    : ''}
                </span>
              ) : (
                <span>Hãy dán dữ liệu từ Excel để bắt đầu trích xuất</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validCount === 0 || isImporting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xác nhận nhập {validCount > 0 ? `(${validCount} HS)` : ''}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
