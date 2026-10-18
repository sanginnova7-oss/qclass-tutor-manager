import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Monitor,
  X,
} from 'lucide-react';
import { db } from '../../services/db';
import { AppSettings } from '../../types';
import { GoogleSheetsSyncModal } from '../modals/GoogleSheetsSyncModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { realtimeService } from '../../services/realtimeService';

export const SettingsView: React.FC = () => {
  const currentSettings = db.getSettings();
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    setShowResetConfirmModal(true);
  };

  const confirmResetData = () => {
    db.resetToDefault();
    setSettings(db.getSettings());
    setShowResetConfirmModal(false);
    realtimeService.dispatchEvent({
      type: 'system',
      title: 'Khôi phục dữ liệu mẫu',
      description: 'Đã hoàn tất khôi phục cơ sở dữ liệu mẫu chuẩn của hệ thống.',
      badge: 'Database',
    });
  };

  const handleExportJson = () => {
    const jsonStr = db.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qclass_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = db.importDataJSON(content);
        if (success) {
          setSettings(db.getSettings());
          setRestoreMessage('Đã nhập và khôi phục dữ liệu thành công!');
          setTimeout(() => setRestoreMessage(null), 3000);
          realtimeService.dispatchEvent({
            type: 'system',
            title: 'Khôi phục dữ liệu thành công',
            description: 'Đã nhập dữ liệu từ file sao lưu JSON thành công.',
            badge: 'Backup Restore',
          });
        } else {
          realtimeService.dispatchEvent({
            type: 'system',
            title: 'Lỗi định dạng file',
            description: 'File dữ liệu không đúng định dạng sao lưu của QClass.',
            badge: 'Import Error',
          });
        }
      } catch (err) {
        realtimeService.dispatchEvent({
          type: 'system',
          title: 'Lỗi đọc file',
          description: 'Có lỗi xảy ra khi đọc file sao lưu JSON.',
          badge: 'File Error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sqlSchema = db.generateSupabaseSQL();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Thiết lập hệ thống</h2>
          <p className="text-xs text-slate-500">
            Cấu hình quy tắc trừ buổi học phí, đơn giá chuẩn, thông tin giáo viên và sao lưu dữ liệu
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu thiết lập!</span>
          </span>
        )}
      </div>

      {restoreMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{restoreMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Attendance Deduction Rules (Critical Business Logic) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Quy tắc trừ buổi học phí khi điểm danh</span>
          </h3>
          <p className="text-xs text-slate-500">
            Thiết lập khi nào hệ thống sẽ tự động trừ 1 buổi từ gói học phí trả trước của học sinh:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deductionRules.present}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deductionRules: { ...settings.deductionRules, present: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <strong className="text-slate-900 block">Có mặt (Present)</strong>
                <span className="text-slate-500 text-[11px]">
                  Tự động trừ 1 buổi học phí khi học sinh đi học đầy đủ (Mặc định: BẬT).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deductionRules.excused}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deductionRules: { ...settings.deductionRules, excused: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <strong className="text-slate-900 block">Có phép (Excused Absence)</strong>
                <span className="text-slate-500 text-[11px]">
                  Học sinh xin nghỉ phép trước: KHÔNG trừ buổi học phí (Mặc định: TẮT).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deductionRules.unexcused}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deductionRules: { ...settings.deductionRules, unexcused: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <strong className="text-slate-900 block">Không phép (Unexcused Absence)</strong>
                <span className="text-slate-500 text-[11px]">
                  Học sinh nghỉ không báo trước: Vẫn trừ 1 buổi học phí (Mặc định: BẬT).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.deductionRules.makeup}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deductionRules: { ...settings.deductionRules, makeup: e.target.checked },
                  })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <strong className="text-slate-900 block">Học bù (Makeup Lesson)</strong>
                <span className="text-slate-500 text-[11px]">
                  Trừ 1 buổi khi học sinh học bù thay thế cho buổi nghỉ (Mặc định: BẬT).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 2: Tuition Package Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Thiết lập gói học phí mặc định</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Số buổi mặc định trong 1 gói đóng
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.defaultPackageSize}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultPackageSize: parseInt(e.target.value, 10) || 10 })
                  }
                  className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-center outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500 shrink-0">buổi/gói</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Đơn giá học phí mặc định (VNĐ/buổi)
              </label>
              <input
                type="number"
                step="5000"
                value={settings.defaultTuitionRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTuitionRate: parseInt(e.target.value, 10) || 60000 })
                }
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-right outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Teacher Information & Bank Transfer Account */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Thông tin giáo viên & Tài khoản nhận học phí
          </h3>
          <p className="text-xs text-slate-500">
            Thông tin này dùng để tạo tin nhắn Zalo/SMS tự động nhắc nộp học phí gửi phụ huynh:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên giáo viên / Quản trị viên
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Thầy Nguyễn Văn Sang"
                value={settings.teacherName}
                onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Môn giảng dạy
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Toán học"
                value={settings.teacherSubject || 'Toán học'}
                onChange={(e) => setSettings({ ...settings, teacherSubject: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại liên hệ / Zalo
              </label>
              <input
                type="tel"
                placeholder="Ví dụ: 0386493786"
                value={settings.teacherPhone}
                onChange={(e) => setSettings({ ...settings, teacherPhone: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 font-mono outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên ngân hàng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: MB Bank, Vietcombank..."
                value={settings.teacherBankName}
                onChange={(e) => setSettings({ ...settings, teacherBankName: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                value={settings.teacherBankAccount}
                onChange={(e) => setSettings({ ...settings, teacherBankAccount: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 font-mono font-semibold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên chủ tài khoản (viết hoa không dấu)
              </label>
              <input
                type="text"
                value={settings.teacherBankHolder}
                onChange={(e) => setSettings({ ...settings, teacherBankHolder: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 font-mono uppercase outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi cài đặt</span>
          </button>
        </div>
      </form>

      {/* Card 4: Backup, Restore & Data Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Quản lý và sao lưu dữ liệu</h3>
        <p className="text-xs text-slate-500">
          Dữ liệu được lưu trữ an toàn trong trình duyệt. Thầy có thể tải file sao lưu JSON về máy tính bất cứ lúc nào:
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải file sao lưu (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Nhập phục hồi từ file JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục dữ liệu mẫu ban đầu</span>
          </button>
        </div>
      </div>

      {/* Card: Google Sheets & Google Drive Cloud Sync */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 rounded-2xl border border-emerald-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Lưu trữ & Đồng bộ Google Sheets tự động
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động tạo bảng tính trên Google Drive, đẩy toàn bộ dữ liệu học sinh, điểm danh, học phí sang Google Sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thiết lập & Đồng bộ Google Sheets</span>
          </button>
        </div>

        {settings.googleSheets?.spreadsheetId && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/80 rounded-xl border border-emerald-200/80 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700">
                Bảng tính đang kết nối:{' '}
                <strong>{settings.googleSheets.spreadsheetTitle || 'QClass Spreadsheet'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {settings.googleSheets.lastSyncedAt && (
                <span className="text-slate-400 text-[11px]">
                  Lần đồng bộ gần nhất: {settings.googleSheets.lastSyncedAt}
                </span>
              )}
              <a
                href={settings.googleSheets.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
              >
                <span>Mở Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Card: PWA & Device Installation */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-2xl border border-blue-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Tải & Cài đặt ứng dụng ra thiết bị (PWA)
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Progressive Web App
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Tạo lối tắt ứng dụng độc lập trên màn hình chính của máy tính (Windows/macOS) hoặc điện thoại (Android/iOS). Mở lên sử dụng toàn màn hình, tải tức thì và không phụ thuộc vào thanh địa chỉ trình duyệt.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <PWAInstallButton variant="button" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-start gap-2.5">
            <Monitor className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Máy tính (Desktop / Laptop)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chạy như ứng dụng desktop độc lập trên thanh Taskbar / Dock, tối ưu giao diện thao tác nhanh phím tắt Ctrl+K.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Điện thoại (Android & iPhone)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Icon app trên màn hình chính, mở nhanh cho giáo viên điểm danh tại lớp và phụ huynh tra cứu điểm số học phí.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 5: Supabase / PostgreSQL Schema */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Kiến trúc cơ sở dữ liệu Supabase / PostgreSQL
            </h3>
          </div>
          <button
            onClick={() => setShowSqlModal(!showSqlModal)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            {showSqlModal ? 'Thu gọn' : 'Xem mã SQL Schema'}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Mô hình dữ liệu chuẩn hóa gồm 8 bảng (students, classes, class_students, payments, student_packages, sessions, attendance, tests, scores) đã sẵn sàng tích hợp với tài khoản Supabase khi triển khai production đa người dùng.
        </p>

        {showSqlModal && (
          <div className="pt-3 space-y-2">
            <div className="flex justify-end">
              <button
                onClick={handleCopySql}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all ${
                  copiedSql ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép toàn bộ SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
              {sqlSchema}
            </pre>
          </div>
        )}
      </div>

      {isGoogleSheetsModalOpen && (
        <GoogleSheetsSyncModal
          isOpen={isGoogleSheetsModalOpen}
          onClose={() => {
            setIsGoogleSheetsModalOpen(false);
            setSettings(db.getSettings());
          }}
        />
      )}

      {/* Confirmation Modal for Resetting to Default Sample Data */}
      {showResetConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Xác nhận khôi phục dữ liệu mẫu?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống sẽ hoàn tác và khôi phục toàn bộ danh sách lớp học, học sinh, điểm số và học phí về bộ dữ liệu mẫu chuẩn ban đầu. Mọi thay đổi bạn vừa tạo cục bộ sẽ được thiết lập lại.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmResetData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
