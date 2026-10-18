import React, { useState } from 'react';
import {
  CheckSquare,
  Zap,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Filter,
  Users,
  Search,
  Check,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import { AutomationWorkflow, TaskItem } from '../../types';
import { formatDateVN, formatDateTimeVN } from '../../utils/formatters';

export const TaskManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'automations' | 'audit_log'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');

  const tasks = db.getTasks(taskFilter);
  const workflows = db.getAutomationWorkflows();
  const auditLogs = db.getAuditLogs();
  const teachers = db.getTeachers();
  const classes = db.getClasses();

  // New task modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTeacher, setNewTaskTeacher] = useState(teachers[0]?.id || 'tc-1');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newTaskCategory, setNewTaskCategory] = useState<'tuition' | 'attendance' | 'academic' | 'parent' | 'lead'>('academic');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    db.createTask({
      title: newTaskTitle.trim(),
      assignedTeacherId: newTaskTeacher,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'pending',
      category: newTaskCategory,
      notes: newTaskNotes.trim() || undefined,
    });

    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskNotes('');
  };

  const handleToggleTaskStatus = (t: TaskItem) => {
    const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
    db.updateTaskStatus(t.id, nextStatus);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
            Tự Động Hóa & Nhiệm Vụ V4 · Automation Engine & Workflows
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quản Lý Nhiệm Vụ & Luồng Kịch Bản Tự Động
          </h2>
          <p className="text-xs text-slate-500">
            Kích hoạt các hành động tự động có kiểm duyệt: nhắc học phí, phát hiện vắng học, gán bài tập bổ trợ.
          </p>
        </div>

        <button
          onClick={() => setShowAddTaskModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo nhiệm vụ mới</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Nhiệm vụ nội bộ</span>
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'automations' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Luồng kịch bản tự động ({workflows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'audit_log' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Nhật ký kiểm toán (Audit Log V4)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TASKS */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'overdue', label: 'Quá hạn' },
              { id: 'upcoming', label: 'Sắp tới' },
              { id: 'completed', label: 'Đã hoàn thành' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTaskFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  taskFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Không có nhiệm vụ nào trong mục này.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const tc = teachers.find((t) => t.id === task.assignedTeacherId);
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.status === 'completed'
                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTaskStatus(task)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              task.priority === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {task.priority === 'high' ? 'Khẩn cấp' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold capitalize">
                            {task.category}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        {task.notes && <p className="text-[11px] text-slate-500">{task.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{formatDateVN(task.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tc?.name || 'Giáo viên'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTOMATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'automations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Kịch bản kích hoạt luồng tự động (Trigger → Action)</h3>
              <p className="text-xs text-slate-500">Các thao tác gửi tin nhắn hoặc tài chính bắt buộc qua Cổng kiểm duyệt (Approval Gate)</p>
            </div>
          </div>

          <div className="space-y-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  wf.isEnabled ? 'bg-white border-blue-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      TRIGGER: {wf.trigger}
                    </span>
                    {wf.requiresApproval && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        🛡️ Cần giáo viên xác nhận
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{wf.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Điều kiện: {wf.conditionText} → Hành động: {wf.actionType}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  <span className="text-xs text-slate-400 font-mono">Đã chạy: {wf.runCount} lần</span>
                  <button
                    onClick={() => db.toggleAutomationWorkflow(wf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      wf.isEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {wf.isEnabled ? 'Đang bật' : 'Tạm dừng'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOG V4 */}
      {/* ========================================================================= */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Nhật ký truy vết & kiểm toán (Audit Trail)</h3>
              <p className="text-xs text-slate-500">Ghi lại toàn bộ hành động người dùng, hệ thống tự động và thay đổi điểm số/học phí</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{auditLogs.length} sự kiện</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {log.action}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">{log.summary}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({log.entityType})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0 font-mono">
                  <span>{log.actorName}</span>
                  <span>·</span>
                  <span>{formatDateTimeVN(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Thêm nhiệm vụ mới</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung nhiệm vụ:</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Gọi điện phụ huynh em Minh..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giáo viên phụ trách:</label>
                  <select
                    value={newTaskTeacher}
                    onChange={(e) => setNewTaskTeacher(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hạn hoàn thành:</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mức độ ưu tiên:</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phân loại:</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="academic">Học tập & Điểm số</option>
                    <option value="tuition">Học phí & Kế toán</option>
                    <option value="attendance">Chuyên cần</option>
                    <option value="parent">Liên hệ Phụ huynh</option>
                    <option value="lead">Tuyển sinh Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú bổ sung:</label>
                <textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 p-2 bg-slate-50 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer mt-2"
              >
                Lưu nhiệm vụ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
