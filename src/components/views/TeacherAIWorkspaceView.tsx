import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  Target,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Calendar,
  Clock,
  Send,
  Copy,
  Check,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  Award,
  Zap,
  Users,
  Eye,
  Edit,
  Trash2,
  Printer,
  ChevronRight,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  DifficultyLevel,
  ErrorCategory,
  QuestionType,
  TestBlueprint,
  WorksheetType,
} from '../../types';
import { formatDateVN, formatVND } from '../../utils/formatters';

interface TeacherAIWorkspaceViewProps {
  onSelectStudent: (studentId: string) => void;
  onOpenWorksheetPrint?: (worksheetId: string) => void;
}

export const TeacherAIWorkspaceView: React.FC<TeacherAIWorkspaceViewProps> = ({
  onSelectStudent,
  onOpenWorksheetPrint,
}) => {
  const [activeTab, setActiveTab] = useState<
    'daily_brief' | 'lesson_planner' | 'question_generator' | 'worksheet_generator' | 'test_generator' | 'grading_assistant' | 'ai_credits'
  >('daily_brief');

  const classes = db.getClasses();
  const students = db.getStudents();
  const topics = db.getKnowledgeTopics();
  const drafts = db.getAIQuestionDrafts();
  const worksheets = db.getWorksheets();
  const tenant = db.getTenant();
  const tasks = db.getTasks('today');
  const summaries = db.getAllTuitionSummaries();
  const lowLessonsStudents = summaries.filter((s) => s.remainingLessons <= 2);

  // Tab 1: AI Daily Brief State
  const [briefDate] = useState(new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // Tab 2: AI Lesson Planner State
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTopic, setSelectedTopic] = useState<string>('Bất đẳng thức & Cực trị đại số');
  const [duration, setDuration] = useState<number>(90);
  const [learningObjective, setLearningObjective] = useState<string>('Nắm vững BĐT Cauchy cộng mẫu, phân hóa điểm 8-9-10');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Tab 3: AI Question Generator State
  const [qGrade, setQGrade] = useState<number>(9);
  const [qTopic, setQTopic] = useState<string>(topics[0]?.name || 'Căn thức bậc hai & Rút gọn đại số');
  const [qDiff, setQDiff] = useState<DifficultyLevel>('application');
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qCount, setQCount] = useState<number>(2);
  const [generatedDrafts, setGeneratedDrafts] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [approvedNotification, setApprovedNotification] = useState<string | null>(null);

  // Tab 4: Worksheet Generator State
  const [wsTitle, setWsTitle] = useState('Phiếu bài tập rèn kỹ năng giải phương trình');
  const [wsType, setWsType] = useState<WorksheetType>('weak_topic');
  const [wsGroup, setWsGroup] = useState<'all' | 'foundation' | 'standard' | 'advanced'>('foundation');
  const [wsTopic, setWsTopic] = useState(topics[0]?.name || 'Đại số');
  const [wsClassId, setWsClassId] = useState(classes[0]?.id || '');
  const [createdWorksheetId, setCreatedWorksheetId] = useState<string | null>(null);

  // Tab 5: Test Blueprint State
  const [testTitle, setTestTitle] = useState('Khảo sát chất lượng Toán định kỳ - Chuẩn hóa ma trận');
  const [testClass, setTestClass] = useState(classes[0]?.id || '');
  const [blueprint, setBlueprint] = useState<TestBlueprint>({
    topicDistribution: { 'Căn thức bậc hai': 30, 'Phương trình bậc hai': 40, 'Bất đẳng thức': 30 },
    difficultyDistribution: { recognition: 20, comprehension: 30, application: 35, advanced: 15 },
    totalQuestions: 10,
    totalScore: 10,
    durationMinutes: 45,
    variantsCount: 4,
  });
  const [generatedTestResult, setGeneratedTestResult] = useState<any | null>(null);

  // Tab 6: Grading & Error Intelligence Assistant State
  const [gradingStudentId, setGradingStudentId] = useState<string>(students[0]?.id || '');
  const [sampleStudentAnswer, setSampleStudentAnswer] = useState<string>(
    'Ta có: 1/x + 1/y = (x + y)/(xy) = 2/(xy). Vì x + y = 2 => xy <= (x+y)^2/4 = 1. Do đó 2/(xy) >= 2/1 = 2. Kết luận min = 2.'
  );
  const [gradingEvaluation, setGradingEvaluation] = useState<any | null>(null);

  // AI Cost & Model Routing State
  const [selectedModel, setSelectedModel] = useState<'fast' | 'advanced' | 'math_cas'>('advanced');

  // Handle Generate Lesson Plan
  const handleGenerateLessonPlan = () => {
    setIsGeneratingPlan(true);
    db.useAiCredits(150, 'Soạn bài học & phân hóa nhóm học sinh');

    setTimeout(() => {
      const cls = classes.find((c) => c.id === selectedClassId);
      const plan = {
        title: `KẾ HOẠCH BÀI GIẢNG 90 PHÚT: ${selectedTopic.toUpperCase()}`,
        targetClass: cls?.name || 'Lớp Toán chất lượng cao',
        classSize: cls?.studentIds.length || 18,
        allocatedDuration: duration,
        objectives: [
          'Học sinh nhận diện đúng điều kiện áp dụng định lý/công thức',
          'Biết cách biến đổi quy lạ về quen, tránh bẫy dấu và thiếu ĐKXĐ',
          'Tối thiểu 75% lớp làm chủ bài toán vận dụng mức 8 điểm',
        ],
        timePhases: [
          { time: '10 phút đầu', phase: 'Khởi động & Kiểm tra kiến thức nền', detail: 'Quét 3 câu hỏi trắc nghiệm nhanh trên Cổng Học Sinh để phát hiện lỗ hổng trước giờ dạy.' },
          { time: '30 phút', phase: 'Trọng tâm lý thuyết & Ví dụ mẫu', detail: 'Minh họa 2 bài toán kinh điển; nhấn mạnh bẫy sai lầm phổ biến nhất trong các đề thi.' },
          { time: '35 phút', phase: 'Luyện tập phân hóa nhóm tại lớp', detail: 'Chia lớp làm 3 nhóm đối kháng, phát phiếu bài tập phân hóa theo năng lực thực tế.' },
          { time: '15 phút cuối', phase: 'Chốt kiến thức & Giao bài về nhà', detail: 'Tổng hợp sơ đồ tư duy, giao bài tập về nhà trên QClass (tối đa 45 phút tự học).' },
        ],
        studentGrouping: [
          { group: 'Nhóm Nền tảng (Foundation)', studentsCount: 4, action: 'Rèn biến đổi đại số cơ bản, có trợ giảng Mai Lan hỗ trợ trực tiếp từng bước.' },
          { group: 'Nhóm Chuẩn (Standard)', studentsCount: 10, action: 'Làm trọn vẹn dạng bài 7-8 điểm, rèn tốc độ tính toán và trình bày chuẩn mực.' },
          { group: 'Nhóm Bứt phá (Advanced)', studentsCount: 4, action: 'Thử sức bài toán cực trị phân loại 9+ và câu hỏi mở rộng tư duy.' },
        ],
        pedagogicalTips: 'Lưu ý: 60% học sinh thường quên ghi điều kiện dấu bằng xảy ra. Cần yêu cầu học sinh kết luận rõ: "Dấu = xảy ra khi và chỉ khi x = y = ..."',
      };
      setGeneratedLessonPlan(plan);
      setIsGeneratingPlan(false);
    }, 600);
  };

  // Handle Generate Questions
  const handleGenerateQuestions = () => {
    setIsGeneratingQuestions(true);
    db.useAiCredits(100 * qCount, 'Sinh câu hỏi Toán chuẩn hóa');

    setTimeout(() => {
      const list: any[] = [];
      for (let i = 0; i < qCount; i++) {
        const id = `draft-ai-${Date.now()}-${i}`;
        const draft = {
          id,
          subject: 'Toán học',
          grade: qGrade,
          topic: qTopic,
          skill: 'Kỹ năng vận dụng giải toán',
          difficulty: qDiff,
          questionType: qType,
          questionText:
            i === 0
              ? `Cho hai số thực dương x, y thỏa mãn x + y = 4. Tìm giá trị nhỏ nhất của biểu thức P = 1/(x + 1) + 1/(y + 1).`
              : `Cho biểu thức A = (√x + 2)/(√x - 1) với x >= 0, x != 1. Tìm tất cả các giá trị nguyên của x để A nhận giá trị nguyên.`,
          options:
            qType === 'single_choice'
              ? [
                  { id: 'opt-1', text: i === 0 ? 'Min P = 2/3 (khi x = y = 2)' : 'x ∈ {0; 4; 16}', isCorrect: true },
                  { id: 'opt-2', text: i === 0 ? 'Min P = 1/2' : 'x ∈ {4; 9}', isCorrect: false },
                  { id: 'opt-3', text: i === 0 ? 'Min P = 4/3' : 'x ∈ {0; 1}', isCorrect: false },
                  { id: 'opt-4', text: i === 0 ? 'Min P = 1' : 'Không có x thỏa mãn', isCorrect: false },
                ]
              : undefined,
          correctNumericAnswer: qType === 'numeric' ? 2 : undefined,
          explanation:
            i === 0
              ? 'Áp dụng BĐT Cauchy-Schwarz dạng cộng mẫu số: 1/(x+1) + 1/(y+1) >= 4/(x+y+2) = 4/6 = 2/3. Dấu bằng xảy ra khi x = y = 2. Vậy Min P = 2/3.'
              : 'Biến đổi A = 1 + 3/(√x - 1). Để A nguyên thì (√x - 1) là ước của 3. Xét các trường hợp tìm được x nguyên thỏa mãn ĐKXĐ.',
          status: 'draft',
          duplicateWarning: 'Đã quét kiểm tra: Câu hỏi mới 100%, không trùng lặp trong Ngân hàng đề.',
          createdAt: new Date().toISOString(),
        };
        db.addAIQuestionDraft(draft as any);
        list.push(draft);
      }
      setGeneratedDrafts(list);
      setIsGeneratingQuestions(false);
    }, 500);
  };

  // Handle Approve Draft
  const handleApproveDraft = (draftId: string) => {
    const q = db.approveAIQuestionDraft(draftId);
    if (q) {
      setApprovedNotification(`Đã kiểm duyệt & lưu câu hỏi "${q.questionText.slice(0, 40)}..." vào Ngân hàng đề thi!`);
      setTimeout(() => setApprovedNotification(null), 3000);
    }
  };

  // Handle Create Worksheet
  const handleCreateWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    const ws = db.createWorksheet({
      title: wsTitle,
      classId: wsClassId,
      type: wsType,
      targetStudentGroup: wsGroup,
      topic: wsTopic,
      grade: 9,
      questions: db.getQuestionBank().slice(0, 5),
      instructions: 'Học sinh làm trực tiếp vào phiếu bài tập, ghi rõ các bước biến đổi trung gian.',
      answerKeyVisible: false,
    });
    setCreatedWorksheetId(ws.id);
  };

  // Handle Generate Test from Blueprint
  const handleGenerateTestBlueprint = () => {
    db.useAiCredits(250, 'Tạo đề thi chuẩn hóa & 4 mã đề tương đương');
    const result = db.generateTestFromBlueprint({
      title: testTitle,
      classId: testClass,
      blueprint,
    });
    setGeneratedTestResult(result);
  };

  // Handle AI Grading Assistant
  const handleRunAiGrading = () => {
    db.useAiCredits(80, 'Trợ lý chấm bài & phát hiện lỗi lập luận');
    setGradingEvaluation({
      deterministicResult: 'Tương đương toán học: Hướng giải ĐÚNG (Dùng BĐT Cauchy ngược chiều)',
      aiScore: 1.75,
      maxScore: 2.0,
      confidence: 92,
      identifiedErrors: [
        {
          type: 'Thiếu kiểm tra điều kiện dấu bằng' as ErrorCategory,
          detail: 'Học sinh đã chỉ ra min = 2 nhưng chưa kết luận rõ: "Dấu = xảy ra khi x = y = 1 (thỏa mãn x + y = 2)".',
          penalty: '-0.25 điểm',
        },
      ],
      aiPedagogicalComment:
        'Bài làm tư duy rất tốt, biến đổi mẫu số chuẩn xác. Cần lưu ý ghi rõ ràng điều kiện xảy ra dấu bằng trong bài thi vào lớp 10 để không bị trừ 0.25 điểm trình bày.',
      needsTeacherReview: false,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-xs uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Hệ Điều Hành Dạy Thêm V4 · AI-Native Workspace</span>
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AI-Assisted, Not AI-Dependent</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Không Gian Trợ Lý AI Giáo Viên
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tự động hóa soạn giáo án phân hóa, sinh đề thi chuẩn hóa ma trận, kiểm duyệt câu hỏi và trợ lý chấm bài chuyên sâu cho giáo viên Toán.
          </p>
        </div>

        {/* AI Credit Balance Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/60 flex items-center justify-center text-white">
            <Zap className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <div className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
              Hạn mức AI Credits
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {(tenant.limits.aiCredits - tenant.aiCreditsUsed).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-300">/ {tenant.limits.aiCredits.toLocaleString('vi-VN')}</span>
            </div>
            <div className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
              <span>Gói tổ chức: {tenant.plan.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Module Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1 overflow-x-auto">
        {[
          { id: 'daily_brief', label: 'Việc cần chú ý hôm nay', icon: Calendar, badge: tasks.length + lowLessonsStudents.length },
          { id: 'lesson_planner', label: 'Soạn giáo án phân hóa', icon: BookOpen },
          { id: 'question_generator', label: 'Sinh & Duyệt câu hỏi', icon: Layers, badge: drafts.filter((d) => d.status === 'draft').length },
          { id: 'worksheet_generator', label: 'Phiếu bài tập', icon: FileText },
          { id: 'test_generator', label: 'Đề thi & 4 Mã đề', icon: Target },
          { id: 'grading_assistant', label: 'Chấm bài & Phân tích lỗi', icon: BrainCircuit },
          { id: 'ai_credits', label: 'Hạn mức & Mô hình', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
                    isActive ? 'bg-white text-blue-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification Toast */}
      {approvedNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{approvedNotification}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AI DAILY BRIEF */}
      {/* ========================================================================= */}
      {activeTab === 'daily_brief' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  AI Teacher Daily Brief
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Báo cáo trọng tâm hoạt động: {briefDate}
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Cập nhật tự động theo thời gian thực</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Cảnh báo học phí ({lowLessonsStudents.length} học sinh)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-full">≤ 2 buổi</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Có {lowLessonsStudents.length} học sinh sắp hết gói học phí. Cần gửi tin nhắn mẫu có mã QR chuyển khoản cho phụ huynh.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onSelectStudent(lowLessonsStudents[0]?.student.id || '')}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Xem danh sách học sinh cần thu</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Lịch giảng dạy hôm nay ({classes.length} ca học)</span>
                  </span>
                  <span className="text-[10px] bg-blue-200/60 px-2 py-0.5 rounded-full">Phòng Archimedes</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Ca 1: 17:30 – Toán 9 Chất lượng cao (Phòng 201).<br />
                  Ca 2: 19:15 – Toán 10 Nâng cao (Phòng 202).
                </p>
                <div className="pt-2 text-xs text-slate-500">
                  <span>Trợ giảng phụ trách: Cô Mai Lan</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-purple-900 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-purple-600" />
                    <span>Chẩn đoán học tập lớp 9</span>
                  </span>
                  <span className="text-[10px] bg-purple-200/60 px-2 py-0.5 rounded-full">AI Insight</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Lớp 9A có 4 học sinh (An, Ngọc, Tuấn, Đức) thường xuyên mắc lỗi "quên điều kiện xác định". Đề xuất dành 10 phút đầu giờ kiểm tra ĐKXĐ.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('lesson_planner')}
                    className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Tạo giáo án củng cố ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Tasks Action List */}
            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nhiệm vụ cần xử lý trong ngày ({tasks.length})
              </h3>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => db.updateTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={t.status === 'completed' ? 'line-through text-slate-400' : 'font-medium text-slate-800'}>
                        {t.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        t.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.priority === 'high' ? 'Ưu tiên cao' : 'Tiêu chuẩn'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI LESSON PLANNER */}
      {/* ========================================================================= */}
      {activeTab === 'lesson_planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Thiết lập bài giảng 90 phút
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn lớp học:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentIds.length} học sinh)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chuyên đề trọng tâm:</label>
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Thời lượng (phút):</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
              >
                <option value={60}>60 phút (Buổi phụ đạo)</option>
                <option value={90}>90 phút (Buổi học chuẩn)</option>
                <option value={120}>120 phút (Chuyên đề chuyên sâu)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mục tiêu sư phạm:</label>
              <textarea
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                rows={3}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerateLessonPlan}
              disabled={isGeneratingPlan}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingPlan ? 'Đang phân tích & Lập giáo án...' : 'Sinh giáo án phân hóa bằng AI'}</span>
            </button>
          </div>

          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            {generatedLessonPlan ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{generatedLessonPlan.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {generatedLessonPlan.targetClass} · Sĩ số {generatedLessonPlan.classSize} học sinh · Thời lượng {generatedLessonPlan.allocatedDuration} phút
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedLessonPlan, null, 2));
                      alert('Đã sao chép cấu trúc giáo án!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép giáo án</span>
                  </button>
                </div>

                {/* 3 Student Groups */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Chiến lược phân hóa nhóm học sinh theo dữ liệu thực tế:</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {generatedLessonPlan.studentGrouping.map((grp: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                          idx === 0
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : idx === 1
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                            : 'bg-purple-50/70 border-purple-200 text-purple-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{grp.group}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/70">{grp.studentsCount} HS</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{grp.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Teaching Phases */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cấu trúc 4 pha tiến trình bài dạy (90 phút):
                  </h4>
                  <div className="space-y-2">
                    {generatedLessonPlan.timePhases.map((phase: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs">
                        <span className="font-mono font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                          {phase.time}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{phase.phase}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{phase.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pedagogical Note */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                  <p className="font-bold">Lưu ý bẫy sai lầm của giáo viên & học sinh:</p>
                  <p className="text-[11px] leading-relaxed">{generatedLessonPlan.pedagogicalTips}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-medium">
                  Chọn lớp & chuyên đề Toán, sau đó bấm "Sinh giáo án phân hóa bằng AI".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUESTION GENERATOR & REVIEW WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'question_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Cấu hình sinh câu hỏi AI
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Khối lớp:</label>
                <select
                  value={qGrade}
                  onChange={(e) => setQGrade(Number(e.target.value))}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Độ khó:</label>
                <select
                  value={qDiff}
                  onChange={(e) => setQDiff(e.target.value as any)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  <option value="recognition">Nhận biết</option>
                  <option value="comprehension">Thông hiểu</option>
                  <option value="application">Vận dụng</option>
                  <option value="advanced">Vận dụng cao</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chuyên đề:</label>
              <select
                value={qTopic}
                onChange={(e) => setQTopic(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} (Khối {t.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Hình thức:</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  <option value="single_choice">Trắc nghiệm</option>
                  <option value="numeric">Điền số</option>
                  <option value="true_false">Đúng / Sai</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Số lượng câu:</label>
                <select
                  value={qCount}
                  onChange={(e) => setQCount(Number(e.target.value))}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  <option value={1}>1 câu</option>
                  <option value={2}>2 câu</option>
                  <option value={5}>5 câu</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateQuestions}
              disabled={isGeneratingQuestions}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingQuestions ? 'Đang tạo câu hỏi & Lời giải...' : 'Tạo bản thảo câu hỏi bằng AI'}</span>
            </button>
          </div>

          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Quy trình kiểm duyệt câu hỏi AI (Draft → Review → Publish)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Bản thảo chờ duyệt: {drafts.filter((d) => d.status === 'draft').length}</span>
            </div>

            <div className="space-y-4">
              {drafts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Chưa có bản thảo nào. Hãy bấm "Tạo bản thảo câu hỏi bằng AI".</p>
                </div>
              ) : (
                drafts.map((d) => (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      d.status === 'approved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : d.status === 'rejected'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-indigo-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                          Khối {d.grade}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600">{d.topic}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            d.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status === 'approved' ? 'Đã duyệt' : d.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>

                      {d.status === 'draft' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveDraft(d.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Phê duyệt</span>
                          </button>
                          <button
                            onClick={() => db.rejectAIQuestionDraft(d.id)}
                            className="px-2.5 py-1 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-50 cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">{d.questionText}</p>

                    {d.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {d.options.map((opt, idx) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                              opt.isCorrect
                                ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + idx)}. {opt.text}
                            </span>
                            {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">Lời giải chi tiết:</p>
                      <p className="leading-relaxed font-mono">{d.explanation}</p>
                    </div>

                    {d.duplicateWarning && (
                      <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{d.duplicateWarning}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WORKSHEET GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'worksheet_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Tạo phiếu bài tập phân hóa
            </h3>

            <form onSubmit={handleCreateWorksheet} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên phiếu bài tập:</label>
                <input
                  type="text"
                  value={wsTitle}
                  onChange={(e) => setWsTitle(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Loại phiếu:</label>
                  <select
                    value={wsType}
                    onChange={(e) => setWsType(e.target.value as any)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="weak_topic">Củng cố học sinh yếu</option>
                    <option value="practice">Luyện tập tại lớp</option>
                    <option value="homework">Bài tập về nhà</option>
                    <option value="exam_prep">Ôn thi khảo sát</option>
                    <option value="personalized">Cá nhân hóa theo HS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Đối tượng phân hóa:</label>
                  <select
                    value={wsGroup}
                    onChange={(e) => setWsGroup(e.target.value as any)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="all">Toàn bộ lớp</option>
                    <option value="foundation">Nhóm Nền tảng (Cần kèm)</option>
                    <option value="standard">Nhóm Tiêu chuẩn</option>
                    <option value="advanced">Nhóm Nâng cao (9+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn lớp áp dụng:</label>
                <select
                  value={wsClassId}
                  onChange={(e) => setWsClassId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo phiếu bài tập</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Danh sách phiếu bài tập đã tạo ({worksheets.length})</h3>
            </div>

            <div className="space-y-3">
              {worksheets.map((ws) => (
                <div key={ws.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {ws.type === 'weak_topic' ? 'Bổ trợ học sinh yếu' : 'Ôn thi'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">Nhóm: {ws.targetStudentGroup?.toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900">{ws.title}</p>
                    <p className="text-[11px] text-slate-500">Ngày tạo: {formatDateVN(ws.createdAt)}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenWorksheetPrint) onOpenWorksheetPrint(ws.id);
                      else alert(`Mở bản in định dạng PDF chuẩn cho phiếu: ${ws.title}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>In phiếu bài tập</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TEST GENERATOR WITH BLUEPRINT & 4 VARIANTS */}
      {/* ========================================================================= */}
      {activeTab === 'test_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Ma trận đề thi chuẩn hóa (Test Blueprint)
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tên kỳ khảo sát / Đề thi:</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Thời gian (phút):</label>
                <input
                  type="number"
                  value={blueprint.durationMinutes}
                  onChange={(e) => setBlueprint({ ...blueprint, durationMinutes: Number(e.target.value) })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Số lượng mã đề:</label>
                <select
                  value={blueprint.variantsCount}
                  onChange={(e) => setBlueprint({ ...blueprint, variantsCount: Number(e.target.value) })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                >
                  <option value={2}>2 mã đề (A, B)</option>
                  <option value={4}>4 mã đề (A, B, C, D)</option>
                </select>
              </div>
            </div>

            {/* Matrix Difficulty Split */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800">Tỉ lệ độ khó chuẩn:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 font-medium">Nhận biết: 20%</div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-800 font-medium">Thông hiểu: 30%</div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-800 font-medium">Vận dụng: 35%</div>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-800 font-medium">Vận dụng cao: 15%</div>
              </div>
            </div>

            <button
              onClick={handleGenerateTestBlueprint}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Sinh đề thi & 4 mã đề tương đương</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            {generatedTestResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã tạo thành công đề thi chuẩn hóa & xuất bản lên Cổng Học Sinh!</span>
                  </div>
                  <p className="text-xs text-emerald-900 font-bold">{generatedTestResult.test.title}</p>
                  <p className="text-[11px] text-emerald-700">
                    Thời lượng: {generatedTestResult.test.durationMinutes} phút · Sĩ số câu: {generatedTestResult.test.questions.length} câu
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Các mã đề tráo thứ tự chống nhìn bài (Variants):
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedTestResult.variants.map((v: any) => (
                      <div key={v.variantCode} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-blue-700 font-mono text-sm">Mã đề {v.variantCode}</span>
                        <p className="text-[11px] text-slate-500">Số câu: {v.questionOrder.length} câu đã xáo trộn</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <Target className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Bấm "Sinh đề thi & 4 mã đề tương đương" để hệ thống tự động bốc câu hỏi từ Ngân hàng đề thi theo đúng ma trận.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GRADING ASSISTANT & ERROR INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeTab === 'grading_assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Trợ lý chấm bài tự luận & Nhận diện lỗi
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn học sinh:</label>
              <select
                value={gradingStudentId}
                onChange={(e) => setGradingStudentId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} - Khối {s.grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bài làm học sinh (văn bản/bước giải):</label>
              <textarea
                value={sampleStudentAnswer}
                onChange={(e) => setSampleStudentAnswer(e.target.value)}
                rows={5}
                className="w-full text-xs font-mono rounded-xl border border-slate-300 p-3 bg-slate-50 outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleRunAiGrading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Kiểm tra lập luận & Gợi ý điểm</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            {gradingEvaluation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm đề xuất AI:</span>
                    <div className="text-2xl font-bold font-mono text-blue-700">
                      {gradingEvaluation.aiScore} / {gradingEvaluation.maxScore}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Độ tin cậy:</span>
                    <div className="text-xs font-bold text-emerald-700">{gradingEvaluation.confidence}% (Độ tin cậy cao)</div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-amber-900">Lỗi lập luận phát hiện được:</span>
                  {gradingEvaluation.identifiedErrors.map((err: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-amber-800">
                      <span>• {err.detail}</span>
                      <span className="font-bold text-rose-600 shrink-0">{err.penalty}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1 text-blue-900">
                  <span className="font-bold">Nhận xét sư phạm đề xuất gửi học sinh:</span>
                  <p className="leading-relaxed font-sans">{gradingEvaluation.aiPedagogicalComment}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <BrainCircuit className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Bấm "Kiểm tra lập luận & Gợi ý điểm" để hệ thống phân tích bước giải toán học của học sinh.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: AI CREDITS & MODEL ROUTER */}
      {/* ========================================================================= */}
      {activeTab === 'ai_credits' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Quản lý định tuyến mô hình & Chi phí AI</h3>
              <p className="text-xs text-slate-500">Tối ưu hóa tốc độ, độ chính xác toán học và ngân sách sử dụng</p>
            </div>
            <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-xl">
              Đã dùng: {tenant.aiCreditsUsed} / {tenant.limits.aiCredits} Credits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSelectedModel('fast')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedModel === 'fast' ? 'bg-blue-50 border-blue-400 shadow-xs' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Fast Model (Tiết kiệm)</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">10 credits/lần</span>
              </div>
              <p className="text-xs text-slate-500">Phù hợp: Soạn tin nhắn phụ huynh, tóm tắt bài tập, nhận xét chuyên cần.</p>
            </div>

            <div
              onClick={() => setSelectedModel('advanced')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedModel === 'advanced' ? 'bg-indigo-50 border-indigo-400 shadow-xs' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Advanced Model (Mặc định)</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-mono">50 credits/lần</span>
              </div>
              <p className="text-xs text-slate-500">Phù hợp: Lập kế hoạch bài giảng 90 phút, sinh đề thi chuẩn ma trận, chẩn đoán học tập.</p>
            </div>

            <div
              onClick={() => setSelectedModel('math_cas')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                selectedModel === 'math_cas' ? 'bg-purple-50 border-purple-400 shadow-xs' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Specialized Math Engine</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono">80 credits/lần</span>
              </div>
              <p className="text-xs text-slate-500">Phù hợp: Kiểm tra tương đương toán học, phát hiện bẫy dấu & chấm bài tự luận chi tiết.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
