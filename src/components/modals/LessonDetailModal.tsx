import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, GraduationCap, Layers, Wrench, Edit, Trash2, Printer, CheckCircle2, FileDown, FileText, Loader2 } from 'lucide-react';
import { LessonPlan, ClassItem, TeacherProfile } from '../../types';
import { exportLessonPlanDocx } from '../../utils/docxService';
import { exportLessonPlanPdf } from '../../utils/pdfService';

interface LessonDetailModalProps {
  lesson: LessonPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lesson: LessonPlan) => void;
  onDelete: (lessonId: string, lessonTitle: string) => void;
  classes: ClassItem[];
  profile?: TeacherProfile;
}

export function LessonDetailModal({
  lesson,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  classes,
  profile,
}: LessonDetailModalProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const currentClass = classes.find((c) => c.id === lesson.classId);
  const className = lesson.className || (currentClass ? currentClass.name : 'قسم غير محدد');

  const fallbackProfile: TeacherProfile = profile || {
    fullName: 'أستاذ المادة',
    schoolName: '',
    subject: lesson.subject || '',
    academicYear: '2024 - 2025',
    wilaya: '',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportErrorMessage(null);
    try {
      await exportLessonPlanPdf(lesson, currentClass || null, fallbackProfile);
      setExportSuccessMessage('تم تصدير المذكرة كملف PDF بنجاح وحفظها في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export lesson PDF:', err);
      setExportErrorMessage(err?.message || 'تعذر تصدير المذكرة كملف PDF، يرجى إعادة المحاولة.');
      setTimeout(() => setExportErrorMessage(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportWord = async () => {
    if (isExportingWord) return;
    setIsExportingWord(true);
    setExportErrorMessage(null);
    try {
      await exportLessonPlanDocx(lesson, fallbackProfile);
      setExportSuccessMessage('تم تصدير المذكرة كملف Word بنجاح وحفظها في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export lesson Word docx:', err);
      setExportErrorMessage(err?.message || 'تعذر تصدير المذكرة كملف Word، يرجى إعادة المحاولة.');
      setTimeout(() => setExportErrorMessage(null), 6000);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[94dvh] sm:h-[88vh] max-h-[96dvh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Modal Top Header */}
        <div 
          className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 text-white relative overflow-hidden shrink-0"
          style={{ backgroundColor: lesson.color || '#006233' }}
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black">
                  {lesson.subject}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white/90 text-xs font-semibold">
                  {className}
                </span>
                {lesson.duration && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.duration}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-snug text-white">
                {lesson.title}
              </h2>
              <div className="flex items-center gap-3 text-white/80 text-xs pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تاريخ الحصة: {lesson.date}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Export PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white transition text-xs flex items-center gap-1 cursor-pointer font-bold"
                title="تصدير المذكرة كملف PDF"
              >
                {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Export Word */}
              <button
                type="button"
                onClick={handleExportWord}
                disabled={isExportingWord}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white transition text-xs flex items-center gap-1 cursor-pointer font-bold"
                title="تصدير المذكرة كملف Word (.docx)"
              >
                {isExportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Word</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1 cursor-pointer"
                title="طباعة المذكرة"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notifications */}
          {exportSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMessage}</span>
            </div>
          )}

          {exportErrorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <span className="w-4 h-4 text-rose-600 font-bold shrink-0">⚠️</span>
              <span>{exportErrorMessage}</span>
            </div>
          )}

          {/* Section: Objectives */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-900/40">
            <h3 className="text-xs font-black tracking-wider text-emerald-800 dark:text-emerald-300 uppercase mb-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الأهداف التعلمية والكفاءات المستهدفة</span>
            </h3>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {lesson.objectives}
            </div>
          </div>

          {/* Section: Teaching Aids */}
          {lesson.teachingAids && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                <span>الوسائل والسندات التعليمية المستعملة</span>
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {lesson.teachingAids}
              </p>
            </div>
          )}

          {/* Section: Lesson Stages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>مراحل سير الدرس البيداغوجي ({lesson.stages?.length || 0} مراحل)</span>
              </h3>
            </div>

            <div className="space-y-3.5">
              {lesson.stages && lesson.stages.length > 0 ? (
                lesson.stages.map((stage, idx) => (
                  <div
                    key={stage.id || idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {stage.title}
                        </h4>
                      </div>
                      {stage.duration && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                          {stage.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pt-1">
                      {stage.content || 'لا توجد تفاصيل مسجلة لهذه المرحلة.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 text-center">
                  لم يتم إدخال مراحل تفصيلية لهذا الدرس.
                </div>
              )}
            </div>
          </div>

          {/* Section: Teacher Notes */}
          {lesson.teacherNotes && (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/40">
              <h3 className="text-xs font-black tracking-wider text-amber-800 dark:text-amber-300 uppercase mb-2">
                ملاحظات وتوجيهات الأستاذ
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                {lesson.teacherNotes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(lesson.id, lesson.title);
            }}
            className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف التحضير</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(lesson);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4" />
              <span>تعديل المذكرة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
