import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Printer, 
  Filter, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { StudentItem, AttendanceRecord, AttendanceStatus } from '../../types';

interface StudentAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  className?: string;
  attendanceRecords: AttendanceRecord[];
}

export const StudentAttendanceHistoryModal: React.FC<StudentAttendanceHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  className,
  attendanceRecords,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');

  // Compute student attendance history sorted by date descending
  const history = useMemo(() => {
    if (!student) return [];

    const list: {
      date: string;
      period?: string;
      status: AttendanceStatus;
      note?: string;
      sessionNotes?: string;
    }[] = [];

    attendanceRecords.forEach((session) => {
      const entry = session.records?.[student.id];
      if (entry) {
        list.push({
          date: session.date,
          period: session.period,
          status: entry.status,
          note: entry.note,
          sessionNotes: session.notes,
        });
      }
    });

    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [student, attendanceRecords]);

  // Statistics
  const stats = useMemo(() => {
    const totalRecorded = history.length;
    const present = history.filter((h) => h.status === 'present').length;
    const absent = history.filter((h) => h.status === 'absent').length;
    const late = history.filter((h) => h.status === 'late').length;
    const excused = history.filter((h) => h.status === 'excused' || (h.status === 'absent' && h.note && h.note.includes('مبرر'))).length;
    const rate = totalRecorded > 0 ? Math.round((present / totalRecorded) * 100) : 100;

    return { totalRecorded, present, absent, late, excused, rate };
  }, [history]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    if (statusFilter === 'ALL') return history;
    return history.filter((item) => item.status === statusFilter);
  }, [history, statusFilter]);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-300 dark:border-emerald-800 shrink-0">
              {student.lastName[0] || 'ط'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                  {student.lastName} {student.firstName}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  student.gender === 'female' 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                    : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                }`}>
                  {student.gender === 'female' ? 'أنثى' : 'ذكر'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {className || 'القسم'} • رقم القيد: <span className="font-mono">{student.studentNumber || '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="طباعة سجل التلميذ"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total days */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                إجمالي الأيام المرصودة
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalRecorded} <span className="text-xs font-normal text-slate-400">يوم</span>
              </span>
            </div>

            {/* Days present */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  أيام الحضور
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {stats.present} <span className="text-xs font-normal text-emerald-600/70">يوم</span>
              </span>
            </div>

            {/* Days absent */}
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  أيام الغياب
                </span>
                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">
                {stats.absent} <span className="text-xs font-normal text-rose-600/70">يوم</span>
              </span>
            </div>

            {/* Attendance Rate */}
            <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                  نسبة الانضباط
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-300">
                %{stats.rate}
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-bold ml-1">تصفية السجل:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              الكل ({history.length})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                statusFilter === 'present'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
            >
              حاضر ({stats.present})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                statusFilter === 'absent'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              }`}
            >
              غائب ({stats.absent})
            </button>
          </div>
        </div>

        {/* Timeline / Records List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                لا توجد جلسات حضور مسجلة مطابقة
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل الحضور لهذا التلميذ يظهر هنا فور حفظ جلسات الحضور في القسم.
              </p>
            </div>
          ) : (
            filteredHistory.map((item, idx) => {
              const isPresent = item.status === 'present';
              const isAbsent = item.status === 'absent';
              const isExcused = isAbsent && (item.status === 'excused' || item.note?.includes('مبرر'));

              return (
                <div
                  key={`${item.date}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isPresent
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : isExcused
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isPresent
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : isExcused
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPresent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                          {item.date}
                        </span>
                        {item.period && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.period}
                          </span>
                        )}
                      </div>

                      {item.note && (
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>ملاحظة: {item.note}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    isPresent
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : isExcused
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}>
                    {isPresent ? 'حاضر' : isExcused ? 'غائب (مبرر)' : 'غائب'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
