import React, { useState, useEffect, useMemo } from 'react';
import { X, Award, Calendar, Layers, BookOpen, Clock, FileText, Check } from 'lucide-react';
import { AssessmentItem, AssessmentType, ClassItem, Trimester } from '../../types';
import { ASSESSMENT_TYPE_INFO, TRIMESTER_INFO } from '../../utils/gradeCalculations';
import { 
  COMMON_SUBJECTS, 
  getSubjectsForGradeAndStage
} from '../../data/algerianData';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: AssessmentItem, andOpenGrading?: boolean) => Promise<void>;
  classes: ClassItem[];
  defaultClassId?: string;
  defaultSubject?: string;
  editingAssessment?: AssessmentItem | null;
}

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  defaultClassId,
  defaultSubject = 'الرياضيات',
  editingAssessment,
}) => {
  const [classId, setClassId] = useState<string>('');
  const [type, setType] = useState<AssessmentType>('test');
  const [trimester, setTrimester] = useState<Trimester>('T1');
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>(defaultSubject || 'الرياضيات');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [coefficient, setCoefficient] = useState<number>(1);
  const [maxScore, setMaxScore] = useState<number>(20);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === classId) || null;
  }, [classes, classId]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingAssessment) {
      setClassId(editingAssessment.classId);
      setType(editingAssessment.type);
      setTrimester(editingAssessment.trimester || 'T1');
      setTitle(editingAssessment.title);
      setSubject(editingAssessment.subject || defaultSubject || 'الرياضيات');
      setDate(editingAssessment.date);
      setCoefficient(editingAssessment.coefficient || 1);
      setMaxScore(editingAssessment.maxScore || 20);
      setNotes(editingAssessment.notes || '');
    } else {
      const foundClass = classes.find((c) => c.id === defaultClassId) || classes[0];
      const initialClassId = foundClass ? foundClass.id : '';
      const initialSubject = foundClass?.subject || defaultSubject || 'الرياضيات';

      setClassId(initialClassId);
      setType('test');
      setTrimester('T1');
      setTitle('الفرض الأول - الفصل الأول');
      setSubject(initialSubject);
      setDate(new Date().toISOString().slice(0, 10));
      setCoefficient(1);
      setMaxScore(20);
      setNotes('');
    }
  }, [isOpen, editingAssessment, defaultClassId, classes, defaultSubject]);

  const handleTypeChange = (newType: AssessmentType) => {
    setType(newType);
    if (!editingAssessment) {
      const trimLabel = TRIMESTER_INFO[trimester].label;
      if (newType === 'test1' || newType === 'test') {
        setTitle(`الفرض الأول - ${trimLabel}`);
      } else if (newType === 'test2') {
        setTitle(`الفرض الثاني - ${trimLabel}`);
      } else if (newType === 'exam') {
        setTitle(`اختبار ${trimLabel}`);
      } else if (newType === 'continuous') {
        setTitle(`التقويم المستمر - ${trimLabel}`);
      } else {
        setTitle(`نشاط وأعمال تطبيقية - ${trimLabel}`);
      }
    }
  };

  const handleTrimesterChange = (newTrim: Trimester) => {
    setTrimester(newTrim);
    if (!editingAssessment) {
      const trimLabel = TRIMESTER_INFO[newTrim].label;
      if (type === 'test1' || type === 'test') {
        setTitle(`الفرض الأول - ${trimLabel}`);
      } else if (type === 'test2') {
        setTitle(`الفرض الثاني - ${trimLabel}`);
      } else if (type === 'exam') {
        setTitle(`اختبار ${trimLabel}`);
      } else if (type === 'continuous') {
        setTitle(`التقويم المستمر - ${trimLabel}`);
      } else {
        setTitle(`نشاط وأعمال تطبيقية - ${trimLabel}`);
      }
    }
  };

  // Sync subject when class changes if not explicitly set
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const found = classes.find((c) => c.id === newClassId);
    if (found && !editingAssessment) {
      const validSubjects = getSubjectsForGradeAndStage(found.stage, found.grade, [found.subject]);
      if (!subject || !validSubjects.includes(subject)) {
        setSubject(found.subject && validSubjects.includes(found.subject) ? found.subject : validSubjects[0] || found.subject || '');
      }
    }
  };

  const handleSubmit = async (andOpenGrading = false) => {
    if (!classId) {
      alert('يرجى اختيار القسم التربوي');
      return;
    }
    if (!title.trim()) {
      alert('يرجى إدخال عنوان التقييم');
      return;
    }
    if (!subject.trim()) {
      alert('يرجى تحديد المادة التعليمية');
      return;
    }
    if (coefficient <= 0) {
      alert('المعامل يجب أن يكون أكبر من 0');
      return;
    }

    const selectedClassObj = classes.find((c) => c.id === classId);

    const assessmentItem: AssessmentItem = {
      id: editingAssessment ? editingAssessment.id : `assess-${Date.now()}`,
      title: title.trim(),
      type,
      classId,
      className: selectedClassObj?.name || '',
      subject: subject.trim(),
      trimester,
      date,
      coefficient: Number(coefficient) || 1,
      maxScore: Number(maxScore) || 20,
      notes: notes.trim(),
      grades: editingAssessment ? editingAssessment.grades : {},
      createdAt: editingAssessment ? editingAssessment.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    setIsSubmitting(true);
    try {
      await onSave(assessmentItem, andOpenGrading);
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingAssessment ? 'تعديل بيانات التقييم' : 'إنشاء تقييم جديد'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                فرض، اختبار، تقويم مستمر، أو نشاط تطبيقي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Class & Subject Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                القسم التربوي <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>المادة</span>
              </label>
              <div className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {subject || defaultSubject || 'الرياضيات'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  تلقائي
                </span>
              </div>
            </div>
          </div>

          {/* 2. Assessment Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نوع التقييم <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                فرض 1 و فرض 2 و الاختبار فقط
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'test1' as AssessmentType, label: 'فرض 1', sub: 'الفرض الأول', color: 'emerald' },
                { key: 'test2' as AssessmentType, label: 'فرض 2', sub: 'الفرض الثاني', color: 'teal' },
                { key: 'exam' as AssessmentType, label: 'الاختبار', sub: 'الاختبار الفصلي', color: 'purple' },
              ].map((item) => {
                const isSelected = type === item.key || (item.key === 'test1' && type === 'test');
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTypeChange(item.key)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 text-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-sm font-black">{item.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Trimester Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الفصل الدراسي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TRIMESTER_INFO) as Trimester[]).map((trimKey) => {
                const isSelected = trimester === trimKey;
                return (
                  <button
                    key={trimKey}
                    type="button"
                    onClick={() => handleTrimesterChange(trimKey)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {TRIMESTER_INFO[trimKey].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان التقييم <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الفرض الأول، اختبار الفصل الأول..."
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* 5. Date & Max Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تاريخ إجراء التقييم <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  اليوم
                </button>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  العدد الأقصى للتقييم (العلامة على) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">افتراضياً 20</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  step="1"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 20)}
                  className="w-24 h-10 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex items-center gap-1">
                  {[20, 40, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxScore(num)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
                        maxScore === num
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      /{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Single Subject Coefficient Notice */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p className="leading-relaxed text-[11px]">
              <strong>ملاحظة بيداغوجية:</strong> لا توجد معاملات فردية للتقييمات، فالمعامل واحد فقط للمادة ويحدد في إعدادات المادة، وطريقة الحساب (من فرض 1 وفرض 2 والاختبار) تحددها خانة <strong>«كيفية الحساب»</strong>.
            </p>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات أو توجيهات الأستاذ (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: الوضعية الإدماجية شملت المجال الأول، ضرورة التركيز على الرسم التخطيطي..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-normal focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            {!editingAssessment && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition active:scale-95"
              >
                حفظ ورصد النقاط الآن
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingAssessment ? 'حفظ التعديلات' : 'حفظ التقييم'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
