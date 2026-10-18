import {
  ActivityLog,
  AnnouncementItem,
  AppSettings,
  AttendanceRecord,
  AttendanceStatus,
  AutomationRuleItem,
  ClassItem,
  ClassSession,
  HomeworkItem,
  HomeworkResultItem,
  LeadItem,
  LeadStage,
  NotificationItem,
  OnlineTestItem,
  Payment,
  PaymentMethod,
  QuestionBankItem,
  ResourceItem,
  ScoreItem,
  Student,
  StudentLearningProfile,
  StudentNote,
  StudentStatus,
  StudentTuitionSummary,
  TestAttemptItem,
  TestItem,
  TopicMastery,
  TrialLessonItem,
  TuitionPackage,
  UserProfile,
  // V4 types
  AIQuestionDraft,
  AnalyticsEvent,
  AuditLogRecord,
  AutomationWorkflow,
  Center,
  Classroom,
  DailyPracticeQuestion,
  DifficultyLevel,
  ErrorCategory,
  KnowledgeTopic,
  PersonalLearningPath,
  QuestionType,
  StudentErrorRecord,
  StudentTopicMastery,
  TaskItem,
  TeacherProfile,
  Tenant,
  TestBlueprint,
  TestVariant,
  WorksheetItem,
} from '../types';
import { formatVND, getLessonAlertLevel } from '../utils/formatters';
import {
  DEFAULT_SETTINGS,
  INITIAL_ACTIVITIES,
  INITIAL_ATTENDANCE,
  INITIAL_CLASSES,
  INITIAL_HOMEWORK,
  INITIAL_HOMEWORK_RESULTS,
  INITIAL_NOTES,
  INITIAL_PACKAGES,
  INITIAL_PAYMENTS,
  INITIAL_SCORES,
  INITIAL_SESSIONS,
  INITIAL_STUDENTS,
  INITIAL_TESTS,
} from './seedData';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUTOMATION_RULES,
  INITIAL_LEADS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ONLINE_TESTS,
  INITIAL_QUESTIONS,
  INITIAL_RESOURCES,
  INITIAL_TEST_ATTEMPTS,
  INITIAL_TRIALS,
  INITIAL_USERS,
} from './seedDataV3';
import {
  INITIAL_AI_QUESTION_DRAFTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATION_WORKFLOWS,
  INITIAL_CENTERS,
  INITIAL_KNOWLEDGE_TOPICS,
  INITIAL_STUDENT_ERRORS,
  INITIAL_STUDENT_MASTERIES,
  INITIAL_TASKS,
  INITIAL_TEACHERS,
  INITIAL_TENANT,
  INITIAL_WORKSHEETS,
} from './seedDataV4';
import { realtimeService, RealtimeEvent } from './realtimeService';

const STORAGE_KEYS = {
  SETTINGS: 'qclass_settings_v1',
  STUDENTS: 'qclass_students_v1',
  CLASSES: 'qclass_classes_v1',
  PACKAGES: 'qclass_packages_v1',
  PAYMENTS: 'qclass_payments_v1',
  ATTENDANCE: 'qclass_attendance_v1',
  SESSIONS: 'qclass_sessions_v1',
  TESTS: 'qclass_tests_v1',
  SCORES: 'qclass_scores_v1',
  HOMEWORK: 'qclass_homework_v1',
  HOMEWORK_RESULTS: 'qclass_hw_results_v1',
  NOTES: 'qclass_notes_v1',
  ACTIVITIES: 'qclass_activities_v1',
  // V3 keys
  USERS: 'qclass_users_v3',
  CURRENT_USER: 'qclass_current_user_v3',
  QUESTIONS: 'qclass_questions_v3',
  ONLINE_TESTS: 'qclass_online_tests_v3',
  TEST_ATTEMPTS: 'qclass_test_attempts_v3',
  LEADS: 'qclass_leads_v3',
  TRIALS: 'qclass_trials_v3',
  RESOURCES: 'qclass_resources_v3',
  ANNOUNCEMENTS: 'qclass_announcements_v3',
  NOTIFICATIONS: 'qclass_notifications_v3',
  AUTOMATION: 'qclass_automation_v3',
  // V4 keys
  TENANT: 'qclass_tenant_v4',
  CENTERS: 'qclass_centers_v4',
  TEACHERS: 'qclass_teachers_v4',
  TOPICS: 'qclass_topics_v4',
  MASTERIES: 'qclass_masteries_v4',
  ERRORS: 'qclass_errors_v4',
  DRAFTS: 'qclass_drafts_v4',
  WORKSHEETS: 'qclass_worksheets_v4',
  WORKFLOWS: 'qclass_workflows_v4',
  TASKS: 'qclass_tasks_v4',
  AUDIT: 'qclass_audit_v4',
};

class DatabaseService {
  private settings: AppSettings = DEFAULT_SETTINGS;
  private students: Student[] = [];
  private classes: ClassItem[] = [];
  private packages: TuitionPackage[] = [];
  private payments: Payment[] = [];
  private attendance: AttendanceRecord[] = [];
  private sessions: ClassSession[] = [];
  private tests: TestItem[] = [];
  private scores: ScoreItem[] = [];
  private homework: HomeworkItem[] = [];
  private homeworkResults: HomeworkResultItem[] = [];
  private notes: StudentNote[] = [];
  private activities: ActivityLog[] = [];

  // V3 state
  private users: UserProfile[] = [];
  private currentUser: UserProfile = INITIAL_USERS[0];
  private questions: QuestionBankItem[] = [];
  private onlineTests: OnlineTestItem[] = [];
  private testAttempts: TestAttemptItem[] = [];
  private leads: LeadItem[] = [];
  private trials: TrialLessonItem[] = [];
  private resources: ResourceItem[] = [];
  private announcements: AnnouncementItem[] = [];
  private notifications: NotificationItem[] = [];
  private automationRules: AutomationRuleItem[] = [];

  // V4 state
  private tenant: Tenant = INITIAL_TENANT;
  private centers: Center[] = [];
  private teachers: TeacherProfile[] = [];
  private knowledgeTopics: KnowledgeTopic[] = [];
  private studentMasteries: StudentTopicMastery[] = [];
  private studentErrors: StudentErrorRecord[] = [];
  private aiQuestionDrafts: AIQuestionDraft[] = [];
  private worksheets: WorksheetItem[] = [];
  private automationWorkflows: AutomationWorkflow[] = [];
  private tasks: TaskItem[] = [];
  private auditLogs: AuditLogRecord[] = [];

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      realtimeService.connect(this.currentUser?.name, this.currentUser?.role);
      realtimeService.onRemoteState((incomingState) => {
        this.applyRemoteState(incomingState);
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private loadFromStorage() {
    try {
      const getStored = <T>(key: string, fallback: T): T => {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        try {
          return JSON.parse(item) as T;
        } catch {
          return fallback;
        }
      };

      this.settings = getStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      this.students = getStored(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      this.classes = getStored(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      this.packages = getStored(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
      this.payments = getStored(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
      this.attendance = getStored(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
      this.sessions = getStored(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      this.tests = getStored(STORAGE_KEYS.TESTS, INITIAL_TESTS);
      this.scores = getStored(STORAGE_KEYS.SCORES, INITIAL_SCORES);
      this.homework = getStored(STORAGE_KEYS.HOMEWORK, INITIAL_HOMEWORK);
      this.homeworkResults = getStored(STORAGE_KEYS.HOMEWORK_RESULTS, INITIAL_HOMEWORK_RESULTS);
      this.notes = getStored(STORAGE_KEYS.NOTES, INITIAL_NOTES);
      this.activities = getStored(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);

      // V3 storage load
      this.users = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.currentUser = getStored(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
      this.questions = getStored(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
      this.onlineTests = getStored(STORAGE_KEYS.ONLINE_TESTS, INITIAL_ONLINE_TESTS);
      this.testAttempts = getStored(STORAGE_KEYS.TEST_ATTEMPTS, INITIAL_TEST_ATTEMPTS);
      this.leads = getStored(STORAGE_KEYS.LEADS, INITIAL_LEADS);
      this.trials = getStored(STORAGE_KEYS.TRIALS, INITIAL_TRIALS);
      this.resources = getStored(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
      this.announcements = getStored(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
      this.notifications = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      this.automationRules = getStored(STORAGE_KEYS.AUTOMATION, INITIAL_AUTOMATION_RULES);

      // V4 storage load
      this.tenant = getStored(STORAGE_KEYS.TENANT, INITIAL_TENANT);
      this.centers = getStored(STORAGE_KEYS.CENTERS, INITIAL_CENTERS);
      this.teachers = getStored(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
      this.knowledgeTopics = getStored(STORAGE_KEYS.TOPICS, INITIAL_KNOWLEDGE_TOPICS);
      this.studentMasteries = getStored(STORAGE_KEYS.MASTERIES, INITIAL_STUDENT_MASTERIES);
      this.studentErrors = getStored(STORAGE_KEYS.ERRORS, INITIAL_STUDENT_ERRORS);
      this.aiQuestionDrafts = getStored(STORAGE_KEYS.DRAFTS, INITIAL_AI_QUESTION_DRAFTS);
      this.worksheets = getStored(STORAGE_KEYS.WORKSHEETS, INITIAL_WORKSHEETS);
      this.automationWorkflows = getStored(STORAGE_KEYS.WORKFLOWS, INITIAL_AUTOMATION_WORKFLOWS);
      this.tasks = getStored(STORAGE_KEYS.TASKS, INITIAL_TASKS);
      this.auditLogs = getStored(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);

      // Automatic sync / migration for Admin / Teacher profile: Thầy Nguyễn Văn Sang, dạy Toán, sdt 0386493786
      let shouldResave = false;
      if (
        !this.settings.teacherName ||
        this.settings.teacherName.includes('Quang') ||
        this.settings.teacherPhone === '0912 345 678' ||
        !this.settings.teacherSubject
      ) {
        this.settings.teacherName = 'Thầy Nguyễn Văn Sang';
        this.settings.teacherSubject = 'Toán học';
        this.settings.teacherPhone = '0386493786';
        if (!this.settings.teacherBankAccount || this.settings.teacherBankAccount === '0912345678999') {
          this.settings.teacherBankAccount = '0386493786';
        }
        if (this.settings.teacherBankHolder === 'NGUYEN DUC QUANG') {
          this.settings.teacherBankHolder = 'NGUYEN VAN SANG';
        }
        shouldResave = true;
      }

      // Update admin user
      const adminUser = this.users.find((u) => u.id === 'user-admin' || u.role === 'admin');
      if (adminUser && (adminUser.name.includes('Quang') || adminUser.phone === '0912 345 678')) {
        adminUser.name = 'Thầy Nguyễn Văn Sang';
        adminUser.phone = '0386493786';
        adminUser.avatar = 'NS';
        shouldResave = true;
      }
      if (this.currentUser && (this.currentUser.id === 'user-admin' || this.currentUser.name.includes('Quang'))) {
        this.currentUser.name = 'Thầy Nguyễn Văn Sang';
        this.currentUser.phone = '0386493786';
        this.currentUser.avatar = 'NS';
        shouldResave = true;
      }

      // Update lead teacher
      const leadTeacher = this.teachers.find((t) => t.id === 'tc-1' || t.role === 'lead');
      if (leadTeacher && (leadTeacher.name.includes('Quang') || leadTeacher.phone === '0912 345 678')) {
        leadTeacher.name = 'Thầy Nguyễn Văn Sang';
        leadTeacher.phone = '0386493786';
        leadTeacher.email = 'sang.math@qclass.edu.vn';
        leadTeacher.avatar = 'NS';
        shouldResave = true;
      }

      // Update center 1
      const center1 = this.centers.find((c) => c.id === 'center-1');
      if (center1 && center1.managerName && center1.managerName.includes('Quang')) {
        center1.managerName = 'Thầy Nguyễn Văn Sang';
        center1.phone = '0386493786';
        shouldResave = true;
      }

      if (shouldResave) {
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Storage read failed, using initial dataset', e);
      this.resetToDefault();
    }
  }

  public exportFullStateObject() {
    return {
      settings: this.settings,
      students: this.students,
      classes: this.classes,
      packages: this.packages,
      payments: this.payments,
      attendance: this.attendance,
      sessions: this.sessions,
      tests: this.tests,
      scores: this.scores,
      homework: this.homework,
      homeworkResults: this.homeworkResults,
      notes: this.notes,
      activities: this.activities,
      users: this.users,
      questions: this.questions,
      onlineTests: this.onlineTests,
      testAttempts: this.testAttempts,
      leads: this.leads,
      trials: this.trials,
      resources: this.resources,
      announcements: this.announcements,
      notifications: this.notifications,
      automationRules: this.automationRules,
      tenant: this.tenant,
      centers: this.centers,
      teachers: this.teachers,
      knowledgeTopics: this.knowledgeTopics,
      studentMasteries: this.studentMasteries,
      studentErrors: this.studentErrors,
      aiQuestionDrafts: this.aiQuestionDrafts,
      worksheets: this.worksheets,
      automationWorkflows: this.automationWorkflows,
      tasks: this.tasks,
      auditLogs: this.auditLogs,
    };
  }

  public applyRemoteState(incomingState: any) {
    if (!incomingState || typeof incomingState !== 'object') return;
    try {
      if (Array.isArray(incomingState.students)) this.students = incomingState.students;
      if (Array.isArray(incomingState.classes)) this.classes = incomingState.classes;
      if (Array.isArray(incomingState.packages)) this.packages = incomingState.packages;
      if (Array.isArray(incomingState.payments)) this.payments = incomingState.payments;
      if (Array.isArray(incomingState.attendance)) this.attendance = incomingState.attendance;
      if (Array.isArray(incomingState.sessions)) this.sessions = incomingState.sessions;
      if (Array.isArray(incomingState.tests)) this.tests = incomingState.tests;
      if (Array.isArray(incomingState.scores)) this.scores = incomingState.scores;
      if (Array.isArray(incomingState.homework)) this.homework = incomingState.homework;
      if (Array.isArray(incomingState.homeworkResults)) this.homeworkResults = incomingState.homeworkResults;
      if (Array.isArray(incomingState.notes)) this.notes = incomingState.notes;
      if (Array.isArray(incomingState.activities)) this.activities = incomingState.activities;
      if (Array.isArray(incomingState.users)) this.users = incomingState.users;
      if (Array.isArray(incomingState.questions)) this.questions = incomingState.questions;
      if (Array.isArray(incomingState.onlineTests)) this.onlineTests = incomingState.onlineTests;
      if (Array.isArray(incomingState.testAttempts)) this.testAttempts = incomingState.testAttempts;
      if (Array.isArray(incomingState.leads)) this.leads = incomingState.leads;
      if (Array.isArray(incomingState.trials)) this.trials = incomingState.trials;
      if (Array.isArray(incomingState.resources)) this.resources = incomingState.resources;
      if (Array.isArray(incomingState.announcements)) this.announcements = incomingState.announcements;
      if (Array.isArray(incomingState.notifications)) this.notifications = incomingState.notifications;
      if (Array.isArray(incomingState.automationRules)) this.automationRules = incomingState.automationRules;
      if (incomingState.settings && typeof incomingState.settings === 'object') this.settings = incomingState.settings;
      if (incomingState.tenant && typeof incomingState.tenant === 'object') this.tenant = incomingState.tenant;
      if (Array.isArray(incomingState.centers)) this.centers = incomingState.centers;
      if (Array.isArray(incomingState.teachers)) this.teachers = incomingState.teachers;
      if (Array.isArray(incomingState.knowledgeTopics)) this.knowledgeTopics = incomingState.knowledgeTopics;
      if (Array.isArray(incomingState.studentMasteries)) this.studentMasteries = incomingState.studentMasteries;
      if (Array.isArray(incomingState.studentErrors)) this.studentErrors = incomingState.studentErrors;
      if (Array.isArray(incomingState.aiQuestionDrafts)) this.aiQuestionDrafts = incomingState.aiQuestionDrafts;
      if (Array.isArray(incomingState.worksheets)) this.worksheets = incomingState.worksheets;
      if (Array.isArray(incomingState.automationWorkflows)) this.automationWorkflows = incomingState.automationWorkflows;
      if (Array.isArray(incomingState.tasks)) this.tasks = incomingState.tasks;
      if (Array.isArray(incomingState.auditLogs)) this.auditLogs = incomingState.auditLogs;

      // Persist to local storage quietly without re-broadcasting
      this.saveToStorage(true);
    } catch (e) {
      console.error('[db] Error applying remote state:', e);
    }
  }

  public saveToStorage(skipBroadcast: boolean = false, event?: RealtimeEvent) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(this.classes));
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(this.payments));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendance));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(this.tests));
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(this.scores));
      localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(this.homework));
      localStorage.setItem(STORAGE_KEYS.HOMEWORK_RESULTS, JSON.stringify(this.homeworkResults));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.activities));

      // V3 storage save
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(this.questions));
      localStorage.setItem(STORAGE_KEYS.ONLINE_TESTS, JSON.stringify(this.onlineTests));
      localStorage.setItem(STORAGE_KEYS.TEST_ATTEMPTS, JSON.stringify(this.testAttempts));
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(this.leads));
      localStorage.setItem(STORAGE_KEYS.TRIALS, JSON.stringify(this.trials));
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(this.resources));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcements));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.AUTOMATION, JSON.stringify(this.automationRules));

      // V4 storage save
      localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(this.tenant));
      localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(this.centers));
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(this.teachers));
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(this.knowledgeTopics));
      localStorage.setItem(STORAGE_KEYS.MASTERIES, JSON.stringify(this.studentMasteries));
      localStorage.setItem(STORAGE_KEYS.ERRORS, JSON.stringify(this.studentErrors));
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(this.aiQuestionDrafts));
      localStorage.setItem(STORAGE_KEYS.WORKSHEETS, JSON.stringify(this.worksheets));
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(this.automationWorkflows));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.error('Storage write error', e);
    }
    this.notify();

    if (!skipBroadcast && typeof window !== 'undefined') {
      realtimeService.broadcastLocalChange(this.exportFullStateObject(), event);
    }
  }

  public resetToDefault() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.students = [...INITIAL_STUDENTS];
    this.classes = [...INITIAL_CLASSES];
    this.packages = [...INITIAL_PACKAGES];
    this.payments = [...INITIAL_PAYMENTS];
    this.attendance = [...INITIAL_ATTENDANCE];
    this.sessions = [...INITIAL_SESSIONS];
    this.tests = [...INITIAL_TESTS];
    this.scores = [...INITIAL_SCORES];
    this.homework = [...INITIAL_HOMEWORK];
    this.homeworkResults = [...INITIAL_HOMEWORK_RESULTS];
    this.notes = [...INITIAL_NOTES];
    this.activities = [...INITIAL_ACTIVITIES];

    // V3 resets
    this.users = [...INITIAL_USERS];
    this.currentUser = INITIAL_USERS[0];
    this.questions = [...INITIAL_QUESTIONS];
    this.onlineTests = [...INITIAL_ONLINE_TESTS];
    this.testAttempts = [...INITIAL_TEST_ATTEMPTS];
    this.leads = [...INITIAL_LEADS];
    this.trials = [...INITIAL_TRIALS];
    this.resources = [...INITIAL_RESOURCES];
    this.announcements = [...INITIAL_ANNOUNCEMENTS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.automationRules = [...INITIAL_AUTOMATION_RULES];

    // V4 resets
    this.tenant = { ...INITIAL_TENANT };
    this.centers = [...INITIAL_CENTERS];
    this.teachers = [...INITIAL_TEACHERS];
    this.knowledgeTopics = [...INITIAL_KNOWLEDGE_TOPICS];
    this.studentMasteries = [...INITIAL_STUDENT_MASTERIES];
    this.studentErrors = [...INITIAL_STUDENT_ERRORS];
    this.aiQuestionDrafts = [...INITIAL_AI_QUESTION_DRAFTS];
    this.worksheets = [...INITIAL_WORKSHEETS];
    this.automationWorkflows = [...INITIAL_AUTOMATION_WORKFLOWS];
    this.tasks = [...INITIAL_TASKS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];

    this.saveToStorage();
  }

  // --- V3 USER PROFILE & ROLE ENGINE ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    this.saveToStorage();
  }

  public getAllUsers(): UserProfile[] {
    return [...this.users];
  }

  // --- GETTERS ---
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
  }

  public getStudents(): Student[] {
    return [...this.students];
  }

  public getClasses(): ClassItem[] {
    return [...this.classes];
  }

  public getPackages(): TuitionPackage[] {
    return [...this.packages];
  }

  public getPayments(): Payment[] {
    return [...this.payments];
  }

  public getAttendance(): AttendanceRecord[] {
    return [...this.attendance];
  }

  public getSessions(): ClassSession[] {
    return [...this.sessions];
  }

  public getTests(): TestItem[] {
    return [...this.tests];
  }

  public getScores(): ScoreItem[] {
    return [...this.scores];
  }

  public getHomework(): HomeworkItem[] {
    return [...this.homework];
  }

  public getHomeworkResults(): HomeworkResultItem[] {
    return [...this.homeworkResults];
  }

  public getNotes(): StudentNote[] {
    return [...this.notes];
  }

  public getActivities(): ActivityLog[] {
    return [...this.activities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // --- V3 GETTERS ---
  public getQuestionBank(): QuestionBankItem[] {
    return [...this.questions];
  }

  public getOnlineTests(): OnlineTestItem[] {
    return [...this.onlineTests];
  }

  public getTestAttempts(): TestAttemptItem[] {
    return [...this.testAttempts];
  }

  public getLeads(): LeadItem[] {
    return [...this.leads];
  }

  public getTrials(): TrialLessonItem[] {
    return [...this.trials];
  }

  public getResources(): ResourceItem[] {
    return [...this.resources];
  }

  public getAnnouncements(): AnnouncementItem[] {
    return [...this.announcements];
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public getAutomationRules(): AutomationRuleItem[] {
    return [...this.automationRules];
  }

  // --- REPUTABLE TUITION CALCULATIONS ---
  public getStudentTuitionSummary(studentId: string): StudentTuitionSummary | null {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return null;

    const studentPackages = this.packages.filter((p) => p.studentId === studentId);
    const studentPayments = this.payments.filter((p) => p.studentId === studentId);

    const totalLessonsPurchased = studentPackages.reduce((acc, p) => acc + p.totalLessons, 0);
    const totalLessonsUsed = studentPackages.reduce((acc, p) => acc + p.usedLessons, 0);
    const remainingLessons = studentPackages
      .filter((p) => p.status === 'active')
      .reduce((acc, p) => acc + p.remainingLessons, 0);

    const totalAmountPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);

    const sortedPayments = [...studentPayments].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
    const lastPaymentDate = sortedPayments[0]?.paymentDate;

    const activePackage = studentPackages.find((p) => p.status === 'active');
    const alertLevel = getLessonAlertLevel(remainingLessons);

    return {
      student,
      activePackage,
      totalLessonsPurchased,
      totalLessonsUsed,
      remainingLessons,
      totalAmountPaid,
      lastPaymentDate,
      alertLevel,
    };
  }

  public getAllTuitionSummaries(): StudentTuitionSummary[] {
    return this.students
      .map((s) => this.getStudentTuitionSummary(s.id))
      .filter((item): item is StudentTuitionSummary => item !== null);
  }

  // --- STUDENT OPERATIONS ---
  public addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>, initialPackageLessons?: number): Student {
    const id = `std-${Date.now()}`;
    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.students.unshift(newStudent);

    // Also add to users table for student and parent portal access
    this.users.push({
      id: `user-${id}`,
      name: newStudent.fullName,
      role: 'student',
      studentId: id,
      phone: newStudent.studentPhone,
      avatar: newStudent.fullName.slice(0, 2).toUpperCase(),
    });

    if (newStudent.parentPhone) {
      this.users.push({
        id: `user-parent-${id}`,
        name: `${newStudent.parentName} (PH ${newStudent.fullName})`,
        role: 'parent',
        studentIds: [id],
        phone: newStudent.parentPhone,
        avatar: 'PH',
      });
    }

    if (initialPackageLessons && initialPackageLessons > 0) {
      const amount = initialPackageLessons * newStudent.defaultTuitionRate;
      this.addPayment({
        studentId: id,
        lessonQuantity: initialPackageLessons,
        pricePerLesson: newStudent.defaultTuitionRate,
        amount,
        paymentDate: now.split('T')[0],
        paymentMethod: 'transfer',
        note: `Gói học phí ban đầu khi nhập học (${initialPackageLessons} buổi)`,
      });
    }

    this.logActivity({
      type: 'student',
      title: `Thêm học sinh: ${newStudent.fullName}`,
      description: `Đã thêm học sinh khối ${newStudent.grade} (${newStudent.school}) vào hệ thống.`,
      studentId: id,
    });

    this.saveToStorage(false, {
      id: `evt-std-${id}`,
      type: 'student',
      title: 'Học sinh mới nhập học',
      description: `${newStudent.fullName} · Khối ${newStudent.grade} (${newStudent.school})`,
      timestamp: now,
      badge: `Khối ${newStudent.grade}`,
    });
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) return null;

    this.students[index] = {
      ...this.students[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.students[index];
  }

  public setStudentStatus(id: string, status: StudentStatus) {
    const student = this.students.find((s) => s.id === id);
    if (student) {
      student.status = status;
      student.updatedAt = new Date().toISOString();
      this.logActivity({
        type: 'student',
        title: `Cập nhật trạng thái: ${student.fullName}`,
        description: `Trạng thái học sinh đã chuyển sang: ${
          status === 'active' ? 'Đang học' : status === 'paused' ? 'Tạm dừng' : 'Thôi học'
        }.`,
        studentId: id,
      });
      this.saveToStorage();
    }
  }

  // --- CLASS OPERATIONS ---
  public addClass(classData: Omit<ClassItem, 'id' | 'createdAt'>): ClassItem {
    const id = `class-${Date.now()}`;
    const newClass: ClassItem = {
      ...classData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.classes.push(newClass);

    this.logActivity({
      type: 'class',
      title: `Tạo lớp mới: ${newClass.name}`,
      description: `Lớp ${newClass.subject} khối ${newClass.grade} đã được tạo thành công.`,
      classId: id,
    });

    this.saveToStorage();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<ClassItem>): ClassItem | null {
    const index = this.classes.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.classes[index] = {
      ...this.classes[index],
      ...updates,
    };
    this.saveToStorage();
    return this.classes[index];
  }

  public assignStudentToClass(classId: string, studentId: string) {
    const c = this.classes.find((item) => item.id === classId);
    if (c && !c.studentIds.includes(studentId)) {
      c.studentIds.push(studentId);
      this.saveToStorage();
    }
  }

  public removeStudentFromClass(classId: string, studentId: string) {
    const c = this.classes.find((item) => item.id === classId);
    if (c) {
      c.studentIds = c.studentIds.filter((id) => id !== studentId);
      this.saveToStorage();
    }
  }

  // --- ATTENDANCE & DEDUCTION ENGINE ---
  public recordAttendanceSession(params: {
    classId: string;
    date: string;
    sessionTitle: string;
    studentAttendances: Array<{
      studentId: string;
      status: AttendanceStatus;
      note?: string;
    }>;
  }): { sessionId: string; deductionsApplied: number } {
    const { classId, date, sessionTitle, studentAttendances } = params;
    const rules = this.settings.deductionRules;
    const now = new Date().toISOString();

    let session = this.sessions.find((s) => s.classId === classId && s.date === date);
    if (!session) {
      session = {
        id: `sess-${Date.now()}`,
        classId,
        date,
        title: sessionTitle || `Buổi học ngày ${date}`,
        attendanceCount: { present: 0, excused: 0, unexcused: 0, makeup: 0 },
        totalStudents: studentAttendances.length,
        createdAt: now,
      };
      this.sessions.unshift(session);
    } else {
      session.title = sessionTitle || session.title;
    }

    let deductionsApplied = 0;
    const counts = { present: 0, excused: 0, unexcused: 0, makeup: 0 };

    for (const item of studentAttendances) {
      counts[item.status]++;

      let shouldDeduct = false;
      if (item.status === 'present' && rules.present) shouldDeduct = true;
      if (item.status === 'excused' && rules.excused) shouldDeduct = true;
      if (item.status === 'unexcused' && rules.unexcused) shouldDeduct = true;
      if (item.status === 'makeup' && rules.makeup) shouldDeduct = true;

      const existingRecordIndex = this.attendance.findIndex(
        (att) => att.studentId === item.studentId && att.classId === classId && att.date === date
      );

      if (existingRecordIndex !== -1) {
        const existingRecord = this.attendance[existingRecordIndex];
        const wasDeducted = existingRecord.lessonDeducted;

        if (wasDeducted && !shouldDeduct) {
          this.adjustStudentLessonBalance(item.studentId, +1);
        } else if (!wasDeducted && shouldDeduct) {
          this.adjustStudentLessonBalance(item.studentId, -1);
          deductionsApplied++;
        }

        this.attendance[existingRecordIndex] = {
          ...existingRecord,
          status: item.status,
          lessonDeducted: shouldDeduct,
          note: item.note ?? existingRecord.note,
          updatedAt: now,
        };
      } else {
        if (shouldDeduct) {
          this.adjustStudentLessonBalance(item.studentId, -1);
          deductionsApplied++;
        }

        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${item.studentId}`,
          studentId: item.studentId,
          classId,
          sessionId: session.id,
          sessionTitle: session.title,
          date,
          status: item.status,
          lessonDeducted: shouldDeduct,
          note: item.note,
          createdAt: now,
          updatedAt: now,
        };
        this.attendance.unshift(newRecord);
      }
    }

    session.attendanceCount = counts;
    session.totalStudents = studentAttendances.length;

    const classItem = this.classes.find((c) => c.id === classId);
    this.logActivity({
      type: 'attendance',
      title: `Điểm danh: ${classItem?.name || 'Lớp học'}`,
      description: `${session.title} (${counts.present} có mặt, ${counts.excused} có phép, ${counts.unexcused} không phép). ${deductionsApplied} buổi học phí đã trừ.`,
      classId,
    });

    this.saveToStorage(false, {
      id: `evt-att-${session.id}`,
      type: 'attendance',
      title: 'Điểm danh buổi học',
      description: `${classItem?.name || 'Lớp'}: ${counts.present} có mặt, trừ ${deductionsApplied} buổi học phí`,
      timestamp: now,
      badge: `${counts.present}/${studentAttendances.length} có mặt`,
    });
    return { sessionId: session.id, deductionsApplied };
  }

  private adjustStudentLessonBalance(studentId: string, delta: number) {
    if (delta === 0) return;

    if (delta < 0) {
      let activePackage = this.packages.find(
        (p) => p.studentId === studentId && p.status === 'active' && p.remainingLessons > 0
      );

      if (!activePackage) {
        activePackage = this.packages.find((p) => p.studentId === studentId && p.status === 'active');
      }

      if (!activePackage) {
        const latestPkg = this.packages
          .filter((p) => p.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (latestPkg) {
          activePackage = latestPkg;
        } else {
          const studentRate = this.students.find((s) => s.id === studentId)?.defaultTuitionRate || this.settings.defaultTuitionRate || 60000;
          const overdraftPkg: TuitionPackage = {
            id: `pkg-overdraft-${Date.now()}-${studentId}`,
            studentId,
            totalLessons: 0,
            usedLessons: 0,
            remainingLessons: 0,
            pricePerLesson: studentRate,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
            note: 'Gói tự động ghi nhận buổi học trước khi hoàn tất đóng học phí',
            createdAt: new Date().toISOString(),
          };
          this.packages.unshift(overdraftPkg);
          activePackage = overdraftPkg;
        }
      }

      if (activePackage) {
        activePackage.usedLessons = activePackage.usedLessons + 1;
        activePackage.remainingLessons = Math.max(0, activePackage.remainingLessons - 1);

        if (activePackage.remainingLessons === 0) {
          const nextPkg = this.packages.find(
            (p) => p.studentId === studentId && p.id !== activePackage!.id && p.remainingLessons > 0
          );
          if (nextPkg) {
            activePackage.status = 'completed';
            nextPkg.status = 'active';
          }
        }
      }
    } else {
      const candidatePackage = this.packages
        .filter((p) => p.studentId === studentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (candidatePackage) {
        candidatePackage.remainingLessons = Math.min(
          candidatePackage.totalLessons,
          candidatePackage.remainingLessons + 1
        );
        candidatePackage.usedLessons = Math.max(0, candidatePackage.usedLessons - 1);
        if (candidatePackage.remainingLessons > 0 && candidatePackage.status === 'completed') {
          candidatePackage.status = 'active';
        }
      }
    }
  }

  // --- TUITION & PAYMENT ENGINE ---
  public addPayment(params: {
    studentId: string;
    lessonQuantity: number;
    pricePerLesson: number;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }): { payment: Payment; pkg: TuitionPackage } {
    const { studentId, lessonQuantity, pricePerLesson, amount, paymentDate, paymentMethod, note } = params;
    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const packageId = `pkg-${Date.now()}`;

    const currentPackages = this.packages.filter((p) => p.studentId === studentId);
    currentPackages.forEach((p) => {
      if (p.remainingLessons === 0) {
        p.status = 'completed';
      }
    });

    const newPackage: TuitionPackage = {
      id: packageId,
      studentId,
      paymentId,
      totalLessons: lessonQuantity,
      usedLessons: 0,
      remainingLessons: lessonQuantity,
      pricePerLesson,
      startDate: paymentDate,
      status: 'active',
      note,
      createdAt: now,
    };

    const newPayment: Payment = {
      id: paymentId,
      studentId,
      packageId,
      amount,
      lessonQuantity,
      pricePerLesson,
      paymentMethod,
      paymentDate,
      receiptNumber: `HP-${paymentDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      note,
      status: 'confirmed',
      createdAt: now,
    };

    this.packages.unshift(newPackage);
    this.payments.unshift(newPayment);

    const student = this.students.find((s) => s.id === studentId);
    this.logActivity({
      type: 'payment',
      title: `Thu học phí: ${student?.fullName || 'Học sinh'}`,
      description: `Đã thu ${formatVND(amount)} (${lessonQuantity} buổi x ${formatVND(pricePerLesson)}). Phương thức: ${
        paymentMethod === 'transfer' ? 'Chuyển khoản' : paymentMethod === 'cash' ? 'Tiền mặt' : 'Khác'
      }.`,
      studentId,
    });

    this.saveToStorage(false, {
      id: `evt-pay-${paymentId}`,
      type: 'payment',
      title: 'Ghi nhận học phí thành công',
      description: `${student?.fullName || 'Học sinh'}: ${formatVND(amount)} (${lessonQuantity} buổi)`,
      timestamp: now,
      badge: `+${lessonQuantity} buổi`,
    });
    return { payment: newPayment, pkg: newPackage };
  }

  // --- ACADEMIC: TESTS & SCORES ---
  public addTest(testData: Omit<TestItem, 'id' | 'createdAt'>): TestItem {
    const id = `test-${Date.now()}`;
    const newTest: TestItem = {
      ...testData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.tests.unshift(newTest);
    this.saveToStorage();
    return newTest;
  }

  public saveScores(testId: string, scoreEntries: Array<{ studentId: string; score: number; notes?: string }>) {
    const now = new Date().toISOString();
    for (const entry of scoreEntries) {
      const existingIndex = this.scores.findIndex((s) => s.testId === testId && s.studentId === entry.studentId);
      if (existingIndex !== -1) {
        this.scores[existingIndex] = {
          ...this.scores[existingIndex],
          score: entry.score,
          notes: entry.notes,
        };
      } else {
        this.scores.unshift({
          id: `sc-${Date.now()}-${entry.studentId}`,
          testId,
          studentId: entry.studentId,
          score: entry.score,
          notes: entry.notes,
          createdAt: now,
        });
      }
    }

    const test = this.tests.find((t) => t.id === testId);
    this.logActivity({
      type: 'score',
      title: `Nhập điểm: ${test?.title || 'Bài kiểm tra'}`,
      description: `Đã cập nhật điểm cho ${scoreEntries.length} học sinh.`,
      classId: test?.classId,
    });

    this.saveToStorage();
  }

  // --- V3 QUESTION BANK CRUD ---
  public addQuestion(question: Omit<QuestionBankItem, 'id' | 'createdAt'>): QuestionBankItem {
    const id = `qb-${Date.now()}`;
    const newQ: QuestionBankItem = {
      ...question,
      id,
      createdAt: new Date().toISOString(),
    };
    this.questions.unshift(newQ);
    this.saveToStorage();
    return newQ;
  }

  public updateQuestion(id: string, updates: Partial<QuestionBankItem>): QuestionBankItem | null {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.questions[idx] = { ...this.questions[idx], ...updates };
    this.saveToStorage();
    return this.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    this.questions = this.questions.filter((q) => q.id !== id);
    this.saveToStorage();
    return true;
  }

  // --- V3 ONLINE TESTS & AUTO-GRADING ---
  public addOnlineTest(test: Omit<OnlineTestItem, 'id' | 'createdAt'>): OnlineTestItem {
    const id = `ontest-${Date.now()}`;
    const newT: OnlineTestItem = {
      ...test,
      id,
      createdAt: new Date().toISOString(),
    };
    this.onlineTests.unshift(newT);
    this.saveToStorage();
    return newT;
  }

  public submitTestAttempt(params: {
    testId: string;
    studentId: string;
    answers: Record<string, any>;
  }): TestAttemptItem {
    const { testId, studentId, answers } = params;
    const test = this.onlineTests.find((t) => t.id === testId);
    const now = new Date().toISOString();

    let calculatedScore = 0;
    const maxScore = test?.maxScore || 10;

    if (test && test.questions.length > 0) {
      test.questions.forEach((qRef) => {
        const q = this.questions.find((item) => item.id === qRef.questionId);
        if (!q) return;

        const studentAns = answers[q.id];
        let isCorrect = false;

        if (q.questionType === 'single_choice' || q.questionType === 'true_false') {
          const correctOpt = q.options?.find((o) => o.isCorrect);
          if (correctOpt && studentAns === correctOpt.id) {
            isCorrect = true;
          }
        } else if (q.questionType === 'numeric') {
          if (Number(studentAns) === Number(q.correctNumericAnswer)) {
            isCorrect = true;
          }
        } else if (q.questionType === 'short_answer') {
          if (
            q.correctShortAnswer &&
            String(studentAns).trim().toLowerCase() === q.correctShortAnswer.trim().toLowerCase()
          ) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          calculatedScore += qRef.points;
        }
      });
    }

    const attempt: TestAttemptItem = {
      id: `attm-${Date.now()}`,
      testId,
      studentId,
      startTime: now,
      submitTime: now,
      answers,
      score: Math.min(maxScore, Math.round(calculatedScore * 10) / 10),
      maxScore,
      status: 'graded',
      feedback: calculatedScore >= 8 ? 'Làm bài rất tốt!' : calculatedScore >= 5 ? 'Đạt yêu cầu.' : 'Cần ôn tập thêm.',
    };

    this.testAttempts.unshift(attempt);

    // Also add to score items for unified reporting
    this.scores.unshift({
      id: `sc-online-${attempt.id}`,
      testId,
      studentId,
      score: attempt.score ?? calculatedScore,
      notes: 'Khảo sát trực tuyến tự động chấm',
      createdAt: now,
    });

    this.logActivity({
      type: 'test',
      title: `Học sinh nộp bài thi: ${test?.title || 'Kiểm tra online'}`,
      description: `Đạt ${attempt.score}/${attempt.maxScore} điểm. Đã tự động chấm và lưu kết quả.`,
      studentId,
      classId: test?.classId,
    });

    this.saveToStorage(false, {
      id: `evt-test-${attempt.id}`,
      type: 'test',
      title: 'Học sinh nộp bài thi online',
      description: `${test?.title || 'Kiểm tra'}: Đạt ${attempt.score}/${attempt.maxScore} điểm`,
      timestamp: now,
      badge: `${attempt.score} điểm`,
    });
    return attempt;
  }

  // --- V3 ENROLLMENT CRM & LEADS ---
  public addLead(lead: Omit<LeadItem, 'id' | 'createdAt' | 'updatedAt'>): LeadItem {
    const id = `lead-${Date.now()}`;
    const now = new Date().toISOString();
    const newLead: LeadItem = {
      ...lead,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.leads.unshift(newLead);

    this.logActivity({
      type: 'lead',
      title: `Lead tuyển sinh mới: ${newLead.studentName}`,
      description: `Khối ${newLead.grade} · Nguồn: ${newLead.source} · PH: ${newLead.parentName} (${newLead.parentPhone})`,
    });

    this.saveToStorage(false, {
      id: `evt-lead-${newLead.id}`,
      type: 'lead',
      title: 'Đơn tuyển sinh mới từ website',
      description: `${newLead.studentName} (Khối ${newLead.grade}) · PH: ${newLead.parentPhone}`,
      timestamp: now,
      badge: `Khối ${newLead.grade}`,
    });
    return newLead;
  }

  public updateLeadStage(id: string, stage: LeadStage): LeadItem | null {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.leads[idx].stage = stage;
    this.leads[idx].updatedAt = new Date().toISOString();
    this.saveToStorage();
    return this.leads[idx];
  }

  /**
   * 1-Click Convert Lead to Student (Preserves contact history, notes, source, assigns class, creates initial package)
   */
  public convertLeadToStudent(leadId: string, classId: string, initialPackageLessons: number = 10): Student | null {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    lead.stage = 'enrolled';
    lead.updatedAt = new Date().toISOString();

    const targetClass = this.classes.find((c) => c.id === classId);
    const rate = targetClass?.defaultTuitionRate || this.settings.defaultTuitionRate || 60000;

    const newStudent = this.addStudent(
      {
        fullName: lead.studentName,
        grade: lead.grade,
        school: lead.school || 'Chưa cập nhật',
        parentName: lead.parentName,
        parentPhone: lead.parentPhone,
        enrollmentDate: new Date().toISOString().split('T')[0],
        defaultTuitionRate: rate,
        status: 'active',
        notes: `Chuyển đổi từ Tuyển sinh (Nguồn: ${lead.source}). Mục tiêu: ${lead.learningGoal || 'Bồi dưỡng môn Toán'}. Ghi chú: ${lead.notes || ''}`,
      },
      initialPackageLessons
    );

    if (classId) {
      this.assignStudentToClass(classId, newStudent.id);
    }

    this.logActivity({
      type: 'student',
      title: `Chuyển đổi tuyển sinh thành công: ${newStudent.fullName}`,
      description: `Đã xếp vào ${targetClass?.name || 'lớp học'} và mở gói ${initialPackageLessons} buổi.`,
      studentId: newStudent.id,
      classId,
    });

    this.saveToStorage();
    return newStudent;
  }

  // --- V3 TRIALS ---
  public addTrialLesson(trial: Omit<TrialLessonItem, 'id' | 'createdAt'>): TrialLessonItem {
    const id = `trial-${Date.now()}`;
    const newT: TrialLessonItem = {
      ...trial,
      id,
      createdAt: new Date().toISOString(),
    };
    this.trials.unshift(newT);
    this.saveToStorage();
    return newT;
  }

  public updateTrialLesson(id: string, updates: Partial<TrialLessonItem>): TrialLessonItem | null {
    const idx = this.trials.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.trials[idx] = { ...this.trials[idx], ...updates };
    this.saveToStorage();
    return this.trials[idx];
  }

  // --- V3 RESOURCES ---
  public addResource(resource: Omit<ResourceItem, 'id' | 'createdAt' | 'downloadCount'>): ResourceItem {
    const id = `res-${Date.now()}`;
    const newR: ResourceItem = {
      ...resource,
      id,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.resources.unshift(newR);
    this.saveToStorage();
    return newR;
  }

  public incrementResourceDownload(id: string) {
    const res = this.resources.find((r) => r.id === id);
    if (res) {
      res.downloadCount = (res.downloadCount || 0) + 1;
      this.saveToStorage();
    }
  }

  // --- V3 ANNOUNCEMENTS & NOTIFICATIONS ---
  public addAnnouncement(ann: Omit<AnnouncementItem, 'id' | 'createdAt'>): AnnouncementItem {
    const id = `ann-${Date.now()}`;
    const newA: AnnouncementItem = {
      ...ann,
      id,
      createdAt: new Date().toISOString(),
    };
    this.announcements.unshift(newA);
    this.saveToStorage();
    return newA;
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): NotificationItem {
    const id = `notif-${Date.now()}`;
    const newN: NotificationItem = {
      ...notif,
      id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newN);
    this.saveToStorage();
    return newN;
  }

  public markNotificationRead(id: string) {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      this.saveToStorage();
    }
  }

  // --- V3 AUTOMATION RULES ---
  public toggleAutomationRule(id: string): boolean {
    const rule = this.automationRules.find((r) => r.id === id);
    if (rule) {
      rule.isEnabled = !rule.isEnabled;
      this.saveToStorage();
      return rule.isEnabled;
    }
    return false;
  }

  // --- V3 LEARNING ANALYTICS & MASTERY ENGINE ---
  public getStudentLearningProfile(studentId: string): StudentLearningProfile {
    const student = this.students.find((s) => s.id === studentId);
    const studentAtt = this.attendance.filter((a) => a.studentId === studentId);
    const studentHw = this.homeworkResults.filter((h) => h.studentId === studentId);
    const studentScores = this.scores.filter((s) => s.studentId === studentId);

    // Attendance rate
    const present = studentAtt.filter((a) => a.status === 'present' || a.status === 'makeup').length;
    const attendanceRate = studentAtt.length > 0 ? Math.round((present / studentAtt.length) * 100) : 100;

    // Homework rate
    const completedHw = studentHw.filter((h) => h.status === 'completed').length;
    const homeworkRate = studentHw.length > 0 ? Math.round((completedHw / studentHw.length) * 100) : 100;

    // Average score
    const avgScore =
      studentScores.length > 0
        ? Math.round((studentScores.reduce((sum, s) => sum + s.score, 0) / studentScores.length) * 10) / 10
        : 8.0;

    // Predefined deterministic math topics based on grade
    const grade = student?.grade || 9;
    let topicDefs: Array<{ topic: string; baseMastery: number }> = [];

    if (grade === 8) {
      topicDefs = [
        { topic: 'Đại số: Hằng đẳng thức & Phân thức', baseMastery: Math.min(95, Math.round(avgScore * 9.5)) },
        { topic: 'Đại số: Phương trình bậc nhất', baseMastery: Math.min(92, Math.round(avgScore * 9.2)) },
        { topic: 'Hình học: Định lý Talet trong tam giác', baseMastery: Math.min(88, Math.round(avgScore * 8.6)) },
        { topic: 'Hình học: Tam giác đồng dạng', baseMastery: Math.min(85, Math.round(avgScore * 8.0)) },
      ];
    } else if (grade === 9) {
      topicDefs = [
        { topic: 'Căn thức bậc hai & Rút gọn biểu thức', baseMastery: Math.min(96, Math.round(avgScore * 9.8)) },
        { topic: 'Hệ phương trình bậc nhất hai ẩn', baseMastery: Math.min(92, Math.round(avgScore * 9.4)) },
        { topic: 'Hàm số bậc nhất & Đồ thị', baseMastery: Math.min(88, Math.round(avgScore * 8.9)) },
        { topic: 'Bất đẳng thức Cauchy & Cực trị', baseMastery: Math.min(82, Math.round(avgScore * 7.8)) },
        { topic: 'Hình học: Đường tròn & Góc nội tiếp', baseMastery: Math.min(86, Math.round(avgScore * 8.4)) },
      ];
    } else {
      topicDefs = [
        { topic: 'Mệnh đề & Tập hợp', baseMastery: Math.min(96, Math.round(avgScore * 9.6)) },
        { topic: 'Hàm số bậc hai & Tam thức bậc hai', baseMastery: Math.min(89, Math.round(avgScore * 9.0)) },
        { topic: 'Véctơ & Các phép toán', baseMastery: Math.min(84, Math.round(avgScore * 8.2)) },
        { topic: 'Tích vô hướng & Hệ tọa độ Oxy', baseMastery: Math.min(80, Math.round(avgScore * 7.9)) },
      ];
    }

    const topicMasteries: TopicMastery[] = topicDefs.map((def) => {
      const mastery = def.baseMastery;
      return {
        topic: def.topic,
        masteryPercent: mastery,
        testedQuestions: 15,
        correctQuestions: Math.round((mastery / 100) * 15),
        status: mastery >= 85 ? 'strong' : mastery >= 65 ? 'moderate' : 'weak',
      };
    });

    const strongTopics = topicMasteries.filter((t) => t.status === 'strong').map((t) => t.topic);
    const weakTopics = topicMasteries.filter((t) => t.status === 'weak' || t.status === 'moderate').map((t) => t.topic);

    // Rule-based recommendations
    const recommendations: string[] = [];
    if (weakTopics.length > 0) {
      recommendations.push(`Nên luyện thêm 5-10 bài tập củng cố chuyên đề: ${weakTopics[0]}`);
    }
    if (homeworkRate < 80) {
      recommendations.push('Cần hoàn thành đầy đủ bài tập về nhà để không bị hổng kiến thức biến đổi.');
    }
    if (attendanceRate < 90) {
      recommendations.push('Đăng ký 1 buổi học bù để kịp tiến độ với các bạn trong lớp.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Tiến độ học tập rất xuất sắc, duy trì giải các bài toán nâng cao 9+ thi chuyên.');
    }

    // Health Score calculation (0-100)
    const healthScore = Math.round(attendanceRate * 0.35 + homeworkRate * 0.35 + (avgScore / 10) * 100 * 0.3);

    return {
      studentId,
      attendanceRate,
      homeworkRate,
      averageScore: avgScore,
      topicMasteries,
      strongTopics,
      weakTopics,
      recommendations,
      healthScore,
    };
  }

  // --- V3 VIETQR GENERATOR ---
  public generateVietQRUrl(studentId: string, amount: number, customContent?: string): string {
    const student = this.students.find((s) => s.id === studentId);
    const settings = this.settings;
    const bankCode = settings.bankCode || 'MB';
    const accountNo = settings.teacherBankAccount || '0912345678999';
    const accountName = settings.teacherBankHolder || 'NGUYEN DUC QUANG';
    const content = customContent || `HP ${student?.fullName || 'HOC SINH'} LOP ${student?.grade || ''}`;

    return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      content
    )}&accountName=${encodeURIComponent(accountName)}`;
  }

  // --- ACADEMIC: HOMEWORK ---
  public addHomework(hwData: Omit<HomeworkItem, 'id' | 'createdAt'>): HomeworkItem {
    const id = `hw-${Date.now()}`;
    const newHw: HomeworkItem = {
      ...hwData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.homework.unshift(newHw);
    this.saveToStorage();
    return newHw;
  }

  public saveHomeworkResults(
    homeworkId: string,
    results: Array<{ studentId: string; status: HomeworkResultItem['status']; notes?: string; score?: number }>
  ) {
    const now = new Date().toISOString();
    for (const r of results) {
      const existingIndex = this.homeworkResults.findIndex(
        (hr) => hr.homeworkId === homeworkId && hr.studentId === r.studentId
      );
      if (existingIndex !== -1) {
        this.homeworkResults[existingIndex] = {
          ...this.homeworkResults[existingIndex],
          status: r.status,
          notes: r.notes,
          score: r.score,
          updatedAt: now,
        };
      } else {
        this.homeworkResults.unshift({
          id: `hwr-${Date.now()}-${r.studentId}`,
          homeworkId,
          studentId: r.studentId,
          status: r.status,
          notes: r.notes,
          score: r.score,
          updatedAt: now,
        });
      }
    }
    this.saveToStorage();
  }

  // --- NOTES ---
  public addStudentNote(studentId: string, content: string): StudentNote {
    const newNote: StudentNote = {
      id: `note-${Date.now()}`,
      studentId,
      content,
      author: this.currentUser.name || this.settings.teacherName,
      createdAt: new Date().toISOString(),
    };
    this.notes.unshift(newNote);
    this.saveToStorage();
    return newNote;
  }

  // --- ACTIVITY LOGS ---
  public logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(newLog);
    if (this.activities.length > 200) {
      this.activities = this.activities.slice(0, 200);
    }
  }

  // --- PARENT MESSAGE GENERATOR ---
  public generateParentMessage(studentId: string): string {
    const summary = this.getStudentTuitionSummary(studentId);
    if (!summary) return '';

    const { student, remainingLessons } = summary;
    const settings = this.settings;
    const packageLessons = settings.defaultPackageSize || 10;
    const rate = student.defaultTuitionRate || settings.defaultTuitionRate || 60000;
    const totalAmount = packageLessons * rate;

    let lessonStatusText = '';
    if (remainingLessons === 0) {
      lessonStatusText = 'hiện tại đã học hết số buổi trong gói học phí đã đóng trước đó';
    } else if (remainingLessons === 1) {
      lessonStatusText = 'hiện tại chỉ còn 1 buổi học trong chu kỳ học phí đã đóng';
    } else {
      lessonStatusText = `hiện tại còn ${remainingLessons} buổi học trong chu kỳ học phí đã đóng`;
    }

    const teacherName = settings.teacherName || 'Thầy Nguyễn Văn Sang';
    const teacherPhone = settings.teacherPhone || '0386493786';

    return `Kính gửi phụ huynh em ${student.fullName},

${teacherName} xin gửi thông tin học phí của con:
- Tình trạng: Con ${lessonStatusText}.
- Chu kỳ học phí tiếp theo: ${formatVND(totalAmount)} / gói ${packageLessons} buổi (đơn giá: ${formatVND(rate)}/buổi).

Thông tin chuyển khoản:
- Ngân hàng: ${settings.teacherBankName}
- Số tài khoản: ${settings.teacherBankAccount}
- Chủ tài khoản: ${settings.teacherBankHolder}
- Cú pháp: HP ${student.fullName} Lớp ${student.grade}
- Liên hệ / Zalo: ${teacherPhone}

Kính mong phụ huynh hoàn tất học phí trước buổi học tiếp theo để thuận tiện theo dõi điểm danh và tài liệu học tập của con.

Thầy xin chân thành cảm ơn phụ huynh!`;
  }

  // --- BACKUP & RESTORE & SUPABASE SCHEMA V3 ---
  public exportDataJSON(): string {
    return JSON.stringify(
      {
        version: '3.0',
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        students: this.students,
        classes: this.classes,
        packages: this.packages,
        payments: this.payments,
        attendance: this.attendance,
        sessions: this.sessions,
        tests: this.tests,
        scores: this.scores,
        homework: this.homework,
        homeworkResults: this.homeworkResults,
        notes: this.notes,
        activities: this.activities,
        // V3 data
        questions: this.questions,
        onlineTests: this.onlineTests,
        testAttempts: this.testAttempts,
        leads: this.leads,
        trials: this.trials,
        resources: this.resources,
        announcements: this.announcements,
        notifications: this.notifications,
        automationRules: this.automationRules,
      },
      null,
      2
    );
  }

  public importDataJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.students && Array.isArray(data.students)) {
        this.students = data.students;
        this.classes = data.classes || [];
        this.packages = data.packages || [];
        this.payments = data.payments || [];
        this.attendance = data.attendance || [];
        this.sessions = data.sessions || [];
        this.tests = data.tests || [];
        this.scores = data.scores || [];
        this.homework = data.homework || [];
        this.homeworkResults = data.homeworkResults || [];
        this.notes = data.notes || [];
        this.activities = data.activities || [];
        if (data.questions) this.questions = data.questions;
        if (data.onlineTests) this.onlineTests = data.onlineTests;
        if (data.testAttempts) this.testAttempts = data.testAttempts;
        if (data.leads) this.leads = data.leads;
        if (data.trials) this.trials = data.trials;
        if (data.resources) this.resources = data.resources;
        if (data.announcements) this.announcements = data.announcements;
        if (data.notifications) this.notifications = data.notifications;
        if (data.automationRules) this.automationRules = data.automationRules;
        if (data.settings) this.settings = data.settings;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ==========================================
  // V4 MULTI-TENANT & SAAS METHODS
  // ==========================================
  public getTenant(): Tenant {
    return this.tenant;
  }

  public updateTenant(updates: Partial<Tenant>): Tenant {
    this.tenant = { ...this.tenant, ...updates };
    this.saveToStorage();
    return this.tenant;
  }

  public useAiCredits(amount: number, operation: string): { success: boolean; remaining: number } {
    if (this.tenant.aiCreditsUsed + amount > this.tenant.aiCreditsQuota) {
      return { success: false, remaining: this.tenant.aiCreditsQuota - this.tenant.aiCreditsUsed };
    }
    this.tenant.aiCreditsUsed += amount;
    this.logAudit('AI_CREDIT_USE', 'Tenant', this.tenant.id, `Sử dụng ${amount} AI Credits cho tác vụ: ${operation}`);
    this.saveToStorage();
    return { success: true, remaining: this.tenant.aiCreditsQuota - this.tenant.aiCreditsUsed };
  }

  public getCenters(): Center[] {
    return [...this.centers];
  }

  public addCenter(centerData: Omit<Center, 'id' | 'createdAt' | 'activeStudentCount' | 'activeClassCount'>): Center {
    const newCenter: Center = {
      ...centerData,
      id: `center-${Date.now()}`,
      activeStudentCount: 0,
      activeClassCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.centers.push(newCenter);
    this.logAudit('CREATE_CENTER', 'Center', newCenter.id, `Tạo cơ sở mới: ${newCenter.name}`);
    this.saveToStorage();
    return newCenter;
  }

  public updateCenter(id: string, updates: Partial<Center>): Center | null {
    const idx = this.centers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.centers[idx] = { ...this.centers[idx], ...updates };
    this.saveToStorage();
    return this.centers[idx];
  }

  public addClassroom(centerId: string, roomData: Omit<Classroom, 'id'>): Classroom | null {
    const center = this.centers.find((c) => c.id === centerId);
    if (!center) return null;
    const newRoom: Classroom = {
      ...roomData,
      id: `room-${Date.now()}`,
    };
    center.classrooms.push(newRoom);
    this.logAudit('CREATE_CLASSROOM', 'Classroom', newRoom.id, `Thêm phòng học: ${newRoom.name} tại ${center.name}`);
    this.saveToStorage();
    return newRoom;
  }

  public getTeachers(): TeacherProfile[] {
    return [...this.teachers];
  }

  public addTeacher(tData: Omit<TeacherProfile, 'id' | 'rating' | 'weeklyHours' | 'activeStudents'>): TeacherProfile {
    const newTeacher: TeacherProfile = {
      ...tData,
      id: `tc-${Date.now()}`,
      rating: 5.0,
      weeklyHours: 12,
      activeStudents: 0,
    };
    this.teachers.push(newTeacher);
    this.logAudit('CREATE_TEACHER', 'TeacherProfile', newTeacher.id, `Thêm giáo viên: ${newTeacher.name}`);
    this.saveToStorage();
    return newTeacher;
  }

  public updateTeacher(id: string, updates: Partial<TeacherProfile>): TeacherProfile | null {
    const idx = this.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.teachers[idx] = { ...this.teachers[idx], ...updates };
    this.saveToStorage();
    return this.teachers[idx];
  }

  // ==========================================
  // V4 ADAPTIVE LEARNING & KNOWLEDGE GRAPH
  // ==========================================
  public getKnowledgeTopics(): KnowledgeTopic[] {
    return [...this.knowledgeTopics];
  }

  public addKnowledgeTopic(tData: Omit<KnowledgeTopic, 'id'>): KnowledgeTopic {
    const newTopic: KnowledgeTopic = {
      ...tData,
      id: `top-${Date.now()}`,
    };
    this.knowledgeTopics.push(newTopic);
    this.saveToStorage();
    return newTopic;
  }

  public getStudentTopicMasteries(studentId: string): StudentTopicMastery[] {
    return this.studentMasteries.filter((m) => m.studentId === studentId);
  }

  public updateTopicMastery(
    studentId: string,
    topicId: string,
    isCorrect: boolean,
    questionSummary?: string,
    errorType?: ErrorCategory
  ): StudentTopicMastery {
    const student = this.students.find((s) => s.id === studentId);
    const topic = this.knowledgeTopics.find((t) => t.id === topicId);
    let item = this.studentMasteries.find((m) => m.studentId === studentId && m.topicId === topicId);

    const now = new Date().toISOString();

    if (!item) {
      item = {
        id: `mst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentId,
        topicId,
        topicName: topic?.name || 'Chuyên đề Toán',
        grade: student?.grade || 9,
        masteryScore: isCorrect ? 65 : 45,
        confidenceScore: 20,
        practiceCount: 1,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        lastPracticed: now,
        lastTested: now,
      };
      this.studentMasteries.push(item);
    } else {
      item.practiceCount += 1;
      item.lastPracticed = now;

      // Deterministic Mastery & Confidence scoring
      // Confidence increases with practice count (asymptote towards 100)
      item.confidenceScore = Math.min(100, item.confidenceScore + 4);

      if (isCorrect) {
        item.correctCount += 1;
        // Mastery increments: bigger jump if low, gradual refinement if high
        const delta = Math.max(2, Math.round((100 - item.masteryScore) * 0.15));
        item.masteryScore = Math.min(100, item.masteryScore + delta);
      } else {
        item.incorrectCount += 1;
        const delta = Math.max(3, Math.round(item.masteryScore * 0.12));
        item.masteryScore = Math.max(0, item.masteryScore - delta);

        // Record Error Intelligence automatically
        this.recordStudentError({
          studentId,
          topic: item.topicName,
          errorType: errorType || 'sai_tinh_toan',
          source: 'practice',
          questionSummary: questionSummary || `Sai câu hỏi chuyên đề ${item.topicName}`,
          correctionNote: 'Cần xem lại phương pháp giải cơ bản và làm lại bài tương tự.',
          teacherConfirmed: false,
        });
      }
    }

    this.saveToStorage();
    return item;
  }

  public setTeacherMasteryOverride(studentId: string, topicId: string, overrideScore: number): boolean {
    const now = new Date().toISOString();
    const item = this.studentMasteries.find((m) => m.studentId === studentId && m.topicId === topicId);
    if (item) {
      item.masteryScore = overrideScore;
      item.teacherOverride = overrideScore;
      item.lastTested = now;
      this.saveToStorage();
      return true;
    } else {
      const topic = this.knowledgeTopics.find((t) => t.id === topicId);
      if (topic) {
        this.studentMasteries.push({
          id: `mst-${Date.now()}-${studentId}`,
          studentId,
          topicId,
          topicName: topic.name,
          grade: topic.grade,
          masteryScore: overrideScore,
          confidenceScore: 80,
          practiceCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastPracticed: now,
          lastTested: now,
          teacherOverride: overrideScore,
        });
        this.saveToStorage();
        return true;
      }
    }
    return false;
  }

  public getPersonalLearningPath(studentId: string): PersonalLearningPath {
    const student = this.students.find((s) => s.id === studentId) || this.students[0];
    const grade = student?.grade || 9;
    const gradeTopics = this.knowledgeTopics.filter((t) => t.grade === grade);
    const masteries = this.getStudentTopicMasteries(studentId);

    // Calculate current focus: lowest mastery topic where prerequisites are met
    let currentFocusTopic = gradeTopics[0];
    let minMastery = 100;

    gradeTopics.forEach((t) => {
      const m = masteries.find((item) => item.topicId === t.id);
      const score = m ? m.masteryScore : 50;
      if (score < minMastery) {
        minMastery = score;
        currentFocusTopic = t;
      }
    });

    const activeMastery = masteries.find((m) => m.topicId === currentFocusTopic?.id);
    const currentScore = activeMastery ? activeMastery.masteryScore : 52;
    const currentConf = activeMastery ? activeMastery.confidenceScore : 40;

    let practiceLevel: 'foundation' | 'standard' | 'advanced' = 'standard';
    if (currentScore < 50) practiceLevel = 'foundation';
    else if (currentScore > 75) practiceLevel = 'advanced';

    // Recommended topics
    const recommendedTopics = gradeTopics
      .filter((t) => t.id !== currentFocusTopic?.id)
      .slice(0, 3)
      .map((t) => {
        const m = masteries.find((item) => item.topicId === t.id);
        const score = m?.masteryScore ?? 60;
        return {
          topicId: t.id,
          name: t.name,
          reason: score < 60 ? 'Mức độ nắm vững chưa đạt (cần củng cố)' : 'Chuyên đề kế tiếp theo chuẩn kiến thức',
        };
      });

    // Spaced review topics (due for spaced repetition)
    const reviewTopics = [
      { topicId: 'top-can-thuc', name: 'Căn thức bậc hai (Ôn tập chu kỳ 7 ngày)', dueDays: 0 },
      { topicId: 'top-he-thuc-luong-9', name: 'Hệ thức lượng trong tam giác vuông (Chu kỳ 14 ngày)', dueDays: 2 },
    ];

    // Upcoming topics
    const upcomingTopics = currentFocusTopic?.recommendedNextTopics.map((nextId) => {
      const t = this.knowledgeTopics.find((item) => item.id === nextId);
      return { topicId: nextId, name: t?.name || 'Chuyên đề tiếp theo' };
    }) || [];

    // Daily practice 5 questions tailored to current topic
    const qBank = this.questions.filter((q) => q.grade === grade);
    const practiceQuestions: DailyPracticeQuestion[] = qBank.slice(0, 4).map((q, idx) => ({
      id: `dpq-${idx + 1}`,
      questionId: q.id,
      topicId: currentFocusTopic?.id || 'top-1',
      topicName: q.topic,
      questionText: q.questionText,
      type: q.questionType,
      options: q.options,
      correctNumericAnswer: q.correctNumericAnswer,
      correctAnswerText: q.correctShortAnswer,
      difficulty: q.difficulty,
      status: 'pending',
      explanation: q.explanation,
    }));

    return {
      studentId,
      currentFocus: currentFocusTopic?.name || 'Phương trình bậc hai & Hệ thức Viète',
      masteryScore: currentScore,
      confidenceScore: currentConf,
      practiceLevel,
      recommendedTopics,
      reviewTopics,
      upcomingTopics,
      dailyPractice: practiceQuestions,
      updatedAt: new Date().toISOString(),
    };
  }

  public submitDailyPractice(
    studentId: string,
    questionId: string,
    isCorrect: boolean,
    errorType?: ErrorCategory
  ) {
    const q = this.questions.find((item) => item.id === questionId);
    const topic = this.knowledgeTopics.find((t) => t.name === q?.topic) || this.knowledgeTopics[0];

    this.updateTopicMastery(
      studentId,
      topic.id,
      isCorrect,
      q?.questionText ? `${q.questionText.slice(0, 80)}...` : undefined,
      errorType
    );

    this.logActivity({
      type: 'homework',
      title: 'Hoàn thành bài luyện tập hàng ngày',
      description: `Học sinh đã trả lời ${isCorrect ? 'ĐÚNG' : 'SAI'} câu hỏi chuyên đề: ${topic.name}`,
      studentId,
    });
  }

  // ==========================================
  // V4 STUDENT ERROR INTELLIGENCE
  // ==========================================
  public getStudentErrors(studentId?: string): StudentErrorRecord[] {
    if (studentId) {
      return this.studentErrors.filter((e) => e.studentId === studentId);
    }
    return [...this.studentErrors];
  }

  public recordStudentError(data: Omit<StudentErrorRecord, 'id' | 'timestamp'>): StudentErrorRecord {
    const newRecord: StudentErrorRecord = {
      ...data,
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.studentErrors.unshift(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  public getStudentErrorAnalytics(studentId: string) {
    const errors = this.studentErrors.filter((e) => e.studentId === studentId);
    const counts: Record<ErrorCategory, number> = {
      sai_kien_thuc: 0,
      sai_tinh_toan: 0,
      sai_dau: 0,
      sai_dieu_kien: 0,
      nham_cong_thuc: 0,
      doc_sai_de: 0,
      thieu_buoc: 0,
      chua_hieu_khai_niem: 0,
    };

    errors.forEach((e) => {
      if (counts[e.errorType] !== undefined) {
        counts[e.errorType] += 1;
      }
    });

    const total = errors.length;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topError = sorted[0];

    return {
      totalErrors: total,
      counts,
      topErrorCategory: topError ? topError[0] : 'sai_tinh_toan',
      topErrorCount: topError ? topError[1] : 0,
    };
  }

  // ==========================================
  // V4 AI QUESTION DRAFTS & REVIEW WORKFLOW
  // ==========================================
  public getAIQuestionDrafts(): AIQuestionDraft[] {
    return [...this.aiQuestionDrafts];
  }

  public addAIQuestionDraft(draftData: Omit<AIQuestionDraft, 'id' | 'createdAt' | 'status'>): AIQuestionDraft {
    const newDraft: AIQuestionDraft = {
      ...draftData,
      id: `draft-${Date.now()}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    this.aiQuestionDrafts.unshift(newDraft);
    this.saveToStorage();
    return newDraft;
  }

  public approveAIQuestionDraft(draftId: string): QuestionBankItem | null {
    const draft = this.aiQuestionDrafts.find((d) => d.id === draftId);
    if (!draft) return null;

    draft.status = 'approved';

    // Insert approved question into official Question Bank
    const newQ: QuestionBankItem = {
      id: `qb-ai-${Date.now()}`,
      subject: draft.subject,
      grade: draft.grade,
      topic: draft.topic,
      skill: draft.skill,
      difficulty: draft.difficulty,
      questionType: draft.questionType,
      questionText: draft.questionText,
      options: draft.options,
      correctNumericAnswer: draft.correctNumericAnswer,
      correctShortAnswer: draft.correctShortAnswer,
      explanation: draft.explanation,
      tags: ['AI-Verified', draft.topic],
      createdAt: new Date().toISOString(),
    };

    this.questions.unshift(newQ);
    this.logAudit('APPROVE_QUESTION', 'QuestionBank', newQ.id, `Phê duyệt câu hỏi AI: ${newQ.questionText.slice(0, 60)}...`);
    this.saveToStorage();
    return newQ;
  }

  public rejectAIQuestionDraft(draftId: string): boolean {
    const draft = this.aiQuestionDrafts.find((d) => d.id === draftId);
    if (!draft) return false;
    draft.status = 'rejected';
    this.saveToStorage();
    return true;
  }

  // ==========================================
  // V4 WORKSHEETS & TEST BLUEPRINTS
  // ==========================================
  public getWorksheets(): WorksheetItem[] {
    return [...this.worksheets];
  }

  public createWorksheet(wsData: Omit<WorksheetItem, 'id' | 'createdAt'>): WorksheetItem {
    const newWs: WorksheetItem = {
      ...wsData,
      id: `ws-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.worksheets.unshift(newWs);
    this.logAudit('CREATE_WORKSHEET', 'Worksheet', newWs.id, `Tạo phiếu bài tập: ${newWs.title}`);
    this.saveToStorage();
    return newWs;
  }

  public generateTestFromBlueprint(params: {
    title: string;
    classId: string;
    blueprint: TestBlueprint;
  }): { test: OnlineTestItem; variants: TestVariant[] } {
    const { title, classId, blueprint } = params;
    const availableQuestions = this.questions;

    // Select questions
    const selectedQ = availableQuestions.slice(0, Math.min(blueprint.totalQuestions, availableQuestions.length));
    const questionsRef = selectedQ.map((q) => ({
      questionId: q.id,
      points: Math.round((blueprint.totalScore / selectedQ.length) * 10) / 10,
    }));

    const now = new Date().toISOString();
    const newTest: OnlineTestItem = {
      id: `test-bp-${Date.now()}`,
      classId,
      title,
      description: `Đề thi ma trận chuẩn hóa (${blueprint.totalQuestions} câu - ${blueprint.durationMinutes} phút)`,
      durationMinutes: blueprint.durationMinutes,
      maxScore: blueprint.totalScore,
      questions: questionsRef,
      startDate: now.split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      attemptsAllowed: 1,
      status: 'published',
      createdAt: now,
    };

    this.onlineTests.unshift(newTest);

    // Generate 4 Variants (Mã đề A, B, C, D)
    const baseIds = selectedQ.map((q) => q.id);
    const variants: TestVariant[] = (['A', 'B', 'C', 'D'] as const).slice(0, blueprint.variantsCount).map((code, idx) => {
      // Deterministic pseudo-shuffle for variant
      const order = [...baseIds];
      if (idx > 0) {
        order.reverse();
      }
      return { variantCode: code, questionOrder: order };
    });

    this.logAudit('GENERATE_TEST_BLUEPRINT', 'OnlineTest', newTest.id, `Tạo đề thi chuẩn hóa: ${newTest.title} kèm ${variants.length} mã đề.`);
    this.saveToStorage();
    return { test: newTest, variants };
  }

  // ==========================================
  // V4 ADVANCED AUTOMATIONS & TASK MANAGEMENT
  // ==========================================
  public getAutomationWorkflows(): AutomationWorkflow[] {
    return [...this.automationWorkflows];
  }

  public toggleAutomationWorkflow(id: string): AutomationWorkflow | null {
    const wf = this.automationWorkflows.find((w) => w.id === id);
    if (!wf) return null;
    wf.isEnabled = !wf.isEnabled;
    this.saveToStorage();
    return wf;
  }

  public getTasks(filter?: 'today' | 'overdue' | 'upcoming' | 'completed'): TaskItem[] {
    const todayStr = new Date().toISOString().split('T')[0];
    if (filter === 'completed') {
      return this.tasks.filter((t) => t.status === 'completed');
    }
    const pending = this.tasks.filter((t) => t.status === 'pending');
    if (filter === 'today') {
      return pending.filter((t) => t.dueDate === todayStr);
    }
    if (filter === 'overdue') {
      return pending.filter((t) => t.dueDate < todayStr);
    }
    if (filter === 'upcoming') {
      return pending.filter((t) => t.dueDate > todayStr);
    }
    return [...this.tasks];
  }

  public createTask(taskData: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    this.saveToStorage();
    return newTask;
  }

  public updateTaskStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): TaskItem | null {
    const t = this.tasks.find((item) => item.id === id);
    if (!t) return null;
    t.status = status;
    this.saveToStorage();
    return t;
  }

  // ==========================================
  // V4 AUDIT LOGS & BUSINESS INTELLIGENCE
  // ==========================================
  public getAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  public logAudit(action: string, entityType: string, entityId: string, summary: string) {
    const record: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.name,
      tenantId: this.tenant.id,
      action,
      entityType,
      entityId,
      summary,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
  }

  public getBusinessIntelligenceMetrics() {
    const activeStudents = this.students.filter((s) => s.status === 'active');
    const totalStudents = this.students.length;
    const paymentsThisMonth = this.payments;
    const totalRevenueRecorded = paymentsThisMonth.reduce((a, b) => a + b.amount, 0);

    // MRR estimate: active students * default rate * 8 sessions/month (approx 2 per week)
    const avgRate = 65000;
    const estimatedMRR = activeStudents.length * avgRate * 8;

    // ARPU (Average Revenue Per User)
    const arpu = activeStudents.length > 0 ? Math.round(totalRevenueRecorded / activeStudents.length) : 0;

    // Retention rate
    const retentionRate = totalStudents > 0 ? Math.round((activeStudents.length / totalStudents) * 100) : 100;

    // Next Month Forecast
    const renewalRateExpected = 0.88; // 88% renewal
    const forecastedRevenue = Math.round(estimatedMRR * renewalRateExpected);

    // Class Capacity Utilization
    const classUtilizations = this.classes.map((cls) => {
      const cap = cls.maxCapacity || 20;
      const count = cls.studentIds.length;
      return {
        classId: cls.id,
        className: cls.name,
        count,
        capacity: cap,
        utilizationPercent: Math.round((count / cap) * 100),
      };
    });

    // New Class Recommendation
    const leadsWaiting = this.leads.filter((l) => l.stage === 'new' || l.stage === 'consulted');
    const grade9Leads = leadsWaiting.filter((l) => l.grade === 9).length;

    let recommendation = 'Tối ưu hóa sĩ số các lớp hiện tại để đạt tỉ lệ lấp đầy trên 85%.';
    if (grade9Leads >= 3) {
      recommendation = `Đang có ${grade9Leads} phụ huynh học sinh Khối 9 chờ xếp lớp. Khuyến nghị: Mở thêm 01 lớp Toán 9 chất lượng cao vào tối Thứ 3 / Thứ 5.`;
    }

    return {
      activeStudentsCount: activeStudents.length,
      estimatedMRR,
      arpu,
      retentionRate,
      forecastedRevenue,
      classUtilizations,
      recommendation,
    };
  }

  public generateSupabaseSQL(): string {
    return `-- ====================================================================
-- QClass Tutor Manager V3 - Toàn diện Schema PostgreSQL / Supabase
-- Hỗ trợ phân quyền RLS cho Giáo viên, Học sinh, Phụ huynh và Tuyển sinh
-- ====================================================================

-- 1. Bảng hồ sơ người dùng (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'assistant', 'student', 'parent')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng học sinh (students)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    grade INTEGER NOT NULL,
    school TEXT,
    student_phone TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    address TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    default_tuition_rate NUMERIC(12,2) NOT NULL DEFAULT 60000,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bảng liên kết Phụ huynh - Học sinh (parent_student_links)
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    parent_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Phụ huynh',
    PRIMARY KEY (parent_user_id, student_id)
);

-- 4. Bảng lớp học (classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'Toán học',
    grade INTEGER NOT NULL,
    default_tuition_rate NUMERIC(12,2) NOT NULL DEFAULT 60000,
    schedule_days TEXT[] NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room TEXT,
    max_capacity INTEGER DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bảng thanh toán học phí (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    lesson_quantity INTEGER NOT NULL DEFAULT 10,
    price_per_lesson NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'cash', 'other')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_number TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bảng gói học phí của học sinh (student_packages)
CREATE TABLE IF NOT EXISTS public.student_packages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
    total_lessons INTEGER NOT NULL DEFAULT 10,
    used_lessons INTEGER NOT NULL DEFAULT 0,
    remaining_lessons INTEGER NOT NULL,
    price_per_lesson NUMERIC(12,2) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Bảng điểm danh (attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'excused', 'unexcused', 'makeup')),
    lesson_deducted BOOLEAN NOT NULL DEFAULT true,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, class_id, date)
);

-- 8. Ngân hàng câu hỏi (question_bank)
CREATE TABLE IF NOT EXISTS public.question_bank (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL DEFAULT 'Toán học',
    grade INTEGER NOT NULL,
    topic TEXT NOT NULL,
    skill TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('recognition', 'comprehension', 'application', 'advanced')),
    question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'numeric', 'short_answer', 'essay')),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_numeric NUMERIC,
    correct_short TEXT,
    explanation TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Kiểm tra trực tuyến (online_tests & attempts)
CREATE TABLE IF NOT EXISTS public.online_tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
    questions JSONB NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT REFERENCES public.online_tests(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submit_time TIMESTAMPTZ,
    answers JSONB NOT NULL,
    score NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'graded'
);

-- 10. Tuyển sinh CRM & Học thử (leads & trial_lessons)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    school TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'Facebook',
    interested_class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trial_lessons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    trial_date DATE NOT NULL,
    trial_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    conversion_result TEXT
);

-- 11. Row Level Security (RLS) bảo vệ dữ liệu học sinh & phụ huynh
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Chính sách RLS: Học sinh chỉ xem dữ liệu của chính mình
CREATE POLICY student_view_own_data ON public.students
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('admin', 'teacher'));

CREATE POLICY student_view_own_attendance ON public.attendance
    FOR SELECT USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR auth.jwt() ->> 'role' IN ('admin', 'teacher')
    );
`;
  }
}

export const db = new DatabaseService();
