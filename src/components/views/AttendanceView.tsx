import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  Users, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Printer, 
  History, 
  FileSpreadsheet, 
  TrendingUp, 
  Clock, 
  Plus, 
  Filter, 
  AlertCircle,
  HelpCircle,
  Eye,
  Edit3,
  CalendarCheck,
  Check,
  X,
  FileDown,
  FileText,
  Loader2
} from 'lucide-react';
import { ClassItem, StudentItem, AttendanceRecord, AttendanceStatus, StudentAttendanceEntry, TeacherProfile } from '../../types';
import { StudentAttendanceHistoryModal } from '../modals/StudentAttendanceHistoryModal';
import { exportAttendanceSheetDocx } from '../../utils/docxService';
import { exportAttendanceSheetPdf } from '../../utils/pdfService';

interface AttendanceViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  attendanceRecords: AttendanceRecord[];
  profile?: TeacherProfile;
  onSaveAttendance: (record: AttendanceRecord) => Promise<void>;
  onDeleteAttendance?: (id: string) => Promise<void>;
  onNavigateToClasses: () => void;
  onNavigateToStudents: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  classes,
  students,
  attendanceRecords,
  profile,
  onSaveAttendance,
  onDeleteAttendance,
  onNavigateToClasses,
  onNavigateToStudents,
}) => {
  // 1. Current selection states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  
  // Format today's date YYYY-MM-DD in local time
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedPeriod, setSelectedPeriod] = useState<string>('كامل اليوم');

  // Sub-view: 'rollcall' (رصد اليوم), 'stats' (إحصائيات وسجل الطلاب), 'history' (أرشيف التواريخ)
  const [activeSubTab, setActiveSubTab] = useState<'rollcall' | 'stats' | 'history'>('rollcall');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected student for detail history modal
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentItem | null>(null);

  // Note editor modal for a specific student's absence note
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [studentNoteInput, setStudentNoteInput] = useState<string>('');

  // Save feedback state
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // If selectedClassId not in classes, reset to first class
  useEffect(() => {
    if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Active Class Object
  const activeClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Students belonging to active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students
      .filter((s) => s.classId === activeClass.id)
      .sort((a, b) => {
        // Sort by studentNumber or lastName
        if (a.studentNumber && b.studentNumber) {
          return a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true });
        }
        return a.lastName.localeCompare(b.lastName, 'ar');
      });
  }, [students, activeClass]);

  // Attendance records for the active class
  const classAttendanceRecords = useMemo(() => {
    if (!activeClass) return [];
    return attendanceRecords.filter((r) => r.classId === activeClass.id);
  }, [attendanceRecords, activeClass]);

  // Find existing record for current class and date
  const currentSessionRecord = useMemo(() => {
    if (!activeClass) return null;
    return classAttendanceRecords.find((r) => r.date === selectedDate) || null;
  }, [classAttendanceRecords, activeClass, selectedDate]);

  // Local draft roll call state for current class and date
  const [localRollCall, setLocalRollCall] = useState<Record<string, StudentAttendanceEntry>>({});

  // Sync draft roll call whenever active class, selected date, or stored record changes
  useEffect(() => {
    if (!activeClass) return;

    if (currentSessionRecord && currentSessionRecord.records) {
      // Load saved record, ensuring any newly added students get a default 'present'
      const merged: Record<string, StudentAttendanceEntry> = { ...currentSessionRecord.records };
      classStudents.forEach((student) => {
        if (!merged[student.id]) {
          merged[student.id] = {
            studentId: student.id,
            status: 'present',
            updatedAt: Date.now(),
          };
        }
      });
      setLocalRollCall(merged);
      if (currentSessionRecord.period) {
        setSelectedPeriod(currentSessionRecord.period);
      }
    } else {
      // Initialize with all students marked 'present' by default
      const initial: Record<string, StudentAttendanceEntry> = {};
      classStudents.forEach((student) => {
        initial[student.id] = {
          studentId: student.id,
          status: 'present',
          updatedAt: Date.now(),
        };
      });
      setLocalRollCall(initial);
    }
  }, [activeClass, selectedDate, currentSessionRecord, classStudents]);

  // Compute Daily Live Statistics
  const dailyStats = useMemo(() => {
    const total = classStudents.length;
    let present = 0;
    let absent = 0;

    classStudents.forEach((s) => {
      const entry = localRollCall[s.id];
      if (!entry || entry.status === 'present') {
        present++;
      } else {
        absent++;
      }
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, rate };
  }, [classStudents, localRollCall]);

  // Helper: Persist localRollCall to IndexedDB
  const persistAttendance = async (draft: Record<string, StudentAttendanceEntry>) => {
    if (!activeClass) return;
    setIsSaving(true);

    let present = 0;
    let absent = 0;
    classStudents.forEach((s) => {
      const entry = draft[s.id];
      if (!entry || entry.status === 'present') {
        present++;
      } else {
        absent++;
      }
    });

    const record: AttendanceRecord = {
      id: `${activeClass.id}_${selectedDate}`,
      classId: activeClass.id,
      className: activeClass.name,
      date: selectedDate,
      period: selectedPeriod,
      records: draft,
      totalStudents: classStudents.length,
      presentCount: present,
      absentCount: absent,
      createdAt: currentSessionRecord?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await onSaveAttendance(record);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } catch (e) {
      console.error('Error saving attendance:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Toggle single student status
  const handleToggleStudentStatus = (studentId: string, newStatus: AttendanceStatus) => {
    setLocalRollCall((prev) => {
      const updated = {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || { studentId }),
          status: newStatus,
          updatedAt: Date.now(),
        },
      };
      persistAttendance(updated);
      return updated;
    });
  };

  // 2. Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, StudentAttendanceEntry> = {};
    classStudents.forEach((s) => {
      const existing = localRollCall[s.id];
      updated[s.id] = {
        studentId: s.id,
        status: 'present',
        note: existing?.note,
        updatedAt: Date.now(),
      };
    });
    setLocalRollCall(updated);
    persistAttendance(updated);
  };

  // 3. Mark all absent
  const handleMarkAllAbsent = () => {
    const updated: Record<string, StudentAttendanceEntry> = {};
    classStudents.forEach((s) => {
      const existing = localRollCall[s.id];
      updated[s.id] = {
        studentId: s.id,
        status: 'absent',
        note: existing?.note,
        updatedAt: Date.now(),
      };
    });
    setLocalRollCall(updated);
    persistAttendance(updated);
  };

  // 4. Save note for student absence
  const handleSaveStudentNote = () => {
    if (!editingNoteStudentId) return;

    setLocalRollCall((prev) => {
      const updated = {
        ...prev,
        [editingNoteStudentId]: {
          ...(prev[editingNoteStudentId] || { studentId: editingNoteStudentId, status: 'absent' }),
          note: studentNoteInput.trim() || undefined,
          updatedAt: Date.now(),
        },
      };
      persistAttendance(updated);
      return updated;
    });

    setEditingNoteStudentId(null);
    setStudentNoteInput('');
  };

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const parts = selectedDate.split('-');
    const current = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Format selected date in Arabic
  const formattedDateArabic = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return new Intl.DateTimeFormat('ar-DZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Overall student attendance statistics across all recorded days for active class
  const studentStatsList = useMemo(() => {
    if (!activeClass) return [];

    const totalDaysRecorded = classAttendanceRecords.length;

    return classStudents.map((student) => {
      let daysPresent = 0;
      let daysAbsent = 0;

      classAttendanceRecords.forEach((rec) => {
        const entry = rec.records?.[student.id];
        if (entry) {
          if (entry.status === 'present') {
            daysPresent++;
          } else {
            daysAbsent++;
          }
        }
      });

      const attendanceRate = totalDaysRecorded > 0 ? Math.round((daysPresent / totalDaysRecorded) * 100) : 100;

      return {
        student,
        totalDaysRecorded,
        daysPresent,
        daysAbsent,
        attendanceRate,
      };
    });
  }, [activeClass, classStudents, classAttendanceRecords]);

  // Filtered student rows by search query
  const displayedRollCallStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase();
    return classStudents.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const num = s.studentNumber ? s.studentNumber.toLowerCase() : '';
      return name.includes(q) || num.includes(q);
    });
  }, [classStudents, searchQuery]);

  const displayedStatsStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentStatsList;
    const q = searchQuery.toLowerCase();
    return studentStatsList.filter((item) => {
      const name = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();
      const num = item.student.studentNumber ? item.student.studentNumber.toLowerCase() : '';
      return name.includes(q) || num.includes(q);
    });
  }, [studentStatsList, searchQuery]);

  // Print function
  const handlePrintSheet = () => {
    window.print();
  };

  // PDF & Word export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const fallbackProfile: TeacherProfile = profile || {
    fullName: 'أستاذ المادة',
    schoolName: '',
    subject: '',
    academicYear: '2024 - 2025',
    wilaya: '',
  };

  // PDF export handler
  const handleExportAttendancePdf = async () => {
    if (!activeClass || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportAttendanceSheetPdf(
        activeClass,
        selectedDate,
        classStudents,
        attendanceRecords,
        fallbackProfile
      );
      setExportSuccessMessage('تم تصدير سجل الحضور والغياب كملف PDF بنجاح وحفظه في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export attendance PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Word export handler
  const handleExportAttendanceWord = async () => {
    if (!activeClass || isExportingWord) return;
    setIsExportingWord(true);
    try {
      await exportAttendanceSheetDocx(
        activeClass,
        selectedDate,
        classStudents,
        attendanceRecords,
        fallbackProfile
      );
      setExportSuccessMessage('تم تصدير سجل الحضور كملف Word (.docx) قابل للتعديل بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export attendance Word docx:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  if (classes.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          لم تقم بإضافة أقسام بعد
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          لتتمكن من تسجيل الحضور والغياب اليومي للطلاب، يرجى إنشاء قسمك التربوي الأول أولاً وإضافة الطلاب إليه.
        </p>
        <button
          onClick={onNavigateToClasses}
          className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
        >
          + الانتقال لإنشاء قسم جديد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  الحضور والغياب
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  رصد ومتابعة انضباط وغيابات الطلاب مع حفظ فوري ومحلي 100% دون إنترنت
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tab Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('rollcall')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeSubTab === 'rollcall'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>رصد اليوم</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stats')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeSubTab === 'stats'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>إحصائيات وسجل الطلاب</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>أرشيف التواريخ ({classAttendanceRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Class selection + Date selection */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Class Select */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
              القسم:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex-1 sm:max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.stage === 'secondary' ? 'ثانوي' : cls.stage === 'middle' ? 'متوسط' : 'ابتدائي'})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Period Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="اليوم السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-hidden font-mono cursor-pointer"
                />
              </div>

              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="اليوم التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate(getTodayString())}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition ml-1"
              >
                اليوم
              </button>
            </div>

            {/* Period selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                persistAttendance(localRollCall);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="كامل اليوم">كامل اليوم</option>
              <option value="الفترة الصباحية">الفترة الصباحية</option>
              <option value="الفترة المسائية">الفترة المسائية</option>
            </select>

            {/* Export PDF Button */}
            <button
              onClick={handleExportAttendancePdf}
              disabled={isExportingPdf || !activeClass}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="تصدير ورقة الحضور والغياب الرسمية كملف PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>PDF</span>
            </button>

            {/* Export Word Button */}
            <button
              onClick={handleExportAttendanceWord}
              disabled={isExportingWord || !activeClass}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-50 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="تصدير ورقة الحضور كملف Word (.docx) قابل للتعديل"
            >
              {isExportingWord ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Word</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrintSheet}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title="طباعة ورقة الحضور والغياب"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportSuccessMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ROLL CALL (رصد اليوم)                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'rollcall' && (
        <div className="space-y-4">
          {/* Quick Stats & Bulk Actions Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Daily Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">تاريخ الرصد:</span>
                <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {formattedDateArabic}
                </span>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>الحاضرون: {dailyStats.present}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>الغياب: {dailyStats.absent}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
                  <TrendingUp className="w-3 h-3" />
                  <span>نسبة الحضور: %{dailyStats.rate}</span>
                </span>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
                title="تسجيل حضور جميع طلاب القسم بضغطة واحدة"
              >
                <Check className="w-4 h-4" />
                <span>حضور الجميع</span>
              </button>

              <button
                onClick={handleMarkAllAbsent}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
                title="تسجيل غياب جميع الطلاب"
              >
                <X className="w-4 h-4" />
                <span>غياب الجميع</span>
              </button>

              <button
                onClick={() => persistAttendance(localRollCall)}
                disabled={isSaving}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSavedRecently
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSavedRecently ? 'تم الحفظ في IndexedDB ✓' : isSaving ? 'جاري الحفظ...' : 'حفظ السجل'}</span>
              </button>
            </div>
          </div>

          {/* Search bar within class */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن طالب بالاسم أو رقم القيد للتأشير السريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs transition"
            />
          </div>

          {/* Student Roll Call Cards / Rows */}
          {classStudents.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا يوجد طلاب مسجلين في هذا القسم بعد
              </p>
              <button
                onClick={onNavigateToStudents}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
              >
                + تسجيل طلاب في هذا القسم
              </button>
            </div>
          ) : displayedRollCallStudents.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                لا يوجد طالب يطابق البحث "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedRollCallStudents.map((student, index) => {
                const entry = localRollCall[student.id] || { studentId: student.id, status: 'present' };
                const isPresent = entry.status === 'present';
                const isAbsent = entry.status === 'absent';

                // Count historical absences for this student in this class
                const historicalAbsenceCount = classAttendanceRecords.reduce((acc, rec) => {
                  return acc + (rec.records?.[student.id]?.status === 'absent' ? 1 : 0);
                }, 0);

                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      isPresent
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-xs'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          isPresent
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          {student.lastName[0] || index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {student.lastName} {student.firstName}
                            </span>
                            {student.studentNumber && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                #{student.studentNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>
                              الغيابات المسجلة سابقاً:{' '}
                              <span className={`font-bold ${historicalAbsenceCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                                {historicalAbsenceCount}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail History Button */}
                      <button
                        onClick={() => setSelectedStudentForHistory(student)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="عرض سجل انضباط التلميذ كاملاً"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action row: Toggle buttons + Note */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* Note or Justification */}
                      <div className="flex-1 min-w-0">
                        {entry.note ? (
                          <button
                            onClick={() => {
                              setEditingNoteStudentId(student.id);
                              setStudentNoteInput(entry.note || '');
                            }}
                            className="text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 truncate"
                            title="تعديل الملاحظة"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0 text-amber-500" />
                            <span className="truncate">{entry.note}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteStudentId(student.id);
                              setStudentNoteInput('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition"
                            title="إضافة تبرير أو ملاحظة"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>+ تبرير / ملاحظة</span>
                          </button>
                        )}
                      </div>

                      {/* Present / Absent Segmented Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => handleToggleStudentStatus(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        <button
                          onClick={() => handleToggleStudentStatus(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STUDENT ATTENDANCE STATS & HISTORY TABLE                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  إحصائيات انضباط طلاب قسم {activeClass?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إجمالي الأيام المسجلة للقسم: {classAttendanceRecords.length} يوم دراسي
                </p>
              </div>

              {/* Search */}
              <div className="relative sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto w-full">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <th className="p-3 font-bold w-12 text-center">#</th>
                    <th className="p-3 font-bold min-w-[160px]">اسم ولقب التلميذ</th>
                    <th className="p-3 font-bold text-center">أيام الرصد</th>
                    <th className="p-3 font-bold text-center text-emerald-700 dark:text-emerald-400">أيام الحضور</th>
                    <th className="p-3 font-bold text-center text-rose-700 dark:text-rose-400">أيام الغياب</th>
                    <th className="p-3 font-bold text-center">نسبة الحضور</th>
                    <th className="p-3 font-bold text-center w-28">السجل التفصيلي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedStatsStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        لا يوجد طلاب لعرض إحصائياتهم
                      </td>
                    </tr>
                  ) : (
                    displayedStatsStudents.map((item, idx) => (
                      <tr 
                        key={item.student.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.student.lastName} {item.student.firstName}</span>
                            {item.student.studentNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.student.studentNumber})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {item.totalDaysRecorded}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {item.daysPresent}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-rose-700 dark:text-rose-400">
                          {item.daysAbsent}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.attendanceRate >= 90
                                    ? 'bg-emerald-500'
                                    : item.attendanceRate >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${item.attendanceRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              %{item.attendanceRate}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedStudentForHistory(item.student)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 font-bold transition flex items-center justify-center gap-1 mx-auto text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض السجل</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PAST DATES LOG & ARCHIVE (أرشيف التواريخ)                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              سجل الجلسات المرصودة لقسم {activeClass?.name}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              يمكنك النقر على أي تاريخ سابق لمعاينته أو تعديل حالة الطلاب فيه مباشرة.
            </p>

            {classAttendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  لم يتم حفظ أي جلسات حضور سابقة لهذا القسم
                </p>
                <button
                  onClick={() => setActiveSubTab('rollcall')}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  رصد حضور اليوم
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {classAttendanceRecords.map((record) => {
                  const rate = record.totalStudents > 0 
                    ? Math.round((record.presentCount / record.totalStudents) * 100) 
                    : 100;

                  const isCurrent = record.date === selectedDate;

                  return (
                    <div
                      key={record.id}
                      onClick={() => {
                        setSelectedDate(record.date);
                        setActiveSubTab('rollcall');
                      }}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 group ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {record.date}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {record.period || 'كامل اليوم'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {record.presentCount} حاضر
                          </span>
                          <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            {record.absentCount} غائب
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-700 dark:text-sky-400">
                          نسبة الحضور: %{rate}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
                          فتح للتعديل
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Individual Student History Modal                                */}
      {/* ========================================================================= */}
      <StudentAttendanceHistoryModal
        isOpen={Boolean(selectedStudentForHistory)}
        onClose={() => setSelectedStudentForHistory(null)}
        student={selectedStudentForHistory}
        className={activeClass?.name}
        attendanceRecords={classAttendanceRecords}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Note / Justification for student absence                   */}
      {/* ========================================================================= */}
      {editingNoteStudentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
                <span>إضافة تبرير أو ملاحظة للغياب</span>
              </h4>
              <button
                onClick={() => setEditingNoteStudentId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick tags */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3 text-xs">
              <span className="text-slate-400 font-bold ml-1">اقتراحات سريعة:</span>
              <button
                onClick={() => setStudentNoteInput('غياب مبرر بشهادة طبية')}
                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
              >
                شهادة طبية
              </button>
              <button
                onClick={() => setStudentNoteInput('غياب مبرر بإذن الولي')}
                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
              >
                إذن الولي
              </button>
              <button
                onClick={() => setStudentNoteInput('تأخر 10 دقائق')}
                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium"
              >
                تأخر
              </button>
              <button
                onClick={() => setStudentNoteInput('غير مبرر')}
                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-medium"
              >
                غير مبرر
              </button>
            </div>

            <textarea
              rows={3}
              value={studentNoteInput}
              onChange={(e) => setStudentNoteInput(e.target.value)}
              placeholder="اكتب سبب الغياب، رقم الشهادة الطبية، أو الملاحظة..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingNoteStudentId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveStudentNote}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                حفظ الملاحظة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
