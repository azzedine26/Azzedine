import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  GraduationCap, 
  MapPin, 
  FileText, 
  Pencil, 
  Trash2, 
  Filter, 
  LayoutGrid, 
  ListOrdered,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ClassItem, DayOfWeek, ScheduleSession } from '../../types';
import { WEEK_DAYS } from '../../data/algerianData';

interface ScheduleViewProps {
  sessions: ScheduleSession[];
  classes: ClassItem[];
  onOpenAddSession: (day?: DayOfWeek) => void;
  onEditSession: (session: ScheduleSession) => void;
  onDeleteSession: (sessionId: string, sessionLabel: string) => void;
  onNavigateToClasses: () => void;
}

// Calculate duration in hours and minutes from "HH:MM" strings
function calculateDurationText(start: string, end: string): string {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (diffMinutes <= 0) return '';
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 1 && minutes === 0) return 'ساعة واحدة';
  if (hours === 2 && minutes === 0) return 'ساعتان';
  if (hours > 2 && minutes === 0) return `${hours} ساعات`;
  if (hours === 0 && minutes > 0) return `${minutes} دقيقة`;
  return `${hours} س و ${minutes} د`;
}

// Check which day of week is today (Algerian week: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4)
function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday
  switch (dayIndex) {
    case 0: return 'sunday';
    case 1: return 'monday';
    case 2: return 'tuesday';
    case 3: return 'wednesday';
    case 4: return 'thursday';
    default: return 'sunday'; // For Fri & Sat weekend, default to start of week (Sunday)
  }
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  sessions,
  classes,
  onOpenAddSession,
  onEditSession,
  onDeleteSession,
  onNavigateToClasses,
}) => {
  const todayDay = useMemo(() => getTodayDayOfWeek(), []);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayDay);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Filter sessions by class
  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      if (selectedClassFilter === 'all') return true;
      return sess.classId === selectedClassFilter;
    });
  }, [sessions, selectedClassFilter]);

  // Sessions for currently selected day
  const dailySessions = useMemo(() => {
    return filteredSessions
      .filter((sess) => sess.dayOfWeek === activeDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredSessions, activeDay]);

  // Total weekly hours calculated
  const totalWeeklyHours = useMemo(() => {
    let totalMinutes = 0;
    sessions.forEach((s) => {
      const [sH, sM] = s.startTime.split(':').map(Number);
      const [eH, eM] = s.endTime.split(':').map(Number);
      const diff = (eH * 60 + eM) - (sH * 60 + sM);
      if (diff > 0) totalMinutes += diff;
    });
    return (totalMinutes / 60).toFixed(1).replace('.0', '');
  }, [sessions]);

  const activeDayLabel = WEEK_DAYS.find((d) => d.id === activeDay)?.label || 'اليوم';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              الجدول الأسبوعي للحصص
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تنظيم التوقيت الأسبوعي من الأحد إلى الخميس، وتوزيع الحصص والقاعات دون إنترنت.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle (Daily Timeline / Weekly Grid) */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="عرض اليوم التفصيلي"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>يومي</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="عرض الأسبوع كاملاً"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة الأسبوع</span>
            </button>
          </div>

          <button
            onClick={() => onOpenAddSession(activeDay)}
            disabled={classes.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حصة</span>
          </button>
        </div>
      </div>

      {/* Alert if no classes created yet */}
      {classes.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium">
              يجب عليك إنشاء قسم تربوي أولاً لإسناد الحصص الأسبوعية إليه.
            </span>
          </div>
          <button
            onClick={onNavigateToClasses}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shrink-0"
          >
            الانتقال لصفحة الأقسام
          </button>
        </div>
      )}

      {/* Weekly Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs text-slate-400 block font-medium">إجمالي الحصص</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {sessions.length}
            </span>
            <span className="text-[11px] text-slate-400">حصة أسبوعياً</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 block font-medium">ساعات التدريس</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {totalWeeklyHours}
            </span>
            <span className="text-[11px] text-slate-400">ساعة / أسبوع</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 block font-medium">حصص {activeDayLabel}</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {sessions.filter((s) => s.dayOfWeek === activeDay).length}
            </span>
            <span className="text-[11px] text-slate-400">حصص اليوم المختار</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block font-medium mb-1">
            تصفية حسب القسم
          </label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">كل الأقسام</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Days of Week Tabs (Sun -> Thu) - Mobile First */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = activeDay === day.id;
            const isToday = todayDay === day.id;
            const daySessionsCount = filteredSessions.filter((s) => s.dayOfWeek === day.id).length;

            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                className={`relative py-3 px-1 sm:px-2 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {/* Today Indicator Pill */}
                {isToday && (
                  <span
                    className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-tight ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    اليوم
                  </span>
                )}

                <span className="font-extrabold text-xs sm:text-sm">
                  {day.label}
                </span>

                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {daySessionsCount} {daySessionsCount === 1 ? 'حصة' : 'حصص'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: DAILY TIMELINE (Default on Mobile) */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>حصص يوم {activeDayLabel}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {dailySessions.length} حصة مسجلة
              </span>
            </h3>

            <button
              onClick={() => onOpenAddSession(activeDay)}
              disabled={classes.length === 0}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حصة لـ {activeDayLabel}</span>
            </button>
          </div>

          {dailySessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                لا توجد حصص مسجلة ليوم {activeDayLabel}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {selectedClassFilter !== 'all'
                  ? 'لا توجد حصص لهذا القسم في هذا اليوم.'
                  : `لم يتم برمجة أي حصة دراسية ليوم ${activeDayLabel}. أضف أول حصة الآن.`}
              </p>
              {classes.length > 0 && (
                <button
                  onClick={() => onOpenAddSession(activeDay)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition"
                >
                  + إضافة حصة ليوم {activeDayLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dailySessions.map((session) => {
                const assignedClass = classes.find((c) => c.id === session.classId);
                const durationText = calculateDurationText(session.startTime, session.endTime);
                const sessionColor = session.color || assignedClass?.color || '#006233';

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition relative overflow-hidden flex flex-col justify-between group"
                  >
                    {/* Visual color bar on the right (RTL start) */}
                    <div
                      className="absolute top-0 bottom-0 right-0 w-1.5"
                      style={{ backgroundColor: sessionColor }}
                    />

                    <div>
                      {/* Top Row: Time & Duration & Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
                          {durationText && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              {durationText}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditSession(session)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="تعديل بيانات الحصة"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteSession(
                                session.id,
                                `حصة ${session.subject} (${assignedClass?.name || session.className}) يوم ${activeDayLabel}`
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="حذف الحصة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Class & Subject */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sessionColor }}
                          />
                          <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                            {assignedClass?.name || session.className || 'قسم غير محدد'}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.subject}</span>
                        </div>
                      </div>

                      {/* Room and Notes */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {session.room && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {session.room}
                            </span>
                          </div>
                        )}

                        {session.notes && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{session.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FULL WEEKLY GRID (Table / Desktop & Tablet View) */}
      {viewMode === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              <span>نظرة شاملة على الأسبوع (الأحد إلى الخميس)</span>
            </h3>
            <span className="text-xs text-slate-400">
              إجمالي: {filteredSessions.length} حصة
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-800">
            {WEEK_DAYS.map((day) => {
              const daySessions = filteredSessions
                .filter((s) => s.dayOfWeek === day.id)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = todayDay === day.id;

              return (
                <div key={day.id} className="p-3 space-y-2.5">
                  <div
                    onClick={() => {
                      setActiveDay(day.id);
                      setViewMode('daily');
                    }}
                    className={`p-2 rounded-xl text-center cursor-pointer transition ${
                      isToday
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold'
                    }`}
                  >
                    <div className="text-xs">{day.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {daySessions.length} حصة
                    </div>
                  </div>

                  {daySessions.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-slate-400">
                      فارغ
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySessions.map((sess) => {
                        const assignedClass = classes.find((c) => c.id === sess.classId);
                        const sessionColor = sess.color || assignedClass?.color || '#006233';

                        return (
                          <div
                            key={sess.id}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-xs transition relative pr-3 shadow-2xs"
                          >
                            <span
                              className="absolute top-2 bottom-2 right-1 w-1 rounded-full"
                              style={{ backgroundColor: sessionColor }}
                            />
                            <div className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              {sess.startTime} - {sess.endTime}
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                              {assignedClass?.name || sess.className}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {sess.subject}
                            </div>
                            {sess.room && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{sess.room}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
