import { db } from './db';
import { formatDateVN, formatVND } from '../utils/formatters';

export interface SyncStats {
  studentCount: number;
  attendanceCount: number;
  paymentCount: number;
  classCount: number;
  examCount: number;
  lastSyncedAt: string;
  spreadsheetUrl: string;
}

const REQUIRED_SHEETS = [
  'Tong_Quan',
  'Hoc_Sinh',
  'Diem_Danh',
  'Thu_Hoc_Phi',
  'Lop_Hoc',
  'Diem_Kiem_Tra',
];

/**
 * Creates a brand new Google Spreadsheet for QClass in the user's Google Drive.
 */
export async function createQClassSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const settings = db.getSettings();
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const title =
    customTitle ||
    `QClass - Quản Lý Lớp Học & Học Phí [${settings.teacherName || 'Thầy Cô'}] (${dateStr})`;

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'vi_VN',
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      sheets: REQUIRED_SHEETS.map((sheetTitle) => ({
        properties: {
          title: sheetTitle,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Lỗi khi tạo Google Sheet: HTTP ${res.status}`
    );
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Update in settings
  const updatedSettings = {
    ...settings,
    googleSheets: {
      ...settings.googleSheets,
      spreadsheetId,
      spreadsheetUrl,
      spreadsheetTitle: title,
    },
  };
  db.updateSettings(updatedSettings);

  return { spreadsheetId, spreadsheetUrl, title };
}

/**
 * Checks if all required sheets exist in spreadsheet, creates them if missing.
 */
export async function ensureSpreadsheetStructure(
  accessToken: string,
  spreadsheetId: string
): Promise<{ sheetMap: Record<string, number> }> {
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!getRes.ok) {
    const errorData = await getRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Không thể truy cập Google Sheet ID: ${spreadsheetId}`
    );
  }

  const sheetData = await getRes.json();
  const existingSheets: Array<{ sheetId: number; title: string }> =
    sheetData.sheets?.map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })) || [];

  const existingTitles = new Set(existingSheets.map((s) => s.title));
  const missingTitles = REQUIRED_SHEETS.filter((title) => !existingTitles.has(title));

  if (missingTitles.length > 0) {
    // Add missing sheets
    const requests = missingTitles.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  // Refetch sheets
  const updatedRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const updatedData = await updatedRes.json();
  const sheetMap: Record<string, number> = {};
  updatedData.sheets?.forEach((s: any) => {
    sheetMap[s.properties.title] = s.properties.sheetId;
  });

  return { sheetMap };
}

/**
 * Syncs all students, attendance, payments, classes, exams to Google Sheets.
 */
export async function syncAllDataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<SyncStats> {
  const { sheetMap } = await ensureSpreadsheetStructure(accessToken, spreadsheetId);

  const students = db.getStudents();
  const classes = db.getClasses();
  const attendance = db.getAttendance();
  const payments = db.getPayments();
  const tests = db.getTests();
  const scores = db.getScores();
  const centers = db.getCenters();
  const settings = db.getSettings();
  const now = new Date();
  const syncTimestampStr = now.toLocaleString('vi-VN');

  // Map classes and centers for quick lookup
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const centerMap = new Map(centers.map((c) => [c.id, c.name]));
  const studentMap = new Map(students.map((s) => [s.id, s.fullName]));

  // 1. Data for Tong_Quan
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalAtt = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'makeup').length;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

  const tongQuanRows: any[][] = [
    ['BẢNG TỔNG QUAN HỆ THỐNG QUẢN LÝ LỚP HỌC QCLASS', ''],
    ['Giáo viên phụ trách', settings.teacherName || 'Thầy Nguyễn Văn Sang'],
    ['Môn giảng dạy', settings.teacherSubject || 'Toán học'],
    ['Số điện thoại liên hệ', settings.teacherPhone || '0386493786'],
    ['Thời điểm đồng bộ', syncTimestampStr],
    ['', ''],
    ['CHỈ SỐ TỔNG HỢP', 'GIÁ TRỊ'],
    ['Tổng số học sinh', students.length],
    ['Số lớp học đang vận hành', classes.filter((c) => c.status === 'active').length],
    ['Tổng doanh thu học phí đã thu', `${formatVND(totalRevenue)}`],
    ['Tổng số lượt điểm danh', totalAtt],
    ['Tỷ lệ chuyên cần trung bình', `${attRate}%`],
    ['Số cơ sở hoạt động', centers.length || 1],
    ['', ''],
    ['LƯU Ý DÀNH CHO THẦY CÔ & TRỢ GIẢNG:', ''],
    ['- Dữ liệu trên bảng tính này được đồng bộ trực tiếp từ ứng dụng QClass Tutor Manager.', ''],
    ['- Thầy cô có thể chia sẻ tệp này cho Trợ giảng hoặc Phụ huynh theo quyền Chỉ xem (Viewer).', ''],
  ];

  // 2. Data for Hoc_Sinh
  const hocSinhHeader = [
    'Mã học sinh',
    'Họ và tên',
    'Khối',
    'Trường học',
    'Lớp học',
    'Tên phụ huynh',
    'Số điện thoại PH',
    'Số buổi đã học',
    'Số buổi còn lại',
    'Trạng thái gói',
    'Trạng thái học',
    'Ngày nhập học',
    'Ghi chú',
  ];

  const tuitionSummaries = db.getAllTuitionSummaries();
  const summaryMap = new Map(tuitionSummaries.map((ts) => [ts.student.id, ts]));

  const hocSinhRows: any[][] = [
    hocSinhHeader,
    ...students.map((st) => {
      const summary = summaryMap.get(st.id);
      const studentClasses = classes
        .filter((c) => c.studentIds.includes(st.id))
        .map((c) => c.name)
        .join(', ');
      
      const statusMap: Record<string, string> = {
        active: 'Đang học',
        paused: 'Tạm nghỉ',
        stopped: 'Đã dừng học',
      };

      const alertMap: Record<string, string> = {
        critical: 'Đã hết buổi (0)',
        urgent: 'Khẩn cấp (1 buổi)',
        warning: 'Cảnh báo (2 buổi)',
        caution: 'Sắp hết (3-4 buổi)',
        normal: 'Bình thường',
      };

      return [
        st.id,
        st.fullName,
        st.grade ? `Khối ${st.grade}` : '',
        st.school || '',
        studentClasses || 'Chưa xếp lớp',
        st.parentName || '',
        st.parentPhone || '',
        summary?.totalLessonsUsed || 0,
        summary?.remainingLessons ?? 0,
        summary ? alertMap[summary.alertLevel] || 'Bình thường' : 'Chưa có gói',
        statusMap[st.status] || st.status,
        st.enrollmentDate ? formatDateVN(st.enrollmentDate) : '',
        st.notes || '',
      ];
    }),
  ];

  // 3. Data for Diem_Danh
  const diemDanhHeader = [
    'Mã điểm danh',
    'Ngày học',
    'Lớp học',
    'Học sinh',
    'Trạng thái',
    'Trừ buổi học phí',
    'Nhận xét của giáo viên',
    'Thời gian tạo',
  ];

  const diemDanhRows: any[][] = [
    diemDanhHeader,
    ...attendance.slice(-500).map((att) => {
      const statusText: Record<string, string> = {
        present: 'Có mặt',
        excused: 'Có phép',
        unexcused: 'Không phép',
        makeup: 'Học bù',
      };
      return [
        att.id,
        formatDateVN(att.date),
        classMap.get(att.classId) || att.classId,
        studentMap.get(att.studentId) || att.studentId,
        statusText[att.status] || att.status,
        att.lessonDeducted ? 'Có (-1 buổi)' : 'Không',
        att.note || '',
        att.createdAt ? new Date(att.createdAt).toLocaleDateString('vi-VN') : '',
      ];
    }),
  ];

  // 4. Data for Thu_Hoc_Phi
  const thuHocPhiHeader = [
    'Mã phiếu thu',
    'Ngày thu',
    'Học sinh',
    'Số buổi nạp',
    'Đơn giá / buổi',
    'Tổng tiền thu',
    'Hình thức',
    'Trạng thái',
    'Ghi chú',
  ];

  const thuHocPhiRows: any[][] = [
    thuHocPhiHeader,
    ...payments.map((p) => {
      const methodText: Record<string, string> = {
        transfer: 'Chuyển khoản (VietQR)',
        cash: 'Tiền mặt',
        other: 'Khác',
      };
      return [
        p.receiptNumber || p.id,
        formatDateVN(p.paymentDate),
        studentMap.get(p.studentId) || p.studentId,
        p.lessonQuantity,
        p.pricePerLesson,
        p.amount,
        methodText[p.paymentMethod] || p.paymentMethod,
        p.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận',
        p.note || '',
      ];
    }),
  ];

  // 5. Data for Lop_Hoc
  const lopHocHeader = [
    'Mã lớp',
    'Tên lớp học',
    'Môn học',
    'Khối',
    'Cơ sở',
    'Lịch học',
    'Khung giờ',
    'Học phí chuẩn/buổi',
    'Số lượng học sinh',
    'Trạng thái',
  ];

  const lopHocRows: any[][] = [
    lopHocHeader,
    ...classes.map((cls) => [
      cls.id,
      cls.name,
      cls.subject || 'Toán học',
      `Khối ${cls.grade}`,
      'Cơ sở chính',
      (cls.scheduleDays || []).join(', '),
      `${cls.startTime} - ${cls.endTime}`,
      cls.defaultTuitionRate,
      cls.studentIds.length,
      cls.status === 'active' ? 'Đang mở' : 'Đã lưu trữ',
    ]),
  ];

  // 6. Data for Diem_Kiem_Tra
  const diemKiemTraHeader = [
    'Mã bài thi',
    'Tên bài kiểm tra',
    'Lớp',
    'Học sinh',
    'Điểm số (/10)',
    'Nhận xét giáo viên',
    'Ngày chấm',
  ];

  const testMap = new Map(tests.map((t) => [t.id, t]));

  const diemKiemTraRows: any[][] = [
    diemKiemTraHeader,
    ...scores.slice(-300).map((sc) => {
      const t = testMap.get(sc.testId);
      return [
        sc.testId,
        t?.title || 'Bài kiểm tra',
        t ? classMap.get(t.classId) || '' : '',
        studentMap.get(sc.studentId) || sc.studentId,
        sc.score,
        sc.notes || '',
        sc.createdAt ? new Date(sc.createdAt).toLocaleDateString('vi-VN') : '',
      ];
    }),
  ];

  // Clear existing ranges first
  const clearRanges = REQUIRED_SHEETS.map((title) => `'${title}'!A1:Z1000`);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ranges: clearRanges }),
    }
  );

  // Helper to sanitize spreadsheet cells (prevent formula injection)
  const sanitizeSheetRows = (rows: any[][]): any[][] =>
    rows.map((row) =>
      row.map((cell) => {
        if (typeof cell === 'string') {
          const t = cell.trim();
          if (t.startsWith('=') || t.startsWith('+') || t.startsWith('-') || t.startsWith('@')) {
            return `'${cell}`;
          }
        }
        return cell;
      })
    );

  // Batch update values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: "'Tong_Quan'!A1", values: sanitizeSheetRows(tongQuanRows) },
          { range: "'Hoc_Sinh'!A1", values: sanitizeSheetRows(hocSinhRows) },
          { range: "'Diem_Danh'!A1", values: sanitizeSheetRows(diemDanhRows) },
          { range: "'Thu_Hoc_Phi'!A1", values: sanitizeSheetRows(thuHocPhiRows) },
          { range: "'Lop_Hoc'!A1", values: sanitizeSheetRows(lopHocRows) },
          { range: "'Diem_Kiem_Tra'!A1", values: sanitizeSheetRows(diemKiemTraRows) },
        ],
      }),
    }
  );

  if (!writeRes.ok) {
    const errorData = await writeRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Lỗi ghi dữ liệu lên Google Sheets: HTTP ${writeRes.status}`
    );
  }

  // Format headers with styling (background color, bold, white text)
  try {
    const formatRequests: any[] = [];
    REQUIRED_SHEETS.forEach((sheetTitle) => {
      const sId = sheetMap[sheetTitle];
      if (sId !== undefined) {
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.08, green: 0.16, blue: 0.32 }, // #142852 dark navy
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                  fontSize: 10,
                },
                horizontalAlignment: 'LEFT',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        });
      }
    });

    if (formatRequests.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: formatRequests }),
        }
      );
    }
  } catch (fmtErr) {
    console.warn('Formatting sheets warning (non-fatal):', fmtErr);
  }

  // Save last sync time in settings
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const updatedSettings = {
    ...settings,
    googleSheets: {
      ...settings.googleSheets,
      spreadsheetId,
      spreadsheetUrl,
      lastSyncedAt: syncTimestampStr,
    },
  };
  db.updateSettings(updatedSettings);

  return {
    studentCount: students.length,
    attendanceCount: attendance.length,
    paymentCount: payments.length,
    classCount: classes.length,
    examCount: scores.length,
    lastSyncedAt: syncTimestampStr,
    spreadsheetUrl,
  };
}
