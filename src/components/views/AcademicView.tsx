import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  Award,
  FileCheck2,
  ListTodo,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDateVN, getTodayISODate } from '../../utils/formatters';
import { HomeworkStatus } from '../../types';

interface AcademicViewProps {
  onSelectStudent: (studentId: string) => void;
}

export const AcademicView: React.FC<AcademicViewProps> = ({ onSelectStudent }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'homework'>('tests');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const classes = db.getClasses();
  const students = db.getStudents();
  const tests = db.getTests();
  const scores = db.getScores();
  const homework = db.getHomework();
  const homeworkResults = db.getHomeworkResults();

  // Test modals
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testClassId, setTestClassId] = useState(classes[0]?.id || '');
  const [testDate, setTestDate] = useState(getTodayISODate());
  const [maxScore, setMaxScore] = useState(10);
  const [testNotes, setTestNotes] = useState('');

  // Score input modal
  const [activeScoreTestId, setActiveScoreTestId] = useState<string | null>(null);
  const [editingScores, setEditingScores] = useState<Record<string, { score: number; notes: string }>>({});

  // Homework modal
  const [showAddHwModal, setShowAddHwModal] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [hwClassId, setHwClassId] = useState(classes[0]?.id || '');
  const [hwDueDate, setHwDueDate] = useState(getTodayISODate());
  const [hwDesc, setHwDesc] = useState('');

  // Handle create test
  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testClassId) return;

    db.addTest({
      title: testTitle.trim(),
      classId: testClassId,
      date: testDate,
      maxScore,
      notes: testNotes.trim() || undefined,
    });

    setShowAddTestModal(false);
    setTestTitle('');
  };

  // Open Score input modal for a test
  const handleOpenScoreModal = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    const testClass = classes.find((c) => c.id === test.classId);
    const classStudents = students.filter((s) => testClass?.studentIds.includes(s.id));

    const initialMap: Record<string, { score: number; notes: string }> = {};
    classStudents.forEach((st) => {
      const existingScore = scores.find((sc) => sc.testId === testId && sc.studentId === st.id);
      initialMap[st.id] = {
        score: existingScore ? existingScore.score : 8,
        notes: existingScore?.notes || '',
      };
    });

    setEditingScores(initialMap);
    setActiveScoreTestId(testId);
  };

  // Save scores
  const handleSaveScores = () => {
    if (!activeScoreTestId) return;

    const entries = Object.entries(editingScores).map(([studentId, data]) => ({
      studentId,
      score: data.score,
      notes: data.notes || undefined,
    }));

    db.saveScores(activeScoreTestId, entries);
    setActiveScoreTestId(null);
  };

  // Handle create homework
  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwClassId) return;

    db.addHomework({
      title: hwTitle.trim(),
      classId: hwClassId,
      assignedDate: getTodayISODate(),
      dueDate: hwDueDate,
      description: hwDesc.trim() || undefined,
    });

    setShowAddHwModal(false);
    setHwTitle('');
    setHwDesc('');
  };

  // Quick toggle homework status
  const handleToggleHwStatus = (homeworkId: string, studentId: string, nextStatus: HomeworkStatus) => {
    db.saveHomeworkResults(homeworkId, [{ studentId, status: nextStatus }]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Học tập & Đánh giá</h2>
          <p className="text-xs text-slate-500">
            Quản lý bài kiểm tra 15p/1 tiết, điểm số học sinh và theo dõi bài tập về nhà
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tests' ? (
            <button
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo bài kiểm tra</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddHwModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Giao bài tập về nhà</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'tests'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600" />
          <span>Bài kiểm tra & Điểm số ({tests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'homework'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListTodo className="w-4 h-4 text-indigo-600" />
          <span>Bài tập về nhà ({homework.length})</span>
        </button>
      </div>

      {/* Tab 1: Tests & Scores */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => {
              const testClass = classes.find((c) => c.id === test.classId);
              const testScores = scores.filter((sc) => sc.testId === test.id);
              const scoreVals = testScores.map((s) => s.score);
              const avg = scoreVals.length > 0 ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(1) : '-';
              const max = scoreVals.length > 0 ? Math.max(...scoreVals) : '-';

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                        {testClass?.name || 'Lớp học'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{formatDateVN(test.date)}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{test.title}</h3>
                    {test.notes && <p className="text-xs text-slate-500 mt-1">{test.notes}</p>}

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Điểm TB:</span>
                        <span className="font-bold text-blue-600 text-sm font-mono">{avg} / 10</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Điểm cao nhất:</span>
                        <span className="font-bold text-emerald-600 text-sm font-mono">{max} / 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Đã chấm: <strong className="text-slate-800">{testScores.length}</strong> học sinh
                    </span>
                    <button
                      onClick={() => handleOpenScoreModal(test.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                    >
                      Nhập / Sửa điểm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Homework */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homework.map((hw) => {
              const hwClass = classes.find((c) => c.id === hw.classId);
              const classStudents = students.filter((s) => hwClass?.studentIds.includes(s.id));
              const results = homeworkResults.filter((r) => r.homeworkId === hw.id);

              return (
                <div key={hw.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      {hwClass?.name || 'Lớp học'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Hạn nộp: {formatDateVN(hw.dueDate)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{hw.title}</h3>
                    {hw.description && <p className="text-xs text-slate-500 mt-1">{hw.description}</p>}
                  </div>

                  {/* Student homework status list */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[11px]">
                      Tình trạng hoàn thành của học sinh ({classStudents.length} em)
                    </div>
                    <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {classStudents.map((st) => {
                        const res = results.find((r) => r.studentId === st.id);
                        const status = res?.status || 'missing';

                        return (
                          <div key={st.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                            <span className="font-medium text-slate-800">{st.fullName}</span>
                            <div className="flex items-center gap-1">
                              {(['completed', 'partial', 'missing'] as HomeworkStatus[]).map((stt) => (
                                <button
                                  key={stt}
                                  type="button"
                                  onClick={() => handleToggleHwStatus(hw.id, st.id, stt)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    status === stt
                                      ? stt === 'completed'
                                        ? 'bg-emerald-600 text-white font-bold'
                                        : stt === 'partial'
                                        ? 'bg-amber-500 text-white font-bold'
                                        : 'bg-rose-500 text-white font-bold'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {stt === 'completed' ? 'Xong' : stt === 'partial' ? 'Một phần' : 'Chưa'}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Input Modal */}
      {activeScoreTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Nhập điểm bài kiểm tra: {tests.find((t) => t.id === activeScoreTestId)?.title}
                </h3>
                <p className="text-xs text-slate-500">Thang điểm 10 (hỗ trợ số thập phân: 8.5, 9.0)</p>
              </div>
              <button
                onClick={() => setActiveScoreTestId(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {Object.keys(editingScores).map((studentId) => {
                const student = students.find((s) => s.id === studentId);
                const scoreData = editingScores[studentId];

                return (
                  <div
                    key={studentId}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 gap-3 text-xs"
                  >
                    <span className="font-semibold text-slate-900 flex-1 truncate">
                      {student?.fullName}
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="10"
                        value={scoreData?.score ?? ''}
                        onChange={(e) =>
                          setEditingScores((prev) => ({
                            ...prev,
                            [studentId]: {
                              ...prev[studentId],
                              score: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="w-18 py-1.5 px-2 text-center font-mono font-bold text-sm rounded-lg border border-slate-300 bg-white text-blue-700 outline-none focus:border-blue-500"
                      />
                      <span className="text-slate-400 text-xs">/ 10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setActiveScoreTestId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveScores}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Lưu bảng điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">Tạo bài kiểm tra mới</h3>
              <button onClick={() => setShowAddTestModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bài kiểm tra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm tra 15p - Bất đẳng thức Bunhiacopxki"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp học</label>
                  <select
                    value={testClassId}
                    onChange={(e) => setTestClassId(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày làm bài</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú đề bài</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 4 câu tự luận, thang điểm 10"
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Tạo bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Homework Modal */}
      {showAddHwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm">Giao bài tập về nhà mới</h3>
              <button onClick={() => setShowAddHwModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateHomework} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề bài tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phiếu 14: 10 bài toán cực trị đại số"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp học</label>
                  <select
                    value={hwClassId}
                    onChange={(e) => setHwClassId(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn nộp</label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Yêu cầu</label>
                <textarea
                  rows={2}
                  placeholder="Làm vào vở bài tập, vẽ hình compa cẩn thận..."
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddHwModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Giao bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
