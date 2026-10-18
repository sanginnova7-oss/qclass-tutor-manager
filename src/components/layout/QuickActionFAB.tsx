import React, { useState } from 'react';
import {
  Plus,
  UserPlus,
  CalendarCheck,
  CreditCard,
  FileCheck2,
  MessageSquarePlus,
  X,
} from 'lucide-react';

interface QuickActionFABProps {
  onAddStudent: () => void;
  onTakeAttendance: () => void;
  onAddPayment: () => void;
  onAddScore: () => void;
  onAddNote: () => void;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onAddStudent,
  onTakeAttendance,
  onAddPayment,
  onAddScore,
  onAddNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Thu học phí',
      icon: CreditCard,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      handler: onAddPayment,
    },
    {
      label: 'Điểm danh nhanh',
      icon: CalendarCheck,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      handler: onTakeAttendance,
    },
    {
      label: 'Thêm học sinh',
      icon: UserPlus,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      handler: onAddStudent,
    },
    {
      label: 'Nhập điểm',
      icon: FileCheck2,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      handler: onAddScore,
    },
    {
      label: 'Ghi chú giáo viên',
      icon: MessageSquarePlus,
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      handler: onAddNote,
    },
  ];

  return (
    <div className="fixed bottom-20 md:bottom-8 right-5 z-40 flex flex-col items-end">
      {/* Backdrop when opened */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs -z-10 animate-in fade-in duration-100"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
          {actions.map((act, index) => {
            const Icon = act.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(false);
                  act.handler();
                }}
                className="flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="bg-white/95 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 transition-all group-hover:scale-105">
                  {act.label}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${act.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Tác vụ nhanh"
        className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl text-white transition-all transform active:scale-95 cursor-pointer ${
          isOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 ring-4 ring-blue-100'
        }`}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
