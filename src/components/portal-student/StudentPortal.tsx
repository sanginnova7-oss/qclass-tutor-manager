import React, { useState, useEffect } from 'react';
import {
  Home,
  Calendar,
  ListTodo,
  Award,
  BarChart3,
  BookOpen,
  Sparkles,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Download,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  X,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, formatDateTimeVN, formatVND } from '../../utils/formatters';
import { OnlineTestItem, QuestionBankItem, UserProfile } from '../../types';

interface StudentPortalProps {
  currentUser: UserProfile;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentUser }) => {
  const students = db.getStudents();
  // Find logged-in student or default to std-1
  const activeStudent = students.find((s) => s.id === currentUser.studentId) || students[0];

  const [activeTab, setActiveTab] = useState<
    'home' | 'schedule' | 'homework' | 'tests' | 'adaptive' | 'analytics' | 'resources' | 'ai' | 'notifications'
  >('home');

  const [dailyAnswers, setDailyAnswers] = useState<Record<string, any>>({});
  const [dailyFeedback, setDailyFeedback] = useState<Record<string, { isCorrect: boolean; explanation: string }>>({});

  const classes = db.getClasses().filter((c) => c.studentIds.includes(activeStudent?.id || ''));
  const allSessions = db.getSessions();
  const homework = db.getHomework().filter((h) => classes.some((c) => c.id === h.classId));
  const hwResults = db.getHomeworkResults().filter((r) => r.studentId === activeStudent?.id);
  const tests = db.getOnlineTests().filter((t) => classes.some((c) => c.id === t.classId));
  const testAttempts = db.getTestAttempts().filter((a) => a.studentId === activeStudent?.id);
  const questions = db.getQuestionBank();
  const resources = db.getResources().filter((r) => r.accessLevel !== 'teacher_only');
  const announcements = db.getAnnouncements();
  const notifications = db.getNotifications().filter(
    (n) => n.userId === 'all' || n.userId === activeStudent?.id || n.userId === currentUser.id
  );
  const learningProfile = db.getStudentLearningProfile(activeStudent?.id || 'std-1');
  const tuitionSummary = db.getStudentTuitionSummary(activeStudent?.id || 'std-1');
  const personalPath = db.getPersonalLearningPath(activeStudent?.id || 'std-1');
  const studentMasteries = db.getStudentTopicMasteries(activeStudent?.id || 'std-1');
  const studentErrors = db.getStudentErrors(activeStudent?.id || 'std-1');

  const handleCheckDailyPractice = (qId: string, correctAns: any, explanation?: string) => {
    const chosen = dailyAnswers[qId];
    const isCorrect = String(chosen).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
    db.submitDailyPractice(activeStudent?.id || 'std-1', qId, isCorrect);
    setDailyFeedback((prev) => ({
      ...prev,
      [qId]: { isCorrect, explanation: explanation || 'Lời giải chi tiết đã được cập nhật.' },
    }));
  };

  // Test Taking State
  const [activeTest, setActiveTest] = useState<OnlineTestItem | null>(null);
  const [testTimeLeft, setTestTimeLeft] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [completedAttempt, setCompletedAttempt] = useState<any | null>(null);

  // AI Math Chat State
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatLog, setAiChatLog] = useState<Array<{ sender: 'student' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Chào em ${activeStudent?.fullName || ''}! Thầy trợ lý AI QClass luôn sẵn sàng giải đáp thắc mắc lý thuyết Toán, gợi ý phương pháp giải và phân tích các dạng bài tập khó. Em đang muốn hỏi về chuyên đề nào?`,
      time: 'Vừa xong',
    },
  ]);

  // Test timer
  useEffect(() => {
    if (activeTest && testTimeLeft > 0) {
      const timer = setInterval(() => {
        setTestTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTest, testTimeLeft]);

  const handleStartTest = (test: OnlineTestItem) => {
    setActiveTest(test);
    setTestTimeLeft(test.durationMinutes * 60);
    setStudentAnswers({});
    setCompletedAttempt(null);
  };

  const handleSubmitTest = () => {
    if (!activeTest || !activeStudent) return;
    const attempt = db.submitTestAttempt({
      testId: activeTest.id,
      studentId: activeStudent.id,
      answers: studentAnswers,
    });
    setCompletedAttempt(attempt);
    setActiveTest(null);
  };

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const query = aiQuery.trim();
    setAiQuery('');
    const newStudentMsg = { sender: 'student' as const, text: query, time: 'Vừa xong' };
    setAiChatLog((prev) => [...prev, newStudentMsg]);

    setTimeout(() => {
      // Deterministic educational AI response grounded in Math concepts
      let reply = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('cauchy') || qLower.includes('bất đẳng thức') || qLower.includes('bđt')) {
        reply = `💡 **Gợi ý phương pháp Bất đẳng thức Cauchy (AM-GM):**
1. **Lý thuyết:** Với $a, b > 0$, ta luôn có: $a + b \\ge 2\\sqrt{ab}$.
2. **Kỹ thuật chọn điểm rơi:** Dự đoán giá trị của biến khi dấu "=" xảy ra (thường khi $a = b$).
3. **Mẹo biến đổi:** Nếu gặp biểu thức dạng $\\frac{1}{x} + \\frac{1}{y}$, hãy nhớ BĐT cộng mẫu số: $\\frac{1}{x} + \\frac{1}{y} \\ge \\frac{4}{x + y}$.
Em hãy thử áp dụng vào bài tập của mình xem nhé!`;
      } else if (qLower.includes('talet') || qLower.includes('đồng dạng') || qLower.includes('tam giác')) {
        reply = `📐 **Định lý Talet & Tam giác đồng dạng:**
- Nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ.
- **Tỉ số diện tích:** Nếu $\\Delta ABC \\sim \\Delta A'B'C'$ theo tỉ số đồng dạng $k$, thì tỉ số diện tích là $S_{ABC} / S_{A'B'C'} = k^2$. Chú ý không được nhầm lẫn giữa tỉ số độ dài ($k$) và tỉ số diện tích ($k^2$)!`;
      } else if (qLower.includes('vecto') || qLower.includes('véctơ') || qLower.includes('tọa độ')) {
        reply = `🎯 **Kiến thức Véctơ & Tọa độ Oxy:**
- Cho $\\vec{u} = (x_1; y_1)$ và $\\vec{v} = (x_2; y_2)$:
  - Tổng: $\\vec{u} + \\vec{v} = (x_1 + x_2; y_1 + y_2)$
  - Tích vô hướng: $\\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2$
  - Hai véctơ vuông góc $\\Leftrightarrow \\vec{u} \\cdot \\vec{v} = 0 \\Leftrightarrow x_1 x_2 + y_1 y_2 = 0$.`;
      } else {
        reply = `Thầy AI đã nhận câu hỏi: "${query}".
Để giải bài toán này, em hãy thực hiện theo 3 bước:
1. Xác định điều kiện xác định (ĐKXĐ) của bài toán.
2. Viết công thức biến đổi cơ bản và quan sát mối liên hệ giữa các giả thiết.
3. Thay số và thử lại kết quả. Em có thể gửi phương trình hoặc đề bài cụ thể để thầy hướng dẫn từng bước nhé!`;
      }

      setAiChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: 'Vừa xong',
        },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Student Profile Ribbon */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xl flex items-center justify-center border border-white/20">
            {activeStudent?.fullName.split(' ').slice(-1)[0]?.slice(0, 1) || 'H'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                Khối {activeStudent?.grade}
              </span>
              <span className="text-xs text-blue-200">{activeStudent?.school}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
              Xin chào, {activeStudent?.fullName}!
            </h2>
            <p className="text-xs text-blue-100">
              Lớp đang theo học:{' '}
              <strong className="text-white">
                {classes.map((c) => c.name).join(', ') || 'Toán Thầy Quang'}
              </strong>
            </p>
          </div>
        </div>

        {/* Remaining lessons indicator */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs flex items-center gap-4 shrink-0">
          <div>
            <span className="text-blue-200 block text-[11px]">Gói học phí hiện tại:</span>
            <span className="font-bold text-white text-sm font-mono">
              Còn {tuitionSummary?.remainingLessons ?? 0} buổi học
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white text-blue-700 font-bold flex items-center justify-center text-sm font-mono shadow-xs">
            {tuitionSummary?.remainingLessons ?? 0}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {[
          { id: 'home', label: 'Trang chủ', icon: Home },
          { id: 'schedule', label: 'Lịch học', icon: Calendar },
          { id: 'homework', label: 'Bài tập online', icon: ListTodo, badge: homework.length },
          { id: 'tests', label: 'Bài kiểm tra', icon: Award, badge: tests.length },
          { id: 'adaptive', label: 'Luyện tập cá nhân hóa', icon: BrainCircuit },
          { id: 'analytics', label: 'Năng lực học tập', icon: BarChart3 },
          { id: 'resources', label: 'Kho tài liệu', icon: BookOpen },
          { id: 'ai', label: 'Trợ lý học tập AI', icon: Sparkles },
          { id: 'notifications', label: 'Thông báo', icon: Bell, badge: notifications.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENT HOME */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* 4 Quick Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Chuyên cần</span>
              <p className="text-xl font-bold text-blue-600 font-mono mt-1">
                {learningProfile.attendanceRate}%
              </p>
              <span className="text-[10px] text-slate-400">Tỷ lệ đi học đầy đủ</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Bài tập về nhà</span>
              <p className="text-xl font-bold text-indigo-600 font-mono mt-1">
                {learningProfile.homeworkRate}%
              </p>
              <span className="text-[10px] text-slate-400">Tỷ lệ hoàn thành</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Điểm trung bình</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
                {learningProfile.averageScore} / 10
              </p>
              <span className="text-[10px] text-slate-400">Đánh giá chung</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Chỉ số phong độ (Health)</span>
              <p className="text-xl font-bold text-purple-600 font-mono mt-1">
                {learningProfile.healthScore} / 100
              </p>
              <span className="text-[10px] text-purple-600 font-medium">Phong độ tốt</span>
            </div>
          </div>

          {/* Two-Column split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upcoming Homework & Tests */}
            <div className="lg:col-span-7 space-y-6">
              {/* Upcoming Homework */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Bài tập cần hoàn thành</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('homework')}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Xem tất cả
                  </button>
                </div>

                <div className="space-y-2.5">
                  {homework.slice(0, 3).map((hw) => {
                    const res = hwResults.find((r) => r.homeworkId === hw.id);
                    const isDone = res?.status === 'completed';
                    return (
                      <div
                        key={hw.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-900">{hw.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Hạn nộp: <strong className="font-mono">{formatDateVN(hw.dueDate)}</strong>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDone ? 'Đã hoàn thành' : 'Chưa nộp'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Online Tests */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Bài kiểm tra trực tuyến có thể làm ngay</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className="text-xs text-purple-600 hover:underline font-semibold"
                  >
                    Vào phòng thi
                  </button>
                </div>

                <div className="space-y-2.5">
                  {tests.map((t) => {
                    const attempt = testAttempts.find((a) => a.testId === t.id);
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-900">{t.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Thời gian: <strong className="font-mono">{t.durationMinutes} phút</strong> · Thang điểm {t.maxScore}
                          </p>
                        </div>
                        {attempt ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold">
                            Đã thi: {attempt.score}/{attempt.maxScore} đ
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTab('tests');
                              handleStartTest(t);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Bắt đầu thi</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Mastery & AI Helper CTA */}
            <div className="lg:col-span-5 space-y-6">
              {/* Topic Mastery Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Mức độ nắm vững chuyên đề</span>
                </h3>

                <div className="space-y-3 pt-1">
                  {learningProfile.topicMasteries.slice(0, 4).map((tm) => (
                    <div key={tm.topic} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-700 truncate">{tm.topic}</span>
                        <span className="font-mono font-bold text-slate-900">{tm.masteryPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tm.masteryPercent >= 85
                              ? 'bg-emerald-500'
                              : tm.masteryPercent >= 70
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${tm.masteryPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">Khuyên dùng:</span>
                  <p className="text-xs text-indigo-700 font-medium mt-0.5">
                    {learningProfile.recommendations[0] || 'Duy trì phong độ học tập tốt.'}
                  </p>
                </div>
              </div>

              {/* AI Study Assistant Callout */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Trợ lý Toán học AI QClass</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Gặp bài toán khó chưa hiểu cách làm?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hỏi trợ lý AI để được giải thích định lý, gợi ý hướng tư duy hoặc tạo thêm bài tập tương tự.
                </p>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trò chuyện cùng Trợ lý AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Lịch học các lớp của em</h3>
              <p className="text-xs text-slate-500">Xem ngày học, khung giờ và phòng học</p>
            </div>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Khối {cls.grade}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{cls.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-1.5">
                    <span>🕒 {cls.scheduleDays.join(', ')} ({cls.startTime} - {cls.endTime})</span>
                    <span>·</span>
                    <span>📍 {cls.room || 'Phòng học chính'}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-200 text-center shrink-0">
                  Đang theo học
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ONLINE HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Phiếu bài tập về nhà trực tuyến</h3>
            <div className="divide-y divide-slate-100">
              {homework.map((hw) => {
                const res = hwResults.find((r) => r.homeworkId === hw.id);
                return (
                  <div key={hw.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{hw.title}</h4>
                      <p className="text-slate-500 mt-1">{hw.description || 'Làm đầy đủ các câu hỏi.'}</p>
                      <p className="text-slate-400 font-mono text-[11px] mt-1">
                        Hạn chót nộp: {formatDateVN(hw.dueDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-xl font-semibold ${
                          res?.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {res?.status === 'completed' ? '✓ Đã hoàn thành' : 'Chưa nộp bài'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ONLINE TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-5">
          {activeTest ? (
            /* Active Test Taking View */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold">
                    Đang làm bài thi trực tuyến
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">{activeTest.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-rose-700 font-mono font-bold text-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>
                      {Math.floor(testTimeLeft / 60)}:
                      {String(testTimeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={handleSubmitTest}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Nộp bài thi
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {activeTest.questions.map((qRef, index) => {
                  const q = questions.find((item) => item.id === qRef.questionId);
                  if (!q) return null;

                  return (
                    <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-700">Câu {index + 1} ({qRef.points} điểm)</span>
                        <span className="text-slate-400 font-mono">{q.topic}</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Options for single choice / true-false */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt) => (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                                studentAnswers[q.id] === opt.id
                                  ? 'bg-blue-50 border-blue-400 font-semibold text-blue-900'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={studentAnswers[q.id] === opt.id}
                                onChange={() =>
                                  setStudentAnswers({ ...studentAnswers, [q.id]: opt.id })
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span>{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Numeric question input */}
                      {q.questionType === 'numeric' && (
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nhập đáp án số của em:
                          </label>
                          <input
                            type="number"
                            value={studentAnswers[q.id] || ''}
                            onChange={(e) =>
                              setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })
                            }
                            placeholder="Ví dụ: 3"
                            className="w-48 px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={handleSubmitTest}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Hoàn thành và Nộp bài thi
                </button>
              </div>
            </div>
          ) : (
            /* Test List & Results */
            <div className="space-y-5">
              {completedAttempt && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-bold text-base">Đã nộp bài và tự động chấm điểm!</h3>
                  </div>
                  <p className="text-sm">
                    Điểm số của em: <strong className="text-emerald-700 font-mono text-xl">{completedAttempt.score} / {completedAttempt.maxScore} điểm</strong>
                  </p>
                  <p className="text-xs text-emerald-800">{completedAttempt.feedback}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Danh sách bài kiểm tra</h3>
                <div className="divide-y divide-slate-100">
                  {tests.map((t) => {
                    const attempt = testAttempts.find((a) => a.testId === t.id);
                    return (
                      <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                          <p className="text-slate-500 mt-0.5">{t.description}</p>
                          <p className="text-slate-400 font-mono mt-1">
                            Thời gian: {t.durationMinutes} phút · {t.questions.length} câu hỏi
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {attempt ? (
                            <div className="text-right">
                              <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 font-mono font-bold text-sm block">
                                {attempt.score} / {attempt.maxScore} đ
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Đã hoàn thành</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartTest(t)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Bắt đầu thi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB ADAPTIVE LEARNING & DAILY PRACTICE */}
      {activeTab === 'adaptive' && (
        <div className="space-y-6">
          {/* Hero Mastery Focus Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
                  Học Tập Thích Ứng Cá Nhân Hóa (Adaptive V4)
                </span>
                <h3 className="text-xl font-extrabold mt-1">Trọng tâm rèn luyện: {personalPath.currentFocus}</h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-300">Độ thành thạo hiện tại</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">{personalPath.masteryScore}/100</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${personalPath.masteryScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                <span>Cấp độ: {personalPath.practiceLevel.toUpperCase()}</span>
                <span>Mục tiêu tuần này: ≥ 75 điểm (Đạt mức Tốt)</span>
              </div>
            </div>
          </div>

          {/* Interactive Daily 5-min Practice */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Luyện tập hôm nay (Daily 5-Minute Practice)</h3>
                <p className="text-xs text-slate-500">4 câu hỏi trúng đích theo đúng lỗ hổng kiến thức cần củng cố</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Tự động chấm & giải thích
              </span>
            </div>

            <div className="space-y-6">
              {personalPath.dailyPractice.map((dp, idx) => {
                const fb = dailyFeedback[dp.id];
                return (
                  <div key={dp.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                        Câu {idx + 1} ({dp.topicName})
                      </span>
                      {fb && (
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                            fb.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {fb.isCorrect ? '✓ Chính xác (+Mastery)' : '✕ Chưa đúng'}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-slate-900 leading-relaxed text-sm">{dp.questionText}</p>

                    {/* Options or numeric input */}
                    {dp.options ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dp.options.map((opt, oIdx) => {
                          const isSelected = dailyAnswers[dp.id] === opt.text;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setDailyAnswers({ ...dailyAnswers, [dp.id]: opt.text })}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer font-medium text-xs flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + oIdx)}. {opt.text}
                              </span>
                              {isSelected && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="text-[11px] text-slate-500 font-semibold block mb-1">Nhập đáp số:</label>
                        <input
                          type="text"
                          value={dailyAnswers[dp.id] || ''}
                          onChange={(e) => setDailyAnswers({ ...dailyAnswers, [dp.id]: e.target.value })}
                          placeholder="Nhập số..."
                          className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-xs w-48"
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    {!fb ? (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            const correctVal =
                              dp.options?.find((o) => o.isCorrect)?.text ?? dp.correctNumericAnswer;
                            handleCheckDailyPractice(dp.id, correctVal, dp.explanation);
                          }}
                          disabled={!dailyAnswers[dp.id]}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Kiểm tra đáp án
                        </button>
                      </div>
                    ) : (
                      /* Explanation reveal */
                      <div
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          fb.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <p className="font-bold flex items-center gap-1.5">
                          {fb.isCorrect ? 'Tuyệt vời! Lời giải chi tiết:' : 'Gợi ý phương pháp giải đúng:'}
                        </p>
                        <p className="font-mono text-[11px] leading-relaxed">{fb.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spaced Review & Common Errors Alert */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Lịch ôn tập ngắt quãng (Spaced Review)</span>
              </h4>
              <p className="text-xs text-slate-500">Chu kỳ 1 - 3 - 7 - 14 - 30 ngày giúp ghi nhớ vĩnh viễn định lý</p>
              <div className="space-y-2 pt-1">
                {personalPath.reviewTopics.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-950">{rev.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                      {rev.dueDays === 0 ? 'Hôm nay' : `Sau ${rev.dueDays} ngày`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Lỗi sai bản chất cần chú ý</span>
              </h4>
              <p className="text-xs text-slate-500">Thầy giáo đã ghi chú các lỗi em hay gặp trong các bài kiểm tra gần đây</p>
              <div className="space-y-2 pt-1">
                {studentErrors.slice(0, 2).map((err) => (
                  <div key={err.id} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900">Chuyên đề: {err.topic}</span>
                    <p className="text-slate-700">{err.questionSummary}</p>
                    {err.correctionNote && <p className="text-blue-700 font-semibold text-[11px]">{err.correctionNote}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEARNING ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Hồ sơ năng lực học tập</h3>
            <p className="text-xs text-slate-500">
              Phân tích độ thuần thục theo chuyên đề Toán và các đề xuất cá nhân hóa:
            </p>

            <div className="space-y-4 pt-2">
              {learningProfile.topicMasteries.map((tm) => (
                <div key={tm.topic} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{tm.topic}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        tm.masteryPercent >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : tm.masteryPercent >= 70
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tm.masteryPercent}% - {tm.status === 'strong' ? 'Thuần thục' : tm.status === 'moderate' ? 'Khá' : 'Cần rèn luyện'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tm.masteryPercent >= 85 ? 'bg-emerald-500' : tm.masteryPercent >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${tm.masteryPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5 mt-4">
              <h4 className="font-bold">Đề xuất phương pháp học tập cho em:</h4>
              <ul className="list-disc pl-4 space-y-1 text-blue-800">
                {learningProfile.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RESOURCES */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Kho tài liệu & Đề thi ôn luyện</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Khối {res.grade} · {res.type.toUpperCase()}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{res.title}</h4>
                  <p className="text-slate-400 text-[11px]">
                    Dung lượng: {res.fileSize || '1.5 MB'} · {res.downloadCount} lượt tải
                  </p>
                </div>
                <button
                  onClick={() => {
                    db.incrementResourceDownload(res.id);
                    alert(`Đã bắt đầu tải xuống tài liệu: ${res.title}`);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Tải về"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: AI STUDY ASSISTANT */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý học tập AI QClass</h3>
                <p className="text-[11px] text-slate-400">Giải đáp lý thuyết, gợi ý phương pháp giải Toán</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              Sẵn sàng hỗ trợ
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            {aiChatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'student'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto text-[11px]">
            {['Gợi ý BĐT Cauchy', 'Định lý Talet tam giác', 'Tích vô hướng véctơ', 'Giải bài toán cực trị'].map(
              (prompt) => (
                <button
                  key={prompt}
                  onClick={() => setAiQuery(prompt)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 whitespace-nowrap cursor-pointer"
                >
                  {prompt}
                </button>
              )
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleAskAI} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Nhập câu hỏi hoặc chuyên đề Toán em muốn hỏi thầy..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-blue-500 text-slate-800"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 8: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Thông báo từ lớp học</h3>
          <div className="divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-xs">Không có thông báo mới.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="py-3 flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{n.title}</h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {formatDateTimeVN(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
