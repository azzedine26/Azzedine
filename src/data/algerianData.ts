import { 
  ClassItem, 
  EducationalStage, 
  StudentItem, 
  TeacherProfile, 
  DayOfWeek, 
  ScheduleSession, 
  LessonPlan, 
  LessonStage, 
  AssessmentItem,
  SubjectSetting,
  SubjectCalculationMethodType,
  AttendanceRecord,
  LibraryItem,
  ReminderItem
} from '../types';

export const ALGERIAN_WILAYAS = [
  '01 - أدرار', '02 - الشلف', '03 - الأغواط', '04 - أم البواقي', '05 - باتنة',
  '06 - بجاية', '07 - بسكرة', '08 - بشار', '09 - البليدة', '10 - البويرة',
  '11 - تمنراست', '12 - تبسة', '13 - تلمسان', '14 - تيارت', '15 - تيزي وزو',
  '16 - الجزائر', '17 - الجلفة', '18 - جيجل', '19 - سطيف', '20 - سعيدة',
  '21 - سكيكدة', '22 - سيدي بلعباس', '23 - عنابة', '24 - قالمة', '25 - قسنطينة',
  '26 - المدية', '27 - مستغانم', '28 - المسيلة', '29 - معسكر', '30 - ورقلة',
  '31 - وهران', '32 - البيض', '33 - إليزي', '34 - برج بوعريريج', '35 - بومرداس',
  '36 - الطارف', '37 - تندوف', '38 - تسمسيلت', '39 - الوادي', '40 - خنشلة',
  '41 - سوق أهراس', '42 - تيبازة', '43 - ميلة', '44 - عين الدفلى', '45 - النعامة',
  '46 - عين تموشنت', '47 - غرداية', '48 - غليزان', '49 - تيميمون', '50 - برج باجي مختار',
  '51 - أولاد جلال', '52 - بني عباس', '53 - عين صالح', '54 - عين قزام', '55 - تقرت',
  '56 - جانت', '57 - المغير', '58 - المنيعة'
];

export const EDUCATIONAL_STAGES: { id: EducationalStage; label: string; grades: string[] }[] = [
  {
    id: 'middle',
    label: 'التعليم المتوسط',
    grades: [
      'السنة الأولى متوسط',
      'السنة الثانية متوسط',
      'السنة الثالثة متوسط',
      'السنة الرابعة متوسط (شهادة BEM)'
    ]
  },
  {
    id: 'secondary',
    label: 'التعليم الثانوي',
    grades: [
      '1 ثانوي - جذع مشترك علوم وتكنولوجيا',
      '1 ثانوي - جذع مشترك آداب',
      '2 ثانوي - علوم تجريبية',
      '2 ثانوي - رياضيات',
      '2 ثانوي - تقني رياضي',
      '2 ثانوي - تسيير واقتصاد',
      '2 ثانوي - لغات أجنبية',
      '2 ثانوي - آداب وفلسفة',
      '3 ثانوي - علوم تجريبية (بكالوريا BAC)',
      '3 ثانوي - رياضيات (بكالوريا BAC)',
      '3 ثانوي - تقني رياضي (بكالوريا BAC)',
      '3 ثانوي - تسيير واقتصاد (بكالوريا BAC)',
      '3 ثانوي - لغات أجنبية (بكالوريا BAC)',
      '3 ثانوي - آداب وفلسفة (بكالوريا BAC)'
    ]
  }
];

export const COMMON_SUBJECTS = [
  'علوم الطبيعة والحياة',
  'الرياضيات',
  'العلوم الفيزيائية والتكنولوجيا',
  'اللغة العربية وآدابها',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'التاريخ والجغرافيا',
  'التربية الإسلامية',
  'التربية المدنية',
  'الفلسفة',
  'الإعلام الآلي',
  'التربية البدنية والرياضية',
  'التربية التشكيلية والفنية',
  'التربية الموسيقية',
  'اللغة الأمازيغية',
  'الهندسة الميكانيكية',
  'الهندسة المدنية',
  'الهندسة الكهربائية',
  'هندسة الطرائق',
  'الاقتصاد والمناجمنت',
  'القانون'
];

export const MIDDLE_SUBJECTS_LIST: string[] = [
  'الرياضيات',
  'علوم الطبيعة والحياة',
  'العلوم الفيزيائية والتكنولوجيا',
  'اللغة العربية وآدابها',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'التاريخ والجغرافيا',
  'التربية الإسلامية',
  'التربية المدنية',
  'الإعلام الآلي',
  'التربية التشكيلية',
  'التربية الموسيقية',
  'التربية البدنية والرياضية',
  'اللغة الأمازيغية'
];

export const SECONDARY_SUBJECTS_LIST: string[] = [
  'علوم الطبيعة والحياة',
  'الرياضيات',
  'العلوم الفيزيائية',
  'اللغة العربية وآدابها',
  'الفلسفة',
  'التاريخ والجغرافيا',
  'العلوم الإسلامية',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'الإعلام الآلي',
  'الهندسة الميكانيكية',
  'الهندسة المدنية',
  'الهندسة الكهربائية',
  'هندسة الطرائق',
  'الاقتصاد والمناجمنت',
  'القانون',
  'التربية البدنية والرياضية',
  'اللغة الإيطالية',
  'اللغة الألمانية',
  'اللغة الإسبانية',
  'اللغة الأمازيغية'
];

export function getSubjectsForGradeAndStage(
  stage?: EducationalStage | string,
  grade?: string,
  fallbackSubjects: string[] = []
): string[] {
  if (stage === 'middle') {
    return MIDDLE_SUBJECTS_LIST;
  }
  if (stage === 'secondary') {
    return SECONDARY_SUBJECTS_LIST;
  }
  return fallbackSubjects.length > 0 ? fallbackSubjects : COMMON_SUBJECTS;
}

export interface CalculationMethodOption {
  id: SubjectCalculationMethodType;
  title: string;
  formula: string;
  badge: string;
  description: string;
  isStandard?: boolean;
}

export const SUBJECT_CALCULATION_METHODS: CalculationMethodOption[] = [
  {
    id: 'tests_avg_plus_exam_x2_div_3',
    title: 'معدل الفرضين + الاختبار مضاعف ÷ 3',
    formula: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    badge: 'النظام الأكثر شيوعاً',
    description: 'يتم احتساب متوسط الفرض 1 والفرض 2 أولاً، ثم إضافة نقطة الاختبار مضروبة في 2، وقسمة المجموع على 3. (في حال إدخال فرض واحد يُعتمد كنقطة الفروض).',
    isStandard: true,
  },
  {
    id: 'tests_sum_plus_exam_x2_div_4',
    title: 'مجموع الفرضين + الاختبار مضاعف ÷ 4',
    formula: '(فرض 1 + فرض 2 + الاختبار × 2) ÷ 4',
    badge: 'النظام الوزاري المباشر',
    description: 'يُجمع الفرض الأول والفرض الثاني مع ضعف الاختبار، ويُقسم المجموع الكلي على 4 بالتساوي.',
  },
  {
    id: 'best_test_plus_exam_x2_div_3',
    title: 'أفضل فرض + الاختبار مضاعف ÷ 3',
    formula: '(الأعلى بين [فرض 1، فرض 2] + الاختبار × 2) ÷ 3',
    badge: 'لمصلحة التلميذ',
    description: 'يتم اختيار العلامة الأعلى بين الفرض 1 والفرض 2 تلقائياً، وتُجمع مع نقطة الاختبار مضاعفة والقسمة على 3.',
  },
  {
    id: 'test1_only_plus_exam_x2_div_3',
    title: 'فرض 1 فقط + الاختبار مضاعف ÷ 3',
    formula: '(فرض 1 + الاختبار × 2) ÷ 3',
    badge: 'فرض واحد واختبار',
    description: 'يُعتمد الفرض الأول فقط مع مضاعفة علامة الاختبار والقسمة على 3 (للمستويات والمواد ذات الفرض الواحد).',
  },
  {
    id: 'arithmetic_mean',
    title: 'المتوسط الحسابي البسيط',
    formula: '(فرض 1 + فرض 2 + الاختبار) ÷ 3',
    badge: 'أوزان متساوية',
    description: 'حساب المتوسط الحسابي العادي بجمع نقطة فرض 1 وفرض 2 والاختبار وقسمتها على 3 بالتساوي.',
  },
  {
    id: 'custom_weights',
    title: 'أوزان مخصصة يحددها الأستاذ',
    formula: '(فرض 1 × و1 + فرض 2 × و2 + الاختبار × و3) ÷ (و1 + و2 + و3)',
    badge: 'صيغة مخصصة',
    description: 'يتيح للأستاذ تحديد الوزن النسبي الدقيق للفرض 1 والفرض 2 والاختبار وفق التدرجات البيداغوجية لمادته.',
  },
];

export const INITIAL_SUBJECT_SETTINGS: SubjectSetting[] = [
  {
    id: 'subj-sciences',
    name: 'علوم الطبيعة والحياة',
    coefficient: 5,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 'subj-maths',
    name: 'الرياضيات',
    coefficient: 5,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
  },
  {
    id: 'subj-physics',
    name: 'العلوم الفيزيائية والتكنولوجيا',
    coefficient: 4,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
  },
  {
    id: 'subj-arabic',
    name: 'اللغة العربية وآدابها',
    coefficient: 3,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000003,
    updatedAt: 1700000000003,
  },
  {
    id: 'subj-french',
    name: 'اللغة الفرنسية',
    coefficient: 2,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000004,
    updatedAt: 1700000000004,
  },
  {
    id: 'subj-english',
    name: 'اللغة الإنجليزية',
    coefficient: 2,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000005,
    updatedAt: 1700000000005,
  },
  {
    id: 'subj-history',
    name: 'التاريخ والجغرافيا',
    coefficient: 2,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000006,
    updatedAt: 1700000000006,
  },
  {
    id: 'subj-islamic',
    name: 'التربية الإسلامية',
    coefficient: 2,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000007,
    updatedAt: 1700000000007,
  },
  {
    id: 'subj-philosophy',
    name: 'الفلسفة',
    coefficient: 3,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000008,
    updatedAt: 1700000000008,
  },
  {
    id: 'subj-cs',
    name: 'الإعلام الآلي',
    coefficient: 2,
    calculationMethod: {
      method: 'tests_avg_plus_exam_x2_div_3',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 2,
      description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    },
    createdAt: 1700000000009,
    updatedAt: 1700000000009,
  },
  {
    id: 'subj-sport',
    name: 'التربية البدنية والرياضية',
    coefficient: 1,
    calculationMethod: {
      method: 'arithmetic_mean',
      customTest1Weight: 1,
      customTest2Weight: 1,
      customExamWeight: 1,
      description: '(فرض 1 + فرض 2 + الاختبار) ÷ 3',
    },
    createdAt: 1700000000010,
    updatedAt: 1700000000010,
  },
];

export const CLASS_COLORS = [
  '#006233', // Algerian Emerald
  '#0284C7', // Sky Blue
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DC2626', // Red
  '#0D9488', // Teal
  '#E11D48', // Rose
  '#4B5563'  // Slate
];

export const INITIAL_TEACHER_PROFILE: TeacherProfile = {
  fullName: 'أ. عبد القادر بن العربي',
  wilaya: '16 - الجزائر',
  schoolName: 'ثانوية الإخوة حامية',
  subject: 'الرياضيات',
  academicYear: '2024 - 2025'
};

export const INITIAL_CLASSES: ClassItem[] = [
  {
    id: 'class-demo-1',
    name: '3 علوم تجريبية 1 (3 ع ت 1)',
    stage: 'secondary',
    grade: '3 ثانوي - علوم تجريبية (بكالوريا BAC)',
    subject: 'الرياضيات',
    room: 'المخبر 2',
    academicYear: '2024 - 2025',
    color: '#006233',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10
  },
  {
    id: 'class-demo-2',
    name: '2 تقني رياضي (2 ت ر)',
    stage: 'secondary',
    grade: '2 ثانوي - تقني رياضي',
    subject: 'الرياضيات',
    room: 'القاعة 14',
    academicYear: '2024 - 2025',
    color: '#0284C7',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8
  },
  {
    id: 'class-demo-3',
    name: '4 متوسط 2 (4 م 2)',
    stage: 'middle',
    grade: 'السنة الرابعة متوسط (شهادة BEM)',
    subject: 'الرياضيات',
    room: 'القاعة 05',
    academicYear: '2024 - 2025',
    color: '#D97706',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  }
];

export const INITIAL_STUDENTS: StudentItem[] = [
  {
    id: 'student-demo-1',
    classId: 'class-demo-1',
    studentNumber: '2024-001',
    firstName: 'أيمن',
    lastName: 'بوجمعة',
    gender: 'male',
    birthDate: '2007-04-12',
    guardianPhone: '0661234567',
    notes: 'تلميذ مجتهد ومشارك ممتاز في القسم',
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9
  },
  {
    id: 'student-demo-2',
    classId: 'class-demo-1',
    studentNumber: '2024-002',
    firstName: 'سارة',
    lastName: 'بلمختار',
    gender: 'female',
    birthDate: '2007-09-24',
    guardianPhone: '0550987654',
    notes: 'مسؤولة القسم - نتائج ممتازة',
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9
  },
  {
    id: 'student-demo-3',
    classId: 'class-demo-1',
    studentNumber: '2024-003',
    firstName: 'رياض',
    lastName: 'محدادي',
    gender: 'male',
    birthDate: '2007-01-15',
    guardianPhone: '0772334455',
    notes: 'يحتاج تركيز في حل الوضعيات الإدماجية',
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9
  },
  {
    id: 'student-demo-4',
    classId: 'class-demo-2',
    studentNumber: '2024-010',
    firstName: 'مريم',
    lastName: 'بن عيسى',
    gender: 'female',
    birthDate: '2008-06-18',
    guardianPhone: '0669112233',
    notes: 'دقيقة في إنجاز التجارب المخبرية',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7
  },
  {
    id: 'student-demo-5',
    classId: 'class-demo-2',
    studentNumber: '2024-011',
    firstName: 'إسلام',
    lastName: 'مباركي',
    gender: 'male',
    birthDate: '2008-11-03',
    guardianPhone: '0555443322',
    notes: 'انضباط عالي في الحضور',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7
  },
  {
    id: 'student-demo-6',
    classId: 'class-demo-3',
    studentNumber: '2024-025',
    firstName: 'ياسمين',
    lastName: 'زواوي',
    gender: 'female',
    birthDate: '2009-03-30',
    guardianPhone: '0770123456',
    notes: 'تتحضر لشهادة التعليم المتوسط BEM بجدية',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4
  }
];

export const WEEK_DAYS: { id: DayOfWeek; label: string; shortLabel: string }[] = [
  { id: 'sunday', label: 'الأحد', shortLabel: 'أحد' },
  { id: 'monday', label: 'الإثنين', shortLabel: 'إثنين' },
  { id: 'tuesday', label: 'الثلاثاء', shortLabel: 'ثلاثاء' },
  { id: 'wednesday', label: 'الأربعاء', shortLabel: 'أربعاء' },
  { id: 'thursday', label: 'الخميس', shortLabel: 'خميس' }
];

export const COMMON_TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '08:00 - 09:00 (ساعة 1)' },
  { start: '08:00', end: '10:00', label: '08:00 - 10:00 (ساعتان)' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00 (ساعة 2)' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00 (ساعة 3)' },
  { start: '10:00', end: '12:00', label: '10:00 - 12:00 (ساعتان)' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00 (ساعة 4)' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00 (ساعة 5)' },
  { start: '13:00', end: '15:00', label: '13:00 - 15:00 (ساعتان)' },
  { start: '14:00', end: '15:00', label: '14:00 - 15:00 (ساعة 6)' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00 (ساعة 7)' },
  { start: '15:00', end: '17:00', label: '15:00 - 17:00 (ساعتان)' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00 (ساعة 8)' }
];

export const INITIAL_SESSIONS: ScheduleSession[] = [
  {
    id: 'session-demo-1',
    dayOfWeek: 'sunday',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    startTime: '08:00',
    endTime: '10:00',
    room: 'المخبر 2',
    notes: 'حصة أعمال موجهة - دراسة الدوال العددية وتطبيقاتها',
    color: '#006233',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'session-demo-2',
    dayOfWeek: 'sunday',
    classId: 'class-demo-2',
    className: '2 تقني رياضي (2 ت ر)',
    subject: 'الرياضيات',
    startTime: '10:00',
    endTime: '11:00',
    room: 'القاعة 14',
    notes: 'درس نظري: المتتاليات العددية الحسابية والهندسية',
    color: '#0284C7',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'session-demo-3',
    dayOfWeek: 'monday',
    classId: 'class-demo-3',
    className: '4 متوسط 2 (4 م 2)',
    subject: 'الرياضيات',
    startTime: '08:00',
    endTime: '09:00',
    room: 'القاعة 05',
    notes: 'حل تمارين مقترحة لشهادة BEM',
    color: '#D97706',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4
  },
  {
    id: 'session-demo-4',
    dayOfWeek: 'monday',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    startTime: '13:00',
    endTime: '15:00',
    room: 'المخبر 2',
    notes: 'تقويم تشخيصي للوحدة التعليمية الثانية',
    color: '#006233',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4
  },
  {
    id: 'session-demo-5',
    dayOfWeek: 'tuesday',
    classId: 'class-demo-2',
    className: '2 تقني رياضي (2 ت ر)',
    subject: 'الرياضيات',
    startTime: '09:00',
    endTime: '11:00',
    room: 'القاعة 14',
    notes: 'أعمال موجهة وحل وضعيات إدماجية',
    color: '#0284C7',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'session-demo-6',
    dayOfWeek: 'wednesday',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    startTime: '10:00',
    endTime: '12:00',
    room: 'المخبر 2',
    notes: 'مراجعة حول الاشتقاقية وتطبيقاتها',
    color: '#006233',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'session-demo-7',
    dayOfWeek: 'thursday',
    classId: 'class-demo-3',
    className: '4 متوسط 2 (4 م 2)',
    subject: 'الرياضيات',
    startTime: '08:00',
    endTime: '10:00',
    room: 'القاعة 05',
    notes: 'فرض الفصل الأول التجريبي',
    color: '#D97706',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  }
];

export const COMMON_TEACHING_AIDS = [
  'الكتاب المدرسي المقرر',
  'السبورة والطبشور / الأقلام الملونة',
  'جهاز العرض الرقمي (Data Show)',
  'المخبر والأدوات التجريبية',
  'المجهر الضوئي والشرائح المجهرية',
  'جهاز الحاسوب وشاشات العرض',
  'مجسمات ونماذج تشريحية',
  'بطاقات ووثائق ومطبوعات تعليمية',
  'أوراق الأنشطة والأعمال الفردية',
  'مسلاط ومكبر صوت',
];

export const COMMON_DURATIONS = [
  '45 دقيقة',
  'ساعة واحدة (1 سا)',
  'ساعة ونصف (1 سا 30 د)',
  'ساعتان (2 سا)',
];

export const DEFAULT_LESSON_STAGES: LessonStage[] = [
  {
    id: 'stage-1',
    title: 'وضعية الانطلاق (التمهيد وإثارة المشكلة)',
    duration: '10 دقائق',
    content: 'تذكير بالمكتسبات القبلية وطرح تساؤل إشكالي يثير فضول التلاميذ وصياغة الفرضيات الأولية.',
  },
  {
    id: 'stage-2',
    title: 'مرحلة بناء التعلمات والبحث والتقصي',
    duration: '35 دقيقة',
    content: 'استغلال الوثائق والسندات والقيام بالنشاطات التجريبية أو التحليلية، واستخلاص النتائج والربط بين المفاهيم.',
  },
  {
    id: 'stage-3',
    title: 'مرحلة التقويم والتحصيل والإدماج',
    duration: '15 دقيقة',
    content: 'صياغة الخلاصة المعرفية وإنجاز تمرين تطبيقي أو وضعية إدماجية بسيطة لقياس مدى تحقق الكفاءة المستهدفة.',
  },
];

export const INITIAL_LESSONS: LessonPlan[] = [
  {
    id: 'lesson-demo-1',
    title: 'دراسة الدوال العددية: النهايات والاستمرار والاشتقاق',
    subject: 'الرياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    date: new Date().toISOString().slice(0, 10),
    duration: 'ساعتان (2 سا)',
    objectives: '1. التمكن من حساب النهايات باستعمال التزايد المقارن.\n2. دراسة تغيرات دالة أسية وتشكيل جدول التغيرات.\n3. تعيين معادلة المماس ورسم المنحنى البياني.',
    stages: [
      {
        id: 'st-1',
        title: 'وضعية الانطلاق والتذكير بالمكتسبات',
        duration: '15 دقيقة',
        content: 'تذكير بخواص النهايات وإجراء تمرين تمهيدي لحساب النهايات المرجعية.',
      },
      {
        id: 'st-2',
        title: 'النشاط الأول: دراسة اتجاه التغير وحساب المشتقة',
        duration: '40 دقيقة',
        content: 'حساب المشتقة الأولى لدالة مركبة ودراسة إشارتها وتحديد القيم الحدية.',
      },
      {
        id: 'st-3',
        title: 'النشاط الثاني: المناقشة البيانية والمماس',
        duration: '45 دقيقة',
        content: 'تعيين نقاط التقاطع مع حاملي المحورين ورسم المنحنى البياني.',
      },
      {
        id: 'st-4',
        title: 'التقويم المرحلي والإدماج',
        duration: '20 دقيقة',
        content: 'حل مسألة إدماجية نموذجية وتدوين النتيجة في كراس الدروس.',
      },
    ],
    teachingAids: 'الكتاب المدرسي، جهاز العرض الرقمي (Data Show)، حاسبة بيانية، السبورة.',
    teacherNotes: 'تفاعل التلاميذ كان ممتازاً في إزالة حالات عدم التعيين.',
    color: '#006233',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'lesson-demo-2',
    title: 'الحساب الحرفي والنشر والتحليل',
    subject: 'الرياضيات',
    classId: 'class-demo-3',
    className: '4 متوسط 2 (4 م 2)',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    duration: 'ساعة واحدة (1 سا)',
    objectives: '1. توظيف المتطابقات الشهيرة في النشر والتبسيط.\n2. تحليل عبارة جبرية إلى جداء عاملين من الدرجة الأولى.\n3. حل معادلة جداء معدوم.',
    stages: [
      {
        id: 'st-201',
        title: 'الوضعية المشكلة والتمهيد',
        duration: '10 دقائق',
        content: 'حساب مساحة مستطيل أبعاده بدلالة x بطريقتين وملاحظة التطابق بين العبارتين.',
      },
      {
        id: 'st-202',
        title: 'بناء التعلمات والتطبيق الموجه',
        duration: '35 دقيقة',
        content: 'تطبيق المتطابقات الشهيرة في التحليل وتدريب التلاميذ على استخراج العامل المشترك.',
      },
      {
        id: 'st-203',
        title: 'الإدماج والتقويم الفردي',
        duration: '15 دقيقة',
        content: 'حل تمرين تدريبي فردي على الألواح وتصحيحه جماعياً على السبورة.',
      },
    ],
    teachingAids: 'الكتاب المدرسي ص 14، بطاقات القوانين، السبورة.',
    teacherNotes: 'ضرورة تثبيت قاعدة إشارة السالب قبل القوس عند التحليل مع بعض التلاميذ.',
    color: '#D97706',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
];

export const INITIAL_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 'assess-demo-1',
    title: 'التقويم المستمر والمشاركة الفصلية',
    type: 'continuous',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    trimester: 'T1',
    date: '2024-10-15',
    coefficient: 1,
    maxScore: 20,
    notes: 'تقييم شامل للانضباط، حل الواجبات المنزلية، والمشاركة الصفية الفعالة.',
    grades: {
      'student-demo-1': { score: 17.5, isAbsent: false, note: 'مشاركة ممتازة والتزام بالواجبات' },
      'student-demo-2': { score: 19.0, isAbsent: false, note: 'مسؤولة ومنضبطة جداً' },
      'student-demo-3': { score: 13.0, isAbsent: false, note: 'يحتاج تحسين إنجاز الواجبات المنزلية' },
    },
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'assess-demo-2',
    title: 'الفرض المحروس الأول - الفصل الأول',
    type: 'test',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    trimester: 'T1',
    date: '2024-11-05',
    coefficient: 1,
    maxScore: 20,
    notes: 'حول الوحدة الأولى: الدوال العددية والنهايات.',
    grades: {
      'student-demo-1': { score: 16.5, isAbsent: false, note: 'إجابة منهجية ممتازة في التمرين الأول' },
      'student-demo-2': { score: 18.0, isAbsent: false, note: 'علامة كاملة في دراسة التغيرات' },
      'student-demo-3': { score: 11.5, isAbsent: false, note: 'نقص في الربط بين المعطيات' },
    },
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'assess-demo-3',
    title: 'اختبار الفصل الأول الرسمي',
    type: 'exam',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    subject: 'الرياضيات',
    trimester: 'T1',
    date: '2024-12-03',
    coefficient: 2,
    maxScore: 20,
    notes: 'مواضيع مطابقة لمنهجية البكالوريا الرسمية.',
    grades: {
      'student-demo-1': { score: 16.0, isAbsent: false, note: 'حل دقيق لمسألة الدوال' },
      'student-demo-2': { score: 18.5, isAbsent: false, note: 'أعلى علامة في القسم' },
      'student-demo-3': { score: 12.0, isAbsent: false, note: 'تحسن في حساب المشتقات' },
    },
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'assess-demo-4',
    title: 'الفرض الأول - الفصل الأول',
    type: 'test',
    classId: 'class-demo-2',
    className: '2 تقني رياضي (2 ت ر)',
    subject: 'الرياضيات',
    trimester: 'T1',
    date: '2024-11-08',
    coefficient: 1,
    maxScore: 20,
    notes: 'المتتاليات العددية.',
    grades: {
      'student-demo-4': { score: 15.0, isAbsent: false, note: 'عمل منظم' },
      'student-demo-5': { score: 14.5, isAbsent: false, note: 'مستوى جيد' },
    },
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'assess-demo-5',
    title: 'تقويم الأنشطة والمشاريع',
    type: 'activity',
    classId: 'class-demo-3',
    className: '4 متوسط 2 (4 م 2)',
    subject: 'الرياضيات',
    trimester: 'T1',
    date: '2024-10-22',
    coefficient: 1,
    maxScore: 20,
    notes: 'إنجاز بحث ومجسم هندسي حول مبرهنة طاليس.',
    grades: {
      'student-demo-6': { score: 17.0, isAbsent: false, note: 'مجسم رائع وعرض شفهي مميز' },
    },
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'class-demo-1_2024-11-03',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    date: '2024-11-03',
    period: 'كامل اليوم',
    totalStudents: 3,
    presentCount: 3,
    absentCount: 0,
    records: {
      'student-demo-1': { studentId: 'student-demo-1', status: 'present', updatedAt: 1700000000000 },
      'student-demo-2': { studentId: 'student-demo-2', status: 'present', updatedAt: 1700000000000 },
      'student-demo-3': { studentId: 'student-demo-3', status: 'present', updatedAt: 1700000000000 },
    },
    notes: 'حضور كامل للقسم وانضباط ممتاز في بداية الأسبوع.',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'class-demo-1_2024-11-05',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    date: '2024-11-05',
    period: 'الفترة الصباحية',
    totalStudents: 3,
    presentCount: 2,
    absentCount: 1,
    records: {
      'student-demo-1': { studentId: 'student-demo-1', status: 'present', updatedAt: 1700000000000 },
      'student-demo-2': { studentId: 'student-demo-2', status: 'present', updatedAt: 1700000000000 },
      'student-demo-3': { studentId: 'student-demo-3', status: 'absent', note: 'غياب مبرر بشهادة طبية', updatedAt: 1700000000000 },
    },
    notes: 'غياب التلميذ رياض محدادي لظرف صحي.',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'class-demo-1_2024-11-07',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    date: '2024-11-07',
    period: 'كامل اليوم',
    totalStudents: 3,
    presentCount: 3,
    absentCount: 0,
    records: {
      'student-demo-1': { studentId: 'student-demo-1', status: 'present', updatedAt: 1700000000000 },
      'student-demo-2': { studentId: 'student-demo-2', status: 'present', note: 'تأخر 5 دقائق وتم التنبيه', updatedAt: 1700000000000 },
      'student-demo-3': { studentId: 'student-demo-3', status: 'present', updatedAt: 1700000000000 },
    },
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  }
];

export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'lib-item-1',
    title: 'ملخص شامل لوحدة الدوال الأسية واللوغاريتمية',
    description: 'مراجعة بيداغوجية مركزة تشمل الخواص الجبرية، النهايات الشهيرة، المشتقات، ودراسة التغيرات مع أمثلة تطبيقية.',
    itemType: 'note',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    folderName: 'ملخصات ودروس',
    content: `# ملخص وحدة الدوال الأسية (Exp)
    
## 1. التعريف والخواص الأساسية:
- الدالة الأسية النيبيرية هي الدالة المعرفة على R بـ: f(x) = e^x
- الدالة e^x موجبة تماماً دوماً لكل x ينتمي إلى R (e^x > 0)
- e^0 = 1 و e^1 ≈ 2.718

## 2. الخواص الجبرية:
- e^(a + b) = e^a × e^b
- e^(a - b) = e^a / e^b
- e^(-a) = 1 / e^a
- (e^a)^n = e^(n × a)

## 3. النهايات الشهيرة:
- lim (e^x) عندما x -> +∞ = +∞
- lim (e^x) عندما x -> -∞ = 0
- lim (e^x / x) عندما x -> +∞ = +∞ (تزايد مقارن)
- lim (x × e^x) عندما x -> -∞ = 0

## 4. الاشتقاق:
- مشتقة (e^x) هي e^x
- مشتقة [e^u(x)] هي: u'(x) × e^u(x)

*ملاحظة توجيهية: التركيز على حالات عدم التعيين وكيفية إزالتها باستعمال النهايات المرجعية والتزايد المقارن.*`,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'lib-item-2',
    title: 'نموذج الفرض المحروس الأول - الفصل الأول',
    description: 'موضوع الفرض المحروس الأول مع سلم التنقيط المعتمد، يحتوي على مسألة شاملة لدراسة دالة ناطقة وتمارين المتتاليات.',
    itemType: 'file',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    folderName: 'فروض واختبارات',
    fileName: 'devoir_1_math_3as.pdf',
    fileType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: 485200, // ~473 KB
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'lib-item-3',
    title: 'سلسلة تمارين الدعم والتعزيز في المتتاليات العددية',
    description: 'تتضمن 15 تمريناً متدرج الصعوبة من مواضيع البكالوريا الجزائرية السابقة مع حلول استرشادية.',
    itemType: 'file',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    folderName: 'سلاسل تمارين',
    fileName: 'serie_suites_bac.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileExtension: 'docx',
    fileSize: 824500, // ~805 KB
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'lib-item-4',
    title: 'مخطط التوزيع السنوي الرسمي لمنهاج الرياضيات 2024-2025',
    description: 'التوزيع البيداغوجي المعتمد من المفتشية العامة للبيداغوجيا بوزارة التربية الوطنية مع جدول الحجم الساعي للوحدات.',
    itemType: 'file',
    subject: 'رياضيات',
    folderName: 'وثائق بيداغوجية',
    fileName: 'repartition_annuelle_math.pdf',
    fileType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: 1250300, // ~1.19 MB
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'lib-item-5',
    title: 'مخطط بياني توضيحي لمشتقات الدوال وإشاراتها',
    description: 'رسم توضيحي عالي الدقة يوضح الربط الهندسي بين الدالة المشتقة والمماس وجدول التغيرات.',
    itemType: 'file',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    folderName: 'ملخصات ودروس',
    fileName: 'graphe_derivees.png',
    fileType: 'image/png',
    fileExtension: 'png',
    fileSize: 312400, // ~305 KB
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  }
];

const getIsoDateWithOffset = (offsetDays: number): string => {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const INITIAL_REMINDERS: ReminderItem[] = [
  {
    id: 'reminder-1',
    title: 'تسليم مواضيع الفروض المحروسة للمصلحة البيداغوجية',
    notes: 'إرفاق سلم التنقيط النموذجي وعناصر الإجابة لمفتشية المادة وناظر الثانوية.',
    dueDate: getIsoDateWithOffset(0), // اليوم
    dueTime: '10:00',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    isCompleted: false,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'reminder-2',
    title: 'جلسة التنسيق والتشاور لمادة الرياضيات',
    notes: 'مناقشة التقدم في التوزيع السنوي وضبط مواعيد الفرض الثاني مع أساتذة الشعب العلمية.',
    dueDate: getIsoDateWithOffset(1), // غداً
    dueTime: '13:30',
    subject: 'رياضيات',
    isCompleted: false,
    priority: 'medium',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'reminder-3',
    title: 'تصحيح أوراق الفرض الأول ورصد العلامات في التطبيق',
    notes: 'إعداد شبكة التقويم وتحليل الأخطاء الشائعة للتلاميذ قبل تقديم الحصة التصحيحية.',
    dueDate: getIsoDateWithOffset(3),
    dueTime: '16:00',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    isCompleted: false,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'reminder-4',
    title: 'تحضير مذكرة وضعية الانطلاق لوحدة المتتاليات الهندسية',
    notes: 'تجهيز السند التعليمي وتمارين التهيئة من الكتاب المدرسي.',
    dueDate: getIsoDateWithOffset(-2), // منتهية ومكتملة
    dueTime: '08:00',
    subject: 'رياضيات',
    classId: 'class-demo-1',
    className: '3 علوم تجريبية 1 (3 ع ت 1)',
    isCompleted: true,
    priority: 'low',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  }
];

