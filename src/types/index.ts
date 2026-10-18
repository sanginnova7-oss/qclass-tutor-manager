export type StudentStatus = 'active' | 'paused' | 'stopped';
export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'makeup';
export type PaymentMethod = 'transfer' | 'cash' | 'other';
export type HomeworkStatus = 'not_started' | 'in_progress' | 'submitted' | 'late' | 'needs_correction' | 'completed' | 'partial' | 'missing';
export type PackageStatus = 'active' | 'completed' | 'cancelled';

// V3 User Roles
export type UserRole = 'admin' | 'teacher' | 'assistant' | 'student' | 'parent';
export type PortalType = 'teacher' | 'student' | 'parent' | 'public';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  studentId?: string; // If student
  studentIds?: string[]; // If parent
  avatar?: string;
}

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  grade: number; // 6 - 12
  school: string;
  studentPhone?: string;
  parentName: string;
  parentPhone: string;
  address?: string;
  enrollmentDate: string;
  defaultTuitionRate: number; // e.g. 60000 VND / lesson
  status: StudentStatus;
  avatar?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassItem {
  id: string;
  name: string;
  subject: string;
  grade: number;
  defaultTuitionRate: number;
  scheduleDays: string[]; // e.g. ['Thứ 3', 'Thứ 5', 'Thứ 7']
  startTime: string; // '18:00'
  endTime: string; // '19:30'
  room?: string;
  studentIds: string[];
  maxCapacity?: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface TuitionPackage {
  id: string;
  studentId: string;
  paymentId?: string;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  pricePerLesson: number;
  startDate: string;
  status: PackageStatus;
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  packageId?: string;
  amount: number;
  lessonQuantity: number;
  pricePerLesson: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  receiptNumber?: string;
  note?: string;
  status?: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  sessionId: string;
  sessionTitle: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  lessonDeducted: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSession {
  id: string;
  classId: string;
  date: string;
  title: string;
  attendanceCount: {
    present: number;
    excused: number;
    unexcused: number;
    makeup: number;
  };
  totalStudents: number;
  createdAt: string;
}

// V3 Question Bank & Online Tests
export type DifficultyLevel = 'recognition' | 'comprehension' | 'application' | 'advanced';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'numeric' | 'short_answer' | 'essay';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionBankItem {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  skill: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctNumericAnswer?: number;
  correctShortAnswer?: string;
  explanation?: string;
  tags?: string[];
  createdAt: string;
}

export interface OnlineTestQuestion {
  questionId: string;
  points: number;
}

export interface OnlineTestItem {
  id: string;
  classId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  maxScore: number;
  questions: OnlineTestQuestion[];
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
  attemptsAllowed: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
}

export interface TestAttemptItem {
  id: string;
  testId: string;
  studentId: string;
  startTime: string;
  submitTime?: string;
  answers: Record<string, any>;
  score?: number;
  maxScore: number;
  status: 'in_progress' | 'submitted' | 'graded';
  feedback?: string;
}

// Legacy TestItem & ScoreItem for backward compatibility
export interface TestItem {
  id: string;
  classId: string;
  title: string;
  date: string;
  maxScore: number;
  notes?: string;
  createdAt: string;
}

export interface ScoreItem {
  id: string;
  testId: string;
  studentId: string;
  score: number;
  notes?: string;
  createdAt: string;
}

// V3 Interactive Homework
export interface InteractiveHomeworkQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctNumericAnswer?: number;
  correctShortAnswer?: string;
  points: number;
  explanation?: string;
}

export interface HomeworkItem {
  id: string;
  classId: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  description?: string;
  questions?: InteractiveHomeworkQuestion[];
  createdAt: string;
}

export interface HomeworkResultItem {
  id: string;
  homeworkId: string;
  studentId: string;
  status: HomeworkStatus;
  score?: number;
  maxScore?: number;
  submittedAt?: string;
  studentAnswers?: Record<string, any>;
  teacherComment?: string;
  notes?: string;
  updatedAt: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'payment' | 'attendance' | 'student' | 'score' | 'package' | 'class' | 'lead' | 'trial' | 'homework' | 'test';
  title: string;
  description: string;
  timestamp: string;
  studentId?: string;
  classId?: string;
}

export interface DeductionRules {
  present: boolean; // default true
  excused: boolean; // default false
  unexcused: boolean; // default true
  makeup: boolean; // default true
}

export interface LowLessonThresholds {
  critical: number; // 0 (red)
  urgent: number;   // 1 (orange)
  warning: number;  // 2 (yellow)
  caution: number;  // 3-4 (light yellow)
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetTitle?: string;
  lastSyncedAt?: string;
  autoSync?: boolean;
  connectedEmail?: string;
}

export interface AppSettings {
  teacherName: string;
  teacherSubject?: string;
  teacherPhone: string;
  teacherBankName: string;
  teacherBankAccount: string;
  teacherBankHolder: string;
  bankCode?: string; // VietQR bank code e.g. 'MB' or 'VCB'
  defaultPackageSize: number; // 10
  defaultTuitionRate: number; // 60000
  classDurationMinutes: number; // 90
  currency: string; // 'VND'
  deductionRules: DeductionRules;
  thresholds: LowLessonThresholds;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleSheets?: GoogleSheetsConfig;
}

export type AlertLevel = 'critical' | 'urgent' | 'warning' | 'caution' | 'normal';

export interface StudentTuitionSummary {
  student: Student;
  activePackage?: TuitionPackage;
  totalLessonsPurchased: number;
  totalLessonsUsed: number;
  remainingLessons: number;
  totalAmountPaid: number;
  lastPaymentDate?: string;
  alertLevel: AlertLevel;
}

// V3 Enrollment CRM & Leads
export type LeadStage =
  | 'new'
  | 'contacted'
  | 'consulted'
  | 'trial_registered'
  | 'trial_completed'
  | 'considering'
  | 'enrolled'
  | 'not_fit';

export type LeadSource =
  | 'Facebook'
  | 'Zalo'
  | 'TikTok'
  | 'YouTube'
  | 'Referral'
  | 'Google'
  | 'Offline'
  | 'Existing Parent'
  | 'Website';

export interface LeadItem {
  id: string;
  studentName: string;
  grade: number;
  school?: string;
  parentName: string;
  parentPhone: string;
  source: LeadSource;
  interestedClassId?: string;
  learningGoal?: string;
  currentLevel?: string;
  stage: LeadStage;
  notes?: string;
  referredBy?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialLessonItem {
  id: string;
  leadId: string;
  classId: string;
  trialDate: string;
  trialTime: string;
  status: 'scheduled' | 'attended' | 'cancelled';
  teacherFeedback?: string;
  studentFeedback?: string;
  conversionResult?: 'enrolled' | 'pending' | 'dropped';
  createdAt: string;
}

// V3 Resource Library
export interface ResourceItem {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'image' | 'video' | 'link';
  url: string;
  grade: number;
  subject: string;
  topic: string;
  classId?: string; // 'all' or specific class
  accessLevel: 'all' | 'class' | 'teacher_only' | 'parent';
  fileSize?: string;
  downloadCount: number;
  createdAt: string;
}

// V3 Announcements & Notifications
export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'class' | 'students' | 'parents';
  classId?: string;
  author: string;
  publishDate: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // 'all', 'teacher', or studentId/parentPhone
  title: string;
  message: string;
  type: 'attendance' | 'tuition' | 'homework' | 'test' | 'announcement' | 'system';
  isRead: boolean;
  createdAt: string;
}

// V3 Learning Mastery
export interface TopicMastery {
  topic: string;
  masteryPercent: number;
  testedQuestions: number;
  correctQuestions: number;
  status: 'weak' | 'moderate' | 'strong';
}

export interface StudentLearningProfile {
  studentId: string;
  attendanceRate: number;
  homeworkRate: number;
  averageScore: number;
  topicMasteries: TopicMastery[];
  strongTopics: string[];
  weakTopics: string[];
  recommendations: string[];
  healthScore: number; // 0 - 100
}

// V3 Automation Rules
export interface AutomationRuleItem {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isEnabled: boolean;
}

// ==========================================
// V4 AI-NATIVE TUTORING OPERATING SYSTEM TYPES
// ==========================================

// 1. Multi-Tenant & SaaS Hierarchy
export type SaaSPlanTier = 'free' | 'pro' | 'center' | 'enterprise';

export interface TenantLimits {
  maxStudents: number;
  maxTeachers: number;
  maxCenters: number;
  aiCredits: number;
  storageMb: number;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  plan: SaaSPlanTier;
  logo?: string;
  brandColor?: string;
  features: Record<string, boolean>;
  limits: TenantLimits;
  aiCreditsUsed: number;
  aiCreditsQuota: number;
  createdAt: string;
}

export interface Classroom {
  id: string;
  centerId: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Center {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  managerName: string;
  phone: string;
  classrooms: Classroom[];
  activeStudentCount: number;
  activeClassCount: number;
  createdAt: string;
}

export interface TeacherProfile {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  role: 'lead' | 'teacher' | 'assistant' | 'substitute';
  specialties: string[];
  assignedClassIds: string[];
  primaryCenterId: string;
  rating: number; // 1 - 5
  weeklyHours: number;
  activeStudents: number;
  status: 'active' | 'on_leave';
  avatar?: string;
}

export interface TeacherAssignment {
  id: string;
  classId: string;
  teacherId: string;
  role: 'primary' | 'assistant' | 'substitute';
  assignedDate: string;
}

// 2. Adaptive Learning & Knowledge Graph
export interface KnowledgeTopic {
  id: string;
  code: string;
  grade: number;
  name: string;
  category: 'Đại số' | 'Hình học' | 'Giải tích' | 'Thống kê & Xác suất';
  prerequisites: string[]; // IDs of prerequisite topics
  requiredMasteryForNext: number; // e.g. 70
  recommendedNextTopics: string[];
  difficultyTier: 1 | 2 | 3 | 4; // 1: Cơ bản -> 4: Chuyên sâu
  description: string;
}

export interface StudentTopicMastery {
  id: string;
  studentId: string;
  topicId: string;
  topicName: string;
  grade: number;
  masteryScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100 based on data volume
  practiceCount: number;
  correctCount: number;
  incorrectCount: number;
  lastPracticed: string;
  lastTested: string;
  decayedConfidence?: number;
  teacherOverride?: number;
}

export interface DailyPracticeQuestion {
  id: string;
  questionId: string;
  topicId: string;
  topicName: string;
  questionText: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctNumericAnswer?: number;
  correctAnswerText?: string;
  difficulty: DifficultyLevel;
  status: 'pending' | 'correct' | 'incorrect';
  explanation?: string;
}

export interface PersonalLearningPath {
  studentId: string;
  currentFocus: string;
  masteryScore: number;
  confidenceScore: number;
  practiceLevel: 'foundation' | 'standard' | 'advanced';
  recommendedTopics: Array<{ topicId: string; name: string; reason: string }>;
  reviewTopics: Array<{ topicId: string; name: string; dueDays: number }>;
  upcomingTopics: Array<{ topicId: string; name: string }>;
  dailyPractice: DailyPracticeQuestion[];
  updatedAt: string;
}

// 3. Student Error Intelligence
export type ErrorCategory =
  | 'sai_kien_thuc'
  | 'sai_tinh_toan'
  | 'sai_dau'
  | 'sai_dieu_kien'
  | 'nham_cong_thuc'
  | 'doc_sai_de'
  | 'thieu_buoc'
  | 'chua_hieu_khai_niem';

export interface StudentErrorRecord {
  id: string;
  studentId: string;
  topic: string;
  errorType: ErrorCategory;
  source: 'test' | 'homework' | 'practice';
  questionSummary: string;
  correctionNote?: string;
  teacherConfirmed: boolean;
  timestamp: string;
}

// 4. AI Question Generation & Review Workflow
export interface AIQuestionDraft {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  skill: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctNumericAnswer?: number;
  correctShortAnswer?: string;
  explanation: string;
  hints?: string[];
  commonMistakes?: string[];
  status: 'draft' | 'approved' | 'rejected';
  duplicateWarning?: string;
  teacherReviewNotes?: string;
  createdAt: string;
}

export interface QuestionVersion {
  version: number;
  updatedAt: string;
  questionText: string;
  options?: QuestionOption[];
  explanation?: string;
  changedBy: string;
}

export interface QuestionQualityMetrics {
  usageCount: number;
  correctRate: number; // 0 - 100%
  discriminationIndex: number; // 0.0 - 1.0
  averageTimeSeconds: number;
  teacherRating: number; // 1 - 5
  isVerified: boolean;
  isAiGenerated: boolean;
}

// 5. Worksheets & Test Blueprints
export type WorksheetType =
  | 'practice'
  | 'homework'
  | 'review'
  | 'weak_topic'
  | 'exam_prep'
  | 'personalized';

export interface WorksheetItem {
  id: string;
  title: string;
  classId: string;
  type: WorksheetType;
  targetStudentGroup?: 'all' | 'foundation' | 'standard' | 'advanced' | string;
  topic: string;
  grade: number;
  questions: QuestionBankItem[];
  instructions?: string;
  answerKeyVisible: boolean;
  createdAt: string;
}

export interface TestBlueprint {
  topicDistribution: Record<string, number>; // Topic name -> %
  difficultyDistribution: Record<DifficultyLevel, number>; // Difficulty -> %
  totalQuestions: number;
  totalScore: number;
  durationMinutes: number;
  variantsCount: number; // e.g. 4 mã đề: A, B, C, D
}

export interface TestVariant {
  variantCode: 'A' | 'B' | 'C' | 'D';
  questionOrder: string[];
}

// 6. Advanced Automations & Tasks
export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger:
    | 'student_absent'
    | 'payment_received'
    | 'package_low'
    | 'test_completed'
    | 'homework_overdue'
    | 'lead_created'
    | 'trial_completed'
    | 'health_low';
  conditionText: string;
  actionType:
    | 'create_notification'
    | 'create_task'
    | 'generate_message_draft'
    | 'assign_practice'
    | 'flag_risk';
  requiresApproval: boolean;
  isEnabled: boolean;
  lastRun?: string;
  runCount: number;
}

export interface TaskItem {
  id: string;
  title: string;
  assignedTeacherId: string;
  studentId?: string;
  classId?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  category: 'tuition' | 'attendance' | 'academic' | 'parent' | 'lead' | 'other';
  notes?: string;
  createdAt: string;
}

// 7. Audit Log, Analytics Events & Webhooks
export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  timestamp: string;
}

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  userId: string;
  eventType:
    | 'student_created'
    | 'student_attended'
    | 'payment_received'
    | 'homework_submitted'
    | 'test_completed'
    | 'lead_converted'
    | 'package_renewed';
  entityId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
}
