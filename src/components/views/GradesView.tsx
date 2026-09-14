import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Calculator, 
  Printer, 
  Layers, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  BookOpen, 
  ChevronDown,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  ListOrdered,
  HelpCircle,
  Sliders,
  X,
  FileDown,
  Loader2,
  FileText
} from 'lucide-react';
import { 
  AssessmentItem, 
  AssessmentType, 
  ClassItem, 
  StudentItem, 
  Trimester, 
  CalculationFormula, 
  TeacherProfile,
  SubjectSetting 
} from '../../types';
import { 
  ASSESSMENT_TYPE_INFO, 
  PRIMARY_ASSESSMENT_TYPES,
  TRIMESTER_INFO, 
  computeClassGradesReport, 
  computeAssessmentStats, 
  getAlgerianAppraisal,
  SubjectCalculationDetailResult 
} from '../../utils/gradeCalculations';
import { StudentSubjectBreakdownModal } from '../modals/StudentSubjectBreakdownModal';
import { getSubjectsForGradeAndStage } from '../../data/algerianData';
import { exportGradesSheetDocx } from '../../utils/docxService';
import { exportElementToPdf, exportGradesSheetPdf } from '../../utils/pdfService';

interface GradesViewProps {
  assessments: AssessmentItem[];
  classes: ClassItem[];
  students: StudentItem[];
  profile: TeacherProfile;
  subjectSettings?: SubjectSetting[];
  onOpenAddAssessment: (defaultClassId?: string) => void;
  onEditAssessment: (assessment: AssessmentItem) => void;
  onDeleteAssessment: (assessment: AssessmentItem) => void;
  onOpenGradeEntry: (assessment: AssessmentItem) => void;
  onNavigateToClasses: () => void;
  onOpenAddSubject?: () => void;
  onOpenEditSubject?: (subject: SubjectSetting) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  assessments,
  classes,
  students,
  profile,
  subjectSettings = [],
  onOpenAddAssessment,
  onEditAssessment,
  onDeleteAssessment,
  onOpenGradeEntry,
  onNavigateToClasses,
  onOpenAddSubject,
  onOpenEditSubject,
}) => {
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  // Filters
  const [selectedTrimester, setSelectedTrimester] = useState<Trimester | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<AssessmentType | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'assessments'>('table');
  const [formula, setFormula] = useState<CalculationFormula>('subject_method');
  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);

  // PDF & Word export states
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // PDF Export Handler
  const handleExportGradesPdf = async () => {
    if (!activeClass || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const filename = `OstadDZ_Kashf_Noqat_${activeClass.name}_${selectedTrimester}`;
      const printableEl = document.getElementById('printable-deliberation-sheet');
      if (printableEl) {
        await exportElementToPdf(printableEl, filename, { orientation: 'landscape' });
      } else {
        await exportGradesSheetPdf(
          activeClass,
          assessments,
          classStudents,
          selectedTrimester,
          profile,
          currentSubjectSetting || undefined
        );
      }
      setExportSuccessMessage('تم تصدير كشف النقاط كملف PDF بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Word (.docx) Export Handler
  const handleExportGradesWord = async () => {
    if (!activeClass || isExportingWord) return;
    setIsExportingWord(true);
    try {
      await exportGradesSheetDocx(
        activeClass,
        assessments,
        classStudents,
        selectedTrimester,
        profile,
        currentSubjectSetting || undefined
      );
      setExportSuccessMessage('تم تصدير كشف النقاط كملف Word (.docx) قابل للتعديل بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Breakdown modal state
  const [breakdownModalData, setBreakdownModalData] = useState<{
    student: StudentItem;
    calculationResult: SubjectCalculationDetailResult;
  } | null>(null);

  // Sync selectedClassId if it gets deleted
  const activeClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students
      .filter((s) => s.classId === activeClass.id)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [students, activeClass]);

  // Assessments for selected class
  const classAssessments = useMemo(() => {
    if (!activeClass) return [];
    return assessments
      .filter((a) => a.classId === activeClass.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [assessments, activeClass]);

  // Available subjects for selected class
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (activeClass) {
      if (activeClass.subject?.trim()) set.add(activeClass.subject.trim());
      if (profile.subject?.trim()) set.add(profile.subject.trim());
      const gradeSubs = getSubjectsForGradeAndStage(activeClass.stage, activeClass.grade, [activeClass.subject]);
      gradeSubs.forEach((s) => set.add(s));
      subjectSettings.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
    } else {
      subjectSettings.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
      if (profile.subject?.trim()) {
        set.add(profile.subject.trim());
      }
    }
    classAssessments.forEach((a) => {
      if (a.subject?.trim()) set.add(a.subject.trim());
    });
    return Array.from(set);
  }, [activeClass, classAssessments, subjectSettings, profile.subject]);

  // Active Subject Name
  const activeSubjectName = useMemo(() => {
    if (selectedSubject !== 'ALL') return selectedSubject;
    return availableSubjects[0] || profile.subject || 'المادة';
  }, [selectedSubject, availableSubjects, profile.subject]);

  // Matched Subject Setting (with single coefficient and calculation method)
  const currentSubjectSetting = useMemo(() => {
    const target = (activeSubjectName || '').trim().toLowerCase();
    return (
      subjectSettings.find(
        (s) => (s?.name || '').trim().toLowerCase() === target
      ) || null
    );
  }, [subjectSettings, activeSubjectName]);

  // Filtered assessments according to trimester, type, and subject
  const filteredAssessments = useMemo(() => {
    return classAssessments.filter((a) => {
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchType =
        selectedType === 'ALL' ||
        a.type === selectedType ||
        (selectedType === 'test1' && a.type === 'test');
      const matchSubject = selectedSubject === 'ALL' || (a.subject || '').trim() === selectedSubject.trim();
      return matchTrimester && matchType && matchSubject;
    });
  }, [classAssessments, selectedTrimester, selectedType, selectedSubject]);

  // Comprehensive report for class with chosen assessments, formula, and subject setting
  const gradesReport = useMemo(() => {
    return computeClassGradesReport(classStudents, filteredAssessments, formula, currentSubjectSetting);
  }, [classStudents, filteredAssessments, formula, currentSubjectSetting]);

  // Filter student rows by search query
  const displayedStudentResults = useMemo(() => {
    if (!searchStudent.trim()) return gradesReport.studentResults;
    const query = searchStudent.toLowerCase();
    return gradesReport.studentResults.filter((item) => {
      const name = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();
      const num = item.student.studentNumber?.toLowerCase() || '';
      return name.includes(query) || num.includes(query);
    });
  }, [gradesReport.studentResults, searchStudent]);

  if (classes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          لا توجد أقسام مسجلة بعد
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          يرجى إضافة قسم تربوي أولاً وإضافة الطلاب إليه للبدء في تسجيل الفروض والاختبارات وحساب المعدلات.
        </p>
        <button
          onClick={onNavigateToClasses}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition"
        >
          إدارة الأقسام والطلاب
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                النقاط والمعدلات
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {activeClass?.name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              رصد نقاط الفروض والاختبارات وحساب المعدلات الفردية والجماعية بدون إنترنت
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Export PDF Button */}
          <button
            onClick={handleExportGradesPdf}
            disabled={isExportingPdf || !activeClass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="تصدير كشف النقاط والمداولات كملف PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-600" />
            )}
            <span>تصدير PDF</span>
          </button>

          {/* Export Word Button */}
          <button
            onClick={handleExportGradesWord}
            disabled={isExportingWord || !activeClass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="تصدير كشف النقاط والمداولات كملف Word (.docx) قابل للتعديل"
          >
            {isExportingWord ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <FileText className="w-4 h-4 text-blue-600" />
            )}
            <span>تصدير Word</span>
          </button>

          {/* Printable Sheet Button */}
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs"
            title="معاينة وطباعة كشف نقاط القسم ومحضر المداولة"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>كشف النقاط (معاينة)</span>
          </button>

          {/* Add Assessment Button */}
          <button
            onClick={() => onOpenAddAssessment(activeClass?.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تقييم جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-400 pl-2 shrink-0">الأقسام:</span>
        {classes.map((cls) => {
          const isSelected = cls.id === activeClass?.id;
          const classStudentsCount = students.filter((s) => s.classId === cls.id).length;
          const classAssessmentsCount = assessments.filter((a) => a.classId === cls.id).length;

          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
              }`}
            >
              <span>{cls.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {classStudentsCount} ط • {classAssessmentsCount} ت
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Class Statistics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Class Average */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">معدل القسم العام</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {gradesReport.classAverage !== null ? gradesReport.classAverage : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          {gradesReport.classAverage !== null && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAlgerianAppraisal(gradesReport.classAverage).badgeBg} ${getAlgerianAppraisal(gradesReport.classAverage).badgeText} ${getAlgerianAppraisal(gradesReport.classAverage).badgeBorder}`}>
                {getAlgerianAppraisal(gradesReport.classAverage).label}
              </span>
            </div>
          )}
        </div>

        {/* Pass Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة النجاح (≥ 10/20)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {gradesReport.totalEvaluatedStudents > 0 ? `${gradesReport.passRate}%` : '—'}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${gradesReport.passRate}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex justify-between">
            <span>الناجحين: {gradesReport.passCount}</span>
            <span>المتعثرين: {gradesReport.failCount}</span>
          </div>
        </div>

        {/* Highest Mark */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">أعلى معدل في القسم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {gradesReport.highestAverage ? gradesReport.highestAverage.value : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {gradesReport.highestAverage ? gradesReport.highestAverage.studentName : 'لا توجد تقييمات'}
          </p>
        </div>

        {/* Lowest Mark */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">أدنى معدل في القسم</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {gradesReport.lowestAverage ? gradesReport.lowestAverage.value : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {gradesReport.lowestAverage ? gradesReport.lowestAverage.studentName : 'لا توجد تقييمات'}
          </p>
        </div>
      </div>

      {/* 4. Controls, Filters & Calculation Formula */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Row 1: Search, View Mode, and Formula Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search student */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="ابحث عن تلميذ بالاسم، اللقب أو رقم التعريف..."
              className="w-full h-10 pl-3 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            {searchStudent && (
              <button
                onClick={() => setSearchStudent('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Calculation formula selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">نظام الحساب:</span>
              </div>
              <select
                value={formula}
                onChange={(e) => setFormula(e.target.value as CalculationFormula)}
                className="h-8 px-2 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="subject_method">كيفية حساب المادة المحددة (الرسمي)</option>
                <option value="weighted">المعدل الموزون بالمعاملات</option>
                <option value="standard_algerian">النظام الوزاري الجزائري (تقويم + فرض + اختبار×2)</option>
                <option value="arithmetic">المعدل الحسابي البسيط</option>
              </select>
              <button
                onClick={() => setIsFormulaHelpOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="شرح طريقة حساب المعدل"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>جدول شامل</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>بطاقات الطلاب</span>
              </button>
              <button
                onClick={() => setViewMode('assessments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'assessments'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>التقييمات ({classAssessments.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Trimester & Assessment Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Trimester Tabs */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold ml-1">الفصل:</span>
            <button
              onClick={() => setSelectedTrimester('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                selectedTrimester === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              الكل
            </button>
            {(Object.keys(TRIMESTER_INFO) as Trimester[]).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setSelectedTrimester(tKey)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  selectedTrimester === tKey
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {TRIMESTER_INFO[tKey].label}
              </button>
            ))}
          </div>

          {/* Assessment Type Pills */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold ml-1">النوع:</span>
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                selectedType === 'ALL'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              الكل
            </button>
            {PRIMARY_ASSESSMENT_TYPES.map((tKey) => (
              <button
                key={tKey}
                onClick={() => setSelectedType(tKey)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedType === tKey
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {ASSESSMENT_TYPE_INFO[tKey].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Subject Selection & Calculation Method (كيفية الحساب) Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>المادة:</span>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">كل المواد في القسم</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            {/* Subject Setting Info Badge */}
            {currentSubjectSetting ? (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  معامل المادة: {currentSubjectSetting.coefficient}
                </span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800 dir-ltr">
                  {currentSubjectSetting.calculationMethod?.method === 'tests_avg_plus_exam_x2_div_3'
                    ? '((ف1 + ف2)/2 + اخ×2)/3'
                    : currentSubjectSetting.calculationMethod?.method === 'tests_sum_plus_exam_x2_div_4'
                    ? '(ف1 + ف2 + اخ×2)/4'
                    : currentSubjectSetting.calculationMethod?.method === 'best_test_plus_exam_x2_div_3'
                    ? '(أفضل فرض + اخ×2)/3'
                    : currentSubjectSetting.calculationMethod?.method === 'test1_only_plus_exam_x2_div_3'
                    ? '(ف1 + اخ×2)/3'
                    : currentSubjectSetting.calculationMethod?.method === 'arithmetic_mean'
                    ? '(ف1 + ف2 + اخ)/3'
                    : 'أوزان مخصصة'}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                (لم يتم ضبط إعداد مخصص لهذه المادة بعد)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentSubjectSetting && onOpenEditSubject ? (
              <button
                type="button"
                onClick={() => onOpenEditSubject(currentSubjectSetting)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تعديل كيفية الحساب / محاكي الناتج</span>
              </button>
            ) : onOpenAddSubject ? (
              <button
                type="button"
                onClick={onOpenAddSubject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إعداد مادة وطريقة حسابها</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 5. Main Content Area */}
      {viewMode === 'assessments' ? (
        /* ================= ASSESSMENTS LIST VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              قائمة التقييمات المسجلة لقسم {activeClass.name} ({filteredAssessments.length})
            </h2>
            <button
              onClick={() => onOpenAddAssessment(activeClass.id)}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تقييم جديد</span>
            </button>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                لا توجد تقييمات مطابقة لهذا القسم والفصل
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                اضغط على الزر أسفله لإنشاء فرض محروس، اختبار فصلي، أو تقويم مستمر.
              </p>
              <button
                onClick={() => onOpenAddAssessment(activeClass.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
              >
                + إنشاء أول تقييم لهذا القسم
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssessments.map((assessment) => {
                const stats = computeAssessmentStats(assessment, students);
                const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type];

                return (
                  <div
                    key={assessment.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/40 transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Badge header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.colorBg} ${typeInfo.colorText} ${typeInfo.colorBorder}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {TRIMESTER_INFO[assessment.trimester]?.label || 'الفصل الأول'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {assessment.date}
                        </span>
                      </div>

                      {/* Title & Subject */}
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {assessment.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        المادة: {assessment.subject} • المعامل: {assessment.coefficient} • العلامة على: /{assessment.maxScore || 20}
                      </p>

                      {assessment.notes && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl line-clamp-2">
                          {assessment.notes}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">معدل الفرض:</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            {stats.average !== null ? `${stats.average}/20` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">المرصودين:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {stats.gradedCount} / {stats.totalStudents}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">الغيابات:</span>
                          <span className={`text-xs font-bold ${stats.absentCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {stats.absentCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditAssessment(assessment)}
                          className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          title="تعديل تفاصيل التقييم"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAssessment(assessment)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="حذف هذا التقييم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenGradeEntry(assessment)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>رصد وتعديل النقاط</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW (PER-STUDENT) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStudentResults.map((result) => {
            const avg = result.average;
            const appraisal = result.appraisal;

            return (
              <div
                key={result.studentId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {result.student.lastName} {result.student.firstName}
                        </span>
                        {result.rank !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            المرتبة {result.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {result.student.studentNumber ? `رقم: ${result.student.studentNumber} • ` : ''}
                        {result.student.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </p>
                    </div>

                    {/* Average badge with breakdown link */}
                    <div 
                      className="text-left cursor-pointer group"
                      onClick={() => {
                        if (result.subjectCalculation) {
                          setBreakdownModalData({
                            student: result.student,
                            calculationResult: result.subjectCalculation,
                          });
                        }
                      }}
                      title="انقر لعرض تفاصيل وخطوات كيفية الحساب"
                    >
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`text-lg font-black ${avg !== null && avg >= 10 ? 'text-emerald-600 dark:text-emerald-400' : avg !== null ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                          {avg !== null ? `${avg}/20` : '—'}
                        </span>
                        {result.subjectCalculation && (
                          <Calculator className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 transition" />
                        )}
                      </div>
                      {result.subjectCalculation?.weightedTotal !== null && (result.subjectCalculation?.coefficient || 1) > 1 && (
                        <span className="text-[10px] text-slate-400 block text-left">
                          المجموع: {result.subjectCalculation?.weightedTotal?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {appraisal && (
                    <div className="mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appraisal.badgeBg} ${appraisal.badgeText} ${appraisal.badgeBorder}`}>
                        {appraisal.label}
                      </span>
                    </div>
                  )}

                  {/* Individual Scores breakdown */}
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">النقاط المرصودة:</span>
                    {filteredAssessments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">لا توجد تقييمات منشأة بعد</p>
                    ) : (
                      filteredAssessments.map((a) => {
                        const scoreData = result.scoresByAssessmentId[a.id];
                        const typeInfo = ASSESSMENT_TYPE_INFO[a.type];

                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                          >
                            <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                              {a.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {scoreData?.isAbsent ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                                  غائب
                                </span>
                              ) : scoreData && scoreData.scoreOutOf20 !== null ? (
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                  {scoreData.rawScore} /{a.maxScore || 20}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                                  —
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= COMPREHENSIVE TABLE VIEW (RESPONSIVE) ================= */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>جدول كشف النقاط والمعدلات الكامل</span>
              <span className="text-slate-400 font-normal">
                ({displayedStudentResults.length} تلميذ • {filteredAssessments.length} تقييم)
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              * انقر على عنوان أي تقييم لفتح واجهة رصد النقاط السريعة
            </div>
          </div>

          {/* Table Wrapper (Horizontal Scrollable with RTL freeze) */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 font-bold text-slate-500 w-10 text-center sticky right-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                    #
                  </th>
                  <th className="p-3 font-bold text-slate-900 dark:text-white min-w-[160px] sticky right-10 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                    التلميذ(ة)
                  </th>

                  {/* Assessment Columns */}
                  {filteredAssessments.map((assessment) => {
                    const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type];
                    return (
                      <th
                        key={assessment.id}
                        onClick={() => onOpenGradeEntry(assessment)}
                        className="p-2.5 font-bold min-w-[110px] text-center border-l border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition group"
                        title="انقر لرصد وتعديل نقاط هذا التقييم"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${typeInfo.colorBg} ${typeInfo.colorText}`}>
                            {typeInfo.shortLabel}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[100px] group-hover:text-emerald-600 transition">
                            {assessment.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            م {assessment.coefficient} • /{assessment.maxScore || 20}
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Calculated Average Column */}
                  <th className="p-3 font-black text-emerald-800 dark:text-emerald-300 min-w-[100px] text-center bg-emerald-50/80 dark:bg-emerald-950/50 border-r border-emerald-200 dark:border-emerald-900">
                    معدل المادة (/20)
                  </th>

                  {/* Appreciation Column */}
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 min-w-[110px] text-center">
                    التقدير والملاحظة
                  </th>

                  {/* Rank Column */}
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 min-w-[70px] text-center">
                    الرتبة
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedStudentResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5 + filteredAssessments.length}
                      className="py-12 text-center text-slate-400"
                    >
                      لا توجد بيانات مطابقة لخيارات البحث أو التصفية
                    </td>
                  </tr>
                ) : (
                  displayedStudentResults.map((row, idx) => {
                    const avg = row.average;
                    const appraisal = row.appraisal;

                    return (
                      <tr
                        key={row.studentId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Index */}
                        <td className="p-3 text-center text-slate-400 font-bold sticky right-0 z-10 bg-white dark:bg-slate-900">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="p-3 font-bold text-slate-900 dark:text-white sticky right-10 z-10 bg-white dark:bg-slate-900 shadow-xs">
                          <div>
                            <span className="block text-xs">
                              {row.student.lastName} {row.student.firstName}
                            </span>
                            {row.student.studentNumber && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {row.student.studentNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assessment Scores */}
                        {filteredAssessments.map((a) => {
                          const scoreObj = row.scoresByAssessmentId[a.id];

                          return (
                            <td
                              key={a.id}
                              onClick={() => onOpenGradeEntry(a)}
                              className="p-2.5 text-center border-l border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition font-mono"
                              title="انقر لتعديل نقطة التلميذ"
                            >
                              {scoreObj?.isAbsent ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  غائب
                                </span>
                              ) : scoreObj && scoreObj.rawScore !== null ? (
                                <span
                                  className={`font-bold ${
                                    (scoreObj.scoreOutOf20 || 0) >= 10
                                      ? 'text-slate-900 dark:text-white'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {scoreObj.rawScore}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 font-normal">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Calculated Average */}
                        <td 
                          className="p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-emerald-100 dark:border-emerald-900/60 font-mono cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition group"
                          onClick={() => {
                            if (row.subjectCalculation) {
                              setBreakdownModalData({
                                student: row.student,
                                calculationResult: row.subjectCalculation,
                              });
                            }
                          }}
                          title="انقر لعرض تفاصيل وخطوات كيفية الحساب"
                        >
                          {avg !== null ? (
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`text-sm font-black flex items-center gap-1 ${
                                  avg >= 10
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {avg.toFixed(2)}
                                <Calculator className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition" />
                              </span>
                              {row.subjectCalculation?.weightedTotal !== null && (row.subjectCalculation?.coefficient || 1) > 1 && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                  المجموع: {row.subjectCalculation?.weightedTotal?.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Appraisal */}
                        <td className="p-3 text-center">
                          {appraisal ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appraisal.badgeBg} ${appraisal.badgeText} ${appraisal.badgeBorder}`}
                            >
                              {appraisal.label}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Rank */}
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {row.rank !== null ? (
                            <span className={`px-2 py-0.5 rounded-md text-xs ${row.rank === 1 ? 'bg-amber-100 text-amber-800 font-black' : ''}`}>
                              {row.rank}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Summary Row */}
              {displayedStudentResults.length > 0 && filteredAssessments.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                    <td colSpan={2} className="p-3 text-slate-900 dark:text-white sticky right-0 z-10 bg-slate-100 dark:bg-slate-800">
                      معدل التقييمات في القسم:
                    </td>
                    {filteredAssessments.map((a) => {
                      const stats = computeAssessmentStats(a, students);
                      return (
                        <td key={a.id} className="p-2.5 text-center font-mono text-emerald-700 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700">
                          {stats.average !== null ? `${stats.average}` : '—'}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 font-mono text-sm">
                      {gradesReport.classAverage !== null ? gradesReport.classAverage.toFixed(2) : '—'}
                    </td>
                    <td colSpan={2} className="p-3 text-center text-slate-500 font-normal">
                      نسبة النجاح: {gradesReport.passRate}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 6. Formula Explanation Modal */}
      {isFormulaHelpOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span>أنظمة وطرق حساب المعدلات في Ostad DZ</span>
              </div>
              <button
                onClick={() => setIsFormulaHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  1. المعدل الموزون بالمعاملات (الافتراضي والمرن)
                </h4>
                <p>
                  يتم حساب معدل كل تلميذ بضرب علامته في كل تقييم بمعامله المحدد ثم قسمة المجموع على مجموع المعاملات:
                </p>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded-lg mt-1.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                  المعدل = (نقطة 1 × م1 + نقطة 2 × م2 + ...) ÷ (م1 + م2 + ...)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  2. النظام الوزاري الجزائري للتعليم المتوسط والثانوي
                </h4>
                <p>
                  يعتمد المنشور الوزاري للتقويم التربوي: التقويم المستمر (معامل 1) + معدل الفروض (معامل 1) + الاختبار الفصلي (معامل 2 أو 3):
                </p>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded-lg mt-1.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                  المعدل = (التقويم + معدل الفروض + الاختبار × المعامل) ÷ (2 + المعامل)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  3. المعدل الحسابي البسيط
                </h4>
                <p>
                  جمع علامات التقييمات المقامة وقسمتها على عددها دون تطبيق أي معاملات تفضيلية.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsFormulaHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Official Printable Deliberation / Grade Sheet Modal */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div 
            id="printable-deliberation-sheet"
            className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-4 print:p-0 print:shadow-none print:w-full"
          >
            {/* Action buttons (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>محضر النقاط والمداولات الرسمي (جاهز للتصدير والطباعة)</span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {/* Export PDF */}
                <button
                  onClick={handleExportGradesPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="تصدير محضر النقاط إلى ملف PDF حقيقي"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>تصدير PDF</span>
                    </>
                  )}
                </button>

                {/* Export Word */}
                <button
                  onClick={handleExportGradesWord}
                  disabled={isExportingWord}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="تصدير محضر النقاط إلى ملف Word (.docx) قابل للتعديل"
                >
                  {isExportingWord ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>تصدير Word</span>
                    </>
                  )}
                </button>

                {/* Direct Print */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>طباعة سريعة</span>
                </button>

                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification message inside modal */}
            {exportSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            {/* Official Algerian School Header */}
            <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
              <h3 className="font-bold text-sm sm:text-base">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
              <h4 className="font-bold text-xs sm:text-sm text-slate-700">وزارة التربية الوطنية</h4>
              <div className="flex items-center justify-between text-xs pt-2 font-semibold">
                <span>مديرية التربية لولاية: {profile.wilaya || 'الجزائر'}</span>
                <span>المؤسسة: {profile.schoolName || 'ثانوية الإخوة حامية'}</span>
                <span>السنة الدراسية: {profile.academicYear || '2024 - 2025'}</span>
              </div>
              <div className="pt-3">
                <h2 className="text-lg font-black underline tracking-wide">
                  محضر نقاط ومداولات مادة {activeClass.subject} - {TRIMESTER_INFO[selectedTrimester === 'ALL' ? 'T1' : selectedTrimester].label}
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  القسم: {activeClass.name} • الأستاذ: {profile.fullName || 'أستاذ المادة'}
                </p>
              </div>
            </div>

            {/* Printable Table */}
            <table className="w-full text-right border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-8">#</th>
                  <th className="border border-slate-400 p-2 text-right">اللقب والاسم</th>
                  {filteredAssessments.map((a) => (
                    <th key={a.id} className="border border-slate-400 p-2">
                      <div>{a.title}</div>
                      <div className="text-[10px] font-normal text-slate-600">
                        م {a.coefficient} (/{a.maxScore || 20})
                      </div>
                    </th>
                  ))}
                  <th className="border border-slate-400 p-2 bg-slate-200">المعدل / 20</th>
                  <th className="border border-slate-400 p-2">التقدير</th>
                  <th className="border border-slate-400 p-2 w-12">الرتبة</th>
                </tr>
              </thead>
              <tbody>
                {gradesReport.studentResults.map((r, idx) => (
                  <tr key={r.studentId} className="border-b border-slate-300">
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-bold">
                      {r.student.lastName} {r.student.firstName}
                    </td>
                    {filteredAssessments.map((a) => {
                      const sc = r.scoresByAssessmentId[a.id];
                      return (
                        <td key={a.id} className="border border-slate-300 p-1.5 text-center font-mono">
                          {sc?.isAbsent ? 'غائب' : sc?.rawScore !== null && sc?.rawScore !== undefined ? sc.rawScore : '—'}
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 p-1.5 text-center font-black font-mono bg-slate-50">
                      {r.average !== null ? r.average.toFixed(2) : '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">
                      {r.appraisal?.label || '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">
                      {r.rank || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Official Summary & Signatures Footer */}
            <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 text-xs">
              <div className="space-y-1">
                <p><strong>معدل القسم:</strong> {gradesReport.classAverage ? `${gradesReport.classAverage} / 20` : '—'}</p>
                <p><strong>نسبة النجاح:</strong> {gradesReport.passRate}% ({gradesReport.passCount} تلميذ ناجح)</p>
                <p><strong>أعلى معدل:</strong> {gradesReport.highestAverage?.value || '—'}</p>
              </div>
              <div className="text-left space-y-8 pl-4">
                <p>حرر بـ: {profile.wilaya?.slice(5) || 'الجزائر'} في: {new Date().toLocaleDateString('ar-DZ')}</p>
                <p className="font-bold underline">توقيع وختم أستاذ المادة:</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Student Subject Calculation Breakdown Modal */}
      {breakdownModalData && (
        <StudentSubjectBreakdownModal
          isOpen={Boolean(breakdownModalData)}
          onClose={() => setBreakdownModalData(null)}
          student={breakdownModalData.student}
          calculationResult={breakdownModalData.calculationResult}
          subjectName={activeSubjectName}
        />
      )}
    </div>
  );
};
