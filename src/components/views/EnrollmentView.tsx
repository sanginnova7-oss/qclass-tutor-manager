import React, { useState } from 'react';
import {
  UserPlus,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Phone,
  MessageSquare,
  Plus,
  X,
  Sparkles,
  Send,
  GraduationCap,
} from 'lucide-react';
import { db } from '../../services/db';
import { LeadItem, LeadSource, LeadStage, TrialLessonItem } from '../../types';
import { formatDateVN, formatDateTimeVN, formatVND } from '../../utils/formatters';

interface EnrollmentViewProps {
  onSelectStudent: (studentId: string) => void;
}

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({ onSelectStudent }) => {
  const leads = db.getLeads();
  const trials = db.getTrials();
  const classes = db.getClasses();
  const students = db.getStudents();
  const settings = db.getSettings();

  const [viewMode, setViewMode] = useState<'pipeline' | 'list' | 'trials'>('pipeline');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [convertClassId, setConvertClassId] = useState<string>(classes[0]?.id || '');
  const [convertPackageLessons, setConvertPackageLessons] = useState<number>(10);

  // New Lead Form state
  const [leadName, setLeadName] = useState('');
  const [leadGrade, setLeadGrade] = useState<number>(9);
  const [leadSchool, setLeadSchool] = useState('');
  const [leadParentName, setLeadParentName] = useState('');
  const [leadParentPhone, setLeadParentPhone] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSource>('Facebook');
  const [leadClassId, setLeadClassId] = useState<string>(classes[0]?.id || '');
  const [leadGoal, setLeadGoal] = useState('');
  const [leadNotes, setLeadNotes] = useState('');

  // Schedule Trial Modal
  const [schedulingTrialLead, setSchedulingTrialLead] = useState<LeadItem | null>(null);
  const [trialDate, setTrialDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [trialTime, setTrialTime] = useState<string>('18:00 - 19:30');
  const [trialClassId, setTrialClassId] = useState<string>(classes[0]?.id || '');

  const STAGES: Array<{ id: LeadStage; label: string; color: string; border: string }> = [
    { id: 'new', label: 'Lead mới', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
    { id: 'contacted', label: 'Đã liên hệ', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
    { id: 'consulted', label: 'Đã tư vấn', color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
    { id: 'trial_registered', label: 'Đăng ký học thử', color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
    { id: 'trial_completed', label: 'Đã học thử', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
    { id: 'considering', label: 'Đang cân nhắc', color: 'bg-yellow-50 text-yellow-800', border: 'border-yellow-200' },
    { id: 'enrolled', label: 'Đã nhập học', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  ];

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !lead.studentName.toLowerCase().includes(q) &&
      !lead.parentName.toLowerCase().includes(q) &&
      !lead.parentPhone.includes(q)
    ) {
      return false;
    }
    if (filterStage !== 'all' && lead.stage !== filterStage) return false;
    if (filterSource !== 'all' && lead.source !== filterSource) return false;
    return true;
  });

  // Conversion metrics
  const totalLeads = leads.length;
  const trialCount = leads.filter((l) => l.stage === 'trial_registered' || l.stage === 'trial_completed' || l.stage === 'enrolled').length;
  const enrolledCount = leads.filter((l) => l.stage === 'enrolled').length;
  const conversionRate = totalLeads > 0 ? Math.round((enrolledCount / totalLeads) * 100) : 0;

  // Add Lead Handler
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadParentPhone.trim()) return;

    db.addLead({
      studentName: leadName.trim(),
      grade: Number(leadGrade),
      school: leadSchool.trim() || undefined,
      parentName: leadParentName.trim() || 'Phụ huynh',
      parentPhone: leadParentPhone.trim(),
      source: leadSource,
      interestedClassId: leadClassId || undefined,
      learningGoal: leadGoal.trim() || undefined,
      currentLevel: 'Khá',
      stage: 'new',
      notes: leadNotes.trim() || undefined,
    });

    setShowAddLeadModal(false);
    // Reset form
    setLeadName('');
    setLeadParentPhone('');
    setLeadParentName('');
  };

  // Convert Lead to Student Handler
  const handleConfirmConvert = () => {
    if (!convertingLead) return;
    const student = db.convertLeadToStudent(convertingLead.id, convertClassId, convertPackageLessons);
    setConvertingLead(null);
    if (student) {
      onSelectStudent(student.id);
    }
  };

  // Save Trial Lesson
  const handleSaveTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingTrialLead) return;

    db.addTrialLesson({
      leadId: schedulingTrialLead.id,
      classId: trialClassId,
      trialDate,
      trialTime,
      status: 'scheduled',
    });

    db.updateLeadStage(schedulingTrialLead.id, 'trial_registered');
    setSchedulingTrialLead(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tuyển sinh & Quản lý Lead</h2>
          <p className="text-xs text-slate-500">
            Phễu tuyển sinh, đăng ký học thử và chuyển đổi lead thành học sinh chính thức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddLeadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Lead tuyển sinh</span>
          </button>
        </div>
      </div>

      {/* KPI Funnel Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Tổng số Lead</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{totalLeads}</p>
          <span className="text-[10px] text-slate-400">Từ các nguồn tiếp cận</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Đã đăng ký học thử</span>
          <p className="text-xl font-bold text-purple-600 font-mono mt-1">{trialCount}</p>
          <span className="text-[10px] text-slate-400">Tham gia trải nghiệm lớp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Đã nhập học chính thức</span>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">{enrolledCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Học sinh đã vào lớp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Tỷ lệ chuyển đổi phễu</span>
          <p className="text-xl font-bold text-blue-600 font-mono mt-1">{conversionRate}%</p>
          <span className="text-[10px] text-slate-400">Lead → Học sinh chính thức</span>
        </div>
      </div>

      {/* View Mode Toggle & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl w-fit">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kanban Phễu tuyển sinh
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh sách Lead ({leads.length})
          </button>
          <button
            onClick={() => setViewMode('trials')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              viewMode === 'trials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch học thử ({trials.length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN PIPELINE */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stg) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stg.id);

            return (
              <div
                key={stg.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 min-w-[200px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-800">{stg.label}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageLeads.map((lead) => {
                      const cleanPhone = lead.parentPhone.replace(/\D/g, '');
                      return (
                        <div
                          key={lead.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all space-y-2 text-xs"
                        >
                          <div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              Khối {lead.grade} · {lead.source}
                            </span>
                            <h4 className="font-bold text-slate-900 mt-1">{lead.studentName}</h4>
                            <p className="text-[11px] text-slate-500">
                              PH: {lead.parentName} ({lead.parentPhone})
                            </p>
                          </div>

                          {lead.learningGoal && (
                            <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded line-clamp-2">
                              {lead.learningGoal}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            <a
                              href={`https://zalo.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Zalo</span>
                            </a>

                            {lead.stage !== 'enrolled' ? (
                              <button
                                onClick={() => setConvertingLead(lead)}
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                + Vào học
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-medium">✓ Đã học</span>
                            )}
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
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-3">Phụ huynh & SĐT</th>
                  <th className="py-3 px-3">Nguồn tiếp cận</th>
                  <th className="py-3 px-3">Giai đoạn</th>
                  <th className="py-3 px-3">Mục tiêu</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map((lead) => {
                  const stageObj = STAGES.find((s) => s.id === lead.stage);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{lead.studentName}</span>
                        <p className="text-[11px] text-slate-400">Khối {lead.grade} · {lead.school || 'Hà Nội'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span>{lead.parentName}</span>
                        <p className="text-[11px] font-mono text-slate-500">{lead.parentPhone}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${stageObj?.color} ${stageObj?.border}`}>
                          {stageObj?.label || lead.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {lead.learningGoal || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSchedulingTrialLead(lead)}
                            className="px-2.5 py-1 text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 font-semibold"
                          >
                            Học thử
                          </button>
                          {lead.stage !== 'enrolled' && (
                            <button
                              onClick={() => setConvertingLead(lead)}
                              className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs"
                            >
                              Nhập học
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: TRIAL LESSONS */}
      {viewMode === 'trials' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Danh sách các buổi học thử đã xếp lịch</h3>
            <span className="text-xs text-slate-400">{trials.length} buổi học thử</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {trials.map((tr) => {
              const lead = leads.find((l) => l.id === tr.leadId);
              const cls = classes.find((c) => c.id === tr.classId);
              return (
                <div key={tr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{lead?.studentName}</span>
                    <p className="text-slate-500 mt-0.5">
                      Lớp trải nghiệm: <strong>{cls?.name}</strong> · Thời gian: <strong className="font-mono">{formatDateVN(tr.trialDate)} ({tr.trialTime})</strong>
                    </p>
                    {tr.teacherFeedback && (
                      <p className="text-blue-700 text-[11px] mt-1 italic">
                        Nhận xét: {tr.teacherFeedback}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl font-semibold ${
                        tr.status === 'attended'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {tr.status === 'attended' ? '✓ Đã học thử' : 'Đã xếp lịch'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Convert Lead to Student Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Chuyển đổi thành học sinh chính thức
              </h3>
              <button onClick={() => setConvertingLead(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Hệ thống sẽ tạo hồ sơ cho <strong className="text-slate-900">{convertingLead.studentName}</strong>, xếp vào lớp học và mở gói học phí trả trước:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Xếp vào lớp</label>
                <select
                  value={convertClassId}
                  onChange={(e) => setConvertClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số buổi trong gói đầu tiên</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={convertPackageLessons}
                  onChange={(e) => setConvertPackageLessons(parseInt(e.target.value, 10) || 10)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConvertingLead(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmConvert}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Xác nhận nhập học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Thêm Lead tuyển sinh mới</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên học sinh *</label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối</label>
                  <select
                    value={leadGrade}
                    onChange={(e) => setLeadGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phụ huynh *</label>
                  <input
                    type="text"
                    required
                    value={leadParentName}
                    onChange={(e) => setLeadParentName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SĐT phụ huynh *</label>
                  <input
                    type="tel"
                    required
                    value={leadParentPhone}
                    onChange={(e) => setLeadParentPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nguồn tiếp cận</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {['Facebook', 'Zalo', 'TikTok', 'Referral', 'Google', 'Website', 'Offline'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp quan tâm</label>
                  <select
                    value={leadClassId}
                    onChange={(e) => setLeadClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục tiêu học tập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ôn thi vào lớp 10 THPT Chu Văn An..."
                  value={leadGoal}
                  onChange={(e) => setLeadGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Lưu Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Trial Modal */}
      {schedulingTrialLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Xếp lịch học thử cho {schedulingTrialLead.studentName}
              </h3>
              <button onClick={() => setSchedulingTrialLead(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrial} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lớp học trải nghiệm</label>
                <select
                  value={trialClassId}
                  onChange={(e) => setTrialClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày học thử</label>
                  <input
                    type="date"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khung giờ</label>
                  <input
                    type="text"
                    value={trialTime}
                    onChange={(e) => setTrialTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingTrialLead(null)}
                  className="px-4 py-2 font-medium text-slate-600 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Lưu lịch học thử
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
