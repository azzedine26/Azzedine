import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  FileText, 
  Award, 
  UserCheck, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Sparkles,
  School,
  ArrowLeft,
  Mail,
  SlidersHorizontal,
  Download,
  Loader2,
  FileDown
} from 'lucide-react';
import { 
  ClassItem, 
  StudentItem, 
  TeacherProfile, 
  AssessmentItem, 
  AttendanceRecord, 
  SubjectSetting,
  Trimester,
  ReportType 
} from '../../types';
import { 
  calculateSubjectGrade, 
  getAlgerianAppraisal, 
  TRIMESTER_INFO, 
  normalizeTo20 
} from '../../utils/gradeCalculations';
import { 
  exportStudentReportCardDocx, 
  exportGradesSheetDocx, 
  exportAttendanceSheetDocx, 
  exportAbsenceNoticeDocx 
} from '../../utils/docxService';
import { exportElementToPdf } from '../../utils/pdfService';

interface ReportsViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  assessments: AssessmentItem[];
  attendanceRecords: AttendanceRecord[];
  profile: TeacherProfile;
  subjectSettings?: SubjectSetting[];
  onNavigateToClasses: () => void;
  onNavigateToStudents: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  classes,
  students,
  assessments,
  attendanceRecords,
  profile,
  subjectSettings = [],
  onNavigateToClasses,
  onNavigateToStudents,
}) => {
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  
  // Report Type
  const [reportType, setReportType] = useState<ReportType>('student_card');
  
  // Selected Student for student-specific reports
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Selected Trimester
  const [selectedTrimester, setSelectedTrimester] = useState<Trimester | 'ALL'>('T1');

  // Custom Options
  const [showOfficialHeader, setShowOfficialHeader] = useState<boolean>(true);
  const [showGrades, setShowGrades] = useState<boolean>(true);
  const [showAttendance, setShowAttendance] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [customRemark, setCustomRemark] = useState<string>('');

  // Active Class
  const activeClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Students in active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students
      .filter((s) => s.classId === activeClass.id)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [students, activeClass]);

  // Ensure active student is valid
  const activeStudent = useMemo(() => {
    if (!classStudents.length) return null;
    const found = classStudents.find((s) => s.id === selectedStudentId);
    return found || classStudents[0] || null;
  }, [classStudents, selectedStudentId]);

  // Find student index for prev/next buttons
  const currentStudentIndex = useMemo(() => {
    if (!activeStudent) return -1;
    return classStudents.findIndex((s) => s.id === activeStudent.id);
  }, [classStudents, activeStudent]);

  // Assessments for active class
  const classAssessments = useMemo(() => {
    if (!activeClass) return [];
    return assessments.filter((a) => {
      const matchClass = a.classId === activeClass.id;
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      return matchClass && matchTrimester;
    });
  }, [assessments, activeClass, selectedTrimester]);

  // Attendance for active class
  const classAttendance = useMemo(() => {
    if (!activeClass) return [];
    return attendanceRecords.filter((rec) => rec.classId === activeClass.id);
  }, [attendanceRecords, activeClass]);

  // Active subject setting
  const activeSubjectSetting = useMemo(() => {
    if (!activeClass || !activeClass.subject) return null;
    const targetSubject = (activeClass.subject || '').trim().toLowerCase();
    return (
      subjectSettings?.find((s) => {
        const settingName = ((s as unknown as { name?: string; subjectName?: string })?.name || 
                             (s as unknown as { name?: string; subjectName?: string })?.subjectName || '').trim().toLowerCase();
        return settingName === targetSubject;
      }) || null
    );
  }, [subjectSettings, activeClass]);

  // Calculate scores & averages for all students in class
  const computedClassGrades = useMemo(() => {
    if (!activeClass || !classStudents.length) return [];

    const test1Assessment = classAssessments.find((a) => a.type === 'test1');
    const test2Assessment = classAssessments.find((a) => a.type === 'test2');
    const examAssessment = classAssessments.find((a) => a.type === 'exam');

    const results = classStudents.map((student) => {
      const t1Entry = test1Assessment?.scores?.[student.id];
      const t2Entry = test2Assessment?.scores?.[student.id];
      const exEntry = examAssessment?.scores?.[student.id];

      const calculation = calculateSubjectGrade(
        {
          rawScore: t1Entry?.score,
          maxScore: test1Assessment?.maxScore || 20,
          isAbsent: t1Entry?.isAbsent,
          note: t1Entry?.note,
          title: test1Assessment?.title,
        },
        {
          rawScore: t2Entry?.score,
          maxScore: test2Assessment?.maxScore || 20,
          isAbsent: t2Entry?.isAbsent,
          note: t2Entry?.note,
          title: test2Assessment?.title,
        },
        {
          rawScore: exEntry?.score,
          maxScore: examAssessment?.maxScore || 20,
          isAbsent: exEntry?.isAbsent,
          note: exEntry?.note,
          title: examAssessment?.title,
        },
        activeSubjectSetting
      );

      return {
        student,
        calculation,
        test1Score: t1Entry?.score ?? null,
        test1Max: test1Assessment?.maxScore || 20,
        test1Absent: t1Entry?.isAbsent,
        test2Score: t2Entry?.score ?? null,
        test2Max: test2Assessment?.maxScore || 20,
        test2Absent: t2Entry?.isAbsent,
        examScore: exEntry?.score ?? null,
        examMax: examAssessment?.maxScore || 20,
        examAbsent: exEntry?.isAbsent,
        average: calculation.averageOutOf20,
        appraisal: calculation.appraisal,
      };
    });

    // Sort to determine rank
    const sorted = [...results].sort((a, b) => {
      if (a.average === null && b.average === null) return 0;
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });

    const rankMap = new Map<string, number>();
    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (item.average !== null) {
        if (idx > 0 && item.average < (sorted[idx - 1].average ?? 0)) {
          currentRank = idx + 1;
        }
        rankMap.set(item.student.id, currentRank);
      }
    });

    return results.map((item) => ({
      ...item,
      rank: rankMap.get(item.student.id) || null,
    }));
  }, [activeClass, classStudents, classAssessments, activeSubjectSetting]);

  // Overall class grade statistics
  const classGradesStats = useMemo(() => {
    const validAverages = computedClassGrades
      .map((g) => g.average)
      .filter((avg): avg is number => avg !== null);

    if (validAverages.length === 0) {
      return {
        average: null,
        highest: null,
        lowest: null,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
      };
    }

    const sum = validAverages.reduce((acc, v) => acc + v, 0);
    const avg = sum / validAverages.length;
    const highest = Math.max(...validAverages);
    const lowest = Math.min(...validAverages);
    const passed = validAverages.filter((v) => v >= 10).length;

    return {
      average: Math.round(avg * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      passedCount: passed,
      failedCount: validAverages.length - passed,
      passRate: Math.round((passed / validAverages.length) * 100),
    };
  }, [computedClassGrades]);

  // Calculate attendance statistics per student
  const computedAttendance = useMemo(() => {
    const totalSessionsRecorded = classAttendance.length;
    const map = new Map<
      string,
      {
        daysPresent: number;
        daysAbsent: number;
        daysLate: number;
        daysExcused: number;
        rate: number;
      }
    >();

    classStudents.forEach((student) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      classAttendance.forEach((record) => {
        const entry = record.records?.[student.id];
        if (entry) {
          if (entry.status === 'present') present++;
          else if (entry.status === 'absent') absent++;
          else if (entry.status === 'late') late++;
          else if (entry.status === 'excused') excused++;
        }
      });

      const totalActive = present + absent + late + excused;
      const rate = totalActive > 0 ? Math.round(((present + late) / totalActive) * 100) : 100;

      map.set(student.id, {
        daysPresent: present,
        daysAbsent: absent,
        daysLate: late,
        daysExcused: excused,
        rate,
      });
    });

    return {
      totalSessions: totalSessionsRecorded,
      studentStats: map,
    };
  }, [classAttendance, classStudents]);

  // Active student calculation
  const activeStudentGrade = useMemo(() => {
    if (!activeStudent) return null;
    return computedClassGrades.find((g) => g.student.id === activeStudent.id) || null;
  }, [computedClassGrades, activeStudent]);

  // Active student attendance
  const activeStudentAttendance = useMemo(() => {
    if (!activeStudent) return null;
    return computedAttendance.studentStats.get(activeStudent.id) || null;
  }, [computedAttendance, activeStudent]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF & Word export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // PDF export handler
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      let filename = 'OstadDZ_Taqrir';
      let orientation: 'portrait' | 'landscape' = 'portrait';
      if (reportType === 'student_card' && activeStudent) {
        filename = `OstadDZ_Kashf_Tilmidh_${activeStudent.lastName}_${activeStudent.firstName}_${selectedTrimester}`;
      } else if (reportType === 'class_grades' && activeClass) {
        filename = `OstadDZ_Kashf_Noqat_${activeClass.name}_${selectedTrimester}`;
        orientation = 'landscape';
      } else if (reportType === 'class_attendance' && activeClass) {
        filename = `OstadDZ_Kashf_Ghiyab_${activeClass.name}`;
      } else if (reportType === 'absence_notice' && activeStudent) {
        filename = `OstadDZ_Istid3aa_Wali_${activeStudent.lastName}_${activeStudent.firstName}`;
      }
      await exportElementToPdf('printable-report-container', filename, { orientation });
      setExportSuccessMessage('تم تصدير ملف PDF بنجاح وحفظه في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Word (.docx) export handler
  const handleExportWord = async () => {
    if (isExportingWord) return;
    setIsExportingWord(true);
    try {
      if (reportType === 'student_card') {
        if (!activeStudent || !activeClass) return;
        const studentStats = activeStudentAttendance ? {
          totalSessions: computedAttendance.totalSessions,
          daysPresent: activeStudentAttendance.daysPresent,
          daysAbsent: activeStudentAttendance.daysAbsent,
          daysExcused: activeStudentAttendance.daysExcused,
          daysLate: activeStudentAttendance.daysLate,
          rate: activeStudentAttendance.rate,
        } : null;

        await exportStudentReportCardDocx(
          activeStudent,
          activeClass,
          classAssessments,
          studentStats,
          profile,
          selectedTrimester,
          customRemark,
          activeSubjectSetting
        );
      } else if (reportType === 'class_grades') {
        if (!activeClass) return;
        await exportGradesSheetDocx(
          activeClass,
          classAssessments,
          classStudents,
          selectedTrimester,
          profile,
          activeSubjectSetting
        );
      } else if (reportType === 'class_attendance') {
        if (!activeClass) return;
        const latestDate = classAttendance[classAttendance.length - 1]?.date || new Date().toISOString().split('T')[0];
        await exportAttendanceSheetDocx(
          activeClass,
          latestDate,
          classStudents,
          attendanceRecords,
          profile
        );
      } else if (reportType === 'absence_notice') {
        if (!activeStudent || !activeClass) return;
        const studentAbsenceCount = activeStudentAttendance?.daysAbsent || 0;
        const lastAbsenceRecord = classAttendance.slice().reverse().find(rec => rec.records?.[activeStudent.id]?.status === 'absent');
        const lastAbsenceDate = lastAbsenceRecord?.date || new Date().toISOString().split('T')[0];

        await exportAbsenceNoticeDocx(
          activeStudent,
          activeClass,
          studentAbsenceCount,
          lastAbsenceDate,
          profile
        );
      }
      setExportSuccessMessage('تم إنشاء وتنزيل ملف Word (.docx) بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Nav student handlers
  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(classStudents[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < classStudents.length - 1) {
      setSelectedStudentId(classStudents[currentStudentIndex + 1].id);
    }
  };

  // Preset teacher remarks
  const remarkPresets = [
    'تلميذ مجتهد ومواظب، واصل العمل بنفس الوتيرة والجدية.',
    'نتائج جيدة جداً، مع سلوك حسن ومشاركة ممتازة في الحصة.',
    'مستوى متوسط ومقبول، يحتاج مزيداً من التركيز والمراجعة المستمرة في البيت.',
    'تراجع مقلق في النتائج بسبب كثرة الغيابات والتهاون، يُرجى من الولي المتابعة العاجلة.',
    'تلميذ هادئ ومؤدب، نرجو منه المشاركة والتفاعل أكثر أثناء شرح الدروس.',
  ];

  if (classes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          لا توجد أقسام مسجلة لإنشاء التقارير
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          يُرجى إضافة قسم وطلابه أولاً لتتمكن من إنشاء كشوف النقاط، بطاقات المتابعة ومحاضر الغياب الجاهزة للطباعة.
        </p>
        <button
          onClick={onNavigateToClasses}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
        >
          إضافة قسم جديد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Control Panel & Options Bar (Hidden in Print) */}
      <div className="no-print space-y-4">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                الوثائق والتقارير المدرسية
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                إنشاء، تخصيص وطباعة كشوف المتابعة، محاضر الغياب، وقوائم النقاط الرسمية
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
              title="تصدير المستند كملف PDF عالي الدقة جاهز للطباعة"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تجهيز PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>تصدير PDF</span>
                </>
              )}
            </button>

            {/* Export Word (.docx) Button */}
            <button
              onClick={handleExportWord}
              disabled={isExportingWord}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
              title="تصدير المستند كملف Word (.docx) قابل للتعديل"
            >
              {isExportingWord ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تجهيز Word...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>تصدير Word (.docx)</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
              title="الطباعة المباشرة عبر المتصفح"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">طباعة سريعة</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Report Type Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setReportType('student_card')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
              reportType === 'student_card'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>بطاقة التلميذ الشاملة</span>
          </button>

          <button
            onClick={() => setReportType('class_grades')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
              reportType === 'class_grades'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>قائمة نقاط ومعدلات القسم</span>
          </button>

          <button
            onClick={() => setReportType('class_attendance')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
              reportType === 'class_attendance'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>محضر مواظبة وغياب القسم</span>
          </button>

          <button
            onClick={() => setReportType('absence_notice')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
              reportType === 'absence_notice'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>إشعار غياب / استدعاء ولي</span>
          </button>
        </div>

        {/* Filters & Configuration Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Class Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                اختيار القسم:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-emerald-600"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade}) - {cls.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Trimester Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                الفصل الدراسي:
              </label>
              <select
                value={selectedTrimester}
                onChange={(e) => setSelectedTrimester(e.target.value as Trimester | 'ALL')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-emerald-600"
              >
                <option value="T1">الفصل الأول (T1)</option>
                <option value="T2">الفصل الثاني (T2)</option>
                <option value="T3">الفصل الثالث (T3)</option>
                <option value="ALL">كامل الموسم الدراسي</option>
              </select>
            </div>

            {/* 3. Student Selector (Only if student card or absence notice) */}
            {(reportType === 'student_card' || reportType === 'absence_notice') && (
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                    اختيار الطالب:
                  </label>
                  {classStudents.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrevStudent}
                        disabled={currentStudentIndex <= 0}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                        title="الطالب السابق"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {currentStudentIndex + 1} / {classStudents.length}
                      </span>
                      <button
                        onClick={handleNextStudent}
                        disabled={currentStudentIndex >= classStudents.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                        title="الطالب التالي"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <select
                  value={activeStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-emerald-600"
                >
                  {classStudents.map((st, idx) => (
                    <option key={st.id} value={st.id}>
                      #{idx + 1} - {st.lastName} {st.firstName} {st.studentNumber ? `(${st.studentNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Document Section Toggles & Customization */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              عناصر الوثيقة:
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOfficialHeader}
                onChange={(e) => setShowOfficialHeader(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>الترويسة الرسمية للوزارة</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGrades}
                onChange={(e) => setShowGrades(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>النقاط والمعدلات</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAttendance}
                onChange={(e) => setShowAttendance(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>المواظبة والغيابات</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>خانات التأشيرة والتوقيعات</span>
            </label>
          </div>

          {/* Optional: Custom remark field for student report or notice */}
          {(reportType === 'student_card' || reportType === 'absence_notice') && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  ملاحظة الأستاذ(ة) المخصصة في هذا التقرير:
                </label>
                {customRemark && (
                  <button
                    onClick={() => setCustomRemark('')}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    مسح الملاحظة
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customRemark}
                onChange={(e) => setCustomRemark(e.target.value)}
                placeholder="اكتب ملاحظة بيداغوجية خاصة بالتلميذ أو اختر من التوجيهات الجاهزة أدناه..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-emerald-600"
              />

              {/* Remark Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-medium">توجيهات مقترحة:</span>
                {remarkPresets.map((pr, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomRemark(pr)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition"
                  >
                    {pr.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. The Printable Document Container */}
      <div 
        id="printable-report-container"
        className="printable-card bg-white text-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-md font-sans print:shadow-none print:border-none print:p-0"
      >
        {/* Official Algerian Ministry Header */}
        {showOfficialHeader && (
          <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center">
            <h4 className="text-sm font-bold tracking-wide text-slate-800">
              الجمهورية الجزائرية الديمقراطية الشعبية
            </h4>
            <h5 className="text-xs font-semibold text-slate-600 mt-0.5">
              وزارة التربية الوطنية
            </h5>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700 border-t border-dashed border-slate-300 pt-3">
              <div className="text-right">
                <p>
                  <span className="font-bold">مديرية التربية لولاية:</span> {profile.wilaya || '...................'}
                </p>
                <p className="mt-1">
                  <span className="font-bold">المؤسسة التعليمية:</span> {profile.schoolName || '...................'}
                </p>
              </div>

              <div className="hidden sm:block text-center self-center">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs border border-slate-300">
                  {profile.academicYear || 'الموسم الدراسي 2024 - 2025'}
                </span>
              </div>

              <div className="text-left">
                <p>
                  <span className="font-bold">الأستاذ(ة):</span> {profile.fullName || '...................'}
                </p>
                <p className="mt-1">
                  <span className="font-bold">مادة التدريس:</span> {activeClass?.subject || profile.subject || '...................'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Title Banner */}
        <div className="text-center my-4 py-2.5 px-4 bg-slate-100 print:bg-slate-50 border-y-2 border-slate-800 rounded-lg">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {reportType === 'student_card' && 'كشف المتابعة البيداغوجية الشاملة للتلميذ'}
            {reportType === 'class_grades' && 'قائمة النقاط ومعدلات المادة للقسم'}
            {reportType === 'class_attendance' && 'محضر الحضور والمواظبة العامة للقسم'}
            {reportType === 'absence_notice' && 'إشعار بالغياب واستدعاء ولي التلميذ'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 font-bold mt-1">
            <span>القسم: {activeClass?.name} ({activeClass?.grade})</span>
            <span>•</span>
            <span>المادة: {activeClass?.subject}</span>
            <span>•</span>
            <span>الفصل: {selectedTrimester === 'ALL' ? 'كامل الموسم' : TRIMESTER_INFO[selectedTrimester].label}</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: Individual Student Comprehensive Card                  */}
        {/* ------------------------------------------------------------- */}
        {reportType === 'student_card' && activeStudent && (
          <div className="space-y-6">
            {/* Student Info Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">اللقب والاسم:</span>
                <span className="font-black text-sm text-slate-900">
                  {activeStudent.lastName} {activeStudent.firstName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">رقم التعريف المدرسي:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {activeStudent.studentNumber || 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">تاريخ الميلاد:</span>
                <span className="font-semibold text-slate-800">
                  {activeStudent.birthDate || 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">هاتف الولي:</span>
                <span className="font-semibold text-slate-800" dir="ltr">
                  {activeStudent.guardianPhone || 'غير محدد'}
                </span>
              </div>
            </div>

            {/* Attendance Summary */}
            {showAttendance && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    المواظبة والانضباط المدرسي:
                  </h3>
                  {activeStudentAttendance && (
                    <span className="text-xs font-bold text-slate-700">
                      نسبة الحضور: {activeStudentAttendance.rate}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-500 text-[11px] block">الحصص المرصودة</span>
                    <span className="font-black text-base text-slate-900">
                      {computedAttendance.totalSessions}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <span className="text-emerald-700 text-[11px] block">أيام الحضور</span>
                    <span className="font-black text-base text-emerald-800">
                      {activeStudentAttendance?.daysPresent ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50">
                    <span className="text-rose-700 text-[11px] block">غياب غير مبرر</span>
                    <span className="font-black text-base text-rose-800">
                      {activeStudentAttendance?.daysAbsent ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                    <span className="text-amber-700 text-[11px] block">غياب مبرر</span>
                    <span className="font-black text-base text-amber-800">
                      {activeStudentAttendance?.daysExcused ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-sky-200 bg-sky-50/50">
                    <span className="text-sky-700 text-[11px] block">مرات التأخر</span>
                    <span className="font-black text-base text-sky-800">
                      {activeStudentAttendance?.daysLate ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grades & Evaluation Summary */}
            {showGrades && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  النتائج والتقييمات المحصلة ({selectedTrimester === 'ALL' ? 'كامل الموسم' : TRIMESTER_INFO[selectedTrimester].label}):
                </h3>

                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                        <th className="p-2.5">الفرض الأول</th>
                        <th className="p-2.5">الفرض الثاني</th>
                        <th className="p-2.5">الاختبار</th>
                        <th className="p-2.5 bg-emerald-50 text-emerald-900 font-black">معدل المادة / 20</th>
                        <th className="p-2.5">الرتبة في القسم</th>
                        <th className="p-2.5">التقدير والملاحظة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-semibold">
                          {activeStudentGrade?.test1Score !== null
                            ? `${activeStudentGrade?.test1Score} / ${activeStudentGrade?.test1Max}`
                            : activeStudentGrade?.test1Absent
                            ? 'غائب'
                            : 'غير مدخل'}
                        </td>
                        <td className="p-2.5 font-semibold">
                          {activeStudentGrade?.test2Score !== null
                            ? `${activeStudentGrade?.test2Score} / ${activeStudentGrade?.test2Max}`
                            : activeStudentGrade?.test2Absent
                            ? 'غائب'
                            : 'غير مدخل'}
                        </td>
                        <td className="p-2.5 font-semibold">
                          {activeStudentGrade?.examScore !== null
                            ? `${activeStudentGrade?.examScore} / ${activeStudentGrade?.examMax}`
                            : activeStudentGrade?.examAbsent
                            ? 'غائب'
                            : 'غير مدخل'}
                        </td>
                        <td className="p-2.5 bg-emerald-50/70 font-black text-sm text-emerald-900">
                          {activeStudentGrade?.average !== null
                            ? `${activeStudentGrade?.average.toFixed(2)} / 20`
                            : '—'}
                        </td>
                        <td className="p-2.5 font-bold">
                          {activeStudentGrade?.rank ? `${activeStudentGrade.rank} من ${classStudents.length}` : '—'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {activeStudentGrade?.appraisal?.label || '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Teacher Observations & Educational Recommendations */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">
                ملاحظات وتوجيهات الأستاذ(ة):
              </span>
              <p className="text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200 min-h-[50px]">
                {customRemark || activeStudent.notes || 'تلميذ مواظب ومجتهد، نرجو له التوفيق والاستمرار في بذل المجهودات لتحقيق أفضل النتائج.'}
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: Class Grades & Averages Roster Sheet                  */}
        {/* ------------------------------------------------------------- */}
        {reportType === 'class_grades' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 text-center w-10">#</th>
                    <th className="p-2 text-center w-20">رقم التسجيل</th>
                    <th className="p-2">اللقب والاسم</th>
                    <th className="p-2 text-center">الفرض 1</th>
                    <th className="p-2 text-center">الفرض 2</th>
                    <th className="p-2 text-center">الاختبار</th>
                    <th className="p-2 text-center bg-emerald-50 text-emerald-950 font-black">المعدل / 20</th>
                    <th className="p-2 text-center">الرتبة</th>
                    <th className="p-2">التقدير الرسمي</th>
                    <th className="p-2">الملاحظة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {computedClassGrades.map((item, idx) => (
                    <tr key={item.student.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2 text-center font-mono text-[11px] text-slate-600">
                        {item.student.studentNumber || '—'}
                      </td>
                      <td className="p-2 font-bold text-slate-900">
                        {item.student.lastName} {item.student.firstName}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {item.test1Score !== null ? item.test1Score : item.test1Absent ? 'غائب' : '—'}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {item.test2Score !== null ? item.test2Score : item.test2Absent ? 'غائب' : '—'}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {item.examScore !== null ? item.examScore : item.examAbsent ? 'غائب' : '—'}
                      </td>
                      <td className="p-2 text-center bg-emerald-50/60 font-black text-emerald-950">
                        {item.average !== null ? item.average.toFixed(2) : '—'}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-700">
                        {item.rank ? item.rank : '—'}
                      </td>
                      <td className="p-2 font-semibold text-slate-800">
                        {item.appraisal?.label || '—'}
                      </td>
                      <td className="p-2 text-slate-600 text-[11px] truncate max-w-[120px]">
                        {item.student.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Class Grade Statistics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">تعداد القسم</span>
                <span className="font-black text-slate-900">{classStudents.length} طالب</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">معدل القسم العام</span>
                <span className="font-black text-emerald-800">
                  {classGradesStats.average !== null ? `${classGradesStats.average} / 20` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">أعلى معدل</span>
                <span className="font-black text-sky-800">
                  {classGradesStats.highest !== null ? `${classGradesStats.highest} / 20` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">أدنى معدل</span>
                <span className="font-black text-rose-800">
                  {classGradesStats.lowest !== null ? `${classGradesStats.lowest} / 20` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">عدد الناجحين (≥10)</span>
                <span className="font-black text-emerald-700">
                  {classGradesStats.passedCount} من {classStudents.length}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">نسبة النجاح</span>
                <span className="font-black text-emerald-700">
                  {classGradesStats.passRate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: Class Attendance & Absence Report                     */}
        {/* ------------------------------------------------------------- */}
        {reportType === 'class_attendance' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 text-center w-10">#</th>
                    <th className="p-2 text-center w-20">رقم التسجيل</th>
                    <th className="p-2">اللقب والاسم</th>
                    <th className="p-2 text-center">أيام الحضور</th>
                    <th className="p-2 text-center">غياب غير مبرر</th>
                    <th className="p-2 text-center">غياب مبرر</th>
                    <th className="p-2 text-center">تأخرات</th>
                    <th className="p-2 text-center bg-emerald-50 text-emerald-950 font-black">نسبة الحضور %</th>
                    <th className="p-2">تقييم المواظبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((st, idx) => {
                    const stat = computedAttendance.studentStats.get(st.id);
                    const rate = stat ? stat.rate : 100;
                    const rating =
                      rate >= 95 ? 'ممتازة' : rate >= 85 ? 'جيدة' : rate >= 70 ? 'متوسطة' : 'مقلقة تستوجب المتابعة';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 text-center font-mono text-[11px] text-slate-600">
                          {st.studentNumber || '—'}
                        </td>
                        <td className="p-2 font-bold text-slate-900">
                          {st.lastName} {st.firstName}
                        </td>
                        <td className="p-2 text-center font-medium text-emerald-800">
                          {stat?.daysPresent ?? 0}
                        </td>
                        <td className="p-2 text-center font-medium text-rose-700">
                          {stat?.daysAbsent ?? 0}
                        </td>
                        <td className="p-2 text-center font-medium text-amber-700">
                          {stat?.daysExcused ?? 0}
                        </td>
                        <td className="p-2 text-center font-medium text-sky-700">
                          {stat?.daysLate ?? 0}
                        </td>
                        <td className="p-2 text-center bg-emerald-50/60 font-black text-emerald-950">
                          {rate}%
                        </td>
                        <td className="p-2 font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rate >= 85
                                ? 'text-emerald-800 bg-emerald-50'
                                : rate >= 70
                                ? 'text-amber-800 bg-amber-50'
                                : 'text-rose-800 bg-rose-50'
                            }`}
                          >
                            {rating}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold text-slate-700">
                إجمالي جلسات الحضور المرصودة في هذا القسم: {computedAttendance.totalSessions} جلسة
              </span>
              <span className="text-slate-500 text-[11px]">
                تم إنشاء المحضر آلياً عبر نظام Ostad DZ
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 4: Absence Notice & Parent Summons Slip                  */}
        {/* ------------------------------------------------------------- */}
        {reportType === 'absence_notice' && activeStudent && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border-2 border-slate-800 bg-slate-50/50 space-y-4 text-xs leading-relaxed">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <span className="font-bold text-slate-700">
                  إلى السيد(ة) ولي أمر التلميذ(ة): <strong className="text-slate-900 text-sm">{activeStudent.lastName} {activeStudent.firstName}</strong>
                </span>
                <span className="text-slate-500">
                  التاريخ: {new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'long' }).format(new Date())}
                </span>
              </div>

              <p className="text-slate-800 text-justify text-sm">
                نحيطكم علماً بأن ابنكم/ابنتكم المسجل(ة) بقسم{' '}
                <strong>{activeClass?.name} ({activeClass?.grade})</strong> في مادة{' '}
                <strong>{activeClass?.subject || profile.subject}</strong> قد سجل غيابات وتأخرات متكررة بلغت:
              </p>

              <div className="grid grid-cols-3 gap-3 text-center my-3">
                <div className="p-3 bg-white rounded-xl border border-rose-200">
                  <span className="text-rose-700 text-xs block">عدد الغيابات غير المبررة</span>
                  <span className="text-xl font-black text-rose-800">
                    {activeStudentAttendance?.daysAbsent ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-sky-200">
                  <span className="text-sky-700 text-xs block">مرات التأخر عن الحصة</span>
                  <span className="text-xl font-black text-sky-800">
                    {activeStudentAttendance?.daysLate ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-xs block">نسبة المواظبة الحالية</span>
                  <span className="text-xl font-black text-emerald-800">
                    {activeStudentAttendance?.rate ?? 100}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">ملاحظة وتوجيه الأستاذ(ة):</span>
                <p className="text-slate-800">
                  {customRemark ||
                    'نظراً للتأثير السلبي للغياب على التحصيل الدراسي واستيعاب المفاهيم، ندعوكم للتقرب من المؤسسة أو الاتصال لتدارك هذا التأخر وتبرير الغيابات المسجلة.'}
                </p>
              </div>

              <p className="text-slate-600 text-[11px] pt-2">
                ملاحظة: تُعاد القسيمة المرفقة أسفله بعد توقيع الولي ومستشار التربية.
              </p>
            </div>

            {/* Detachable Return Slip */}
            <div className="border-t-2 border-dashed border-slate-400 pt-5 mt-8 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block text-center">
                ✂ قسيمة إشعار بالاستلام تعاد للأستاذ(ة) ✂
              </span>
              <div className="p-4 rounded-xl border border-slate-300 text-xs space-y-2">
                <p>
                  أنا الموقع أسفله ولي أمر التلميذ(ة):{' '}
                  <strong>{activeStudent.lastName} {activeStudent.firstName}</strong> (قسم: {activeClass?.name})،
                  أشهد أنني اطلعت على إشعار الغياب وسأتخذ التدابير اللازمة لمتابعة تمدرس ابني/ابنتي.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 text-center">
                  <div>
                    <span className="block font-bold">توقيع وملاحظة الولي:</span>
                    <div className="h-12 border-b border-slate-300 mt-2" />
                  </div>
                  <div>
                    <span className="block font-bold">تأشيرة مستشار التربية / المدير:</span>
                    <div className="h-12 border-b border-slate-300 mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signatures & Stamps Block */}
        {showSignatures && reportType !== 'absence_notice' && (
          <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <span className="font-bold text-slate-800 block mb-1">توقيع الأستاذ(ة):</span>
              <p className="text-[11px] text-slate-500 mb-8">{profile.fullName || 'أستاذ المادة'}</p>
              <div className="border-b border-slate-400 mx-auto w-32" />
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">تأشيرة الإدارة / المدير:</span>
              <p className="text-[11px] text-slate-500 mb-8">الختم والتاريخ</p>
              <div className="border-b border-slate-400 mx-auto w-32" />
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">
                {reportType === 'student_card' ? 'توقيع واطلاع الولي:' : 'مفتش التعليم / البيداغوجيا:'}
              </span>
              <p className="text-[11px] text-slate-500 mb-8">الملاحظة</p>
              <div className="border-b border-slate-400 mx-auto w-32" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
