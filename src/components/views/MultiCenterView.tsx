import React, { useState } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { db } from '../../services/db';
import { Center, Classroom, SaaSPlanTier, TeacherProfile } from '../../types';
import { formatVND } from '../../utils/formatters';

export const MultiCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'centers' | 'classrooms' | 'teachers' | 'saas_plans'>('centers');

  const tenant = db.getTenant();
  const centers = db.getCenters();
  const teachers = db.getTeachers();
  const classes = db.getClasses();

  // Add Center Modal state
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [centerName, setCenterName] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [centerAddress, setCenterAddress] = useState('');
  const [centerManager, setCenterManager] = useState('');
  const [centerPhone, setCenterPhone] = useState('');

  // Add Room Modal state
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string>(centers[0]?.id || '');
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState<number>(20);
  const [roomEquipment, setRoomEquipment] = useState('Smart TV, Điều hòa, Bảng từ trượt');

  // Add Teacher Modal state
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherRole, setTeacherRole] = useState<'lead' | 'teacher' | 'assistant' | 'substitute'>('teacher');
  const [teacherSpecialties, setTeacherSpecialties] = useState('Toán 9 Luyện thi vào 10');

  const handleAddCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim()) return;
    db.addCenter({
      tenantId: tenant.id,
      name: centerName.trim(),
      code: centerCode.trim() || 'CS-NEW',
      address: centerAddress.trim() || 'Hà Nội',
      managerName: centerManager.trim() || 'Quản lý cơ sở',
      phone: centerPhone.trim() || '0912 345 678',
      classrooms: [],
    });
    setShowAddCenterModal(false);
    setCenterName('');
    setCenterCode('');
    setCenterAddress('');
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    db.addClassroom(selectedCenterId, {
      centerId: selectedCenterId,
      name: roomName.trim(),
      capacity: Number(roomCapacity),
      equipment: roomEquipment.split(',').map((s) => s.trim()),
      status: 'available',
    });
    setShowAddRoomModal(false);
    setRoomName('');
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;
    db.addTeacher({
      tenantId: tenant.id,
      name: teacherName.trim(),
      phone: teacherPhone.trim(),
      role: teacherRole,
      specialties: teacherSpecialties.split(',').map((s) => s.trim()),
      assignedClassIds: [],
      primaryCenterId: centers[0]?.id || 'center-1',
      status: 'active',
    });
    setShowAddTeacherModal(false);
    setTeacherName('');
    setTeacherPhone('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
            Mở Rộng Quy Mô V4 · Multi-Center & Multi-Teacher
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quản Lý Hệ Thống Cơ Sở & Đội Ngũ Giáo Viên
          </h2>
          <p className="text-xs text-slate-500">
            {tenant.name} · Hỗ trợ từ giáo viên cá nhân đến chuỗi trung tâm đa chi nhánh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCenterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cơ sở mới</span>
          </button>
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Thêm giáo viên</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1 overflow-x-auto">
        {[
          { id: 'centers', label: `Danh sách cơ sở (${centers.length})`, icon: Building2 },
          { id: 'classrooms', label: 'Quản lý phòng học', icon: Layers },
          { id: 'teachers', label: `Đội ngũ giáo viên (${teachers.length})`, icon: Users },
          { id: 'saas_plans', label: 'Gói SaaS & Phân quyền', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CENTERS LIST */}
      {/* ========================================================================= */}
      {activeTab === 'centers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {centers.map((center) => (
            <div
              key={center.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                    {center.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{center.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{center.address}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-medium">Học sinh</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{center.activeStudentCount}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-medium">Lớp học</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{center.activeClassCount}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-medium">Phòng học</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{center.classrooms.length}</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quản lý: {center.managerName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{center.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASSROOMS */}
      {/* ========================================================================= */}
      {activeTab === 'classrooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Danh mục phòng học & Thiết bị giảng dạy</h3>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm phòng học</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {centers.flatMap((c) =>
              c.classrooms.map((room) => (
                <div key={room.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold">{c.name}</span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">{room.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        room.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : room.status === 'occupied'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {room.status === 'available' ? 'Có sẵn' : room.status === 'occupied' ? 'Đang học' : 'Bảo trì'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Sức chứa:</span>
                      <span className="font-bold font-mono">{room.capacity} học sinh</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Trang thiết bị:</span>
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.map((eq, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEACHERS & WORKLOAD */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teachers.map((tc) => (
            <div key={tc.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center">
                    {tc.avatar || tc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{tc.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {tc.role === 'lead' ? 'Trưởng bộ môn Toán' : tc.role === 'teacher' ? 'Giáo viên Toán' : 'Trợ giảng chuyên môn'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-200">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{tc.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Giờ dạy / tuần:</span>
                  <div className="font-bold font-mono text-sm text-slate-900">{tc.weeklyHours} giờ</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Học sinh phụ trách:</span>
                  <div className="font-bold font-mono text-sm text-slate-900">{tc.activeStudents} học sinh</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chuyên môn giảng dạy:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tc.specialties.map((sp, idx) => (
                    <span key={idx} className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl font-medium border border-blue-100">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAAS PLANS & TENANT LIMITS */}
      {/* ========================================================================= */}
      {activeTab === 'saas_plans' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                SaaS Subscription & Tenant Isolation
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Cấu hình gói đăng ký của tổ chức</h3>
              <p className="text-xs text-slate-500">Mã đơn vị: <span className="font-mono font-bold">{tenant.code}</span> · Gói hiện tại: <span className="font-bold uppercase text-blue-600">{tenant.plan}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                id: 'free',
                name: 'Gói Free (Khởi tạo)',
                price: 'Miễn phí',
                students: 'Tối đa 25 học sinh',
                teachers: '1 giáo viên',
                centers: '1 cơ sở',
                credits: '500 AI credits',
              },
              {
                id: 'pro',
                name: 'Gói Pro (Gia sư chuyên)',
                price: '299.000 đ/tháng',
                students: 'Tối đa 150 học sinh',
                teachers: '3 giáo viên',
                centers: '1 cơ sở',
                credits: '3.000 AI credits',
              },
              {
                id: 'center',
                name: 'Gói Center (Trung tâm)',
                price: '799.000 đ/tháng',
                students: 'Tối đa 1.000 học sinh',
                teachers: '20 giáo viên',
                centers: '5 cơ sở',
                credits: '10.000 AI credits',
                isCurrent: true,
              },
              {
                id: 'enterprise',
                name: 'Gói Enterprise (Chuỗi)',
                price: 'Liên hệ',
                students: 'Không giới hạn',
                teachers: 'Không giới hạn',
                centers: 'Không giới hạn',
                credits: '50.000 AI credits',
              },
            ].map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                  p.isCurrent
                    ? 'bg-blue-50/60 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    {p.isCurrent && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Đang dùng
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900">{p.price}</div>

                  <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.students}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.teachers}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.centers}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.credits}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Center Modal */}
      {showAddCenterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Thêm cơ sở dạy học mới</h3>
              <button onClick={() => setShowAddCenterModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCenter} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên cơ sở:</label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="Ví dụ: Cơ sở 3 - Hà Đông"
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Địa chỉ chi tiết:</label>
                <input
                  type="text"
                  value={centerAddress}
                  onChange={(e) => setCenterAddress(e.target.value)}
                  placeholder="Số nhà, đường, quận..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Người quản lý:</label>
                  <input
                    type="text"
                    value={centerManager}
                    onChange={(e) => setCenterManager(e.target.value)}
                    placeholder="Thầy/Cô..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={centerPhone}
                    onChange={(e) => setCenterPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer mt-2"
              >
                Xác nhận tạo cơ sở
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Thêm phòng học mới</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thuộc cơ sở:</label>
                <select
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên phòng:</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng 302 - Thales"
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sức chứa (học sinh):</label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer mt-2"
              >
                Lưu phòng học
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Thêm giáo viên / trợ giảng</h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên giáo viên:</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Thầy / Cô..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vai trò:</label>
                  <select
                    value={teacherRole}
                    onChange={(e) => setTeacherRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                  >
                    <option value="teacher">Giáo viên chính</option>
                    <option value="assistant">Trợ giảng</option>
                    <option value="lead">Trưởng bộ môn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chuyên môn giảng dạy:</label>
                <input
                  type="text"
                  value={teacherSpecialties}
                  onChange={(e) => setTeacherSpecialties(e.target.value)}
                  placeholder="Cách nhau bởi dấu phẩy..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer mt-2"
              >
                Xác nhận thêm giáo viên
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
