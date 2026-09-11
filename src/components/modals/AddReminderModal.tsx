import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Clock, BookOpen, GraduationCap, AlertCircle, Sparkles, Flag } from 'lucide-react';
import { ClassItem, ReminderItem, ReminderPriority } from '../../types';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: ReminderItem) => Promise<void>;
  classes: ClassItem[];
  editingReminder?: ReminderItem | null;
  defaultClassId?: string;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  editingReminder = null,
  defaultClassId,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<ReminderPriority>('medium');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for today's ISO date
  const getTodayIso = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (editingReminder) {
        setTitle(editingReminder.title);
        setNotes(editingReminder.notes || '');
        setDueDate(editingReminder.dueDate);
        setDueTime(editingReminder.dueTime || '');
        setClassId(editingReminder.classId || '');
        setSubject(editingReminder.subject || '');
        setPriority(editingReminder.priority || 'medium');
      } else {
        setTitle('');
        setNotes('');
        setDueDate(getTodayIso());
        setDueTime('09:00');
        const initialClass = defaultClassId || (classes.length > 0 ? '' : '');
        setClassId(initialClass);
        if (initialClass) {
          const found = classes.find(c => c.id === initialClass);
          setSubject(found?.subject || '');
        } else {
          setSubject(classes[0]?.subject || '');
        }
        setPriority('medium');
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, editingReminder, defaultClassId, classes]);

  const handleClassChange = (selectedId: string) => {
    setClassId(selectedId);
    if (selectedId) {
      const cls = classes.find(c => c.id === selectedId);
      if (cls && cls.subject && !subject) {
        setSubject(cls.subject);
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'يرجى كتابة عنوان للتذكير';
    }
    if (!dueDate) {
      errs.dueDate = 'يرجى تحديد تاريخ التذكير';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const selectedClass = classes.find(c => c.id === classId);

      const reminderData: ReminderItem = {
        id: editingReminder ? editingReminder.id : `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate,
        dueTime: dueTime || undefined,
        classId: classId || undefined,
        className: selectedClass ? selectedClass.name : (editingReminder?.className || undefined),
        subject: subject.trim() || undefined,
        isCompleted: editingReminder ? editingReminder.isCompleted : false,
        priority,
        createdAt: editingReminder ? editingReminder.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      await onSave(reminderData);
      onClose();
    } catch (err) {
      console.error('Error saving reminder:', err);
      setErrors({ general: 'تعذر حفظ التذكير في قاعدة البيانات المحلية. يرجى المحاولة ثانية.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/40">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {editingReminder ? 'تعديل التذكير' : 'إضافة تذكير جديد'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل موعد، مهمة بيداغوجية، أو استحقاق محفوظ محلياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان التذكير أو المهمة <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تسليم مواضيع الفروض للمديرية، جلسة تنسيق، تصحيح الأوراق..."
                className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border ${
                  errors.title ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                } focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition`}
                autoFocus
              />
            </div>
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ الاستحقاق <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full pr-10 pl-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border ${
                    errors.dueDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition`}
                />
              </div>
              {errors.dueDate && (
                <p className="text-xs text-rose-500 mt-1">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الوقت المحدد (اختياري)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              درجة الأهمية / الأولوية
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'low'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>عادية</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>متوسطة</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'high'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>عاجلة / هامة</span>
              </button>
            </div>
          </div>

          {/* Link to Class & Subject (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ربط بقسم تربوي (اختياري)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="">-- بدون قسم محدد (تذكير عام) --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                المادة (اختياري)
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: رياضيات، علوم، فيزياء..."
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات أو تفاصيل إضافية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="اكتب أي تعليمات أو عناصر مساعدة تتعلق بالتذكير..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingReminder ? 'تحديث التذكير' : 'حفظ التذكير'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
