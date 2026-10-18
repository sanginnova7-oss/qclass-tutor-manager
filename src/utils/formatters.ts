import { AlertLevel, AttendanceStatus, HomeworkStatus, StudentStatus } from '../types';

/**
 * Format number into Vietnamese currency format: 60.000 đ
 */
export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

/**
 * Format ISO date string or Date object to DD/MM/YYYY
 */
export function formatDateVN(dateInput: string | Date | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format to relative or full Vietnamese datetime: 14/10/2026 18:30
 */
export function formatDateTimeVN(dateInput: string | Date | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const dateStr = formatDateVN(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getTodayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate alert level based on remaining lessons
 */
export function getLessonAlertLevel(remaining: number): AlertLevel {
  if (remaining <= 0) return 'critical';
  if (remaining === 1) return 'urgent';
  if (remaining === 2) return 'warning';
  if (remaining <= 4) return 'caution';
  return 'normal';
}

export function getAlertBadgeStyles(level: AlertLevel): {
  bg: string;
  text: string;
  border: string;
  label: string;
  dotColor: string;
} {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
        label: 'Hết buổi (0)',
        dotColor: 'bg-rose-500',
      };
    case 'urgent':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        label: 'Còn 1 buổi',
        dotColor: 'bg-orange-500',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        label: 'Còn 2 buổi',
        dotColor: 'bg-amber-500',
      };
    case 'caution':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        label: 'Sắp hết',
        dotColor: 'bg-yellow-500',
      };
    case 'normal':
    default:
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        label: 'Đủ buổi',
        dotColor: 'bg-emerald-500',
      };
  }
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, { label: string; short: string; color: string; desc: string }> = {
  present: {
    label: 'Có mặt',
    short: 'CM',
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    desc: 'Trừ 1 buổi',
  },
  excused: {
    label: 'Có phép',
    short: 'CP',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    desc: 'Không trừ buổi',
  },
  unexcused: {
    label: 'Không phép',
    short: 'KP',
    color: 'bg-rose-600 hover:bg-rose-700 text-white',
    desc: 'Trừ 1 buổi',
  },
  makeup: {
    label: 'Học bù',
    short: 'HB',
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
    desc: 'Trừ 1 buổi bù',
  },
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, { label: string; color: string }> = {
  active: { label: 'Đang học', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  paused: { label: 'Tạm dừng', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  stopped: { label: 'Thôi học', color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

export const HOMEWORK_STATUS_LABELS: Record<HomeworkStatus, { label: string; color: string }> = {
  not_started: { label: 'Chưa làm', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  in_progress: { label: 'Đang làm', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  submitted: { label: 'Đã nộp', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  completed: { label: 'Đã hoàn thành', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  late: { label: 'Nộp muộn', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  needs_correction: { label: 'Cần sửa', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  partial: { label: 'Làm một phần', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  missing: { label: 'Thiếu bài', color: 'text-rose-700 bg-rose-50 border-rose-200' },
};
