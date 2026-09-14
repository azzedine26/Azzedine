import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, BookOpen, Clock, Calendar, CheckCircle, Sparkles, HelpCircle, GraduationCap } from 'lucide-react';
import { ClassItem, LessonPlan, LessonStage } from '../../types';
import { 
  COMMON_DURATIONS, 
  COMMON_TEACHING_AIDS, 
  DEFAULT_LESSON_STAGES,
  getSubjectsForGradeAndStage
} from '../../data/algerianData';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonData: LessonPlan | Omit<LessonPlan, 'createdAt' | 'updatedAt'>) => void;
  classes: ClassItem[];
  defaultClassId?: string;
  defaultSubject?: string;
  editingLesson?: LessonPlan | null;
}

export function AddLessonModal({
  isOpen,
  onClose,
  onSave,
  classes,
  defaultClassId,
  defaultSubject = 'الرياضيات',
  editingLesson,
}: AddLessonModalProps) {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState(defaultSubject || 'الرياضيات');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('ساعة واحدة (1 سا)');
  const [objectives, setObjectives] = useState('');
  const [teachingAids, setTeachingAids] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [color, setColor] = useState('#006233');
  const [stages, setStages] = useState<LessonStage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === classId) || null;
  }, [classes, classId]);

  const notesTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize teacher notes textarea to match content
  useEffect(() => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = `${Math.max(88, notesTextareaRef.current.scrollHeight)}px`;
    }
  }, [teacherNotes, isOpen]);

  const colorOptions = [
    { label: 'أخضر جزائري', value: '#006233' },
    { label: 'أزرق سماوي', value: '#0284C7' },
    { label: 'كهرماني', value: '#D97706' },
    { label: 'بنفسجي', value: '#7C3AED' },
    { label: 'وردي', value: '#E11D48' },
    { label: 'رمادي حجري', value: '#475569' },
  ];

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title);
      setClassId(editingLesson.classId);
      setSubject(editingLesson.subject || defaultSubject || 'الرياضيات');
      setDate(editingLesson.date);
      setDuration(editingLesson.duration || 'ساعة واحدة (1 سا)');
      setObjectives(editingLesson.objectives || '');
      setTeachingAids(editingLesson.teachingAids || '');
      setTeacherNotes(editingLesson.teacherNotes || '');
      setColor(editingLesson.color || '#006233');
      setStages(editingLesson.stages && editingLesson.stages.length > 0 
        ? JSON.parse(JSON.stringify(editingLesson.stages)) 
        : JSON.parse(JSON.stringify(DEFAULT_LESSON_STAGES))
      );
    } else {
      const initialClassId = defaultClassId || (classes.length > 0 ? classes[0].id : '');
      const initialClass = classes.find((c) => c.id === initialClassId);
      
      setTitle('');
      setClassId(initialClassId);
      setSubject(defaultSubject || initialClass?.subject || 'الرياضيات');
      setDate(new Date().toISOString().slice(0, 10));
      setDuration('ساعة واحدة (1 سا)');
      setObjectives('');
      setTeachingAids('الكتاب المدرسي المقرر، السبورة، جهاز العرض الرقمي (Data Show)');
      setTeacherNotes('');
      setColor(initialClass ? initialClass.color : '#006233');
      setStages(JSON.parse(JSON.stringify(DEFAULT_LESSON_STAGES)));
    }
    setErrors({});
  }, [editingLesson, defaultClassId, classes, isOpen, defaultSubject]);

  if (!isOpen) return null;

  // When class changes, auto-update subject and color if not custom
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const targetClass = classes.find((c) => c.id === newClassId);
    if (targetClass) {
      if (!editingLesson) {
        setSubject(defaultSubject || targetClass.subject || 'الرياضيات');
      }
      setColor(targetClass.color || '#006233');
    }
  };

  // Stage Helpers
  const handleAddStage = () => {
    const newStage: LessonStage = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `مرحلة جديدة ${stages.length + 1}`,
      duration: '15 دقيقة',
      content: '',
    };
    setStages([...stages, newStage]);
  };

  const handleUpdateStage = (index: number, field: keyof LessonStage, value: string) => {
    setStages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return;
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle quick teaching aids
  const handleToggleAid = (aid: string) => {
    if (teachingAids.includes(aid)) {
      const updated = teachingAids
        .split('،')
        .map((s) => s.trim())
        .filter((s) => s && s !== aid)
        .join('، ');
      setTeachingAids(updated);
    } else {
      const current = teachingAids.trim();
      if (!current) {
        setTeachingAids(aid);
      } else {
        setTeachingAids(`${current}، ${aid}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'يرجى كتابة عنوان الدرس أو موضوع المذكرة';
    }
    if (!classId) {
      newErrors.classId = 'يرجى اختيار القسم التربوي';
    }
    if (!subject.trim()) {
      newErrors.subject = 'يرجى إدخال المادة الدراسية';
    }
    if (!date) {
      newErrors.date = 'يرجى تحديد تاريخ الدرس';
    }
    if (!objectives.trim()) {
      newErrors.objectives = 'يرجى تحديد أهداف الدرس والكفاءات المستهدفة';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedClassObj = classes.find((c) => c.id === classId);
    const lessonData: LessonPlan = {
      id: editingLesson ? editingLesson.id : `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      classId,
      className: selectedClassObj ? selectedClassObj.name : undefined,
      subject: (editingLesson ? (subject || defaultSubject || 'الرياضيات') : (defaultSubject || subject || 'الرياضيات')).trim(),
      date,
      duration: duration.trim(),
      objectives: objectives.trim(),
      stages: stages.map((st) => ({
        id: st.id,
        title: st.title.trim() || 'مرحلة تعليمية',
        duration: st.duration?.trim() || '',
        content: st.content.trim(),
      })),
      teachingAids: teachingAids.trim(),
      teacherNotes: teacherNotes.trim(),
      color,
      createdAt: editingLesson ? editingLesson.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(lessonData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-xs flex justify-center items-start p-2 sm:p-4 sm:py-8 min-h-screen">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 shadow-2xl my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {editingLesson ? 'تعديل تحضير الدرس' : 'تحضير درس جديد (مذكرة بيداغوجية)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل الأهداف ومراحل الحصة والوسائل التعليمية والملاحظات محلياً
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Row 1: Lesson Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان الدرس / موضوع المذكرة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: آليات تركيب البروتين، الثورة التحريرية الجزائرية، الحساب الشعاعي..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                errors.title ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.title}</p>}
          </div>

          {/* Row 2: Class & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                القسم التربوي <span className="text-rose-500">*</span>
              </label>
              {classes.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  يرجى إضافة قسم تربوي أولاً من صفحة الأقسام.
                </div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                    errors.classId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="" disabled>-- اختر القسم --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              )}
              {errors.classId && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.classId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>المادة المقررة</span>
              </label>
              <div className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {defaultSubject || subject || 'الرياضيات'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  تلقائي من إعدادات الأستاذ
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ تقديم الدرس <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                    errors.date ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.date && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                مدة الحصة
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: ساعة واحدة (1 سا) أو ساعتان..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium ${
                      duration === dur
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Objectives */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                أهداف الدرس والكفاءات المستهدفة <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">سجل الأهداف في نقاط واضحة</span>
            </div>
            <textarea
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="مثال:&#10;1. التعرف على مفهوم الاستنساخ ومقره في الخلية.&#10;2. استنتاج دور إنزيم ARN بوليميراز.&#10;3. إنجاز مخطط تفسيري لآلية التعبير المورثي."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition leading-relaxed ${
                errors.objectives ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.objectives && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.objectives}</p>}
          </div>

          {/* Row 5: Lesson Stages (مراحل سير الدرس) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>مراحل سير الدرس البيداغوجي</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
                    {stages.length} مراحل
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  تفصيل خطوات الدرس من وضعية الانطلاق إلى مرحلة البناء والتقويم
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStage}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 dark:border-emerald-800/80 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مرحلة</span>
              </button>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div 
                  key={stage.id || index}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={stage.title}
                        onChange={(e) => handleUpdateStage(index, 'title', e.target.value)}
                        placeholder="عنوان المرحلة (مثال: وضعية الانطلاق)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stage.duration || ''}
                        onChange={(e) => handleUpdateStage(index, 'duration', e.target.value)}
                        placeholder="المدة (مثال: 15 د)"
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={stages.length <= 1}
                        onClick={() => handleRemoveStage(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:pointer-events-none"
                        title="حذف المرحلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={stage.content}
                    onChange={(e) => handleUpdateStage(index, 'content', e.target.value)}
                    placeholder="محتوى المرحلة: نشاط الأستاذ، نشاط المتعلم، التعليمات والسندات المستغلة..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Teaching Aids (الوسائل التعليمية) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الوسائل والسندات التعليمية
            </label>
            <input
              type="text"
              value={teachingAids}
              onChange={(e) => setTeachingAids(e.target.value)}
              placeholder="مثال: الكتاب المدرسي، جهاز العرض، بطاقات تعليمية، مخبر..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
            />
            {/* Quick chips */}
            <div className="mt-2.5">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">اختصارات سريعة للوسائل المعتمدة في المدارس الجزائرية:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TEACHING_AIDS.map((aid) => {
                  const isSelected = teachingAids.includes(aid);
                  return (
                    <button
                      key={aid}
                      type="button"
                      onClick={() => handleToggleAid(aid)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                      <span>{aid}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 7: Teacher Notes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ملاحظات الأستاذ وتوجيهات الحصة (اختياري)
            </label>
            <textarea
              ref={notesTextareaRef}
              rows={3}
              value={teacherNotes}
              onChange={(e) => {
                setTeacherNotes(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(88, e.target.scrollHeight)}px`;
              }}
              placeholder="مثال: صعوبات لوحظت لدى التلاميذ، توجيهات للحصة القادمة، أسئلة إضافية مقترحة..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition leading-relaxed min-h-[88px] resize-y overflow-visible"
              style={{ minHeight: '88px' }}
            />
          </div>

          {/* Row 8: Color Tagging */}
          <div className="pb-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              لون تمييز بطاقة الدرس
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {color === c.value && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={classes.length === 0}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 disabled:opacity-50"
          >
            {editingLesson ? 'حفظ التعديلات' : 'حفظ التحضير في الذاكرة'}
          </button>
        </div>
      </div>
    </div>
  );
}
