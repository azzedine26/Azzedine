import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Check } from 'lucide-react';
import { ClassItem, EducationalStage } from '../../types';
import { CLASS_COLORS, COMMON_SUBJECTS, EDUCATIONAL_STAGES } from '../../data/algerianData';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Omit<ClassItem, 'createdAt' | 'updatedAt'> | ClassItem) => Promise<void>;
  editingClass?: ClassItem | null;
  defaultAcademicYear: string;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClass,
  defaultAcademicYear,
}) => {
  const [name, setName] = useState('');
  const [stage, setStage] = useState<EducationalStage>('secondary');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [room, setRoom] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear || '2024 - 2025');
  const [color, setColor] = useState(CLASS_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update grade options when stage changes
  const currentStageConfig = EDUCATIONAL_STAGES.find((s) => s.id === stage) || EDUCATIONAL_STAGES[2];

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setStage(editingClass.stage);
      setGrade(editingClass.grade);
      if (COMMON_SUBJECTS.includes(editingClass.subject)) {
        setSubject(editingClass.subject);
        setCustomSubject('');
      } else {
        setSubject('أخرى');
        setCustomSubject(editingClass.subject);
      }
      setRoom(editingClass.room || '');
      setAcademicYear(editingClass.academicYear || defaultAcademicYear);
      setColor(editingClass.color || CLASS_COLORS[0]);
    } else {
      // Reset form
      setName('');
      setStage('secondary');
      setGrade(EDUCATIONAL_STAGES[2].grades[0]);
      setSubject(COMMON_SUBJECTS[0]);
      setCustomSubject('');
      setRoom('');
      setAcademicYear(defaultAcademicYear || '2024 - 2025');
      setColor(CLASS_COLORS[0]);
    }
    setError('');
  }, [editingClass, isOpen, defaultAcademicYear]);

  // When stage changes, adjust grade to first available grade
  const handleStageChange = (newStage: EducationalStage) => {
    setStage(newStage);
    const stageObj = EDUCATIONAL_STAGES.find((s) => s.id === newStage);
    if (stageObj && stageObj.grades.length > 0) {
      setGrade(stageObj.grades[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم القسم (مثال: 3 علوم تجريبية 1)');
      return;
    }

    const finalSubject = subject === 'أخرى' ? (customSubject.trim() || 'مادة عامة') : subject;

    setIsSubmitting(true);
    setError('');

    try {
      const classPayload = {
        id: editingClass ? editingClass.id : `class-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim(),
        stage,
        grade: grade || currentStageConfig.grades[0],
        subject: finalSubject,
        room: room.trim() || undefined,
        academicYear: academicYear.trim(),
        color,
        ...(editingClass ? { createdAt: editingClass.createdAt } : {}),
      };

      await onSave(classPayload as ClassItem);
      onClose();
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ القسم. حاول مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {editingClass ? 'تعديل بيانات القسم' : 'إضافة قسم تربوي جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Class Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم القسم (التعيين الرسمي) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 3 ع ت 1 أو 4 متوسط 2 أو 5 ابتدائي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 text-sm font-medium"
            />
          </div>

          {/* Educational Stage (الطور التعليمي) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الطور التعليمي في الجزائر
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EDUCATIONAL_STAGES.map((stg) => (
                <button
                  type="button"
                  key={stg.id}
                  onClick={() => handleStageChange(stg.id)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition text-center ${
                    stage === stg.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {stg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade / المستوى والمجرى الدراسي */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              المستوى أو الشعبة الدراسية
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            >
              {currentStageConfig.grades.map((grd) => (
                <option key={grd} value={grd}>
                  {grd}
                </option>
              ))}
            </select>
          </div>

          {/* Subject (المادة) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                مادة التدريس
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              >
                {COMMON_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="أخرى">مادة أخرى...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الحجرة / القاعة (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: القاعة 12 أو مخبر 2"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {subject === 'أخرى' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اكتب اسم المادة
              </label>
              <input
                type="text"
                required
                placeholder="اكتب المادة هنا"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          )}

          {/* Color & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                لون بطاقة القسم
              </label>
              <div className="flex items-center gap-2">
                {CLASS_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      color === col ? 'scale-115 ring-2 ring-offset-2 ring-emerald-600 dark:ring-offset-slate-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {color === col && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                السنة الدراسية
              </label>
              <input
                type="text"
                placeholder="2024 - 2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              {isSubmitting ? 'جاري الحفظ...' : editingClass ? 'تحديث القسم' : 'حفظ القسم محلياً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
