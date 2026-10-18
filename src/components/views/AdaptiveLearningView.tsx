import React, { useState } from 'react';
import {
  BrainCircuit,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Check,
  X,
  Play,
  HelpCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { ErrorCategory, KnowledgeTopic, StudentTopicMastery } from '../../types';
import { formatDateVN } from '../../utils/formatters';

interface AdaptiveLearningViewProps {
  onSelectStudent?: (studentId: string) => void;
}

export const AdaptiveLearningView: React.FC<AdaptiveLearningViewProps> = ({ onSelectStudent }) => {
  const students = db.getStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'knowledge_map' | 'learning_path' | 'error_intelligence'>('knowledge_map');

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const topics = db.getKnowledgeTopics();
  const masteries = db.getStudentTopicMasteries(activeStudent?.id || '');
  const learningPath = db.getPersonalLearningPath(activeStudent?.id || '');
  const errorAnalytics = db.getStudentErrorAnalytics(activeStudent?.id || '');
  const studentErrors = db.getStudentErrors(activeStudent?.id || '');

  // Teacher override state
  const [overrideTopicId, setOverrideTopicId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(75);

  const getMasteryBadge = (score: number) => {
    if (score < 40) return { label: 'Chưa đạt (0–39)', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (score < 60) return { label: 'Đang hình thành (40–59)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (score < 75) return { label: 'Đạt cơ bản (60–74)', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (score < 90) return { label: 'Tốt (75–89)', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    return { label: 'Thành thạo (90–100)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const ERROR_LABELS: Record<ErrorCategory, { label: string; desc: string }> = {
    sai_dieu_kien: { label: 'Sai điều kiện (ĐKXĐ)', desc: 'Quên mẫu khác 0, trong căn >= 0, dấu bằng BĐT' },
    sai_dau: { label: 'Sai dấu', desc: 'Chuyển vế không đổi dấu, nhân chia số âm' },
    sai_tinh_toan: { label: 'Sai tính toán', desc: 'Cộng trừ nhân chia số học nhầm' },
    nham_cong_thuc: { label: 'Nhầm công thức', desc: 'Nhầm hằng đẳng thức, diện tích k² thành k' },
    sai_kien_thuc: { label: 'Sai kiến thức nền', desc: 'Chưa nắm vững định lý lý thuyết' },
    doc_sai_de: { label: 'Đọc sai đề', desc: 'Bỏ sót giả thiết đề bài' },
    thieu_buoc: { label: 'Thiếu bước lập luận', desc: 'Bỏ qua bước chứng minh trung gian' },
    chua_hieu_khai_niem: { label: 'Chưa hiểu khái niệm', desc: 'Nhầm lẫn bản chất đối tượng' },
  };

  const handleSaveOverride = (topicId: string) => {
    if (!activeStudent) return;
    const success = db.setTeacherMasteryOverride(activeStudent.id, topicId, overrideScore);
    if (success) {
      alert(`Đã lưu điểm thành thạo của học sinh thành ${overrideScore}/100.`);
    }
    setOverrideTopicId(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Student Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
            Động Cơ Học Tập Thích Ứng (Adaptive Learning Engine V4)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Bản Đồ Tri Thức & Lộ Trình Học Cá Nhân Hóa
          </h2>
          <p className="text-xs text-slate-500">
            Mô hình hóa năng lực học sinh qua thang đo Thành thạo (Mastery) & Độ tin cậy (Confidence).
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Chọn học sinh:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900 outline-none focus:border-blue-500 w-56"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} (Khối {s.grade})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveSubTab('knowledge_map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'knowledge_map'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Bản đồ tri thức (Knowledge Graph)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('learning_path')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'learning_path'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Lộ trình học tập & Ôn tập lặp lại</span>
        </button>

        <button
          onClick={() => setActiveSubTab('error_intelligence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'error_intelligence'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Phân tích lỗi sai ({errorAnalytics.totalErrors})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: KNOWLEDGE MAP */}
      {/* ========================================================================= */}
      {activeSubTab === 'knowledge_map' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Cây kiến thức môn Toán Khối {activeStudent?.grade} · Học sinh: {activeStudent?.fullName}
              </h3>
              <span className="text-xs text-slate-500">Màu sắc thể hiện mức độ thành thạo thực tế</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics
                .filter((t) => t.grade === activeStudent?.grade)
                .map((topic) => {
                  const m = masteries.find((item) => item.topicId === topic.id);
                  const score = m?.masteryScore ?? 50;
                  const confidence = m?.confidenceScore ?? 30;
                  const badge = getMasteryBadge(score);

                  return (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                          {topic.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{topic.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{topic.description}</p>
                      </div>

                      {/* Mastery & Confidence Indicators */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Điểm thành thạo:</span>
                          <span className="font-bold font-mono text-slate-800">{score}/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${
                              score < 40 ? 'bg-rose-500' : score < 60 ? 'bg-amber-500' : score < 75 ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Độ tin cậy dữ liệu:</span>
                          <span className="font-mono">{confidence}% ({m?.practiceCount || 0} bài đã làm)</span>
                        </div>
                      </div>

                      {/* Prerequisites check */}
                      {topic.prerequisites.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Yêu cầu tiên quyết: </span>
                          <span>Đạt ≥ 70 điểm kiến thức nền</span>
                        </div>
                      )}

                      {/* Teacher Override Button */}
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setOverrideTopicId(topic.id);
                            setOverrideScore(score);
                          }}
                          className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Giáo viên điều chỉnh điểm
                        </button>
                      </div>

                      {overrideTopicId === topic.id && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2 animate-in fade-in">
                          <span className="text-[11px] font-bold text-blue-900 block">Điều chỉnh điểm thành thạo:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={overrideScore}
                              onChange={(e) => setOverrideScore(Number(e.target.value))}
                              className="w-20 text-xs font-mono p-1 rounded border border-blue-300 bg-white"
                            />
                            <button
                              onClick={() => handleSaveOverride(topic.id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setOverrideTopicId(null)}
                              className="px-2 py-1 text-slate-500 text-[11px] hover:text-slate-700 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: LEARNING PATH & SPACED REVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'learning_path' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Trọng tâm học tập hiện tại của {activeStudent?.fullName}</span>
            </h3>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                Mục tiêu cần đột phá
              </span>
              <h4 className="text-base font-extrabold text-slate-900">{learningPath.currentFocus}</h4>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Mức độ hiện tại: </span>
                  <span className="font-bold font-mono text-blue-700">{learningPath.masteryScore}/100</span>
                </div>
                <div>
                  <span className="text-slate-500">Cấp độ bài tập: </span>
                  <span className="font-bold text-indigo-700 capitalize">{learningPath.practiceLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Khuyến nghị tiếp theo (Dựa trên quy tắc logic):
              </h4>
              <div className="space-y-2">
                {learningPath.recommendedTopics.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-slate-500 text-[11px]">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Ôn tập ngắt quãng (Spaced Review 1 - 3 - 7 - 14 - 30 ngày)</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Các chuyên đề đã thành thạo sẽ tự động được xếp lịch ôn lại định kỳ để chống hiện tượng "quên kiến thức sau 2 tuần".
            </p>

            <div className="space-y-3">
              {learningPath.reviewTopics.map((rev, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-purple-950">{rev.name}</p>
                    <p className="text-[11px] text-purple-700">
                      {rev.dueDays === 0 ? 'Hạn ôn tập: Hôm nay' : `Hạn ôn tập: Còn ${rev.dueDays} ngày nữa`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${rev.dueDays === 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-200 text-purple-800'}`}>
                    {rev.dueDays === 0 ? 'Cần làm ngay' : 'Đúng hạn'}
                  </span>
                </div>
              ))}
            </div>

            {/* Daily 5 questions preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800">Bộ câu hỏi "Luyện tập hôm nay" (Daily 5-min):</span>
              <p className="text-xs text-slate-600">
                Đã chuẩn bị sẵn {learningPath.dailyPractice.length} câu hỏi phù hợp năng lực học sinh, hiển thị trực tiếp trên Cổng Học Sinh của em.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ERROR INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeSubTab === 'error_intelligence' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Hồ sơ lỗi sai 30 ngày (Student Error Profile): {activeStudent?.fullName}
                </h3>
                <p className="text-xs text-slate-500">Phân loại theo 8 nhóm sai lầm bản chất trong học Toán</p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Tổng cộng: {errorAnalytics.totalErrors} lần mắc lỗi
              </span>
            </div>

            {/* Error Breakdown Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(ERROR_LABELS) as ErrorCategory[]).map((cat) => {
                const count = errorAnalytics.counts[cat] || 0;
                return (
                  <div
                    key={cat}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      count > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={count > 0 ? 'text-rose-900' : 'text-slate-600'}>{ERROR_LABELS[cat].label}</span>
                      <span className="font-mono text-sm font-extrabold">{count}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{ERROR_LABELS[cat].desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Error Log Timeline */}
            <div className="space-y-3 pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nhật ký lỗi sai thực tế gần nhất ({studentErrors.length}):
              </h4>
              <div className="space-y-2">
                {studentErrors.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Chưa ghi nhận lỗi sai nào cho học sinh này.
                  </div>
                ) : (
                  studentErrors.map((err) => (
                    <div
                      key={err.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            {ERROR_LABELS[err.errorType]?.label || err.errorType}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">Chuyên đề: {err.topic}</span>
                          <span className="text-[10px] text-slate-400">({formatDateVN(err.timestamp)})</span>
                        </div>
                        <p className="font-medium text-slate-800 leading-relaxed">{err.questionSummary}</p>
                        {err.correctionNote && (
                          <p className="text-[11px] text-blue-700 font-semibold">
                            💡 Khắc phục: {err.correctionNote}
                          </p>
                        )}
                      </div>

                      <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                        Nguồn: {err.source === 'test' ? 'Bài thi' : err.source === 'homework' ? 'Bài tập về nhà' : 'Luyện tập'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
