import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Plus,
  AlertTriangle,
  LogOut,
  Layers,
  Users,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getCurrentUser,
} from '../../services/googleAuth';
import {
  createQClassSpreadsheet,
  syncAllDataToGoogleSheet,
  SyncStats,
} from '../../services/googleSheetsService';
import { db } from '../../services/db';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncSuccessStats, setSyncSuccessStats] = useState<SyncStats | null>(null);

  // Settings & Spreadsheet state
  const settings = db.getSettings();
  const [spreadsheetId, setSpreadsheetId] = useState(settings.googleSheets?.spreadsheetId || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(settings.googleSheets?.spreadsheetUrl || '');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(settings.googleSheets?.spreadsheetTitle || '');
  const [lastSyncedAt, setLastSyncedAt] = useState(settings.googleSheets?.lastSyncedAt || '');
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [customSheetIdInput, setCustomSheetIdInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Cửa sổ đăng nhập đã được đóng trước khi cấp quyền.');
      } else if (err?.code === 'auth/access-denied' || err?.message?.includes('access_denied')) {
        setErrorMessage('Tài khoản chưa được cấp quyền truy cập. Vui lòng thử lại với tài khoản Google đã phê duyệt.');
      } else {
        setErrorMessage(err?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setAccessToken(null);
      setSyncSuccessStats(null);
    } catch (err: any) {
      setErrorMessage('Lỗi khi đăng xuất.');
    }
  };

  const handleCreateNewSheet = async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      setErrorMessage('Vui lòng kết nối tài khoản Google trước.');
      return;
    }

    setIsCreatingSheet(true);
    setErrorMessage(null);
    try {
      const result = await createQClassSpreadsheet(token);
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setSpreadsheetTitle(result.title);
      // Auto prompt to sync data right after creation
      setShowConfirmSync(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tạo Google Sheet. Vui lòng kiểm tra quyền truy cập.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleApplyCustomSheetId = () => {
    if (!customSheetIdInput.trim()) return;
    let extractedId = customSheetIdInput.trim();
    // Support full URL extraction
    const match = customSheetIdInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    const newUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/edit`;
    setSpreadsheetId(extractedId);
    setSpreadsheetUrl(newUrl);
    setSpreadsheetTitle('Bảng tính Google Sheets tùy chỉnh');
    setShowCustomInput(false);

    // Save in settings
    db.updateSettings({
      ...settings,
      googleSheets: {
        ...settings.googleSheets,
        spreadsheetId: extractedId,
        spreadsheetUrl: newUrl,
      },
    });
  };

  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      setErrorMessage('Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    if (!spreadsheetId) {
      setErrorMessage('Chưa chọn bảng tính Google Sheets để đồng bộ.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncSuccessStats(null);
    try {
      const stats = await syncAllDataToGoogleSheet(token, spreadsheetId);
      setSyncSuccessStats(stats);
      setLastSyncedAt(stats.lastSyncedAt);
      setSpreadsheetUrl(stats.spreadsheetUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình ghi dữ liệu lên Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const studentsCount = db.getStudents().length;
  const attendanceCount = db.getAttendance().length;
  const paymentsCount = db.getPayments().length;
  const classesCount = db.getClasses().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Đồng bộ Google Sheets & Google Drive
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  API Trực Tiếp
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu trữ tự động học sinh, điểm danh và học phí lên bảng tính cá nhân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold">Thông báo lỗi:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: Google Account Connection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {currentUser?.displayName ? currentUser.displayName[0] : 'G'}
                  </div>
                )}
                <div>
                  {currentUser ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          {currentUser.displayName || 'Tài khoản Google'}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold text-slate-900">
                        Chưa kết nối tài khoản Google
                      </h4>
                      <p className="text-xs text-slate-500">
                        Đăng nhập bằng tài khoản Google có quyền truy cập Google Drive & Sheets
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div>
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất Google</span>
                  </button>
                ) : (
                  /* Standard Google Sign-In Button as mandated by skill */
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoadingAuth}
                    className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isLoadingAuth ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Spreadsheet Selection / Creation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bảng tính Google Sheets đích
              </h4>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {showCustomInput ? 'Thu gọn' : 'Liên kết Sheet có sẵn bằng link/ID'}
              </button>
            </div>

            {showCustomInput && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2">
                <p className="text-xs text-indigo-900 font-medium">
                  Dán đường dẫn (URL) hoặc mã ID của Google Sheet có sẵn:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customSheetIdInput}
                    onChange={(e) => setCustomSheetIdInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... hoặc mã ID"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleApplyCustomSheetId}
                    className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}

            {spreadsheetId ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                      Bảng tính đang kết nối:
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {spreadsheetTitle || 'QClass - Quản Lý Lớp Học & Học Phí'}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ID: {spreadsheetId}
                    </p>
                  </div>

                  <a
                    href={spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-xl transition-colors cursor-pointer w-fit"
                  >
                    <span>Mở Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {lastSyncedAt && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    🕒 Lần đồng bộ gần nhất: <strong>{lastSyncedAt}</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Bạn chưa có bảng tính nào được chỉ định. Nhấn nút bên dưới để tạo ngay 1 tệp Google Sheets mới với đầy đủ 6 trang tính chuẩn hóa.
                </p>
                <button
                  onClick={handleCreateNewSheet}
                  disabled={!currentUser || isCreatingSheet}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {isCreatingSheet
                      ? 'Đang khởi tạo bảng tính trên Google Drive...'
                      : 'Tạo Google Sheet mới trên Drive của tôi'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Data Preview to be Synced */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dữ liệu sẽ được ghi lên 6 trang tính (Sheets)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{studentsCount}</div>
                  <div className="text-[10px] text-slate-500">Học sinh</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{attendanceCount}</div>
                  <div className="text-[10px] text-slate-500">Lượt điểm danh</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{paymentsCount}</div>
                  <div className="text-[10px] text-slate-500">Phiếu thu học phí</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-violet-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{classesCount}</div>
                  <div className="text-[10px] text-slate-500">Lớp học</div>
                </div>
              </div>
            </div>
          </div>

          {/* Success summary card */}
          {syncSuccessStats && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Đồng bộ thành công 100% dữ liệu lên Google Sheets!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Đã cập nhật {syncSuccessStats.studentCount} học sinh, {syncSuccessStats.attendanceCount} bản ghi điểm danh, {syncSuccessStats.paymentCount} phiếu thu học phí và {syncSuccessStats.classCount} lớp học.
              </p>
              <div className="pt-1">
                <a
                  href={syncSuccessStats.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors"
                >
                  <span>Xem ngay trên Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Mandatory Confirmation Step for mutative write operation */}
          {showConfirmSync && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-amber-900">
                    Xác nhận đồng bộ & ghi đè dữ liệu lên Google Sheets
                  </h5>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Hệ thống sẽ cập nhật toàn bộ thông tin từ QClass vào các trang tính <strong>Tong_Quan, Hoc_Sinh, Diem_Danh, Thu_Hoc_Phi, Lop_Hoc, Diem_Kiem_Tra</strong> trên tệp Google Sheet của bạn.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  onClick={() => setShowConfirmSync(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy thao tác
                </button>
                <button
                  onClick={handleExecuteSync}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow transition-colors cursor-pointer"
                >
                  Tôi xác nhận, bắt đầu ghi dữ liệu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chuẩn Google Sheets v4 API • Bảo mật quyền tài khoản</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {spreadsheetId ? (
              <button
                onClick={() => setShowConfirmSync(true)}
                disabled={!currentUser || isSyncing}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'}</span>
              </button>
            ) : (
              <button
                onClick={handleCreateNewSheet}
                disabled={!currentUser || isCreatingSheet}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Khởi tạo bảng tính trước</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
