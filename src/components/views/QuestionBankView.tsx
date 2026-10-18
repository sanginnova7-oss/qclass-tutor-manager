import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Filter,
  Search,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  BarChart3,
  X,
  Play,
} from 'lucide-react';
import { db } from '../../services/db';
import { DifficultyLevel, OnlineTestItem, QuestionBankItem, QuestionType } from '../../types';
import { formatDateVN } from '../../utils/formatters';

export const QuestionBankView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bank' | 'tests'>('bank');
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');

  const questions = db.getQuestionBank();
  const onlineTests = db.getOnlineTests();
  const testAttempts = db.getTestAttempts();
  const classes = db.getClasses();

  // Add Question Modal state
  const [showAddQModal, setShowAddQModal] = useState(false);
  const [qGrade, setQGrade] = useState<number>(9);
  const [qTopic, setQTopic] = useState('Bất đẳng thức & Cực trị');
  const [qSkill, setQSkill] = useState('Bất đẳng thức Cauchy');
  const [qDiff, setQDiff] = useState<DifficultyLevel>('comprehension');
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOptIndex, setCorrectOptIndex] = useState(0);
  const [numericAnswer, setNumericAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState('');

  // Add Test Modal state
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testClassId, setTestClassId] = useState(classes[0]?.id || '');
  const [testDuration, setTestDuration] = useState<number>(15);
  const [testMaxScore, setTestMaxScore] = useState<number>(10);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const s = search.toLowerCase().trim();
    if (s && !q.questionText.toLowerCase().includes(s) && !q.topic.toLowerCase().includes(s)) return false;
    if (selectedGrade !== 'all' && q.grade !== Number(selectedGrade)) return false;
    if (selectedDiff !== 'all' && q.difficulty !== selectedDiff) return false;
    return true;
  });

  const DIFF_LABELS: Record<DifficultyLevel, { label: string; color: string }> = {
    recognition: { label: 'Nhận biết', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    comprehension: { label: 'Thông hiểu', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    application: { label: 'Vận dụng', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    advanced: { label: 'Vận dụng cao', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    let options = undefined;
    if (qType === 'single_choice' || qType === 'true_false') {
      options = [
        { id: 'opt-1', text: opt1.trim() || 'Lựa chọn A', isCorrect: correctOptIndex === 0 },
        { id: 'opt-2', text: opt2.trim() || 'Lựa chọn B', isCorrect: correctOptIndex === 1 },
        { id: 'opt-3', text: opt3.trim() || 'Lựa chọn C', isCorrect: correctOptIndex === 2 },
        { id: 'opt-4', text: opt4.trim() || 'Lựa chọn D', isCorrect: correctOptIndex === 3 },
      ];
    }

    db.addQuestion({
      subject: 'Toán học',
      grade: Number(qGrade),
      topic: qTopic.trim(),
      skill: qSkill.trim(),
      difficulty: qDiff,
      questionType: qType,
      questionText: qText.trim(),
      options,
      correctNumericAnswer: qType === 'numeric' ? Number(numericAnswer) : undefined,
      explanation: explanation.trim() || undefined,
    });

    setShowAddQModal(false);
    // Reset form
    setQText('');
    setExplanation('');
  };

  const handleCreateOnlineTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || selectedQuestionIds.length === 0) return;

    const pointsPerQ = Math.round((testMaxScore / selectedQuestionIds.length) * 10) / 10;
    const qRefs = selectedQuestionIds.map((qId) => ({ questionId: qId, points: pointsPerQ }));

    db.addOnlineTest({
      classId: testClassId,
      title: testTitle.trim(),
      durationMinutes: testDuration,
      maxScore: testMaxScore,
      questions: qRefs,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-10-31',
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      attemptsAllowed: 2,
      status: 'published',
    });

    setShowAddTestModal(false);
    setTestTitle('');
    setSelectedQuestionIds([]);
    setActiveTab('tests');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Ngân hàng câu hỏi & Bài thi Online
          </h2>
          <p className="text-xs text-slate-500">
            Kho lưu trữ câu hỏi phân hóa 4 cấp độ, tạo đề kiểm tra trực tuyến và tự động chấm điểm
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'bank' ? (
            <button
              onClick={() => setShowAddQModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm câu hỏi mới</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo đề thi Online</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Ngân hàng câu hỏi ({questions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'tests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-purple-600" />
          <span>Đề thi trực tuyến ({onlineTests.length})</span>
        </button>
      </div>

      {/* TAB 1: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo nội dung câu hỏi, chuyên đề hoặc kỹ năng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 outline-none"
              >
                <option value="all">Tất cả khối lớp</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
                <option value="10">Khối 10</option>
              </select>

              <select
                value={selectedDiff}
                onChange={(e) => setSelectedDiff(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 outline-none"
              >
                <option value="all">Tất cả độ khó</option>
                <option value="recognition">Nhận biết</option>
                <option value="comprehension">Thông hiểu</option>
                <option value="application">Vận dụng</option>
                <option value="advanced">Vận dụng cao</option>
              </select>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-3">
            {filteredQuestions.map((q, index) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 font-mono">#{index + 1}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Khối {q.grade}
                    </span>
                    <span className="font-semibold text-slate-800">{q.topic}</span>
                    <span className="text-slate-400">· {q.skill}</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      DIFF_LABELS[q.difficulty]?.color
                    }`}
                  >
                    {DIFF_LABELS[q.difficulty]?.label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options preview */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Numeric answer preview */}
                {q.questionType === 'numeric' && (
                  <div className="text-xs p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-mono">
                    Đáp số đúng: <strong>{q.correctNumericAnswer}</strong>
                  </div>
                )}

                {q.explanation && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-0.5">
                    <span className="font-bold block text-[11px]">Hướng dẫn giải:</span>
                    <p className="leading-relaxed text-blue-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ONLINE TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineTests.map((t) => {
              const cls = classes.find((c) => c.id === t.classId);
              const attempts = testAttempts.filter((a) => a.testId === t.id);
              const scores = attempts.map((a) => a.score || 0);
              const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {cls?.name || 'Toán học'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {t.durationMinutes} phút
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{t.title}</h3>
                    {t.description && <p className="text-slate-500 text-xs line-clamp-2">{t.description}</p>}

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Đã nộp bài:</span>
                        <span className="font-bold font-mono text-slate-900">{attempts.length} học sinh</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Điểm TB:</span>
                        <span className="font-bold font-mono text-purple-600">{avg} / {t.maxScore}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Đang mở thi
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{t.questions.length} câu hỏi</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">Thêm câu hỏi vào ngân hàng đề</h3>
              <button onClick={() => setShowAddQModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={qGrade}
                    onChange={(e) => setQGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {[8, 9, 10].map((g) => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Độ khó</label>
                  <select
                    value={qDiff}
                    onChange={(e) => setQDiff(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="recognition">Nhận biết</option>
                    <option value="comprehension">Thông hiểu</option>
                    <option value="application">Vận dụng</option>
                    <option value="advanced">Vận dụng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dạng câu</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="single_choice">Trắc nghiệm</option>
                    <option value="numeric">Điền số</option>
                    <option value="true_false">Đúng / Sai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chuyên đề Toán</label>
                  <input
                    type="text"
                    required
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kỹ năng đánh giá</label>
                  <input
                    type="text"
                    required
                    value={qSkill}
                    onChange={(e) => setQSkill(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập đề bài câu hỏi..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              {/* Options for single choice */}
              {(qType === 'single_choice' || qType === 'true_false') && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">
                    Các lựa chọn & Đánh dấu đáp án đúng:
                  </label>
                  {[opt1, opt2, opt3, opt4].map((optVal, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={correctOptIndex === idx}
                        onChange={() => setCorrectOptIndex(idx)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + idx)}`}
                        value={idx === 0 ? opt1 : idx === 1 ? opt2 : idx === 2 ? opt3 : opt4}
                        onChange={(e) => {
                          if (idx === 0) setOpt1(e.target.value);
                          if (idx === 1) setOpt2(e.target.value);
                          if (idx === 2) setOpt3(e.target.value);
                          if (idx === 3) setOpt4(e.target.value);
                        }}
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'numeric' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đáp án số chính xác</label>
                  <input
                    type="number"
                    value={numericAnswer}
                    onChange={(e) => setNumericAnswer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hướng dẫn giải / Lời giải chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Giải thích các bước biến đổi..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Lưu vào ngân hàng đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">Tạo đề thi trực tuyến mới</h3>
              <button onClick={() => setShowAddTestModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOnlineTest} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài kiểm tra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khảo sát trực tuyến 15p - Bất đẳng thức & Căn thức"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giao cho lớp</label>
                  <select
                    value={testClassId}
                    onChange={(e) => setTestClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value, 10) || 15)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thang điểm</label>
                  <input
                    type="number"
                    value={testMaxScore}
                    onChange={(e) => setTestMaxScore(parseInt(e.target.value, 10) || 10)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Chọn câu hỏi từ Ngân hàng đề ({selectedQuestionIds.length} đã chọn):
                </label>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {questions.map((q) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <label key={q.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                            } else {
                              setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                            }
                          }}
                          className="mt-0.5 text-purple-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900 block">{q.questionText}</span>
                          <span className="text-[10px] text-slate-400">
                            Khối {q.grade} · {q.topic} ({DIFF_LABELS[q.difficulty]?.label})
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Tạo và Xuất bản đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
