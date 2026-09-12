import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  Pencil, 
  Trash2, 
  Layers, 
  ArrowLeft,
  School
} from 'lucide-react';
import { ClassItem, EducationalStage, StudentItem } from '../../types';

interface ClassesViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  onOpenAddClass: () => void;
  onEditClass: (classItem: ClassItem) => void;
  onDeleteClass: (classId: string, className: string) => void;
  onViewClassStudents: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  onOpenAddClass,
  onEditClass,
  onDeleteClass,
  onViewClassStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchStage = selectedStage === 'all' || c.stage === selectedStage;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        (c.room && c.room.toLowerCase().includes(q));

      return matchStage && matchSearch;
    });
  }, [classes, selectedStage, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              إدارة الأقسام التربوية
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تنظيم الأفواج والأقسام المسندة إليك بحسب الأطوار والمستويات التعليمية في الجزائر.
          </p>
        </div>

        <button
          onClick={onOpenAddClass}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Filters Bar: Search & Stage tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم القسم، المادة، أو الشعبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedStage === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            الكل ({classes.length})
          </button>
          <button
            onClick={() => setSelectedStage('middle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedStage === 'middle'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            متوسط ({classes.filter((c) => c.stage === 'middle').length})
          </button>
          <button
            onClick={() => setSelectedStage('secondary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedStage === 'secondary'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ثانوي ({classes.filter((c) => c.stage === 'secondary').length})
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <School className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            لا توجد أقسام تطابق البحث
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `لم يتم العثور على نتائج توافق "${searchQuery}".`
              : 'لم تقم بإضافة أقسام في هذا الطور بعد.'}
          </p>
          <button
            onClick={onOpenAddClass}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
          >
            + إضافة قسم جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const classStudentCount = students.filter((s) => s.classId === cls.id).length;
            const stageLabel =
              cls.stage === 'secondary'
                ? 'التعليم الثانوي'
                : 'التعليم المتوسط';

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Color, Title, and Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cls.color || '#006233' }}
                      />
                      <div>
                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                          {cls.name}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {stageLabel}
                        </span>
                      </div>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1 opacity-90">
                      <button
                        onClick={() => onEditClass(cls)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="تعديل بيانات القسم"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(cls.id, cls.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Class Metadata */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الشعبة / المستوى:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{cls.grade}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المادة:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{cls.subject}</span>
                    </div>
                    {cls.room && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">الحجرة:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{cls.room}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الموسم الدراسي:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{cls.academicYear}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Student count & direct view students */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{classStudentCount} طالب</span>
                  </div>

                  <button
                    onClick={() => onViewClassStudents(cls.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                  >
                    <span>قائمة الطلاب</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
