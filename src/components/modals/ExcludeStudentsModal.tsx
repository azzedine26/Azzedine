import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  UserCheck, 
  UserX, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  CalendarCheck,
  Users
} from 'lucide-react';
import { StudentItem, AttendanceRecord } from '../../types';

interface ExcludeStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  students: StudentItem[];
  excludedStudentIds: string[];
  onSaveExcluded: (newExcludedIds: string[]) => void;
  todayAttendanceRecord?: AttendanceRecord;
}

export const ExcludeStudentsModal: React.FC<ExcludeStudentsModalProps> = ({
  isOpen,
  onClose,
  className,
  students,
  excludedStudentIds,
  onSaveExcluded,
  todayAttendanceRecord,
}) => {
  const [localExcluded, setLocalExcluded] = useState<string[]>(excludedStudentIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalExcluded(excludedStudentIds);
      setSearchQuery('');
    }
  }, [isOpen, excludedStudentIds]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const full = `${s.firstName} ${s.lastName}`.toLowerCase();
      const num = (s.studentNumber || '').toLowerCase();
      return full.includes(q) || num.includes(q);
    });
  }, [students, searchQuery]);

  if (!isOpen) return null;

  const toggleStudent = (id: string) => {
    setLocalExcluded((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleIncludeAll = () => {
    setLocalExcluded([]);
  };

  const handleExcludeAll = () => {
    setLocalExcluded(students.map((s) => s.id));
  };

  const handleImportAbsentFromToday = () => {
    if (!todayAttendanceRecord || !todayAttendanceRecord.records) return;
    const absentIds = Object.keys(todayAttendanceRecord.records).filter((sid) => {
      const rec = todayAttendanceRecord.records[sid];
      return rec && (rec.status === 'absent' || rec.status === 'excused');
    });
    setLocalExcluded((prev) => Array.from(new Set([...prev, ...absentIds])));
  };

  const handleConfirm = () => {
    onSaveExcluded(localExcluded);
    onClose();
  };

  const activeCount = students.length - localExcluded.length;
  const excludedCount = localExcluded.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                استثناء وتحديد الحضور للقرعة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                قسم: <span className="font-bold text-emerald-600 dark:text-emerald-400">{className}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Quick actions bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
          {/* Summary counters */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>مشارك بالقرعة: {activeCount}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span>مستثنى: {excludedCount}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleIncludeAll}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
              >
                تضمين الكل
              </button>
              <button
                type="button"
                onClick={handleExcludeAll}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
              >
                استثناء الكل
              </button>
            </div>
          </div>

          {/* Quick sync with attendance if available */}
          {todayAttendanceRecord && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-xs">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300">
                <CalendarCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>يوجد سجل حضور مسجل لهذا اليوم ({todayAttendanceRecord.date})</span>
              </div>
              <button
                type="button"
                onClick={handleImportAbsentFromToday}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-xs"
              >
                استبعاد الغائبين
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم التلميذ أو لقبه..."
              className="w-full pr-10 pl-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Students list */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px]">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              لا يوجد تلاميذ مطابقين لخيارات البحث
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const isExcluded = localExcluded.includes(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`pt-1.5 first:pt-0 pb-1.5 flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                    isExcluded
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 text-slate-400 dark:text-slate-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate ${isExcluded ? 'line-through opacity-70' : ''}`}>
                          {student.lastName} {student.firstName}
                        </span>
                        {student.gender === 'female' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-medium">
                            أنثى
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium">
                            ذكر
                          </span>
                        )}
                      </div>
                      {student.studentNumber && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          رقم: {student.studentNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                        isExcluded
                          ? 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {isExcluded ? 'مستثنى (غائب)' : 'مشارك في القرعة'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            يمكنك إعادة التلاميذ المستثنين في أي لحظة أثناء الحصة.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              حفظ التغييرات ({activeCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
