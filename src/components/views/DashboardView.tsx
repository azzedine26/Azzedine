import React from 'react';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  School, 
  Sparkles,
  Database,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  FileText,
  Bell,
  Folder
} from 'lucide-react';
import { ClassItem, StudentItem, TeacherProfile, ActiveTab, ScheduleSession, LessonPlan, AssessmentItem, AttendanceRecord, ReminderItem, LibraryItem } from '../../types';
import { ASSESSMENT_TYPE_INFO, TRIMESTER_INFO } from '../../utils/gradeCalculations';

interface DashboardViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  sessions?: ScheduleSession[];
  lessons?: LessonPlan[];
  assessments?: AssessmentItem[];
  attendanceRecords?: AttendanceRecord[];
  reminders?: ReminderItem[];
  libraryItems?: LibraryItem[];
  profile: TeacherProfile;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddClass: () => void;
  onOpenAddStudent: () => void;
  onOpenAddLesson?: () => void;
  onOpenAddAssessment?: () => void;
  onSelectClass: (classId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  sessions = [],
  lessons = [],
  assessments = [],
  attendanceRecords = [],
  reminders = [],
  libraryItems = [],
  profile,
  onNavigateTab,
  onOpenAddClass,
  onOpenAddStudent,
  onOpenAddLesson,
  onOpenAddAssessment,
  onSelectClass,
}) => {
  // Compute Stats
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === 'male').length;
  const femaleStudents = students.filter((s) => s.gender === 'female').length;
  const totalSessions = sessions.length;
  const totalLessons = lessons.length;
  const totalAssessments = assessments.length;
  const pendingReminders = reminders.filter((r) => !r.isCompleted);

  // Format today's date in Arabic
  const todayArabic = new Intl.DateTimeFormat('ar-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Recent 5 students
  const recentStudents = [...students].slice(0, 5);
  // Recent 3 lessons
  const recentLessons = [...lessons].slice(0, 3);
  // Recent 3 assessments
  const recentAssessments = [...assessments].slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Teacher Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl translate-x-10 translate-y-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayArabic}</span>
              <span className="opacity-50">•</span>
              <span>الموسم: {profile.academicYear || '2024 - 2025'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              أهلاً بك، {profile.fullName || 'أستاذنا الفاضل'}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-emerald-100/90 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs text-white font-bold text-xs border border-white/20">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {profile.stage === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-300" />
                <span>{profile.schoolName || 'المؤسسة التربوية'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-300" />
                <span>{profile.wilaya || 'الجزائر'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>مادة التدريس: {profile.subject || 'الرياضيات'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddClass}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>إضافة قسم</span>
            </button>
            <button
              onClick={onOpenAddStudent}
              disabled={classes.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold border border-emerald-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل طالب</span>
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold border border-emerald-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>الحضور والغياب</span>
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold border border-indigo-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>الوثائق والتقارير</span>
            </button>
            <button
              onClick={() => onNavigateTab('grades')}
              className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold border border-amber-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>النقاط والمعدلات</span>
            </button>
            <button
              onClick={() => onNavigateTab('lessons')}
              className="px-4 py-2.5 rounded-xl bg-teal-600/90 hover:bg-teal-600 text-white text-xs sm:text-sm font-bold border border-teal-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-teal-200" />
              <span>تحضير الدروس</span>
            </button>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold border border-emerald-400/30 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>الجدول الأسبوعي</span>
            </button>
            <button
              onClick={() => onNavigateTab('library')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold border border-emerald-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-emerald-200" />
              <span>المكتبة {libraryItems.length > 0 ? `(${libraryItems.length})` : ''}</span>
            </button>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold border border-amber-400/40 shadow-md transition transform active:scale-95 flex items-center gap-2"
            >
              <Bell className="w-4 h-4 text-amber-200" />
              <span>التذكيرات {pendingReminders.length > 0 ? `(${pendingReminders.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Classes */}
        <div 
          onClick={() => onNavigateTab('classes')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الأقسام</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalClasses}
            </span>
            <span className="text-xs text-slate-400 font-medium">قسم</span>
          </div>
        </div>

        {/* Total Students */}
        <div 
          onClick={() => onNavigateTab('students')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStudents}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              ({maleStudents}ذ/{femaleStudents}ث)
            </span>
          </div>
        </div>

        {/* Total Assessments */}
        <div 
          onClick={() => onNavigateTab('grades')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">النقاط والتقييم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalAssessments}
            </span>
            <span className="text-xs text-slate-400 font-medium">تقييم مسجل</span>
          </div>
        </div>

        {/* Total Lessons Prepared */}
        <div 
          onClick={() => onNavigateTab('lessons')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تحضير الدروس</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalLessons}
            </span>
            <span className="text-xs text-slate-400 font-medium">مذكرة</span>
          </div>
        </div>

        {/* Weekly Schedule Sessions */}
        <div 
          onClick={() => onNavigateTab('schedule')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الجدول الأسبوعي</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSessions}
            </span>
            <span className="text-xs text-slate-400 font-medium">حصة/أسبوع</span>
          </div>
        </div>

        {/* Attendance Sessions */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الغياب والحضور</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {attendanceRecords.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">جلسة رصد</span>
          </div>
        </div>

        {/* Total Library Items */}
        <div 
          onClick={() => onNavigateTab('library')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المكتبة والملفات</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {libraryItems.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">عنصر</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Classes + Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Overview (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                الأقسام التربوية
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('classes')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>عرض كل الأقسام</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {classes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لم تقم بإضافة أي قسم بعد
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ابدأ بإضافة أول قسم لك لتسجيل طلابك وتسييرهم دون إنترنت.
              </p>
              <button
                onClick={onOpenAddClass}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
              >
                + إضافة قسم جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {classes.map((cls) => {
                const classStudentCount = students.filter((s) => s.classId === cls.id).length;
                return (
                  <div
                    key={cls.id}
                    onClick={() => onSelectClass(cls.id)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 mt-1" 
                          style={{ backgroundColor: cls.color || '#006233' }}
                        />
                        <div className="flex-1">
                          <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                            {cls.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {cls.grade}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {cls.stage === 'secondary' ? 'ثانوي' : cls.stage === 'middle' ? 'متوسط' : 'ابتدائي'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>المادة: {cls.subject}</span>
                        {cls.room && <span>{cls.room}</span>}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {classStudentCount} طالب
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClass(cls.id);
                            onNavigateTab('attendance');
                          }}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition flex items-center gap-1"
                          title="رصد غياب وحضور هذا القسم"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>الغياب</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClass(cls.id);
                            onNavigateTab('reports');
                          }}
                          className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition flex items-center gap-1"
                          title="إنشاء تقارير وكشوف هذا القسم"
                        >
                          <Printer className="w-3 h-3" />
                          <span>التقارير</span>
                        </button>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mr-1">
                          الطلاب
                          <ArrowLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Students Side List (1 col on lg) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                آخر الطلاب
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
            {recentStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                لا يوجد طلاب مسجلين حالياً.
              </div>
            ) : (
              recentStudents.map((st) => {
                const assignedClass = classes.find((c) => c.id === st.classId);
                return (
                  <div key={st.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        st.gender === 'female' 
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                          : 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300'
                      }`}>
                        {st.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {st.lastName} {st.firstName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {assignedClass ? assignedClass.name : 'بدون قسم'}
                          {st.studentNumber ? ` • ${st.studentNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      st.gender === 'female'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                        : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                    }`}>
                      {st.gender === 'female' ? 'أنثى' : 'ذكر'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Offline Database Indicator Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <strong className="block font-bold mb-0.5">التخزين المحلي الآمن (IndexedDB)</strong>
              بيانات أقسامك، طلابك، مذكراتك وجدولك محفوظة كلياً داخل جهازك دون الحاجة لأي اتصال بالإنترنت.
            </div>
          </div>

          {/* Quick Reminders Card */}
          <div 
            onClick={() => onNavigateTab('reminders')}
            className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3 cursor-pointer hover:border-amber-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-950 dark:text-amber-200 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <strong className="block font-bold mb-0.5">التذكيرات والمهام المستحقة</strong>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  {pendingReminders.length} معلقة
                </span>
              </div>
              <p className="line-clamp-2 text-slate-600 dark:text-amber-300/80 mt-0.5">
                {pendingReminders.length > 0
                  ? `أقرب موعد: ${pendingReminders[0].title}`
                  : 'لا توجد مهام معلقة، اضغط لفتح صفحة التذكيرات.'}
              </p>
            </div>
          </div>

          {/* Quick Reports Card */}
          <div 
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex items-start gap-3 cursor-pointer hover:border-indigo-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Printer className="w-4 h-4" />
            </div>
            <div className="text-xs text-indigo-950 dark:text-indigo-200">
              <strong className="block font-bold mb-0.5">الوثائق والتقارير الرسمية</strong>
              طباعة كشوف النقاط، بطاقات المتابعة، محاضر الغياب وإشعارات الأولياء بصيغة PDF.
            </div>
          </div>

          {/* Quick Library Card */}
          <div 
            onClick={() => onNavigateTab('library')}
            className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3 cursor-pointer hover:border-emerald-400 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Folder className="w-4 h-4" />
            </div>
            <div className="text-xs text-emerald-950 dark:text-emerald-200">
              <strong className="block font-bold mb-0.5">مكتبة الدروس والملفات ({libraryItems.length})</strong>
              تخزين محلي للمذكرات والملفات (PDF، Word، صور) مع إمكانية الفتح والمراجعة بدون إنترنت.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lesson Plans Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                آخر المذكرات وتحاضير الدروس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة الدروس المحضرة والمحفوظة في قاعدة بيانات الهاتف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddLesson && (
              <button
                onClick={onOpenAddLesson}
                disabled={classes.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold border border-teal-200 dark:border-teal-800/80 transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تحضير درس جديد</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('lessons')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>عرض كل المذكرات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentLessons.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              لم تسجل أي مذكرة تحضير دروس بعد. يمكنك البدء الآن بإنشاء مذكرتك الأولى!
            </p>
            {onOpenAddLesson && (
              <button
                onClick={onOpenAddLesson}
                disabled={classes.length === 0}
                className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition disabled:opacity-50"
              >
                + تحضير أول درس
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentLessons.map((lesson) => {
              const classObj = classes.find((c) => c.id === lesson.classId);
              const className = lesson.className || (classObj ? classObj.name : 'قسم غير محدد');
              return (
                <div
                  key={lesson.id}
                  onClick={() => onNavigateTab('lessons')}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500/60 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {lesson.subject}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lesson.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition line-clamp-1">
                      {lesson.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {lesson.objectives || 'لا توجد أهداف مدونة'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{className}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{lesson.duration || 'حصة'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Assessments Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                آخر الفروض والتقييمات المسجلة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة رصد النقاط، الفروض المحروسة والاختبارات الفصلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddAssessment && (
              <button
                onClick={onOpenAddAssessment}
                disabled={classes.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold border border-amber-200 dark:border-amber-800/80 transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تقييم جديد</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('grades')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>فتح كشوف النقاط</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentAssessments.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              لم تسجل أي تقييم أو فرض بعد. يمكنك البدء الآن بإضافة أول تقييم ورصد نقاط تلاميذك!
            </p>
            {onOpenAddAssessment && (
              <button
                onClick={onOpenAddAssessment}
                disabled={classes.length === 0}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition disabled:opacity-50"
              >
                + إنشاء أول تقييم
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentAssessments.map((assessment) => {
              const classObj = classes.find((c) => c.id === assessment.classId);
              const className = assessment.className || (classObj ? classObj.name : 'قسم');
              const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type];
              const gradedCount = (Object.values(assessment.grades || {}) as Array<{ score: number | null; isAbsent: boolean }>).filter(
                (g) => typeof g.score === 'number' || g.isAbsent
              ).length;

              return (
                <div
                  key={assessment.id}
                  onClick={() => onNavigateTab('grades')}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/60 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.colorBg} ${typeInfo.colorText} ${typeInfo.colorBorder}`}>
                        {typeInfo.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {assessment.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition line-clamp-1">
                      {assessment.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      المادة: {assessment.subject} • المعامل: {assessment.coefficient}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{className}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {gradedCount} نقطة مرصودة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
