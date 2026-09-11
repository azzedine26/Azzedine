import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  GraduationCap, 
  BookOpen, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Check, 
  Flag, 
  ArrowUpDown, 
  BellRing,
  Sparkles,
  CheckCircle,
  Inbox
} from 'lucide-react';
import { ReminderItem, ClassItem, ReminderPriority } from '../../types';

interface RemindersViewProps {
  reminders: ReminderItem[];
  classes: ClassItem[];
  onOpenAddReminder: () => void;
  onEditReminder: (reminder: ReminderItem) => void;
  onDeleteReminder: (id: string, title: string) => void;
  onToggleComplete: (id: string) => Promise<void>;
}

type FilterTab = 'all' | 'upcoming' | 'overdue' | 'completed';
type SortOption = 'date-asc' | 'date-desc' | 'created-desc' | 'priority';

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  classes,
  onOpenAddReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleComplete,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Request browser notification permissions
  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setRequestFeedback('المتصفح الحالي لا يدعم إشعارات سطح المكتب.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        setRequestFeedback('تم تفعيل التنبيهات المحلية بنجاح! سيتم تنبيهك عند حلول المواعيد.');
        try {
          new Notification('Ostad DZ - التذكيرات', {
            body: 'تم تفعيل التنبيهات المحلية لتطبيق الأستاذ بنجاح.',
            icon: '/favicon.ico',
          });
        } catch {
          // Ignore notification display errors in sandbox
        }
      } else {
        setRequestFeedback('تم رفض إذن الإشعارات من قبل المتصفح.');
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    setTimeout(() => {
      setRequestFeedback(null);
    }, 4500);
  };

  // Helper to format ISO date to readable Arabic date
  const formatArabicDate = (isoDate: string) => {
    try {
      const [year, month, day] = isoDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('ar-DZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(dateObj);
    } catch {
      return isoDate;
    }
  };

  // Date comparison helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const getReminderStatus = (reminder: ReminderItem) => {
    if (reminder.isCompleted) return 'completed';
    if (reminder.dueDate < todayStr) return 'overdue';
    if (reminder.dueDate === todayStr) return 'today';
    return 'upcoming';
  };

  // Filter and sort items
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      // 1. Tab filter
      const status = getReminderStatus(item);
      if (activeTab === 'upcoming' && (item.isCompleted || status === 'overdue')) return false;
      if (activeTab === 'overdue' && (item.isCompleted || status !== 'overdue')) return false;
      if (activeTab === 'completed' && !item.isCompleted) return false;

      // 2. Class filter
      if (selectedClassId !== 'all') {
        if (item.classId !== selectedClassId) return false;
      }

      // 3. Priority filter
      if (selectedPriority !== 'all') {
        if (item.priority !== selectedPriority) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
        const matchesClass = item.className ? item.className.toLowerCase().includes(q) : false;
        const matchesSubject = item.subject ? item.subject.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNotes && !matchesClass && !matchesSubject) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-asc') {
        const timeA = a.dueDate + (a.dueTime ? ' ' + a.dueTime : ' 23:59');
        const timeB = b.dueDate + (b.dueTime ? ' ' + b.dueTime : ' 23:59');
        return timeA.localeCompare(timeB);
      }
      if (sortBy === 'date-desc') {
        const timeA = a.dueDate + (a.dueTime ? ' ' + a.dueTime : ' 23:59');
        const timeB = b.dueDate + (b.dueTime ? ' ' + b.dueTime : ' 23:59');
        return timeB.localeCompare(timeA);
      }
      if (sortBy === 'created-desc') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const pA = priorityWeight[a.priority || 'medium'];
        const pB = priorityWeight[b.priority || 'medium'];
        return pB - pA;
      }
      return 0;
    });
  }, [reminders, activeTab, selectedClassId, selectedPriority, searchQuery, sortBy, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    let completed = 0;
    let overdue = 0;
    let todayCount = 0;
    let upcoming = 0;

    for (const r of reminders) {
      if (r.isCompleted) {
        completed++;
      } else {
        if (r.dueDate < todayStr) {
          overdue++;
        } else if (r.dueDate === todayStr) {
          todayCount++;
          upcoming++;
        } else {
          upcoming++;
        }
      }
    }

    return {
      total: reminders.length,
      pending: reminders.length - completed,
      completed,
      overdue,
      todayCount,
      upcoming,
    };
  }, [reminders, todayStr]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-600/60 border border-emerald-400/30 text-emerald-100 text-xs font-black flex items-center gap-1.5 shadow-xs">
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>المفكرة والتذكيرات التربوية</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-100 text-xs font-semibold">
                محفوظة محلياً 100% دون إنترنت
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              التذكيرات والمهام
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl font-medium leading-relaxed">
              سجّل مواعيد تسليم الفروض، جلسات التنسيق البيداغوجي، تحضير الاختبارات، والمهام اليومية مع إمكانية ربطها بأقسامك وموادك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Native Notification Trigger Button */}
            {notificationStatus !== 'granted' && (
              <button
                onClick={handleRequestNotification}
                title="تفعيل الإشعارات المحلية لتلقي تنبيهات عند حلول المواعيد"
                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5"
              >
                <BellRing className="w-4 h-4 text-amber-300" />
                <span>تفعيل التنبيهات</span>
              </button>
            )}

            {notificationStatus === 'granted' && (
              <div 
                title="التنبيهات مفعلة على هذا الجهاز"
                className="px-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>التنبيهات مفعلة</span>
              </div>
            )}

            {/* Add Reminder Button */}
            <button
              onClick={onOpenAddReminder}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition transform active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تذكير جديد</span>
            </button>
          </div>
        </div>

        {/* Feedback Message if any */}
        {requestFeedback && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-900/80 border border-emerald-400/40 text-xs text-emerald-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{requestFeedback}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي التذكيرات</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
        </div>

        {/* Upcoming / Today */}
        <div 
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">القادمة والمستحقة</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.upcoming}
            </span>
            {stats.todayCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                {stats.todayCount} اليوم
              </span>
            )}
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">متأخرة / فائتة</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.overdue}
          </div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">المنجزة / المكتملة</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-4 shadow-xs">
        {/* Row 1: Search and Tab Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المستحقة ({stats.upcoming})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'overdue'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المتأخرة ({stats.overdue})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              المكتملة ({stats.completed})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، الملاحظة، القسم، أو المادة..."
              className="w-full pr-9 pl-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Class, Priority, Sorting) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="all">جميع الأقسام</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="all">كل الأولويات</option>
              <option value="high">عاجلة / هامة</option>
              <option value="medium">متوسطة</option>
              <option value="low">عادية</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 mr-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
            >
              <option value="date-asc">الأقرب تاريخاً ووقت (تصاعدي)</option>
              <option value="date-desc">الأبعد تاريخاً (تنازلي)</option>
              <option value="created-desc">الأحدث إضافة</option>
              <option value="priority">الأعلى أهمية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mb-1">
            لا توجد تذكيرات تطابق البحث الحالي
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            {reminders.length === 0 
              ? 'لم تقم بإضافة أي تذكير بعد. ابدأ بإضافة مواعيد تسليم الفروض، جلسات التنسيق، أو المهام اليومية.'
              : 'جرّب تغيير عبارة البحث أو الفلاتر المحددة لعرض التذكيرات المسجلة.'}
          </p>
          <button
            onClick={onOpenAddReminder}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition transform active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول تذكير الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const status = getReminderStatus(reminder);
            const isCompleted = reminder.isCompleted;

            return (
              <div
                key={reminder.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : status === 'overdue'
                    ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-400'
                    : status === 'today'
                    ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/80 shadow-xs hover:border-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  
                  {/* Right side: Checkbox + Content */}
                  <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                    {/* Completion Toggle Button */}
                    <button
                      onClick={() => onToggleComplete(reminder.id)}
                      className={`mt-0.5 shrink-0 rounded-lg p-1 transition transform active:scale-90 ${
                        isCompleted
                          ? 'text-teal-600 dark:text-teal-400 hover:text-teal-700'
                          : 'text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                      title={isCompleted ? 'تحديد كغير مكتمل' : 'تحديد كمكتمل'}
                      aria-label="تحديد حالة التذكير"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 fill-teal-100 dark:fill-teal-950" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Text Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Title */}
                        <h4
                          className={`font-black text-sm sm:text-base leading-snug break-words ${
                            isCompleted
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {reminder.title}
                        </h4>

                        {/* Status Badges */}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-black shrink-0">
                            مكتمل
                          </span>
                        )}

                        {!isCompleted && status === 'overdue' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black shrink-0 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>متأخر</span>
                          </span>
                        )}

                        {!isCompleted && status === 'today' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>اليوم</span>
                          </span>
                        )}

                        {/* Priority Badge */}
                        {reminder.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[10px] font-black shrink-0">
                            عاجلة
                          </span>
                        )}
                        {reminder.priority === 'low' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-semibold shrink-0">
                            عادية
                          </span>
                        )}
                      </div>

                      {/* Notes (if any) */}
                      {reminder.notes && (
                        <p
                          className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words ${
                            isCompleted
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {reminder.notes}
                        </p>
                      )}

                      {/* Metadata Badges (Date, Time, Class, Subject) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Due Date & Time */}
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatArabicDate(reminder.dueDate)}</span>
                        </span>

                        {reminder.dueTime && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{reminder.dueTime}</span>
                          </span>
                        )}

                        {/* Linked Class */}
                        {reminder.className && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                            <GraduationCap className="w-3 h-3" />
                            <span>{reminder.className}</span>
                          </span>
                        )}

                        {/* Linked Subject */}
                        {reminder.subject && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                            <BookOpen className="w-3 h-3" />
                            <span>{reminder.subject}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left side: Action Buttons (Edit, Delete) */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => onEditReminder(reminder)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                      title="تعديل التذكير"
                      aria-label="تعديل التذكير"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteReminder(reminder.id, reminder.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      title="حذف التذكير"
                      aria-label="حذف التذكير"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
