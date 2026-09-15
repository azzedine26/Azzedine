import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SplashScreen } from './components/views/SplashScreen';
import { DashboardView } from './components/views/DashboardView';
import { ClassesView } from './components/views/ClassesView';
import { StudentsView } from './components/views/StudentsView';
import { SettingsView } from './components/views/SettingsView';
import { ScheduleView } from './components/views/ScheduleView';
import { LessonsView } from './components/views/LessonsView';
import { GradesView } from './components/views/GradesView';
import { AttendanceView } from './components/views/AttendanceView';
import { ReportsView } from './components/views/ReportsView';
import { RemindersView } from './components/views/RemindersView';
import { LibraryView } from './components/views/LibraryView';
import { RandomPickerView } from './components/views/RandomPickerView';
import { AddClassModal } from './components/modals/AddClassModal';
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AddSessionModal } from './components/modals/AddSessionModal';
import { AddLessonModal } from './components/modals/AddLessonModal';
import { AddAssessmentModal } from './components/modals/AddAssessmentModal';
import { AddReminderModal } from './components/modals/AddReminderModal';
import { GradeEntryModal } from './components/modals/GradeEntryModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { SubjectSettingModal } from './components/modals/SubjectSettingModal';
import { EducationalStageModal } from './components/modals/EducationalStageModal';
import { ExcelImportModal } from './components/modals/ExcelImportModal';
import { exportStudentsToExcel, generateStudentExcelTemplate } from './utils/excelService';
import { useTheme } from './hooks/useTheme';
import { databaseService } from './db/databaseService';
import { 
  ActiveTab, 
  AppSettings, 
  ClassItem, 
  StudentItem, 
  TeacherProfile, 
  ScheduleSession, 
  DayOfWeek, 
  LessonPlan, 
  AssessmentItem,
  StudentScoreRecord,
  SubjectSetting,
  AttendanceRecord,
  ReminderItem,
  LibraryItem,
  EducationalStage
} from './types';
import { INITIAL_TEACHER_PROFILE } from './data/algerianData';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [hasVisitedSplash, setHasVisitedSplash] = useState<boolean>(true);

  // Core Data State (Loaded from IndexedDB)
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [subjectSettings, setSubjectSettings] = useState<SubjectSetting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    key: 'main_config',
    theme: 'light',
    profile: INITIAL_TEACHER_PROFILE,
    hasSeenSplash: true,
    updatedAt: Date.now(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sidebar state
  const [isMobileSidebarExpanded, setIsMobileSidebarExpanded] = useState<boolean>(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState<boolean>(false);

  // Modals State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [sessionDefaultDay, setSessionDefaultDay] = useState<DayOfWeek>('sunday');

  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonPlan | null>(null);
  const [defaultLessonClassId, setDefaultLessonClassId] = useState<string | undefined>(undefined);

  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentItem | null>(null);
  const [defaultAssessmentClassId, setDefaultAssessmentClassId] = useState<string | undefined>(undefined);
  const [gradingAssessment, setGradingAssessment] = useState<AssessmentItem | null>(null);

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectSetting | null>(null);

  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  // Excel Import Modal State
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Educational Stage Modal State
  const [isEducationalStageModalOpen, setIsEducationalStageModalOpen] = useState(false);

  // Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'class' | 'student' | 'session' | 'lesson' | 'assessment' | 'subject' | 'reminder';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'class',
    id: '',
    name: '',
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Initial Load & Seed from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      await databaseService.ensureInitialized();
      const [
        fetchedClasses, 
        fetchedStudents, 
        fetchedSessions, 
        fetchedLessons, 
        fetchedAssessments,
        fetchedSettings,
        fetchedSubjects,
        fetchedAttendance,
        fetchedReminders,
        fetchedLibraryItems
      ] = await Promise.all([
        databaseService.getAllClasses(),
        databaseService.getAllStudents(),
        databaseService.getAllSessions(),
        databaseService.getAllLessons(),
        databaseService.getAllAssessments(),
        databaseService.getSettings(),
        databaseService.getAllSubjectSettings(),
        databaseService.getAllAttendance(),
        databaseService.getAllReminders(),
        databaseService.getAllLibraryItems(),
      ]);

      setClasses(fetchedClasses);
      setStudents(fetchedStudents);
      setSessions(fetchedSessions);
      setLessons(fetchedLessons);
      setAssessments(fetchedAssessments);
      setSettings(fetchedSettings);
      setSubjectSettings(fetchedSubjects);
      setAttendanceRecords(fetchedAttendance);
      setReminders(fetchedReminders);
      setLibraryItems(fetchedLibraryItems);

      // Check if educational stage has not been set yet
      if (!fetchedSettings.educationalStage) {
        setIsEducationalStageModalOpen(true);
      }

      // Check if first-ever visit
      if (!fetchedSettings.hasSeenSplash && !localStorage.getItem('ostad_dz_seen_splash')) {
        setCurrentTab('splash');
        setHasVisitedSplash(false);
      }
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Handler to leave splash and start dashboard
  const handleStartFromSplash = async () => {
    setCurrentTab('dashboard');
    setHasVisitedSplash(true);
    localStorage.setItem('ostad_dz_seen_splash', 'true');
    await databaseService.saveSettings({ hasSeenSplash: true });
    if (!settings.educationalStage) {
      setIsEducationalStageModalOpen(true);
    }
  };

  // ================= Educational Stage System =================
  const handleSaveEducationalStage = async (
    stage: EducationalStage, 
    specializedSubject: string
  ) => {
    try {
      await databaseService.saveSettings({
        educationalStage: stage,
        profile: {
          ...settings.profile,
          stage,
          subject: specializedSubject,
        },
        hasSeenSplash: true,
      });

      if (specializedSubject.trim()) {
        const existing = await databaseService.getAllSubjectSettings();
        const exists = existing.some((s) => s.name.trim().toLowerCase() === specializedSubject.trim().toLowerCase());
        if (!exists) {
          await databaseService.saveSubjectSetting({
            id: `subj-spec-${Date.now()}`,
            name: specializedSubject.trim(),
            coefficient: 2,
            calculationMethod: {
              method: 'tests_avg_plus_exam_x2_div_3',
            },
          });
        }
      }

      const [freshSettings, freshSubjects] = await Promise.all([
        databaseService.getSettings(),
        databaseService.getAllSubjectSettings(),
      ]);
      setSettings(freshSettings);
      setSubjectSettings(freshSubjects);
      setIsEducationalStageModalOpen(false);
      setHasVisitedSplash(true);
      localStorage.setItem('ostad_dz_seen_splash', 'true');
      showToast(
        `تم حفظ وضبط الطور التعليمي (${
          stage === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'
        }) بنجاح.`
      );
    } catch (err) {
      console.error('Error saving educational stage:', err);
      showToast('حدث خطأ أثناء حفظ الطور التعليمي.');
    }
  };

  // ================= Class Operations =================
  const handleSaveClass = async (classData: ClassItem | Omit<ClassItem, 'createdAt' | 'updatedAt'>) => {
    if (editingClass) {
      const updated = await databaseService.updateClass(classData as ClassItem);
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast(`تم تحديث القسم "${updated.name}" بنجاح.`);
    } else {
      const created = await databaseService.addClass(classData as ClassItem);
      setClasses((prev) => [created, ...prev]);
      showToast(`تم إنشاء القسم "${created.name}" بنجاح.`);
    }
    setEditingClass(null);
  };

  const handlePromptDeleteClass = (classId: string, className: string) => {
    const studentCountInClass = students.filter((s) => s.classId === classId).length;
    const warning =
      studentCountInClass > 0
        ? `تنبيه: هذا القسم يحتوي على ${studentCountInClass} طالب مسجل. حذف القسم سيؤدي أيضاً إلى حذف جميع الطلاب المنتمين إليه.`
        : 'هل أنت متأكد من حذف هذا القسم؟';

    setDeleteModal({
      isOpen: true,
      type: 'class',
      id: classId,
      name: `${className} - ${warning}`,
    });
  };

  // ================= Student Operations =================
  const handleSaveStudent = async (studentData: StudentItem | Omit<StudentItem, 'createdAt' | 'updatedAt'>) => {
    if (editingStudent) {
      const updated = await databaseService.updateStudent(studentData as StudentItem);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`تم تعديل بيانات الطالب "${updated.lastName} ${updated.firstName}".`);
    } else {
      const created = await databaseService.addStudent(studentData as StudentItem);
      setStudents((prev) => [created, ...prev]);
      showToast(`تم تسجيل التلميذ "${created.lastName} ${created.firstName}" بنجاح.`);
    }
    setEditingStudent(null);
  };

  const handlePromptDeleteStudent = (studentId: string, studentName: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'student',
      id: studentId,
      name: studentName,
    });
  };

  // ================= Excel Operations for Students =================
  const handleExportStudentsExcel = () => {
    try {
      const result = exportStudentsToExcel(students, classes, selectedClassFilter);
      showToast(`تم تصدير ${result.count} تلميذ بنجاح إلى ملف "${result.filename}".`);
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      showToast('حدث خطأ أثناء تصدير ملف Excel.');
    }
  };

  const handleDownloadExcelTemplate = () => {
    try {
      const result = generateStudentExcelTemplate();
      showToast(`تم تنزيل نموذج Excel الجاهز "${result.filename}".`);
    } catch (err: any) {
      console.error('Download template failed:', err);
      showToast('حدث خطأ أثناء تنزيل نموذج Excel.');
    }
  };

  const handleExcelImportComplete = async (
    importedStudents: StudentItem[],
    updatedStudents: StudentItem[],
    newClassCreated?: ClassItem
  ) => {
    try {
      if (newClassCreated) {
        await databaseService.addClass(newClassCreated);
        setClasses((prev) => [newClassCreated, ...prev]);
      }

      if (importedStudents.length > 0) {
        await databaseService.bulkSaveStudents(importedStudents);
      }

      if (updatedStudents.length > 0) {
        await databaseService.bulkSaveStudents(updatedStudents);
      }

      // Refresh student list from database
      const freshStudents = await databaseService.getAllStudents();
      setStudents(freshStudents);

      const parts: string[] = [];
      if (importedStudents.length > 0) {
        parts.push(`إضافة ${importedStudents.length} تلميذ`);
      }
      if (updatedStudents.length > 0) {
        parts.push(`تحديث ${updatedStudents.length} تلميذ`);
      }
      if (newClassCreated) {
        parts.push(`إنشاء قسم "${newClassCreated.name}"`);
      }

      showToast(`تم بنجاح: ${parts.join(' و ')}.`);
    } catch (err: any) {
      console.error('Excel import failed:', err);
      showToast('حدث خطأ أثناء حفظ بيانات التلاميذ.');
    }
  };

  // ================= Schedule Operations =================
  const handleOpenAddSession = (day?: DayOfWeek) => {
    setEditingSession(null);
    if (day) setSessionDefaultDay(day);
    setIsAddSessionOpen(true);
  };

  const handleEditSession = (session: ScheduleSession) => {
    setEditingSession(session);
    setSessionDefaultDay(session.dayOfWeek);
    setIsAddSessionOpen(true);
  };

  const handleSaveSession = async (sessionData: ScheduleSession | Omit<ScheduleSession, 'createdAt' | 'updatedAt'>) => {
    if (editingSession) {
      const updated = await databaseService.updateSession(sessionData as ScheduleSession);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`تم تعديل بيانات الحصة بنجاح.`);
    } else {
      const newSession: ScheduleSession = {
        ...(sessionData as ScheduleSession),
        id: (sessionData as ScheduleSession).id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const created = await databaseService.addSession(newSession);
      setSessions((prev) => [created, ...prev]);
      showToast(`تمت إضافة الحصة إلى الجدول الأسبوعي.`);
    }
    setEditingSession(null);
  };

  const handlePromptDeleteSession = (sessionId: string, sessionLabel: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'session',
      id: sessionId,
      name: sessionLabel,
    });
  };

  // ================= Lesson Plan Operations =================
  const handleOpenAddLesson = (defaultClassId?: string) => {
    setEditingLesson(null);
    setDefaultLessonClassId(defaultClassId);
    setIsAddLessonOpen(true);
  };

  const handleEditLesson = (lesson: LessonPlan) => {
    setEditingLesson(lesson);
    setDefaultLessonClassId(lesson.classId);
    setIsAddLessonOpen(true);
  };

  const handleSaveLesson = async (lessonData: LessonPlan | Omit<LessonPlan, 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingLesson) {
        const updated = await databaseService.updateLesson(lessonData as LessonPlan);
        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        showToast('تم تحديث تحضير الدرس والمذكرة بنجاح.');
      } else {
        const created = await databaseService.addLesson(lessonData as LessonPlan);
        setLessons((prev) => [created, ...prev]);
        showToast('تم حفظ تحضير الدرس بنجاح.');
      }
    } catch (err) {
      console.error('Error saving lesson:', err);
      showToast('حدث خطأ أثناء حفظ تحضير الدرس.');
    }
  };

  const handlePromptDeleteLesson = (lessonId: string, lessonTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'lesson',
      id: lessonId,
      name: lessonTitle,
    });
  };

  // ================= Assessment & Grade Operations =================
  const handleOpenAddAssessment = (classId?: string) => {
    setEditingAssessment(null);
    setDefaultAssessmentClassId(classId);
    setIsAddAssessmentOpen(true);
  };

  const handleEditAssessment = (assessment: AssessmentItem) => {
    setEditingAssessment(assessment);
    setDefaultAssessmentClassId(assessment.classId);
    setIsAddAssessmentOpen(true);
  };

  const handleSaveAssessment = async (
    assessmentData: AssessmentItem | Omit<AssessmentItem, 'createdAt' | 'updatedAt' | 'grades'>
  ) => {
    try {
      if (editingAssessment) {
        const updated = await databaseService.updateAssessment(assessmentData as AssessmentItem);
        setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToast('تم تحديث بيانات التقييم بنجاح.');
      } else {
        const created = await databaseService.addAssessment(assessmentData as AssessmentItem);
        setAssessments((prev) => [created, ...prev]);
        showToast('تم إنشاء التقييم بنجاح.');
      }
    } catch (err) {
      console.error('Error saving assessment:', err);
      showToast('حدث خطأ أثناء حفظ التقييم.');
    }
  };

  const handlePromptDeleteAssessment = (assessmentId: string, assessmentTitle: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'assessment',
      id: assessmentId,
      name: assessmentTitle,
    });
  };

  const handleOpenGrading = (assessment: AssessmentItem) => {
    setGradingAssessment(assessment);
  };

  const handleSaveGrades = async (assessmentId: string, grades: Record<string, StudentScoreRecord>) => {
    try {
      const updated = await databaseService.saveBatchGrades(assessmentId, grades);
      setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('تم حفظ نقاط الطلاب بنجاح.');
    } catch (err) {
      console.error('Error saving grades:', err);
      showToast('حدث خطأ أثناء حفظ النقاط.');
    }
  };

  // ================= Subject Setting Operations =================
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setIsAddSubjectOpen(true);
  };

  const handleOpenEditSubject = (subject: SubjectSetting) => {
    setEditingSubject(subject);
    setIsAddSubjectOpen(true);
  };

  const handleSaveSubjectSetting = async (setting: SubjectSetting) => {
    try {
      await databaseService.saveSubjectSetting(setting);
      const updated = await databaseService.getAllSubjectSettings();
      setSubjectSettings(updated);
      showToast(`تم حفظ إعدادات مادة "${setting.name}" بنجاح.`);
    } catch (err) {
      console.error('Error saving subject setting:', err);
      showToast('حدث خطأ أثناء حفظ إعدادات المادة.');
    }
  };

  const handlePromptDeleteSubject = (subject: SubjectSetting) => {
    setDeleteModal({
      isOpen: true,
      type: 'subject',
      id: subject.id,
      name: subject.name,
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (deleteModal.type === 'class') {
      await databaseService.deleteClass(deleteModal.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteModal.id));
      setStudents((prev) => prev.filter((s) => s.classId !== deleteModal.id));
      setSessions((prev) => prev.filter((s) => s.classId !== deleteModal.id));
      setLessons((prev) => prev.filter((l) => l.classId !== deleteModal.id));
      setAssessments((prev) => prev.filter((a) => a.classId !== deleteModal.id));
      showToast('تم حذف القسم وجميع سجلاته ونقاطه بنجاح.');
    } else if (deleteModal.type === 'student') {
      await databaseService.deleteStudent(deleteModal.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteModal.id));
      showToast('تم حذف الطالب من السجل بنجاح.');
    } else if (deleteModal.type === 'session') {
      await databaseService.deleteSession(deleteModal.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteModal.id));
      showToast('تم حذف الحصة من الجدول الأسبوعي بنجاح.');
    } else if (deleteModal.type === 'lesson') {
      await databaseService.deleteLesson(deleteModal.id);
      setLessons((prev) => prev.filter((l) => l.id !== deleteModal.id));
      showToast('تم حذف مذكرة تحضير الدرس بنجاح.');
    } else if (deleteModal.type === 'assessment') {
      await databaseService.deleteAssessment(deleteModal.id);
      setAssessments((prev) => prev.filter((a) => a.id !== deleteModal.id));
      showToast('تم حذف التقييم وكشف نقاطه بنجاح.');
    } else if (deleteModal.type === 'subject') {
      await databaseService.deleteSubjectSetting(deleteModal.id);
      setSubjectSettings((prev) => prev.filter((s) => s.id !== deleteModal.id));
      showToast('تم حذف إعدادات المادة بنجاح.');
    } else if (deleteModal.type === 'reminder') {
      await databaseService.deleteReminder(deleteModal.id);
      setReminders((prev) => prev.filter((r) => r.id !== deleteModal.id));
      showToast('تم حذف التذكير بنجاح.');
    }
    setDeleteModal({ isOpen: false, type: 'class', id: '', name: '' });
  };

  // ================= Settings Operations =================
  const handleSaveProfile = async (profile: TeacherProfile) => {
    const trimmedSubject = profile.subject?.trim();
    const updatedSettings = await databaseService.saveSettings({ profile });
    setSettings(updatedSettings);

    if (trimmedSubject) {
      const existing = await databaseService.getAllSubjectSettings();
      const exists = existing.some((s) => s.name.trim().toLowerCase() === trimmedSubject.toLowerCase());
      if (!exists) {
        await databaseService.saveSubjectSetting({
          id: `subj-spec-${Date.now()}`,
          name: trimmedSubject,
          coefficient: 2,
          calculationMethod: {
            method: 'tests_avg_plus_exam_x2_div_3',
          },
        });
        const freshSubjects = await databaseService.getAllSubjectSettings();
        setSubjectSettings(freshSubjects);
      }
    }
    showToast(`تم حفظ بيانات الأستاذ ومادة التدريس المركزية (${trimmedSubject || updatedSettings.profile.subject}) بنجاح.`);
  };

  const handleExportBackup = async () => {
    try {
      const jsonString = await databaseService.exportBackupJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `ostad_dz_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('تم تنزيل النسخة الاحتياطية بنجاح.');
    } catch (err) {
      console.error(err);
      showToast('تعذر تصدير النسخة الاحتياطية.');
    }
  };

  const handleImportBackup = async (jsonString: string) => {
    const result = await databaseService.importBackupJson(jsonString);
    await reloadData();
    showToast(`تم استيراد ${result.classesCount} قسم و ${result.studentsCount} طالب بنجاح!`);
    return result;
  };

  const handleResetToSample = async () => {
    await databaseService.resetToSampleData();
    await reloadData();
    showToast('تمت استعادة البيانات النموذجية.');
  };

  // ================= Attendance Operations =================
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    try {
      await databaseService.saveAttendance(record);
      setAttendanceRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === record.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [record, ...prev];
      });
      showToast(`تم حفظ سجل الحضور والغياب ليوم ${record.date} بنجاح.`);
    } catch (err) {
      console.error('Failed to save attendance record:', err);
      showToast('تعذر حفظ سجل الحضور.');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    try {
      await databaseService.deleteAttendance(id);
      setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('تم حذف سجل الحضور بنجاح.');
    } catch (err) {
      console.error('Failed to delete attendance record:', err);
    }
  };

  // ================= Reminders Operations =================
  const handleOpenAddReminder = () => {
    setEditingReminder(null);
    setIsAddReminderOpen(true);
  };

  const handleEditReminder = (reminder: ReminderItem) => {
    setEditingReminder(reminder);
    setIsAddReminderOpen(true);
  };

  const handleSaveReminder = async (data: Omit<ReminderItem, 'id' | 'createdAt' | 'updatedAt'> | ReminderItem) => {
    try {
      const saved = await databaseService.saveReminder(data);
      setReminders((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      showToast(editingReminder ? 'تم تعديل التذكير بنجاح.' : 'تمت إضافة التذكير بنجاح.');
    } catch (err) {
      console.error('Error saving reminder:', err);
      showToast('حدث خطأ أثناء حفظ التذكير.');
    }
  };

  const handlePromptDeleteReminder = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'reminder',
      id,
      name: title,
    });
  };

  const handleToggleReminderCompleted = async (id: string) => {
    try {
      const updated = await databaseService.toggleReminderCompleted(id);
      if (updated) {
        setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
        showToast(updated.isCompleted ? 'تم تحديد التذكير كمكتمل.' : 'تم إعادة تعيين التذكير كقائم.');
      }
    } catch (err) {
      console.error('Error toggling reminder:', err);
    }
  };

  // ================= Library Operations =================
  const handleSaveLibraryItem = (item: LibraryItem) => {
    setLibraryItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    showToast('تم حفظ العنصر في المكتبة بنجاح.');
  };

  const handleDeleteLibraryItem = async (id: string) => {
    try {
      await databaseService.deleteLibraryItem(id);
      setLibraryItems((prev) => prev.filter((i) => i.id !== id));
      showToast('تم حذف العنصر من المكتبة بنجاح.');
    } catch (err) {
      console.error('Error deleting library item:', err);
      showToast('حدث خطأ أثناء حذف العنصر من المكتبة.');
    }
  };

  const handleRenameLibraryItem = async (id: string, newTitle: string, newFolderName: string, newFileName?: string) => {
    try {
      await databaseService.renameLibraryItem(id, newTitle, newFolderName, newFileName);
      setLibraryItems((prev) =>
        prev.map((i) => {
          if (i.id === id) {
            return {
              ...i,
              title: newTitle,
              folderName: newFolderName,
              fileName: newFileName || i.fileName,
              updatedAt: Date.now(),
            };
          }
          return i;
        })
      );
      showToast('تم تحديث بيانات العنصر بنجاح.');
    } catch (err) {
      console.error('Error renaming library item:', err);
      showToast('حدث خطأ أثناء إعادة التسمية.');
    }
  };

  // Jump directly to view students of a specific class
  const handleViewClassStudents = (classId: string) => {
    setSelectedClassFilter(classId);
    setCurrentTab('students');
  };

  // Close mobile sidebar drawer whenever tab changes
  useEffect(() => {
    setIsMobileSidebarExpanded(false);
  }, [currentTab]);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-row font-sans relative">
      {/* 1. In-flow Vertical Sidebar (Desktop only, drawer overlay on mobile) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        classesCount={classes.length}
        studentsCount={students.length}
        sessionsCount={sessions.length}
        lessonsCount={lessons.length}
        assessmentsCount={assessments.length}
        attendanceCount={attendanceRecords.length}
        remindersCount={reminders.filter((r) => !r.isCompleted).length}
        libraryCount={libraryItems.length}
        profile={settings.profile}
        isMobileExpanded={isMobileSidebarExpanded}
        setIsMobileExpanded={setIsMobileSidebarExpanded}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        setIsDesktopCollapsed={setIsDesktopSidebarCollapsed}
      />

      {/* 2. Main content container: flex sibling occupying 100% of remaining width */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen max-w-full">
        {/* Sticky Top Bar (Contains main Header) */}
        <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          {/* Top Header */}
          <Header
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            profile={settings.profile}
            remindersCount={reminders.filter((r) => !r.isCompleted).length}
            libraryCount={libraryItems.length}
            onToggleSidebar={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsMobileSidebarExpanded((prev) => !prev);
              } else {
                setIsDesktopSidebarCollapsed((prev) => !prev);
              }
            }}
          />
        </div>

        {/* Main Views Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full min-w-0 px-2.5 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-6 pb-20 sm:pb-16">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                جاري تهيئة قاعدة بيانات Ostad DZ المحلية...
              </p>
            </div>
          ) : (
          <>
            {currentTab === 'splash' && (
              <SplashScreen
                onStart={handleStartFromSplash}
                profile={settings.profile}
                classesCount={classes.length}
                studentsCount={students.length}
              />
            )}

            {currentTab === 'dashboard' && (
              <DashboardView
                classes={classes}
                students={students}
                sessions={sessions}
                lessons={lessons}
                assessments={assessments}
                attendanceRecords={attendanceRecords}
                reminders={reminders}
                libraryItems={libraryItems}
                profile={settings.profile}
                onNavigateTab={setCurrentTab}
                onOpenAddClass={() => {
                  setEditingClass(null);
                  setIsAddClassOpen(true);
                }}
                onOpenAddStudent={() => {
                  setEditingStudent(null);
                  setIsAddStudentOpen(true);
                }}
                onOpenAddLesson={() => handleOpenAddLesson()}
                onOpenAddAssessment={() => handleOpenAddAssessment()}
                onSelectClass={handleViewClassStudents}
              />
            )}

            {currentTab === 'classes' && (
              <ClassesView
                classes={classes}
                students={students}
                onOpenAddClass={() => {
                  setEditingClass(null);
                  setIsAddClassOpen(true);
                }}
                onEditClass={(item) => {
                  setEditingClass(item);
                  setIsAddClassOpen(true);
                }}
                onDeleteClass={handlePromptDeleteClass}
                onViewClassStudents={handleViewClassStudents}
              />
            )}

            {currentTab === 'students' && (
              <StudentsView
                classes={classes}
                students={students}
                profile={settings.profile}
                selectedClassIdFilter={selectedClassFilter}
                onSelectClassFilter={setSelectedClassFilter}
                onOpenAddStudent={() => {
                  setEditingStudent(null);
                  setIsAddStudentOpen(true);
                }}
                onEditStudent={(item) => {
                  setEditingStudent(item);
                  setIsAddStudentOpen(true);
                }}
                onDeleteStudent={handlePromptDeleteStudent}
                onNavigateToClasses={() => setCurrentTab('classes')}
                onOpenImportExcel={() => setIsExcelImportModalOpen(true)}
                onExportExcel={handleExportStudentsExcel}
                onDownloadTemplate={handleDownloadExcelTemplate}
              />
            )}

            {currentTab === 'random_picker' && (
              <RandomPickerView
                classes={classes}
                students={students}
                attendanceRecords={attendanceRecords}
                profile={settings.profile}
                onNavigateToClasses={() => setCurrentTab('classes')}
                onNavigateToStudents={() => setCurrentTab('students')}
              />
            )}

            {currentTab === 'lessons' && (
              <LessonsView
                lessons={lessons}
                classes={classes}
                profile={settings.profile}
                onOpenAddLesson={handleOpenAddLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handlePromptDeleteLesson}
                onNavigateToClasses={() => setCurrentTab('classes')}
              />
            )}

            {currentTab === 'grades' && (
              <GradesView
                assessments={assessments}
                classes={classes}
                students={students}
                profile={settings.profile}
                subjectSettings={subjectSettings}
                onOpenAddAssessment={handleOpenAddAssessment}
                onEditAssessment={handleEditAssessment}
                onDeleteAssessment={handlePromptDeleteAssessment}
                onOpenGradeEntry={handleOpenGrading}
                onNavigateToClasses={() => setCurrentTab('classes')}
                onOpenAddSubject={handleOpenAddSubject}
                onOpenEditSubject={handleOpenEditSubject}
                onSaveGrades={handleSaveGrades}
                onSaveAssessment={handleSaveAssessment}
                onSaveSubjectSetting={handleSaveSubjectSetting}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleView
                sessions={sessions}
                classes={classes}
                onOpenAddSession={handleOpenAddSession}
                onEditSession={handleEditSession}
                onDeleteSession={handlePromptDeleteSession}
                onNavigateToClasses={() => setCurrentTab('classes')}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceView
                classes={classes}
                students={students}
                attendanceRecords={attendanceRecords}
                profile={settings.profile}
                onSaveAttendance={handleSaveAttendance}
                onDeleteAttendance={handleDeleteAttendance}
                onNavigateToClasses={() => setCurrentTab('classes')}
                onNavigateToStudents={() => setCurrentTab('students')}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                classes={classes}
                students={students}
                assessments={assessments}
                attendanceRecords={attendanceRecords}
                profile={settings.profile}
                subjectSettings={subjectSettings}
                onNavigateToClasses={() => setCurrentTab('classes')}
                onNavigateToStudents={() => setCurrentTab('students')}
              />
            )}

            {currentTab === 'library' && (
              <LibraryView
                items={libraryItems}
                classes={classes}
                profile={settings.profile}
                onAddItem={handleSaveLibraryItem}
                onDeleteItem={handleDeleteLibraryItem}
                onRenameItem={handleRenameLibraryItem}
                onNavigateToClasses={() => setCurrentTab('classes')}
              />
            )}

            {currentTab === 'reminders' && (
              <RemindersView
                reminders={reminders}
                classes={classes}
                onOpenAddReminder={handleOpenAddReminder}
                onEditReminder={handleEditReminder}
                onDeleteReminder={handlePromptDeleteReminder}
                onToggleComplete={handleToggleReminderCompleted}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                theme={theme}
                onThemeChange={setTheme}
                onSaveProfile={handleSaveProfile}
                onSaveStage={handleSaveEducationalStage}
                onOpenStageWizard={() => setIsEducationalStageModalOpen(true)}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetToSampleData={handleResetToSample}
                classesCount={classes.length}
                studentsCount={students.length}
                subjectSettings={subjectSettings}
                onOpenAddSubject={handleOpenAddSubject}
                onOpenEditSubject={handleOpenEditSubject}
                onDeleteSubject={handlePromptDeleteSubject}
              />
            )}
          </>
        )}
      </main>
      </div>

      {/* 3. Modals */}
      <EducationalStageModal
        isOpen={isEducationalStageModalOpen}
        isFirstLaunch={!settings.educationalStage}
        currentStage={settings.educationalStage || 'secondary'}
        currentSpecializedSubject={settings.profile.subject}
        currentPrimarySubjects={settings.primarySubjects || []}
        onSave={handleSaveEducationalStage}
        onClose={() => {
          if (settings.educationalStage) {
            setIsEducationalStageModalOpen(false);
          }
        }}
      />

      <AddClassModal
        isOpen={isAddClassOpen}
        onClose={() => {
          setIsAddClassOpen(false);
          setEditingClass(null);
        }}
        onSave={handleSaveClass}
        editingClass={editingClass}
        defaultAcademicYear={settings.profile.academicYear}
        defaultStage={settings.educationalStage || 'secondary'}
        defaultSubject={settings.profile.subject || 'الرياضيات'}
        primarySubjects={settings.primarySubjects || []}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        classes={classes}
        defaultClassId={selectedClassFilter !== 'all' ? selectedClassFilter : undefined}
        editingStudent={editingStudent}
      />

      <AddSessionModal
        isOpen={isAddSessionOpen}
        onClose={() => {
          setIsAddSessionOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        classes={classes}
        defaultDay={sessionDefaultDay}
        defaultSubject={settings.profile.subject || 'الرياضيات'}
        editingSession={editingSession}
      />

      <AddLessonModal
        isOpen={isAddLessonOpen}
        onClose={() => {
          setIsAddLessonOpen(false);
          setEditingLesson(null);
        }}
        onSave={handleSaveLesson}
        classes={classes}
        defaultClassId={defaultLessonClassId}
        defaultSubject={settings.profile.subject || 'الرياضيات'}
        editingLesson={editingLesson}
      />

      <AddAssessmentModal
        isOpen={isAddAssessmentOpen}
        onClose={() => {
          setIsAddAssessmentOpen(false);
          setEditingAssessment(null);
        }}
        onSave={handleSaveAssessment}
        classes={classes}
        defaultClassId={defaultAssessmentClassId}
        defaultSubject={settings.profile.subject || 'الرياضيات'}
        editingAssessment={editingAssessment}
      />

      {gradingAssessment && (
        <GradeEntryModal
          isOpen={Boolean(gradingAssessment)}
          onClose={() => setGradingAssessment(null)}
          assessment={gradingAssessment}
          students={students.filter((s) => s.classId === gradingAssessment.classId)}
          onSaveGrades={handleSaveGrades}
        />
      )}

      <SubjectSettingModal
        isOpen={isAddSubjectOpen}
        onClose={() => {
          setIsAddSubjectOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleSaveSubjectSetting}
        editingSubject={editingSubject}
      />

      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => {
          setIsAddReminderOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        classes={classes}
        editingReminder={editingReminder}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        classes={classes}
        existingStudents={students}
        defaultClassId={selectedClassFilter}
        defaultAcademicYear={settings.profile?.academicYear || '2024 - 2025'}
        defaultSubject={settings.profile?.primarySubject || 'الرياضيات'}
        defaultStage={settings.profile?.educationalStage || 'middle'}
        onImportComplete={handleExcelImportComplete}
        onDownloadTemplate={handleDownloadExcelTemplate}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: 'class', id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === 'class'
            ? 'حذف القسم التربوي'
            : deleteModal.type === 'student'
            ? 'حذف بيانات التلميذ'
            : deleteModal.type === 'session'
            ? 'حذف الحصة الدراسية'
            : deleteModal.type === 'lesson'
            ? 'حذف مذكرة تحضير الدرس'
            : deleteModal.type === 'assessment'
            ? 'حذف التقييم وكشف النقاط'
            : deleteModal.type === 'subject'
            ? 'حذف إعدادات المادة'
            : 'حذف التذكير'
        }
        message={
          deleteModal.type === 'class'
            ? `هل أنت متأكد من رغبتك في حذف: ${deleteModal.name}؟`
            : deleteModal.type === 'student'
            ? `هل أنت متأكد من حذف التلميذ "${deleteModal.name}" نهائياً؟`
            : deleteModal.type === 'session'
            ? `هل أنت متأكد من حذف ${deleteModal.name} نهائياً من الجدول الأسبوعي؟`
            : deleteModal.type === 'lesson'
            ? `هل أنت متأكد من حذف مذكرة الدرس "${deleteModal.name}" نهائياً؟`
            : deleteModal.type === 'assessment'
            ? `هل أنت متأكد من حذف التقييم "${deleteModal.name}" وكافة النقاط المرصودة فيه نهائياً؟`
            : deleteModal.type === 'subject'
            ? `هل أنت متأكد من حذف إعدادات مادة "${deleteModal.name}" وكيفية حسابها؟`
            : `هل أنت متأكد من حذف التذكير "${deleteModal.name}" نهائياً؟`
        }
      />

      {/* 6. Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
