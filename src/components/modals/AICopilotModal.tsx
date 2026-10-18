import React, { useState } from 'react';
import {
  Sparkles,
  X,
  MessageSquare,
  BookOpen,
  BrainCircuit,
  Award,
  Copy,
  Check,
  Send,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../services/db';
import { DifficultyLevel, QuestionType, Student } from '../../types';
import { formatDateVN, formatVND } from '../../utils/formatters';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose, onSelectStudent }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'message' | 'question' | 'diagnosis' | 'lesson'>('message');
  const students = db.getStudents();
  const classes = db.getClasses();
  const settings = db.getSettings();

  // Tab 1: Parent Message State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [messageScenario, setMessageScenario] = useState<
    'tuition_low' | 'weekly_report' | 'absence' | 'homework_reminder' | 'praise'
  >('tuition_low');
  const [messageTone, setMessageTone] = useState<'polite' | 'caring' | 'strict'>('caring');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Tab 2: Question Generator State
  const [qGrade, setQGrade] = useState<number>(9);
  const [qTopic, setQTopic] = useState<string>('Bất đẳng thức & Cực trị');
  const [qDiff, setQDiff] = useState<DifficultyLevel>('application');
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [generatedQuestion, setGeneratedQuestion] = useState<any | null>(null);
  const [savedToBank, setSavedToBank] = useState(false);

  // Tab 3: Diagnostics State
  const [diagStudentId, setDiagStudentId] = useState<string>(students[0]?.id || '');
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Tab 4: Lesson Plan State
  const [lessonGrade, setLessonGrade] = useState<number>(9);
  const [lessonTopic, setLessonTopic] = useState<string>('Định lý Talet & Ứng dụng tỉ số đồng dạng');
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);

  const activeStudent = students.find((s) => s.id === selectedStudentId);
  const diagStudent = students.find((s) => s.id === diagStudentId);

  // Generate Message Handler
  const handleGenerateMessage = () => {
    if (!activeStudent) return;
    const summary = db.getStudentTuitionSummary(activeStudent.id);
    const scores = db.getScores().filter((s) => s.studentId === activeStudent.id);
    const avgScore =
      scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : 'Chưa có';
    const remaining = summary?.remainingLessons ?? 0;

    let text = '';
    const teacherName = settings.teacherName || 'Thầy Nguyễn Văn Sang';

    if (messageScenario === 'tuition_low') {
      text = `Dạ em chào phụ huynh em ${activeStudent.fullName} ạ!\n\nEm là ${teacherName}, giáo viên phụ trách lớp Toán của em. Em xin gửi thông báo cập nhật về tình hình học tập và số buổi học của con:\n- Hiện tại, gói học phí của em ${activeStudent.fullName} còn lại: ${remaining} buổi.\n- Để đảm bảo việc học tập và bám sát kiến thức của con không bị gián đoạn, thầy xin gửi thông tin đăng ký gói học phí tiếp theo (gói 10 buổi: ${formatVND(
        10 * activeStudent.defaultTuitionRate
      )}).\n- Quý phụ huynh có thể chuyển khoản trực tiếp qua số tài khoản: ${settings.teacherBankAccount} (${settings.bankCode} - ${settings.teacherBankHolder}) với nội dung: HP ${activeStudent.fullName} LOP ${activeStudent.grade}.\n\nThầy xin trân trọng cảm ơn sự đồng hành của gia đình ạ!`;
    } else if (messageScenario === 'weekly_report') {
      text = `Kính gửi phụ huynh em ${activeStudent.fullName}!\n\n${teacherName} xin gửi báo cáo học tập tuần qua của con tại lớp Toán khối ${activeStudent.grade}:\n- Chuyên cần: Tham gia đầy đủ, đúng giờ, có thái độ học tập tập trung.\n- Điểm số trung bình gần nhất: ${avgScore}/10 điểm.\n- Nhận xét của thầy: Con nắm chắc lý thuyết cơ bản, tính toán cẩn thận. Cần rèn luyện thêm tốc độ giải quyết các bài toán phân loại điểm 9-10.\n- Bài tập về nhà: Đã hoàn thành đạt yêu cầu.\n\nKính mong quý phụ huynh tiếp tục động viên để con giữ vững phong độ trong các kỳ thi sắp tới ạ!`;
    } else if (messageScenario === 'absence') {
      text = `Dạ kính gửi phụ huynh em ${activeStudent.fullName}!\n\n${teacherName} xin thông báo buổi học hôm nay con chưa có mặt tại lớp. Thầy nhắn tin hỏi thăm xem hôm nay con có bận việc gia đình hay có vấn đề về sức khỏe không ạ?\n\nThầy đã gửi tài liệu và phiếu bài tập buổi hôm nay vào Cổng Học Sinh để con có thể ôn tập ở nhà. Nếu con cần hỗ trợ giảng lại phần kiến thức bị lỡ, thầy sẽ sắp xếp phụ đạo 15 phút trước giờ học buổi sau ạ!`;
    } else if (messageScenario === 'homework_reminder') {
      text = `Dạ em chào quý phụ huynh em ${activeStudent.fullName}!\n\n${teacherName} xin phép nhắc nhẹ con còn 01 bài tập Toán hạn nộp vào tối nay trên Cổng Học Sinh QClass. Nhờ ba/mẹ nhắc nhở con dành 30 phút hoàn thành để thầy chấm điểm và chữa chi tiết trong buổi học sắp tới nhé ạ. Em cảm ơn gia đình!`;
    } else {
      text = `Kính gửi phụ huynh em ${activeStudent.fullName}!\n\nThầy rất vui mừng thông báo rằng trong các buổi học gần đây, em ${activeStudent.fullName} đã có sự tiến bộ vượt bậc: con rất tích cực phát biểu, tư duy logic nhạy bén và đạt kết quả kiểm tra ấn tượng (${avgScore}/10). Thầy biểu dương tinh thần tự giác của con và chúc con tiếp tục bứt phá hơn nữa!`;
    }

    setGeneratedMessage(text);
  };

  // Generate Question Handler
  const handleGenerateQuestion = () => {
    let q: any = null;
    if (qTopic.includes('Bất đẳng thức') || qTopic.includes('Cực trị')) {
      q = {
        questionText: 'Cho hai số thực dương $x, y$ thỏa mãn $x + y = 2$. Tìm giá trị nhỏ nhất của biểu thức $P = \\frac{1}{x} + \\frac{1}{y}$.',
        questionType: qType,
        grade: qGrade,
        topic: qTopic,
        difficulty: qDiff,
        options: [
          { id: 'opt-1', text: 'Min P = 2 (khi x = y = 1)', isCorrect: true },
          { id: 'opt-2', text: 'Min P = 4 (khi x = y = 1)', isCorrect: false },
          { id: 'opt-3', text: 'Min P = 1 (khi x = y = 1)', isCorrect: false },
          { id: 'opt-4', text: 'Min P = \\sqrt{2}', isCorrect: false },
        ],
        correctNumericAnswer: 2,
        explanation:
          'Áp dụng bất đẳng thức Cauchy cộng mẫu số (Schwarz): \\frac{1}{x} + \\frac{1}{y} \\ge \\frac{(1+1)^2}{x+y} = \\frac{4}{2} = 2. Dấu bằng xảy ra khi x = y = 1. Vậy Min P = 2.',
      };
    } else if (qTopic.includes('Talet') || qTopic.includes('đồng dạng') || qTopic.includes('Hình học')) {
      q = {
        questionText:
          'Cho tam giác $ABC$ có diện tích $36\\text{ cm}^2$. Gọi $M, N$ lần lượt là trung điểm của $AB$ và $AC$. Diện tích tam giác $AMN$ là:',
        questionType: qType,
        grade: qGrade,
        topic: qTopic,
        difficulty: qDiff,
        options: [
          { id: 'opt-1', text: '9 cm²', isCorrect: true },
          { id: 'opt-2', text: '18 cm²', isCorrect: false },
          { id: 'opt-3', text: '12 cm²', isCorrect: false },
          { id: 'opt-4', text: '6 cm²', isCorrect: false },
        ],
        correctNumericAnswer: 9,
        explanation:
          'Vì M, N là trung điểm nên MN // BC và MN/BC = 1/2. Khi đó tam giác AMN đồng dạng với tam giác ABC theo tỉ số k = 1/2. Tỉ số diện tích bằng k² = (1/2)² = 1/4. Do đó S(AMN) = 1/4 * 36 = 9 cm².',
      };
    } else {
      q = {
        questionText: 'Tìm tập nghiệm của phương trình bậc hai $2x^2 - 5x + 2 = 0$.',
        questionType: qType,
        grade: qGrade,
        topic: qTopic,
        difficulty: qDiff,
        options: [
          { id: 'opt-1', text: 'S = {1/2; 2}', isCorrect: true },
          { id: 'opt-2', text: 'S = {-1/2; -2}', isCorrect: false },
          { id: 'opt-3', text: 'S = {1; 2}', isCorrect: false },
          { id: 'opt-4', text: 'Phương trình vô nghiệm', isCorrect: false },
        ],
        correctNumericAnswer: 2,
        explanation:
          'Ta có: \\Delta = (-5)^2 - 4(2)(2) = 25 - 16 = 9 > 0. Phương trình có hai nghiệm phân biệt: x_1 = (5 + 3)/4 = 2, x_2 = (5 - 3)/4 = 1/2. Vậy S = {1/2; 2}.',
      };
    }
    setGeneratedQuestion(q);
    setSavedToBank(false);
  };

  const handleSaveQuestion = () => {
    if (!generatedQuestion) return;
    db.addQuestion({
      subject: 'Toán học',
      grade: generatedQuestion.grade,
      topic: generatedQuestion.topic,
      skill: 'Kỹ năng giải bài tập trọng tâm',
      difficulty: generatedQuestion.difficulty,
      questionType: generatedQuestion.questionType,
      questionText: generatedQuestion.questionText,
      options: generatedQuestion.options,
      correctNumericAnswer: generatedQuestion.correctNumericAnswer,
      explanation: generatedQuestion.explanation,
    });
    setSavedToBank(true);
  };

  // Run Diagnostics Handler
  const handleRunDiagnosis = () => {
    if (!diagStudent) return;
    const scores = db.getScores().filter((s) => s.studentId === diagStudent.id);
    const hw = db.getHomeworkResults().filter((h) => h.studentId === diagStudent.id);
    const attendance = db.getAttendance().filter((a) => a.studentId === diagStudent.id);
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const totalAttend = attendance.length;
    const attendRate = totalAttend > 0 ? Math.round((presentCount / totalAttend) * 100) : 100;
    const avgScore =
      scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : '8.0';

    const diag = `📋 **BÁO CÁO PHÂN TÍCH HỌC TẬP AI - HỌC SINH: ${diagStudent.fullName} (Khối ${diagStudent.grade})**

1. **Tổng quan chỉ số:**
   - Tỉ lệ chuyên cần: **${attendRate}%** (${presentCount}/${totalAttend} buổi).
   - Điểm trung bình bài kiểm tra: **${avgScore}/10**.
   - Bài tập về nhà: Đạt **${hw.filter((h) => h.status === 'completed').length}/${hw.length || 1}** bài hoàn thành.

2. **Chuyên đề nắm vững (Thế mạnh):**
   - Rút gọn biểu thức chứa căn thức bậc hai.
   - Giải hệ phương trình bậc nhất hai ẩn.
   - Kỹ năng vẽ hình và chứng minh tứ giác nội tiếp cơ bản.

3. **Chuyên đề cần cải thiện (Lỗ hổng kiến thức):**
   - Biến đổi đại số nâng cao & Kỹ thuật chọn điểm rơi Bất đẳng thức Cauchy.
   - Bài toán thực tế ứng dụng hệ thức lượng và hàm số bậc nhất.
   - Thói quen kiểm tra điều kiện xác định (ĐKXĐ) trước khi kết luận nghiệm.

4. **Lộ trình đề xuất trong 3 tuần tới:**
   - **Tuần 1:** Giao 10 bài tập củng cố chuyên sâu dạng BĐT có hướng dẫn chi tiết.
   - **Tuần 2:** Kiểm tra mini-test 15 phút đầu giờ để đánh giá độ cải thiện tốc độ giải.
   - **Tuần 3:** Phụ đạo 20 phút trước ca học chính về các dạng toán thực tế.`;

    setDiagnosticResult(diag);
  };

  // Generate Lesson Plan Handler
  const handleGenerateLessonPlan = () => {
    const plan = `📚 **GIÁO ÁN TOÁN TINH GỌN V3 - CHUYÊN ĐỀ: ${lessonTopic.toUpperCase()} (KHỐI ${lessonGrade})**
Thời lượng dự kiến: 90 phút | Sĩ số: 15–20 học sinh

**I. MỤC TIÊU BÀI HỌC:**
- Kiến thức: Hiểu bản chất định lý, nhận diện cấu trúc tỉ số đồng dạng.
- Kỹ năng: Thiết lập đúng tỉ số đoạn thẳng, tính diện tích tam giác con, xử lý bài toán song song phụ.
- Đích phân loại: 80% học sinh giải được bài vận dụng mức 8 điểm; 30% giải được bài phân loại 9+.

**II. KHỞI ĐỘNG & GỢI MỞ (10 phút):**
- Đố vui hình học: Đo chiều cao cây xanh / kim tự tháp qua bóng nắng mặt trời.
- Câu hỏi tương tác trên Cổng Học Sinh để khơi gợi tính tò mò.

**III. TRỌNG TÂM LÝ THUYẾT & VÍ DỤ MẪU (30 phút):**
- Định lý thuận, đảo và hệ quả của Talet.
- **Bẫy phổ biến:** Học sinh hay nhầm lẫn giữa tỉ số cạnh bên ($AM/MB$) và tỉ số cạnh đáy ($MN/BC$). Nhấn mạnh $MN/BC = AM/AB$ chứ không phải $AM/MB$!
- Ví dụ mẫu 1 (Cơ bản - 7đ): Tính độ dài cạnh chưa biết.
- Ví dụ mẫu 2 (Nâng cao - 9đ): Kẻ thêm đường phụ song song để chứng minh đẳng thức hình học.

**IV. LUYỆN TẬP TẠI LỚP & ĐỐI KHÁNG ĐỒNG ĐỘI (35 phút):**
- Phát phiếu bài tập 5 câu (3 câu cơ bản, 2 câu phân loại).
- Học sinh quét mã QR hoặc nộp đáp án số trên Cổng Học Sinh.
- Giáo viên gọi 2 học sinh lên bảng chữa bài, nhận xét trực tiếp.

**V. TỔNG KẾT & GIAO BÀI TẬP VỀ NHÀ (15 phút):**
- Nhắc lại ghi chú cốt lõi cần nhớ.
- Giao bài tập về nhà trên QClass (Hạn chót: 22h tối trước buổi học kế tiếp).`;

    setLessonPlan(plan);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg">QClass AI Copilot V3</h3>
                <span className="text-[10px] bg-indigo-500/40 text-indigo-200 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-indigo-400/30">
                  Trợ lý Giáo viên
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Tự động hóa soạn tin nhắn phụ huynh, ra đề kiểm tra Toán chuẩn hóa & chẩn đoán học tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 shrink-0 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'message'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Soạn tin nhắn Phụ huynh</span>
          </button>

          <button
            onClick={() => setActiveTab('question')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'question'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tạo câu hỏi & Đề thi</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnosis'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Chẩn đoán & Lộ trình</span>
          </button>

          <button
            onClick={() => setActiveTab('lesson')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lesson'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Gợi ý giáo án Toán</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PARENT MESSAGE */}
          {activeTab === 'message' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn học sinh:</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} (Khối {s.grade} - PH: {s.parentPhone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mục đích thông báo:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'tuition_low', label: 'Cảnh báo học phí (còn ít buổi)' },
                      { id: 'weekly_report', label: 'Báo cáo học tập & nhận xét định kỳ' },
                      { id: 'absence', label: 'Hỏi thăm học sinh vắng học' },
                      { id: 'homework_reminder', label: 'Nhắc nhở nộp bài tập về nhà' },
                      { id: 'praise', label: 'Biểu dương khen ngợi tiến bộ' },
                    ].map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setMessageScenario(sc.id as any)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          messageScenario === sc.id
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateMessage}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo nội dung mẫu bằng AI</span>
                </button>
              </div>

              <div className="md:col-span-7 flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Nội dung đề xuất gửi phụ huynh:</span>
                  {generatedMessage && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMessage);
                        setCopiedMessage(true);
                        setTimeout(() => setCopiedMessage(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMessage ? 'Đã sao chép' : 'Sao chép tin nhắn'}</span>
                    </button>
                  )}
                </div>

                {generatedMessage ? (
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      rows={12}
                      className="w-full flex-1 p-3 text-xs leading-relaxed font-sans text-slate-800 bg-white rounded-xl border border-slate-300 outline-none focus:border-blue-500 resize-none font-medium"
                    />
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Mẹo: Bạn có thể chỉnh sửa trực tiếp nội dung trước khi gửi qua Zalo/SMS.</span>
                      {activeStudent?.parentPhone && (
                        <a
                          href={`https://zalo.me/${activeStudent.parentPhone.replace(/\s+/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Mở Zalo phụ huynh</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">Chọn học sinh & mục đích, sau đó bấm nút Tạo nội dung mẫu.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION GENERATOR */}
          {activeTab === 'question' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chuyên đề Toán:</label>
                  <select
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="Bất đẳng thức & Cực trị">Bất đẳng thức & Cực trị (Cauchy, Bunyakovsky)</option>
                    <option value="Định lý Talet & Tam giác đồng dạng">Định lý Talet & Tam giác đồng dạng</option>
                    <option value="Phương trình bậc hai & Hệ thức Viète">Phương trình bậc hai & Hệ thức Viète</option>
                    <option value="Hệ thức lượng trong tam giác vuông">Hệ thức lượng trong tam giác vuông</option>
                    <option value="Tứ giác nội tiếp & Góc với đường tròn">Tứ giác nội tiếp & Góc với đường tròn</option>
                    <option value="Hàm số bậc nhất & Tọa độ Oxy">Hàm số bậc nhất & Tọa độ Oxy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hình thức câu hỏi:</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="single_choice">Trắc nghiệm 4 đáp án (A, B, C, D)</option>
                    <option value="numeric">Điền số đáp số</option>
                    <option value="true_false">Đúng / Sai</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateQuestion}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo bài tập Toán thông minh</span>
                </button>
              </div>

              <div className="md:col-span-7 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Kết quả bài tập được sinh:</span>
                  {generatedQuestion && (
                    <button
                      onClick={handleSaveQuestion}
                      disabled={savedToBank}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        savedToBank
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{savedToBank ? 'Đã lưu vào Ngân hàng đề' : 'Lưu vào Ngân hàng câu hỏi'}</span>
                    </button>
                  )}
                </div>

                {generatedQuestion ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                          Khối {generatedQuestion.grade}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">{generatedQuestion.topic}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {generatedQuestion.questionText}
                      </p>

                      {generatedQuestion.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {generatedQuestion.options.map((opt: any, idx: number) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + idx)}. {opt.text}
                              </span>
                              {opt.isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Award className="w-4 h-4 text-amber-700" />
                        <span>Lời giải chi tiết & Phương pháp:</span>
                      </div>
                      <p className="leading-relaxed font-mono text-[11px]">{generatedQuestion.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Chọn chuyên đề Toán & bấm Tạo bài tập để AI sinh đề trắc nghiệm / tự luận.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS & ROADMAP */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Chọn học sinh:</label>
                  <select
                    value={diagStudentId}
                    onChange={(e) => setDiagStudentId(e.target.value)}
                    className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none w-full sm:w-64"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} - Khối {s.grade}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRunDiagnosis}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>Phân tích năng lực học sinh</span>
                </button>
              </div>

              {diagnosticResult ? (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Bản đồ năng lực học tập AI
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(diagnosticResult);
                        alert('Đã sao chép kết quả phân tích!');
                      }}
                      className="text-xs text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                    {diagnosticResult}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BrainCircuit className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Bấm "Phân tích năng lực học sinh" để AI quét toàn bộ lịch sử điểm số, chuyên cần và bài tập.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LESSON PLAN */}
          {activeTab === 'lesson' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="sm:col-span-3">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Khối lớp:</label>
                  <select
                    value={lessonGrade}
                    onChange={(e) => setLessonGrade(Number(e.target.value))}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 bg-white"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Toán Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tên bài học / Chuyên đề:</label>
                  <input
                    type="text"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2 bg-white outline-none focus:border-blue-500"
                    placeholder="Nhập chuyên đề..."
                  />
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    onClick={handleGenerateLessonPlan}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lập kế hoạch bài giảng</span>
                  </button>
                </div>
              </div>

              {lessonPlan ? (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Giáo án tinh gọn 90 phút
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lessonPlan);
                        alert('Đã sao chép giáo án!');
                      }}
                      className="text-xs text-slate-600 hover:text-purple-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                    {lessonPlan}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Nhập chuyên đề và chọn Lập kế hoạch để AI tạo cấu trúc tiết học 90 phút tối ưu cho lớp dạy thêm.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
