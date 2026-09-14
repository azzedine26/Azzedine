import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, BookOpen, GraduationCap, MapPin, FileText, Calendar, Sparkles } from 'lucide-react';
import { ClassItem, DayOfWeek, ScheduleSession } from '../../types';
import { 
  WEEK_DAYS, 
  COMMON_TIME_SLOTS, 
  getSubjectsForGradeAndStage
} from '../../data/algerianData';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: ScheduleSession | Omit<ScheduleSession, 'createdAt' | 'updatedAt'>) => Promise<void>;
  classes: ClassItem[];
  defaultDay?: DayOfWeek;
  defaultSubject?: string;
  editingSession?: ScheduleSession | null;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  defaultDay = 'sunday',
  defaultSubject = 'الرياضيات',
  editingSession = null,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(defaultDay);
  const [classId, setClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>(defaultSubject || 'الرياضيات');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [room, setRoom] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [color, setColor] = useState<string>('#006233');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === classId) || null;
  }, [classes, classId]);

  // Sync state when modal opens or editingSession changes
  useEffect(() => {
    if (editingSession) {
      setDayOfWeek(editingSession.dayOfWeek);
      setClassId(editingSession.classId);
      setSubject(editingSession.subject || defaultSubject || 'الرياضيات');
      setStartTime(editingSession.startTime);
      setEndTime(editingSession.endTime);
      setRoom(editingSession.room || '');
      setNotes(editingSession.notes || '');
      setColor(editingSession.color || '#006233');
    } else {
      setDayOfWeek(defaultDay);
      if (classes.length > 0) {
        const first = classes[0];
        setClassId(first.id);
        setSubject(defaultSubject || first.subject || 'الرياضيات');
        setRoom(first.room || '');
        setColor(first.color || '#006233');
      } else {
        setClassId('');
        setSubject(defaultSubject || 'الرياضيات');
        setRoom('');
        setColor('#006233');
      }
      setStartTime('08:00');
      setEndTime('10:00');
      setNotes('');
    }
    setErrors({});
  }, [editingSession, defaultDay, classes, isOpen, defaultSubject]);

  if (!isOpen) return null;

  // Handle Class change
  const handleClassChange = (selectedId: string) => {
    setClassId(selectedId);
    const foundClass = classes.find((c) => c.id === selectedId);
    if (foundClass) {
      if (!editingSession) {
        setSubject(defaultSubject || foundClass.subject || 'الرياضيات');
      }
      if (!room || room === '') {
        setRoom(foundClass.room || '');
      }
      if (foundClass.color) {
        setColor(foundClass.color);
      }
    }
  };

  // Quick select time slot
  const handleSelectTimeSlot = (slotStart: string, slotEnd: string) => {
    setStartTime(slotStart);
    setEndTime(slotEnd);
    if (errors.time) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.time;
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!classId) {
      errs.classId = 'يرجى اختيار القسم التربوي';
    }
    const targetSub = defaultSubject || subject || 'الرياضيات';
    if (!targetSub.trim()) {
      errs.subject = 'يرجى إدخال اسم المادة';
    }
    if (!startTime) {
      errs.startTime = 'يرجى تحديد وقت البداية';
    }
    if (!endTime) {
      errs.endTime = 'يرجى تحديد وقت النهاية';
    }
    if (startTime && endTime && startTime >= endTime) {
      errs.time = 'وقت البداية يجب أن يكون قبل وقت النهاية';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedClass = classes.find((c) => c.id === classId);
      const sessionPayload = {
        ...(editingSession ? { id: editingSession.id, createdAt: editingSession.createdAt } : {}),
        dayOfWeek,
        classId,
        className: selectedClass ? selectedClass.name : '',
        subject: (editingSession ? (subject || defaultSubject || 'الرياضيات') : (defaultSubject || subject || 'الرياضيات')).trim(),
        startTime,
        endTime,
        room: room.trim() || undefined,
        notes: notes.trim() || undefined,
        color: color || selectedClass?.color || '#006233',
        updatedAt: Date.now(),
      };

      await onSave(sessionPayload as ScheduleSession);
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: 'حدث خطأ أثناء حفظ الحصة. يرجى المحاولة ثانية.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingSession ? 'تعديل بيانات الحصة' : 'إضافة حصة جديدة في الجدول'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل الحصة مع التوقيت، القسم، والقاعة بدون إنترنت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              {errors.form}
            </div>
          )}

          {/* 1. Day of Week Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>يوم الحصة (من الأحد إلى الخميس) *</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {WEEK_DAYS.map((day) => {
                const isSelected = dayOfWeek === day.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setDayOfWeek(day.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <span>{day.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Class & Subject Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>القسم التربوي *</span>
              </label>
              {classes.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  لا توجد أقسام مسجلة. أنشئ قسماً أولاً من صفحة الأقسام.
                </div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                >
                  <option value="">-- اختر القسم --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.stage === 'secondary' ? 'ثانوي' : 'متوسط'})
                    </option>
                  ))}
                </select>
              )}
              {errors.classId && <p className="text-[11px] text-rose-500 mt-1">{errors.classId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>مادة الحصة</span>
              </label>
              <div className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {defaultSubject || subject || 'الرياضيات'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  تلقائي من إعدادات الأستاذ
                </span>
              </div>
            </div>
          </div>

          {/* 3. Time Range (Start & End) */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وقت البداية *</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وقت النهاية *</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                />
              </div>
            </div>

            {errors.time && (
              <p className="text-[11px] text-rose-500 font-semibold">{errors.time}</p>
            )}

            {/* Quick time slot chips for convenience */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-1">أوقات شائعة بالمدارس الجزائرية:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TIME_SLOTS.slice(0, 6).map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTimeSlot(slot.start, slot.end)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 font-mono transition"
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Room & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>القاعة أو المخبر (اختياري)</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="مثال: المخبر 2 أو القاعة 08"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>لون تمييز الحصة</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>ملاحظات الحصة (اختياري)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: أعمال تطبيقية، تحضير تجارب، إحضار كراريس الأنشطة..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || classes.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>جاري الحفظ...</span>
              ) : (
                <span>{editingSession ? 'حفظ التعديلات' : 'إضافة الحصة'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
