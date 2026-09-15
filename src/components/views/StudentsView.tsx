import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Pencil, 
  Trash2,
  GraduationCap,
  FileSpreadsheet,
  Upload,
  Download,
  FileDown,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { ClassItem, StudentItem, TeacherProfile } from '../../types';
import { exportStudentsListDocx } from '../../utils/docxService';
import { exportStudentsListPdf } from '../../utils/pdfService';

interface StudentsViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  profile?: TeacherProfile;
  selectedClassIdFilter?: string;
  onSelectClassFilter: (classId: string) => void;
  onOpenAddStudent: () => void;
  onEditStudent: (studentItem: StudentItem) => void;
  onDeleteStudent: (studentId: string, studentName: string) => void;
  onNavigateToClasses: () => void;
  onOpenImportExcel: () => void;
  onExportExcel: () => void;
  onDownloadTemplate: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  classes,
  students,
  profile,
  selectedClassIdFilter = 'all',
  onSelectClassFilter,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
  onNavigateToClasses,
  onOpenImportExcel,
  onExportExcel,
  onDownloadTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  const fallbackProfile: TeacherProfile = profile || {
    fullName: 'أستاذ المادة',
    schoolName: '',
    subject: '',
    academicYear: '2024 - 2025',
    wilaya: '',
  };

  const handleExportStudentsPdf = async () => {
    if (isExportingPdf || filteredStudents.length === 0) return;
    setIsExportingPdf(true);
    setExportErrorMessage(null);
    try {
      const targetClass = selectedClassIdFilter !== 'all' ? classes.find(c => c.id === selectedClassIdFilter) : null;
      await exportStudentsListPdf(filteredStudents, targetClass, fallbackProfile);
      setExportSuccessMessage('تم تصدير قائمة التلاميذ كملف PDF بنجاح وحفظه في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export students PDF:', err);
      setExportErrorMessage(err?.message || 'تعذر تصدير قائمة التلاميذ كملف PDF، يرجى إعادة المحاولة.');
      setTimeout(() => setExportErrorMessage(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportStudentsWord = async () => {
    if (isExportingWord || filteredStudents.length === 0) return;
    setIsExportingWord(true);
    try {
      const targetClass = selectedClassIdFilter !== 'all' ? classes.find(c => c.id === selectedClassIdFilter) : null;
      await exportStudentsListDocx(filteredStudents, targetClass, fallbackProfile);
      setExportSuccessMessage('تم تصدير قائمة التلاميذ كملف Word (.docx) قابل للتعديل بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export students Word docx:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClassIdFilter === 'all' || s.classId === selectedClassIdFilter;
      const matchGender = genderFilter === 'all' || s.gender === genderFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        `${s.lastName} ${s.firstName}`.toLowerCase().includes(q) ||
        (s.studentNumber && s.studentNumber.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q));

      return matchClass && matchGender && matchSearch;
    });
  }, [students, selectedClassIdFilter, genderFilter, searchQuery]);

  // Counts in current view
  const currentTotal = filteredStudents.length;
  const currentMales = filteredStudents.filter((s) => s.gender === 'male').length;
  const currentFemales = filteredStudents.filter((s) => s.gender === 'female').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Bar: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              سجل التلاميذ والطلاب
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة شاملة لبيانات التلاميذ، أرقام التسجيل، أرقام أولياء الأمور، والملاحظات البيداغوجية.
          </p>
        </div>

        <button
          onClick={onOpenAddStudent}
          disabled={classes.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل طالب جديد</span>
        </button>
      </div>

      {/* Excel Management Bar (Import, Export, Download Template) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-right">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                إدارة القوائم عبر Excel
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                تصدير واستيراد قوائم التلاميذ بصيغة <strong className="font-mono text-emerald-600 dark:text-emerald-400">.xlsx</strong> وتنسيقها
              </span>
            </div>
          </div>

          {/* Action Buttons: [ تصدير PDF ]   [ تصدير Word ]   [ استيراد من Excel ]   [ تصدير Excel ] */}
          <div className="flex items-center flex-wrap gap-2 sm:shrink-0">
            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportStudentsPdf}
              disabled={filteredStudents.length === 0 || isExportingPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="تصدير قائمة التلاميذ الحالية كملف PDF عالي الدقة"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-600" />
              )}
              <span>تصدير PDF</span>
            </button>

            {/* Export Word (.docx) Button */}
            <button
              type="button"
              onClick={handleExportStudentsWord}
              disabled={filteredStudents.length === 0 || isExportingWord}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="تصدير قائمة التلاميذ الحالية كملف Word (.docx) قابل للتعديل"
            >
              {isExportingWord ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600" />
              )}
              <span>تصدير Word</span>
            </button>

            <button
              type="button"
              onClick={onOpenImportExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="استيراد قائمة تلاميذ من ملف Excel"
            >
              <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>استيراد Excel</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              disabled={students.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="تصدير قائمة التلاميذ الحالية إلى ملف Excel"
            >
              <Download className="w-4 h-4 text-sky-600" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {exportSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {exportErrorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="w-4 h-4 text-rose-600 font-bold shrink-0">⚠️</span>
            <span>{exportErrorMessage}</span>
          </div>
        )}

        {/* وتحتها: [ تحميل نموذج Excel ] */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer w-fit"
            title="تحميل ملف Excel فارغ مهيأ بالأعمدة المناسبة للتعبئة"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="underline decoration-emerald-500/40 underline-offset-2">تحميل نموذج Excel</span>
          </button>

          <span className="text-[11px] text-slate-400">
            {selectedClassIdFilter !== 'all' 
              ? `التصدير سيشمل تلاميذ قسم: ${classes.find(c => c.id === selectedClassIdFilter)?.name || ''}`
              : 'التصدير يشمل كافة التلاميذ المسجلين'}
          </span>
        </div>
      </div>

      {classes.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium">
              يجب عليك إنشاء قسم تربوي أولاً قبل أن تتمكن من تسجيل الطلاب وإلحاقهم به.
            </span>
          </div>
          <button
            onClick={onNavigateToClasses}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shrink-0"
          >
            الانتقال لصفحة الأقسام
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باللقب، الاسم، أو رقم التسجيل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClassIdFilter}
              onChange={(e) => onSelectClassFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            >
              <option value="all">كل الأقسام ({students.length} طالب)</option>
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    قسم: {cls.name} ({count} طالب)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Gender Filter Buttons */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setGenderFilter('all')}
              className={`py-1 text-xs font-bold rounded-lg transition ${
                genderFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              className={`py-1 text-xs font-bold rounded-lg transition ${
                genderFilter === 'male'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              ذكور
            </button>
            <button
              onClick={() => setGenderFilter('female')}
              className={`py-1 text-xs font-bold rounded-lg transition ${
                genderFilter === 'female'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              إناث
            </button>
          </div>
        </div>

        {/* Status Count Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>النتائج المعروضة: <strong className="text-slate-900 dark:text-white">{currentTotal}</strong></span>
          <span>•</span>
          <span>ذكور: <strong className="text-sky-600 dark:text-sky-400">{currentMales}</strong></span>
          <span>•</span>
          <span>إناث: <strong className="text-rose-600 dark:text-rose-400">{currentFemales}</strong></span>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            لم يتم العثور على أي طلاب
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `لا توجد نتائج توافق بحثك "${searchQuery}".`
              : 'ابدأ بتسجيل أول طالب في هذا القسم الآن.'}
          </p>
          {classes.length > 0 && (
            <button
              onClick={onOpenAddStudent}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
            >
              + تسجيل طالب جديد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStudents.map((st) => {
            const assignedClass = classes.find((c) => c.id === st.classId);

            return (
              <div
                key={st.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar & Name & Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                          st.gender === 'female'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                            : 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300'
                        }`}
                      >
                        {st.firstName.charAt(0)}
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                          {st.lastName} {st.firstName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {st.studentNumber && (
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              #{st.studentNumber}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            st.gender === 'female'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                              : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                          }`}>
                            {st.gender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditStudent(st)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="تعديل بيانات الطالب"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStudent(st.id, `${st.lastName} ${st.firstName}`)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Class Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: assignedClass?.color || '#006233' }}
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {assignedClass ? assignedClass.name : 'قسم محذوف أو غير معين'}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {st.birthDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>الميلاد: {st.birthDate}</span>
                      </div>
                    )}

                    {st.guardianPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a
                          href={`tel:${st.guardianPhone}`}
                          className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline dir-ltr text-right"
                        >
                          {st.guardianPhone}
                        </a>
                      </div>
                    )}

                    {st.notes && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{st.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
