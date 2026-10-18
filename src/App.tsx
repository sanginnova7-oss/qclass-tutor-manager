/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useData } from './hooks/useData';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { TopBar } from './components/layout/TopBar';
import { QuickActionFAB } from './components/layout/QuickActionFAB';
import { PortalSwitcher } from './components/layout/PortalSwitcher';

// Portals
import { StudentPortal } from './components/portal-student/StudentPortal';
import { ParentPortal } from './components/portal-parent/ParentPortal';
import { PublicEnrollmentPortal } from './components/portal-public/PublicEnrollmentPortal';

// Modals
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { AddStudentModal } from './components/modals/AddStudentModal';
import { ParentMessageModal } from './components/modals/ParentMessageModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AddNoteModal } from './components/modals/AddNoteModal';
import { AICopilotModal } from './components/modals/AICopilotModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { WorksheetPrintModal } from './components/modals/WorksheetPrintModal';
import { GoogleSheetsSyncModal } from './components/modals/GoogleSheetsSyncModal';
import { RealtimeToastContainer } from './components/common/RealtimeToastContainer';

// Views
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { StudentProfileView } from './components/views/StudentProfileView';
import { ClassesView } from './components/views/ClassesView';
import { AttendanceView } from './components/views/AttendanceView';
import { TuitionView } from './components/views/TuitionView';
import { AcademicView } from './components/views/AcademicView';
import { EnrollmentView } from './components/views/EnrollmentView';
import { QuestionBankView } from './components/views/QuestionBankView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { TeacherAIWorkspaceView } from './components/views/TeacherAIWorkspaceView';
import { AdaptiveLearningView } from './components/views/AdaptiveLearningView';
import { MultiCenterView } from './components/views/MultiCenterView';
import { TaskManagementView } from './components/views/TaskManagementView';

import { db } from './services/db';
import { PortalType, UserProfile } from './types';

export default function App() {
  // Subscribe to database changes
  useData();

  // Portal & User Identity
  const [currentPortal, setCurrentPortal] = useState<PortalType>('teacher');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => db.getCurrentUser());

  // Teacher navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modal triggers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  const [isParentMessageOpen, setIsParentMessageOpen] = useState(false);
  const [parentMessageStudentId, setParentMessageStudentId] = useState<string | null>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [printWorksheetId, setPrintWorksheetId] = useState<string | null>(null);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);

  // Global keyboard shortcuts (Ctrl+K for Command Palette, '/' for Search, 'Escape' to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsGoogleSheetsOpen(false);
        setIsSearchOpen(false);
        setIsAddStudentOpen(false);
        setIsAddPaymentOpen(false);
        setIsParentMessageOpen(false);
        setIsAddNoteOpen(false);
        setIsCopilotOpen(false);
        setPrintWorksheetId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for switching tabs & views
  const handleTabChange = (tab: NavTab) => {
    setSelectedStudentId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAttendanceForClass = (classId: string) => {
    setAttendanceClassId(classId);
    setSelectedStudentId(null);
    setCurrentTab('attendance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPayment = (studentId?: string) => {
    setPaymentStudentId(studentId || null);
    setIsAddPaymentOpen(true);
  };

  const handleOpenParentMessage = (studentId: string) => {
    setParentMessageStudentId(studentId);
    setIsParentMessageOpen(true);
  };

  const handleOpenNote = (studentId?: string) => {
    setNoteStudentId(studentId || null);
    setIsAddNoteOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* V3 Global 4-Portal & Persona Switcher Banner */}
      <PortalSwitcher
        currentPortal={currentPortal}
        onPortalChange={setCurrentPortal}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* RENDER ACTIVE PORTAL */}

      {/* 1. STUDENT PORTAL */}
      {currentPortal === 'student' && (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
          <StudentPortal currentUser={currentUser} />
        </div>
      )}

      {/* 2. PARENT PORTAL */}
      {currentPortal === 'parent' && (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
          <ParentPortal currentUser={currentUser} />
        </div>
      )}

      {/* 3. PUBLIC ENROLLMENT PORTAL */}
      {currentPortal === 'public' && (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
          <PublicEnrollmentPortal onBackToTeacherPortal={() => setCurrentPortal('teacher')} />
        </div>
      )}

      {/* 4. TEACHER / ADMIN PORTAL */}
      {currentPortal === 'teacher' && (
        <div className="flex-1 flex min-h-0">
          {/* Desktop Responsive Left Sidebar */}
          <Sidebar currentTab={currentTab} onTabChange={handleTabChange} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Top Header */}
            <TopBar
              currentTab={currentTab}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
              onOpenAddPayment={() => handleOpenPayment()}
              onOpenAddStudent={() => setIsAddStudentOpen(true)}
              onSelectStudent={handleSelectStudent}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />

            {/* Dynamic View Content */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
              {selectedStudentId ? (
                <StudentProfileView
                  studentId={selectedStudentId}
                  onBack={() => setSelectedStudentId(null)}
                  onOpenPayment={handleOpenPayment}
                  onOpenParentMessage={handleOpenParentMessage}
                  onOpenNote={handleOpenNote}
                />
              ) : (
                <>
                  {currentTab === 'dashboard' && (
                    <DashboardView
                      onNavigateTab={handleTabChange}
                      onOpenAttendanceForClass={handleOpenAttendanceForClass}
                      onOpenPaymentForStudent={handleOpenPayment}
                      onOpenParentMessageForStudent={handleOpenParentMessage}
                      onSelectStudent={handleSelectStudent}
                    />
                  )}

                  {currentTab === 'students' && (
                    <StudentsView
                      onSelectStudent={handleSelectStudent}
                      onOpenAddStudent={() => setIsAddStudentOpen(true)}
                      onOpenPayment={handleOpenPayment}
                      onOpenParentMessage={handleOpenParentMessage}
                      onOpenNote={handleOpenNote}
                      onTakeAttendanceForStudent={(stId) => {
                        handleTabChange('attendance');
                      }}
                    />
                  )}

                  {currentTab === 'classes' && (
                    <ClassesView
                      onOpenAttendanceForClass={handleOpenAttendanceForClass}
                      onSelectStudent={handleSelectStudent}
                    />
                  )}

                  {currentTab === 'attendance' && (
                    <AttendanceView
                      initialClassId={attendanceClassId}
                      onOpenPaymentForStudent={handleOpenPayment}
                      onOpenParentMessageForStudent={handleOpenParentMessage}
                      onSelectStudent={handleSelectStudent}
                    />
                  )}

                  {currentTab === 'tuition' && (
                    <TuitionView
                      onOpenAddPayment={handleOpenPayment}
                      onOpenParentMessage={handleOpenParentMessage}
                      onSelectStudent={handleSelectStudent}
                    />
                  )}

                  {currentTab === 'academic' && (
                    <AcademicView onSelectStudent={handleSelectStudent} />
                  )}

                  {currentTab === 'ai-workspace' && (
                    <TeacherAIWorkspaceView
                      onSelectStudent={handleSelectStudent}
                      onOpenWorksheetPrint={(wsId) => setPrintWorksheetId(wsId)}
                    />
                  )}

                  {currentTab === 'adaptive' && (
                    <AdaptiveLearningView onSelectStudent={handleSelectStudent} />
                  )}

                  {currentTab === 'enrollment' && (
                    <EnrollmentView onSelectStudent={handleSelectStudent} />
                  )}

                  {currentTab === 'questions' && <QuestionBankView />}

                  {currentTab === 'centers' && <MultiCenterView />}

                  {currentTab === 'tasks' && <TaskManagementView />}

                  {currentTab === 'reports' && <ReportsView />}

                  {currentTab === 'settings' && <SettingsView />}
                </>
              )}
            </main>
          </div>

          {/* Floating Quick Action Button */}
          <QuickActionFAB
            onAddStudent={() => setIsAddStudentOpen(true)}
            onTakeAttendance={() => handleTabChange('attendance')}
            onAddPayment={() => handleOpenPayment()}
            onAddScore={() => handleTabChange('academic')}
            onAddNote={() => handleOpenNote()}
          />

          {/* Mobile Bottom Navigation */}
          <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        </div>
      )}

      {/* Modals */}
      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectStudent={handleSelectStudent}
          onSelectClass={handleOpenAttendanceForClass}
          onOpenPayment={handleOpenPayment}
          onOpenParentMessage={handleOpenParentMessage}
        />
      )}

      {isAddStudentOpen && (
        <AddStudentModal
          onClose={() => setIsAddStudentOpen(false)}
          onSuccess={(newId) => handleSelectStudent(newId)}
        />
      )}

      {isAddPaymentOpen && (
        <AddPaymentModal
          initialStudentId={paymentStudentId}
          onClose={() => setIsAddPaymentOpen(false)}
        />
      )}

      {isParentMessageOpen && (
        <ParentMessageModal
          studentId={parentMessageStudentId}
          onClose={() => setIsParentMessageOpen(false)}
          onOpenPayment={handleOpenPayment}
        />
      )}

      {isAddNoteOpen && (
        <AddNoteModal
          studentId={noteStudentId}
          onClose={() => setIsAddNoteOpen(false)}
        />
      )}

      {isCopilotOpen && (
        <AICopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          onSelectStudent={handleSelectStudent}
        />
      )}

      {isCommandPaletteOpen && (
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateTab={handleTabChange}
          onSelectStudent={handleSelectStudent}
          onOpenPayment={handleOpenPayment}
          onOpenAddStudent={() => setIsAddStudentOpen(true)}
          onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        />
      )}

      {printWorksheetId && (
        <WorksheetPrintModal
          worksheetId={printWorksheetId}
          onClose={() => setPrintWorksheetId(null)}
        />
      )}

      {isGoogleSheetsOpen && (
        <GoogleSheetsSyncModal
          isOpen={isGoogleSheetsOpen}
          onClose={() => setIsGoogleSheetsOpen(false)}
        />
      )}

      {/* Global Realtime Live Sync Notifications */}
      <RealtimeToastContainer />
    </div>
  );
}
