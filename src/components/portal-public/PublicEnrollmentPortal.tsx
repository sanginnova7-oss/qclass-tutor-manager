import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Phone,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatVND } from '../../utils/formatters';

interface PublicEnrollmentPortalProps {
  onBackToTeacherPortal?: () => void;
}

export const PublicEnrollmentPortal: React.FC<PublicEnrollmentPortalProps> = ({
  onBackToTeacherPortal,
}) => {
  const classes = db.getClasses().filter((c) => c.status === 'active');
  const settings = db.getSettings();

  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState<number>(9);
  const [school, setSchool] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim()) return;

    db.addLead({
      studentName: studentName.trim(),
      grade: Number(grade),
      school: school.trim() || undefined,
      parentName: parentName.trim() || 'Phụ huynh',
      parentPhone: parentPhone.trim(),
      source: 'Website',
      interestedClassId: selectedClassId || undefined,
      learningGoal: learningGoal.trim() || 'Bồi dưỡng kiến thức Toán & Thi vào 10',
      currentLevel: 'Chưa khảo sát',
      stage: 'new',
      notes: notes.trim() || undefined,
    });

    db.addNotification({
      userId: 'teacher',
      title: 'Đăng ký tuyển sinh mới từ Website',
      message: `Học sinh ${studentName} (Khối ${grade} - ${school || 'Hà Nội'}) vừa đăng ký học thử. SĐT: ${parentPhone}.`,
      type: 'announcement',
    });

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Hero Banner */}
      <div className="text-center space-y-4 pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>Tuyển Sinh Lớp Toán Chất Lượng Cao · {settings.teacherName || 'Thầy Nguyễn Văn Sang'}</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
          Bồi dưỡng tư duy Toán & Luyện thi Chuyên vào lớp 10
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Mô hình lớp học nhỏ 15–20 học sinh, lộ trình bám sát đề thi chuẩn, kiểm tra định kỳ và sổ liên lạc điện tử cập nhật từng buổi học.
        </p>
      </div>

      {/* 3 Core Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Học thử 01 buổi miễn phí</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Học sinh được trải nghiệm không gian học, đánh giá năng lực đầu vào và định hướng phương pháp học trước khi đăng ký chính thức.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Học phí minh bạch theo buổi</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Áp dụng hình thức đóng gói 10 buổi trả trước. Nghỉ có phép không bị trừ tiền, phụ huynh quét mã VietQR tự động tiện lợi.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Cổng học tập & Trợ lý AI</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Học sinh có tài khoản riêng làm bài tập trắc nghiệm, thi thử trực tuyến và được phân tích điểm mạnh yếu theo từng chuyên đề.
          </p>
        </div>
      </div>

      {/* Available Classes Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Các lớp học đang mở tuyển sinh:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                Khối {cls.grade}
              </span>
              <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
              <p className="text-slate-600">
                Lịch: <strong>{cls.scheduleDays.join(', ')}</strong> ({cls.startTime} - {cls.endTime})
              </p>
              <p className="text-emerald-700 font-mono font-bold">
                {formatVND(cls.defaultTuitionRate)} / buổi
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trial Registration Form Card */}
      <div className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-md">
        {isSubmitted ? (
          <div className="py-12 text-center space-y-4 animate-in fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">
              Đăng ký học thử thành công!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Cảm ơn phụ huynh em <strong className="text-slate-900">{studentName}</strong>. Thầy Quang sẽ chủ động liên hệ qua SĐT <strong className="text-blue-600 font-mono">{parentPhone}</strong> trong vòng 24 giờ để xếp lịch học thử phù hợp nhất.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 px-5 py-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Gửi thêm lượt đăng ký khác
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                Phiếu đăng ký học thử & Tư vấn lộ trình
              </h3>
              <p className="text-xs text-slate-500">
                Vui lòng điền thông tin để thầy liên hệ sắp xếp buổi học thử miễn phí:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 bg-white text-slate-800"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trường đang học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: THCS Giảng Võ, Cầu Giấy..."
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp quan tâm</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 bg-white text-slate-800"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên phụ huynh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bác Dũng (Bố)"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại Zalo / Gọi điện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="091..."
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mục tiêu học tập & Ghi chú thêm
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Con đang học lực khá nhưng yếu hình học không gian, gia đình mong muốn thi vào lớp 10 THPT Chu Văn An..."
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Xác nhận gửi thông tin đăng ký học thử</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Contact */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>QClass Tutor Manager · Địa chỉ lớp: Số 15 ngõ 42 Liễu Giai, Ba Đình, Hà Nội</p>
        <p>Hotline / Zalo thầy phụ trách: <strong className="text-slate-800 font-mono">{settings.teacherPhone}</strong></p>
      </div>
    </div>
  );
};
