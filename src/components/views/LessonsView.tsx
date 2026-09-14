import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, BookOpen, Calendar, Clock, Layers, 
  Trash2, Edit, Eye, GraduationCap, Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { LessonPlan, ClassItem, TeacherProfile } from '../../types';
import { LessonDetailModal } from '../modals/LessonDetailModal';
import { getSubjectsForGradeAndStage } from '../../data/algerianData';

interface LessonsViewProps {
  lessons: LessonPlan[];
  classes: ClassItem[];
  profile?: TeacherProfile;
  onOpenAddLesson: (defaultClassId?: string) => void;
  onEditLesson: (lesson: LessonPlan) => void;
  onDeleteLesson: (lessonId: string, lessonTitle: string) => void;
  onNavigateToClasses: () => void;
}

export function LessonsView({
  lessons,
  classes,
  profile,
  onOpenAddLesson,
  onEditLesson,
  onDeleteLesson,
  onNavigateToClasses,
}: LessonsViewProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [detailModalLesson, setDetailModalLesson] = useState<LessonPlan | null>(null);

  // Derive unique subjects from lessons and classes (with grade-awareness for selected class)
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    
    if (selectedClassFilter !== 'all') {
      const matchedClass = classes.find((c) => c.id === selectedClassFilter);
      if (matchedClass) {
        const gradeSubjects = getSubjectsForGradeAndStage(matchedClass.stage, matchedClass.grade, [matchedClass.subject]);
        gradeSubjects.forEach((s) => set.add(s));
      }
      lessons
        .filter((l) => l.classId === selectedClassFilter)
        .forEach((l) => {
          if (l.subject) set.add(l.subject.trim());
        });
    } else {
      classes.forEach((c) => {
        if (c.subject) set.add(c.subject.trim());
        const gradeSubjects = getSubjectsForGradeAndStage(c.stage, c.grade, [c.subject]);
        gradeSubjects.forEach((s) => set.add(s));
      });
      lessons.forEach((l) => {
        if (l.subject) set.add(l.subject.trim());
      });
    }
    
    return Array.from(set);
  }, [classes, lessons, selectedClassFilter]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      // 1. Search filter (title, objectives, aids, notes, subject)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = lesson.title.toLowerCase().includes(query);
        const matchesSubject = lesson.subject.toLowerCase().includes(query);
        const matchesObjectives = (lesson.objectives || '').toLowerCase().includes(query);
        const matchesAids = (lesson.teachingAids || '').toLowerCase().includes(query);
        const matchesNotes = (lesson.teacherNotes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesObjectives && !matchesAids && !matchesNotes) {
          return false;
        }
      }

      // 2. Class filter
      if (selectedClassFilter !== 'all' && lesson.classId !== selectedClassFilter) {
        return false;
      }

      // 3. Subject filter
      if (selectedSubjectFilter !== 'all' && lesson.subject !== selectedSubjectFilter) {
        return false;
      }

      // 4. Date filter
      if (selectedDateFilter && lesson.date !== selectedDateFilter) {
        return false;
      }

      return true;
    });
  }, [lessons, searchQuery, selectedClassFilter, selectedSubjectFilter, selectedDateFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedClassFilter !== 'all' || selectedSubjectFilter !== 'all' || selectedDateFilter !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClassFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedDateFilter('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>المذكرات والتحضير البيداغوجي</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white/90 text-xs font-semibold">
                محلي 100% بدون إنترنت
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              تحضير الدروس والمذكرات البيداغوجية
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              إعداد وتدوين أهداف الدروس، مراحل سير الحصة التعليمية، الوسائل والسندات، وملاحظات الأستاذ مع حفظ فوري على ذاكرة الهاتف.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onOpenAddLesson(selectedClassFilter !== 'all' ? selectedClassFilter : undefined)}
              disabled={classes.length === 0}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-black shadow-lg shadow-black/10 transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>تحضير درس جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Banner Row */}
        <div className="mt-6 pt-5 border-t border-emerald-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-right">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-emerald-200/90 block">إجمالي التحاضير</span>
            <span className="text-lg sm:text-xl font-black text-white">{lessons.length}</span>
            <span className="text-[10px] text-emerald-200/70 mr-1">درس محفوظ</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-emerald-200/90 block">المواد المحضرة</span>
            <span className="text-lg sm:text-xl font-black text-white">{availableSubjects.length}</span>
            <span className="text-[10px] text-emerald-200/70 mr-1">مادة دراسية</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-emerald-200/90 block">الأقسام المغطاة</span>
            <span className="text-lg sm:text-xl font-black text-white">
              {new Set(lessons.map((l) => l.classId)).size}
            </span>
            <span className="text-[10px] text-emerald-200/70 mr-1">من أصل {classes.length}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-emerald-200/90 block">قاعدة البيانات</span>
            <span className="text-xs sm:text-sm font-black text-emerald-300">IndexedDB</span>
            <span className="text-[10px] text-emerald-200/70 block">تخزين آمن ومحلي</span>
          </div>
        </div>
      </div>

      {/* Warning if no classes exist */}
      {classes.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                لا توجد أقسام مسجلة بعد!
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                لربط التحضير بالقسم التربوي، قم بإضافة قسمك أولاً في صفحة الأقسام.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToClasses}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
          >
            إضافة قسم الآن
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، الأهداف، الوسائل..."
              className="w-full pr-10 pl-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">جميع الأقسام التربوية ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="all">جميع المواد التعليمية ({availableSubjects.length})</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              title="تصفية حسب التاريخ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition shrink-0"
                title="إعادة ضبط الفلاتر"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            عرض <strong className="text-slate-900 dark:text-white">{filteredLessons.length}</strong> من إجمالي {lessons.length} درس محضّر
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              مسح الفلاتر المطبقة
            </button>
          )}
        </div>
      </div>

      {/* Lesson Plans List Grid */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {hasActiveFilters ? 'لا توجد نتائج تطابق خيارات البحث' : 'لم تقم بإضافة أي تحضير دروس بعد'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {hasActiveFilters
                ? 'جرب تغيير معايير البحث أو اختيار قسم ومادة مختلفة أو مسح الفلاتر.'
                : 'ابدأ الآن بتسجيل أول مذكرة درس مع الأهداف والكفاءات ومراحل سير الحصة والوسائل المستعملة.'}
            </p>
          </div>
          <div className="pt-2">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                مسح الفلاتر
              </button>
            ) : (
              <button
                onClick={() => onOpenAddLesson()}
                disabled={classes.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition transform active:scale-95 disabled:opacity-50"
              >
                تحضير درس جديد
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredLessons.map((lesson) => {
            const classObj = classes.find((c) => c.id === lesson.classId);
            const className = lesson.className || (classObj ? classObj.name : 'قسم غير محدد');

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header Color Bar */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: lesson.color || '#006233' }}
                  />

                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/60">
                        {lesson.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {className}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3
                        onClick={() => setDetailModalLesson(lesson)}
                        className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition cursor-pointer leading-snug line-clamp-2"
                      >
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lesson.date}</span>
                        </span>
                        {lesson.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lesson.duration}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Objectives Snippet */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">
                        الأهداف والكفاءات:
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {lesson.objectives || 'لا توجد أهداف مسجلة.'}
                      </p>
                    </div>

                    {/* Stages Count & Teaching Aids */}
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lesson.stages?.length || 0} مراحل سير الدرس</span>
                      </div>
                      {lesson.teachingAids && (
                        <div className="text-[11px] text-slate-400 truncate">
                          <strong className="text-slate-600 dark:text-slate-300">الوسائل: </strong>
                          {lesson.teachingAids}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailModalLesson(lesson)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض المذكرة</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditLesson(lesson)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition"
                      title="تعديل التحضير"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLesson(lesson.id, lesson.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 transition"
                      title="حذف التحضير"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lesson Detail / Printable Modal */}
      <LessonDetailModal
        lesson={detailModalLesson}
        isOpen={Boolean(detailModalLesson)}
        onClose={() => setDetailModalLesson(null)}
        onEdit={(lesson) => {
          setDetailModalLesson(null);
          onEditLesson(lesson);
        }}
        onDelete={(lessonId, lessonTitle) => {
          setDetailModalLesson(null);
          onDeleteLesson(lessonId, lessonTitle);
        }}
        classes={classes}
        profile={profile}
      />
    </div>
  );
}
