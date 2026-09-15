export type EducationalStage = 'middle' | 'secondary';

export interface ClassItem {
  id: string;
  name: string; // e.g., "3 ع ت 1" أو "4 م 2" أو "1 ج م ع 1"
  stage: EducationalStage; // متوسط / ثانوي
  grade: string; // e.g. "السنة 3 ثانوي (بكالوريا)" أو "السنة الرابعة متوسط"
  subject: string; // e.g. "علوم الطبيعة والحياة"
  room?: string; // رقم الحجرة / القاعة
  academicYear: string; // e.g. "2024 - 2025"
  color: string; // للتمييز البصري
  createdAt: number;
  updatedAt: number;
}

export interface StudentItem {
  id: string;
  classId: string;
  studentNumber?: string; // رقم التعريف المدرسي
  firstName: string; // الاسم
  lastName: string; // اللقب
  gender: 'male' | 'female'; // ذكر / أنثى
  birthDate?: string; // تاريخ الميلاد
  guardianPhone?: string; // هاتف الولي
  notes?: string; // ملاحظات تربوية
  createdAt: number;
  updatedAt: number;
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday';

export interface ScheduleSession {
  id: string;
  dayOfWeek: DayOfWeek;
  subject: string;
  classId: string;
  className?: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "10:00"
  room?: string;     // القاعة / المخبر
  notes?: string;    // ملاحظات بيداغوجية
  color?: string;    // لون تمييز الحصة
  createdAt: number;
  updatedAt: number;
}

export interface LessonStage {
  id: string;
  title: string; // e.g. "وضعية الانطلاق", "مرحلة بناء التعلمات", "التقويم والإدماج"
  duration?: string; // e.g. "15 دقيقة"
  content: string; // تفاصيل المرحلة والأنشطة
}

export interface LessonPlan {
  id: string;
  title: string; // عنوان الدرس
  subject: string; // المادة
  classId: string; // القسم
  className?: string; // اسم القسم المساعد
  date: string; // تاريخ الحصة YYYY-MM-DD
  duration: string; // مدة الحصة (e.g. 1 ساعة، ساعتان...)
  objectives: string; // أهداف الدرس / الكفاءات المستهدفة
  stages: LessonStage[]; // مراحل سير الدرس
  teachingAids: string; // الوسائل والسندات التعليمية
  teacherNotes?: string; // ملاحظات الأستاذ وتقويمه
  color?: string; // لون التمييز
  createdAt: number;
  updatedAt: number;
}

export interface TeacherProfile {
  fullName: string;
  wilaya: string; // الولاية
  schoolName: string; // اسم المؤسسة
  subject: string; // المادة الرئيسية
  academicYear: string; // السنة الدراسية
  stage?: EducationalStage; // الطور التعليمي
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type AssessmentType = 'test1' | 'test2' | 'exam' | 'test' | 'continuous' | 'activity';

export type Trimester = 'T1' | 'T2' | 'T3';

export interface StudentScoreRecord {
  score?: number | null; // العلامة المتحصل عليها (out of maxScore e.g. 15.5)
  isAbsent?: boolean; // غائب
  note?: string; // ملاحظة الأستاذ (e.g. "عمل ممتاز", "يحتاج تركيز")
}

export interface AssessmentItem {
  id: string;
  title: string; // عنوان التقييم (e.g. "الفرض الأول", "الفرض الثاني", "الاختبار الفصلي")
  type: AssessmentType; // نوع التقييم: فرض 1، فرض 2، اختبار
  classId: string; // القسم
  className?: string; // اسم القسم المساعد
  subject: string; // المادة
  trimester: Trimester; // الفصل الأول / الثاني / الثالث
  date: string; // YYYY-MM-DD
  coefficient?: number; // للمحافظة على التوافق، المعامل المعتمد هو معامل المادة
  maxScore: number; // العدد الأقصى للتقييم (افتراضياً 20)
  notes?: string; // ملاحظات وتوجيهات
  grades: Record<string, StudentScoreRecord>; // studentId -> StudentScoreRecord
  createdAt: number;
  updatedAt: number;
}

// كيفية الحساب للمادة (Subject Calculation Methods)
export type SubjectCalculationMethodType =
  | 'tests_avg_plus_exam_x2_div_3'    // ((فرض 1 + فرض 2) / 2 + اختبار × 2) / 3 (الرسمي الشائع)
  | 'tests_sum_plus_exam_x2_div_4'    // (فرض 1 + فرض 2 + اختبار × 2) / 4 (الوزاري المباشر)
  | 'best_test_plus_exam_x2_div_3'    // (الأعلى بين فرض 1 وفرض 2 + اختبار × 2) / 3 (أفضل فرض)
  | 'test1_only_plus_exam_x2_div_3'   // (فرض 1 + اختبار × 2) / 3 (فرض واحد واختبار)
  | 'arithmetic_mean'                 // (فرض 1 + فرض 2 + اختبار) / 3 (متوسط بسيط)
  | 'custom_weights';                 // أوزان مخصصة يحددها الأستاذ

export interface SubjectCalculationConfig {
  method: SubjectCalculationMethodType;
  customTest1Weight?: number;  // وزن فرض 1 (افتراضياً 1)
  customTest2Weight?: number;  // وزن فرض 2 (افتراضياً 1)
  customExamWeight?: number;   // وزن الاختبار (افتراضياً 2)
  description?: string;        // شرح طريقة الحساب
}

export interface SubjectSetting {
  id: string;
  name: string; // اسم المادة
  coefficient?: number | null; // معامل المادة (معامل واحد فقط للمادة)
  calculationMethod: SubjectCalculationConfig; // كيفية الحساب
  createdAt?: number;
  updatedAt?: number;
}

export type CalculationFormula = 'weighted' | 'standard_algerian' | 'arithmetic' | 'subject_method';

export interface AppSettings {
  key: string;
  theme: ThemeMode;
  profile: TeacherProfile;
  hasSeenSplash: boolean;
  educationalStage?: EducationalStage; // الطور التعليمي: 'middle' | 'secondary'
  lastBackupDate?: string;
  updatedAt: number;
}

export type ActiveTab = 'splash' | 'dashboard' | 'classes' | 'students' | 'random_picker' | 'schedule' | 'lessons' | 'grades' | 'attendance' | 'reports' | 'library' | 'reminders' | 'settings';

export interface RandomDrawRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentGender?: 'male' | 'female';
  studentNumber?: string;
  classId: string;
  className: string;
  timestamp: number;
  dateString: string;
  timeString: string;
  purpose?: string;
}

export interface RandomDrawClassState {
  classId: string;
  noRepeat: boolean;
  selectedStudentIds: string[];
  excludedStudentIds: string[];
  lastSelectedStudentId?: string;
  updatedAt: number;
}

export type ReminderPriority = 'low' | 'medium' | 'high';

export interface ReminderItem {
  id: string;
  title: string;              // عنوان التذكير
  notes?: string;             // تفاصيل أو ملاحظة
  dueDate: string;            // تاريخ الاستحقاق YYYY-MM-DD
  dueTime?: string;           // وقت الاستحقاق HH:mm
  classId?: string;           // معرف القسم (اختياري)
  className?: string;         // اسم القسم (اختياري)
  subject?: string;           // المادة (اختياري)
  isCompleted: boolean;       // مكتمل / غير مكتمل
  priority?: ReminderPriority; // الأولوية (منخفضة / متوسطة / عاجلة)
  createdAt: number;
  updatedAt: number;
}

export type LibraryItemType = 'file' | 'note';

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  itemType: LibraryItemType;
  subject: string;
  classId?: string;
  className?: string;
  folderName: string;
  fileName?: string;
  fileType?: string; // MIME type
  fileExtension?: string; // pdf, docx, png, etc.
  fileSize?: number; // In bytes
  fileId?: string; // Key in LIBRARY_FILES store
  thumbnailUrl?: string; // Cached local base64/dataURL thumbnail for visual preview
  content?: string; // For text/notes
  createdAt: number;
  updatedAt: number;
}

export interface LibraryFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  updatedAt: number;
}

export type ReportType = 
  | 'student_card'       // بطاقة المتابعة الشاملة للتلميذ
  | 'class_grades'       // قائمة نقاط ومعدلات القسم
  | 'class_attendance'   // محضر غياب ومواظبة القسم
  | 'absence_notice';    // إشعار بالغياب واستدعاء الولي

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt?: number;
}

export interface AttendanceRecord {
  id: string; // `${classId}_${date}`
  classId: string;
  className?: string;
  date: string; // YYYY-MM-DD
  period?: string; // 'كامل اليوم' | 'الفترة الصباحية' | 'الفترة المسائية'
  records: Record<string, StudentAttendanceEntry>;
  presentCount: number;
  absentCount: number;
  lateCount?: number;
  totalStudents: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  student: StudentItem;
  totalRecordedDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  attendanceRate: number;
  history: {
    date: string;
    status: AttendanceStatus;
    note?: string;
    recordId: string;
  }[];
}
