import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Dices, 
  RotateCcw, 
  UserX, 
  UserCheck, 
  History, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Award, 
  HelpCircle, 
  Filter, 
  RefreshCw,
  Copy,
  ChevronDown,
  Play,
  Share2,
  Check
} from 'lucide-react';
import { 
  ClassItem, 
  StudentItem, 
  TeacherProfile, 
  AttendanceRecord, 
  RandomDrawRecord, 
  RandomDrawClassState 
} from '../../types';
import { 
  selectFairRandomStudent, 
  playShuffleTickSound, 
  playVictoryChime, 
  DRAW_PURPOSES, 
  formatDrawDate, 
  formatDrawTime 
} from '../../utils/randomPickerService';
import { databaseService } from '../../db/databaseService';
import { ExcludeStudentsModal } from '../modals/ExcludeStudentsModal';

interface RandomPickerViewProps {
  classes: ClassItem[];
  students: StudentItem[];
  attendanceRecords?: AttendanceRecord[];
  profile: TeacherProfile;
  onNavigateToClasses?: () => void;
  onNavigateToStudents?: () => void;
}

export const RandomPickerView: React.FC<RandomPickerViewProps> = ({
  classes,
  students,
  attendanceRecords = [],
  profile,
  onNavigateToClasses,
  onNavigateToStudents,
}) => {
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return classes.length > 0 ? classes[0].id : '';
  });

  // Sound toggle (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ostad_dz_draw_sound') !== 'false';
    } catch {
      return true;
    }
  });

  // Selected Purpose tag
  const [selectedPurpose, setSelectedPurpose] = useState<string>(DRAW_PURPOSES[0]);

  // Class specific draw state
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  const [pickedStudentIds, setPickedStudentIds] = useState<string[]>([]);
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
  
  // Active draw result & animation
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayStudentName, setDisplayStudentName] = useState<string>('اضغط على "ابدأ القرعة" للاختيار');
  const [selectedWinner, setSelectedWinner] = useState<StudentItem | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Modal for student exclusion
  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<RandomDrawRecord[]>([]);
  const [historyFilterClass, setHistoryFilterClass] = useState<string>('all');
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [isClearingHistory, setIsClearingHistory] = useState<boolean>(false);

  // Animation refs
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioTickCountRef = useRef<number>(0);

  // Fallback if initial selected class is invalid
  useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.some(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Get current class object
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // All students belonging to the selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Eligible pool of students available for the next draw
  const eligibleStudents = useMemo(() => {
    return classStudents.filter((student) => {
      // Must not be excluded (e.g. absent)
      if (excludedStudentIds.includes(student.id)) return false;
      // If noRepeat is active, must not be already picked in this cycle
      if (noRepeat && pickedStudentIds.includes(student.id)) return false;
      return true;
    });
  }, [classStudents, excludedStudentIds, noRepeat, pickedStudentIds]);

  // All non-excluded students (for cycle participation calculation)
  const activeStudentsCount = useMemo(() => {
    return classStudents.filter((s) => !excludedStudentIds.includes(s.id)).length;
  }, [classStudents, excludedStudentIds]);

  // Check if today's attendance record exists for this class
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayAttendanceRecord = useMemo(() => {
    return attendanceRecords.find((r) => r.classId === selectedClassId && r.date === todayDateStr);
  }, [attendanceRecords, selectedClassId, todayDateStr]);

  // Load saved state for selected class from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const loadState = async () => {
      if (!selectedClassId) return;
      try {
        const saved = await databaseService.getRandomDrawState(selectedClassId);
        if (saved && isMounted) {
          setNoRepeat(saved.noRepeat ?? true);
          setPickedStudentIds(saved.selectedStudentIds || []);
          setExcludedStudentIds(saved.excludedStudentIds || []);
          if (saved.lastSelectedStudentId) {
            const winner = students.find((s) => s.id === saved.lastSelectedStudentId);
            if (winner) {
              setSelectedWinner(winner);
              setDisplayStudentName(`${winner.lastName} ${winner.firstName}`);
            }
          }
        } else if (isMounted) {
          setPickedStudentIds([]);
          setExcludedStudentIds([]);
          setSelectedWinner(null);
          setDisplayStudentName('اضغط على "ابدأ القرعة" للاختيار');
        }
      } catch (err) {
        console.error('Failed loading draw state:', err);
      }
    };
    loadState();
    return () => {
      isMounted = false;
    };
  }, [selectedClassId, students]);

  // Save state whenever picked, excluded, or noRepeat changes
  const persistClassState = useCallback(
    async (
      updatedPicked: string[],
      updatedExcluded: string[],
      updatedNoRepeat: boolean,
      lastWinnerId?: string
    ) => {
      if (!selectedClassId) return;
      const stateObj: RandomDrawClassState = {
        classId: selectedClassId,
        noRepeat: updatedNoRepeat,
        selectedStudentIds: updatedPicked,
        excludedStudentIds: updatedExcluded,
        lastSelectedStudentId: lastWinnerId,
        updatedAt: Date.now(),
      };
      await databaseService.saveRandomDrawState(stateObj);
    },
    [selectedClassId]
  );

  // Load Draw History
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const records = await databaseService.getAllRandomDrawHistory(
        historyFilterClass === 'all' ? undefined : historyFilterClass
      );
      setHistory(records);
    } catch (e) {
      console.error('Failed loading draw history:', e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historyFilterClass]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('ostad_dz_draw_sound', String(next));
    } catch {
      // ignore
    }
  };

  // Perform Draw Action
  const handleStartDraw = () => {
    if (isSpinning) return;
    if (classStudents.length === 0) return;

    if (eligibleStudents.length === 0) {
      if (noRepeat && activeStudentsCount > 0) {
        // All students participated, cycle complete
        return;
      }
      return;
    }

    setIsSpinning(true);
    setSelectedWinner(null);
    audioTickCountRef.current = 0;

    // Pick winner immediately using secure uniform RNG
    const winner = selectFairRandomStudent(eligibleStudents);
    if (!winner) {
      setIsSpinning(false);
      return;
    }

    // Animation: Carousel shuffle effect with deceleration
    const candidateNames = classStudents.map((s) => `${s.lastName} ${s.firstName}`);
    let step = 0;
    const totalSteps = 24; // 24 rapid name flashes
    let currentInterval = 45; // Starts fast (45ms) and slows down smoothly

    const runShuffleStep = () => {
      step++;
      const randomDisplay = candidateNames[Math.floor(Math.random() * candidateNames.length)];
      setDisplayStudentName(randomDisplay);

      if (soundEnabled && step % 2 === 0) {
        playShuffleTickSound();
      }

      if (step < totalSteps) {
        // Exponential deceleration
        currentInterval = Math.floor(45 + Math.pow(step / totalSteps, 2.5) * 220);
        spinTimerRef.current = setTimeout(runShuffleStep, currentInterval);
      } else {
        // Reveal winner!
        setDisplayStudentName(`${winner.lastName} ${winner.firstName}`);
        setSelectedWinner(winner);
        setIsSpinning(false);

        if (soundEnabled) {
          playVictoryChime();
        }

        // Update picked pool
        const newPicked = noRepeat
          ? Array.from(new Set([...pickedStudentIds, winner.id]))
          : pickedStudentIds;
        setPickedStudentIds(newPicked);

        // Persist state
        persistClassState(newPicked, excludedStudentIds, noRepeat, winner.id);

        // Record history
        const now = Date.now();
        const historyRecord: RandomDrawRecord = {
          id: `draw_${now}_${Math.random().toString(36).substr(2, 6)}`,
          studentId: winner.id,
          studentName: `${winner.lastName} ${winner.firstName}`,
          studentGender: winner.gender,
          studentNumber: winner.studentNumber,
          classId: selectedClassId,
          className: currentClass?.name || 'القسم',
          timestamp: now,
          dateString: formatDrawDate(now),
          timeString: formatDrawTime(now),
          purpose: selectedPurpose,
        };

        databaseService.addRandomDrawRecord(historyRecord).then(() => {
          setHistory((prev) => [historyRecord, ...prev]);
        });
      }
    };

    spinTimerRef.current = setTimeout(runShuffleStep, currentInterval);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  // Reset current cycle
  const handleResetCycle = () => {
    setPickedStudentIds([]);
    setSelectedWinner(null);
    setDisplayStudentName('تم بدء دورة جديدة. اضغط على "ابدأ القرعة" للاختيار');
    persistClassState([], excludedStudentIds, noRepeat, undefined);
  };

  // Toggle single student exclusion directly from the list
  const handleToggleStudentExclusion = (studentId: string) => {
    const isExcluded = excludedStudentIds.includes(studentId);
    const newExcluded = isExcluded
      ? excludedStudentIds.filter((id) => id !== studentId)
      : [...excludedStudentIds, studentId];
    
    setExcludedStudentIds(newExcluded);
    persistClassState(pickedStudentIds, newExcluded, noRepeat, selectedWinner?.id);
  };

  // Save excluded from modal
  const handleSaveExcludedFromModal = (newExcluded: string[]) => {
    setExcludedStudentIds(newExcluded);
    persistClassState(pickedStudentIds, newExcluded, noRepeat, selectedWinner?.id);
  };

  // Clear history
  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      await databaseService.clearRandomDrawHistory(
        historyFilterClass === 'all' ? undefined : historyFilterClass
      );
      if (historyFilterClass === 'all') {
        setHistory([]);
      } else {
        setHistory((prev) => prev.filter((r) => r.classId !== historyFilterClass));
      }
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Copy winner name
  const handleCopyWinnerName = () => {
    if (!selectedWinner) return;
    const text = `${selectedWinner.lastName} ${selectedWinner.firstName} (${currentClass?.name || ''})`;
    navigator.clipboard?.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Percentage of participation in current cycle
  const cycleParticipationPercent = useMemo(() => {
    if (activeStudentsCount === 0) return 0;
    const validPickedCount = pickedStudentIds.filter(id => !excludedStudentIds.includes(id)).length;
    return Math.min(100, Math.round((validPickedCount / activeStudentsCount) * 100));
  }, [pickedStudentIds, excludedStudentIds, activeStudentsCount]);

  const isCycleCompleted = noRepeat && activeStudentsCount > 0 && eligibleStudents.length === 0;

  return (
    <div className="space-y-6 pb-12 w-full max-w-full min-w-0 font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl translate-x-10 translate-y-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold">
              <Dices className="w-3.5 h-3.5 text-emerald-300" />
              <span>أداة بيداغوجية تفاعلية</span>
              <span className="opacity-50">•</span>
              <span>100% بدون إنترنت</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>القرعة العشوائية للتلاميذ</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                مشاركة عادلة
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              اختيار تلميذ عشوائياً بطريقة تفاعلية وعادلة لطرح الأسئلة، المشاركة، حل التمارين على السبورة، أو الاختبارات الشفوية مع نظام منع التكرار الذكي.
            </p>
          </div>

          {/* Sound toggle & Class Quick Switch */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleToggleSound}
              className={`p-2.5 rounded-2xl border backdrop-blur-md transition flex items-center gap-2 text-xs font-bold ${
                soundEnabled
                  ? 'bg-emerald-600/80 border-emerald-400/40 text-white shadow-md'
                  : 'bg-white/10 border-white/20 text-emerald-200 hover:bg-white/20'
              }`}
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-200" />
                  <span className="hidden sm:inline">الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">الصوت صامت</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Class Selection & Participation Metrics */}
      {classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              لم يتم إنشاء أي قسم بعد
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              قم بإضافة أقسامك وتلاميذك أولاً من تبويب "الأقسام والصفوف" لتتمكن من استخدام ميزة القرعة العشوائية.
            </p>
          </div>
          {onNavigateToClasses && (
            <button
              onClick={onNavigateToClasses}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md transition"
            >
              الانتقال إلى الأقسام
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Class Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  اختر القسم المستهدف:
                </span>
              </div>

              {/* Class Pills / Select */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {classes.map((cls) => {
                  const isSelected = cls.id === selectedClassId;
                  const count = students.filter((s) => s.classId === cls.id).length;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm shadow-emerald-700/20'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="truncate">{cls.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                          isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Class Stats & Participation Status Bar */}
            {currentClass && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {/* Total in class */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>إجمالي التلاميذ</span>
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                    {classStudents.length} <span className="text-xs font-medium text-slate-400">تلميذ</span>
                  </div>
                </div>

                {/* Available for draw */}
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>متاح في القرعة</span>
                    <Dices className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {eligibleStudents.length} <span className="text-xs font-medium text-emerald-600/70">تلميذ</span>
                  </div>
                </div>

                {/* Already Picked in this cycle */}
                <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40">
                  <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 flex items-center justify-between">
                    <span>تم اختيارهم (الدورة)</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-sky-700 dark:text-sky-400 mt-1">
                    {pickedStudentIds.filter(id => !excludedStudentIds.includes(id)).length} <span className="text-xs font-medium text-sky-600/70">تلميذ</span>
                  </div>
                </div>

                {/* Excluded (absent/sick) */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>مستثنون (غائبون)</span>
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400 mt-1">
                    {excludedStudentIds.length} <span className="text-xs font-medium text-amber-600/70">تلميذ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Main Stage: Draw Arena & Options */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: The Draw Arena (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Draw Box & Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden relative">
                {/* Top status bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      قسم: <strong className="text-emerald-700 dark:text-emerald-400">{currentClass?.name}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {currentClass?.subject || 'المادة'}
                    </span>
                  </div>

                  {/* Purpose selector chip */}
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      الغرض:
                    </label>
                    <select
                      value={selectedPurpose}
                      onChange={(e) => setSelectedPurpose(e.target.value)}
                      className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {DRAW_PURPOSES.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* The Draw Visual Canvas */}
                <div className="p-6 sm:p-10 md:p-12 text-center flex flex-col items-center justify-center relative min-h-[280px] sm:min-h-[320px] bg-radial from-slate-50 via-white to-slate-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
                  {/* Subtle glowing rings */}
                  <div className="absolute w-72 h-72 rounded-full border border-emerald-500/10 dark:border-emerald-400/10 animate-pulse pointer-events-none" />
                  <div className="absolute w-96 h-96 rounded-full border border-teal-500/5 dark:border-teal-400/5 pointer-events-none" />

                  {/* When Cycle is Completed */}
                  {isCycleCompleted ? (
                    <div className="space-y-4 max-w-md animate-in zoom-in-95 duration-300 z-10">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-700/20">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          تم اختيار جميع تلاميذ القسم!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          أكمل جميع التلاميذ ({activeStudentsCount}) مشاركتهم في هذه الدورة بنجاح وفق مبدأ العدالة وتكافؤ الفرص.
                        </p>
                      </div>
                      <button
                        onClick={handleResetCycle}
                        className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-lg shadow-emerald-700/30 transition transform active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>بدء دورة جديدة</span>
                      </button>
                    </div>
                  ) : selectedWinner && !isSpinning ? (
                    /* Winner Card Display */
                    <div className="space-y-5 max-w-lg w-full animate-in zoom-in-90 duration-300 z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800 shadow-xs">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>تم اختيار التلميذ بنجاح!</span>
                      </div>

                      {/* Prominent Winner Box */}
                      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border-2 border-emerald-500 dark:border-emerald-500/80 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
                        <div className="flex items-center justify-center gap-4">
                          <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-md ${
                              selectedWinner.gender === 'female'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200'
                            }`}
                          >
                            {selectedWinner.lastName.slice(0, 1)}
                          </div>
                          <div className="text-right">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                              {selectedWinner.lastName} {selectedWinner.firstName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {currentClass?.name}
                              </span>
                              {selectedWinner.studentNumber && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">رقم: {selectedWinner.studentNumber}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium">
                                {selectedWinner.gender === 'female' ? 'أنثى' : 'ذكر'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action shortcuts inside winner box */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-center gap-2 flex-wrap text-xs">
                          <button
                            onClick={handleCopyWinnerName}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-1.5"
                          >
                            {copiedSuccess ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تم النسخ!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>نسخ الاسم</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleToggleStudentExclusion(selectedWinner.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 transition flex items-center gap-1.5"
                            title="استثناء التلميذ مؤقتاً في حال اعتذر أو غاب"
                          >
                            <UserX className="w-3.5 h-3.5 text-amber-600" />
                            <span>استثناء مؤقتاً</span>
                          </button>
                        </div>
                      </div>

                      {/* Primary Next Action Buttons */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={handleStartDraw}
                          disabled={eligibleStudents.length === 0}
                          className="px-7 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-700/30 transition transform active:scale-95 flex items-center gap-2.5"
                        >
                          <Dices className="w-5 h-5" />
                          <span>اختيار تلميذ آخر</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial / Active Spinning Name Roll */
                    <div className="space-y-4 max-w-lg w-full z-10">
                      <div
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border transition-all ${
                          isSpinning
                            ? 'bg-emerald-600 text-white border-emerald-500 scale-110 shadow-lg shadow-emerald-600/30 animate-bounce'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Dices className={`w-8 h-8 ${isSpinning ? 'animate-spin' : ''}`} />
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-sm min-h-[70px] flex items-center justify-center">
                        <p
                          className={`text-lg sm:text-2xl font-black text-slate-900 dark:text-white transition-all ${
                            isSpinning ? 'scale-105 text-emerald-700 dark:text-emerald-400' : ''
                          }`}
                        >
                          {displayStudentName}
                        </p>
                      </div>

                      {/* Big Start Button */}
                      <div>
                        <button
                          id="btn-start-random-draw"
                          onClick={handleStartDraw}
                          disabled={isSpinning || eligibleStudents.length === 0}
                          className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center gap-3 mx-auto"
                        >
                          <Dices className="w-6 h-6" />
                          <span>{isSpinning ? 'جاري السحب العشوائي...' : '🎲 ابدأ القرعة'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Progress & Cycle indicator */}
                {noRepeat && (
                  <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        تقدم الدورة الحالية:
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {pickedStudentIds.filter(id => !excludedStudentIds.includes(id)).length} / {activeStudentsCount}
                      </span>
                      <span className="text-slate-400">({cycleParticipationPercent}%)</span>
                    </div>

                    <div className="flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${cycleParticipationPercent}%` }}
                      />
                    </div>

                    {pickedStudentIds.length > 0 && (
                      <button
                        onClick={handleResetCycle}
                        className="text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة تعيين الدورة</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Student Pool Cards & Status View */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>قائمة تلاميذ القسم وحالتهم في القرعة</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {classStudents.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      يمكنك استثناء أي تلميذ غائب أو مريض بالضغط عليه مباشرة.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsExcludeModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/60 transition flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>تحديد الغياب والاستثناءات</span>
                    </button>
                  </div>
                </div>

                {/* Student grid cards */}
                {classStudents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                    لا يوجد تلاميذ مسجلين في هذا القسم
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                    {classStudents.map((student, idx) => {
                      const isExcluded = excludedStudentIds.includes(student.id);
                      const isPicked = pickedStudentIds.includes(student.id) && !isExcluded;
                      const isWinner = selectedWinner?.id === student.id;

                      let statusBadge = {
                        label: 'متاح للقرعة',
                        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
                      };

                      if (isExcluded) {
                        statusBadge = {
                          label: 'مستثنى (غائب)',
                          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
                        };
                      } else if (isPicked) {
                        statusBadge = {
                          label: 'شارك في الدورة',
                          bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
                        };
                      }

                      return (
                        <div
                          key={student.id}
                          onClick={() => handleToggleStudentExclusion(student.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                            isWinner
                              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-400'
                              : isExcluded
                              ? 'bg-slate-50/80 dark:bg-slate-900/60 opacity-60 border-dashed border-slate-300 dark:border-slate-800'
                              : isPicked
                              ? 'bg-sky-50/30 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-900/40'
                              : 'bg-white dark:bg-slate-800/60 hover:border-emerald-500/60 border-slate-200 dark:border-slate-700/80 shadow-xs'
                          }`}
                          title="اضغط لاستثناء التلميذ أو إعادته للقرعة"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate ${isExcluded ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                {student.lastName} {student.firstName}
                              </p>
                              <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded font-bold border ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {isExcluded ? (
                              <UserX className="w-4 h-4 text-amber-500" />
                            ) : isPicked ? (
                              <CheckCircle2 className="w-4 h-4 text-sky-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Settings, Control Options & History (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Draw Options Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>إعدادات وضوابط القرعة</span>
                </h3>

                {/* Option 1: No-Repeat Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label 
                      htmlFor="toggle-no-repeat"
                      className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer select-none"
                    >
                      منع تكرار اختيار التلميذ
                    </label>
                    <input
                      id="toggle-no-repeat"
                      type="checkbox"
                      checked={noRepeat}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setNoRepeat(val);
                        persistClassState(pickedStudentIds, excludedStudentIds, val, selectedWinner?.id);
                      }}
                      className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    عند التفعيل، التلميذ الذي تم اختياره لا يدخل في القرعات التالية حتى يشارك جميع تلاميذ القسم.
                  </p>
                </div>

                {/* Quick Exclude Modal trigger */}
                <button
                  type="button"
                  onClick={() => setIsExcludeModalOpen(true)}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        استثناء التلاميذ (الغياب / العذر)
                      </p>
                      <p className="text-[10px] text-slate-400">
                        المستثنون حالياً: {excludedStudentIds.length} تلميذ
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Reset Cycle button */}
                <button
                  type="button"
                  onClick={handleResetCycle}
                  className="w-full p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>بدء دورة قرعة جديدة للقسم</span>
                </button>
              </div>

              {/* Draw History Log Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      سجل القرعات
                    </h3>
                    <span className="text-xs px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                      {history.length}
                    </span>
                  </div>

                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      disabled={isClearingHistory}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>مسح السجل</span>
                    </button>
                  )}
                </div>

                {/* Class Filter for history */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">تصفية:</span>
                  <select
                    value={historyFilterClass}
                    onChange={(e) => setHistoryFilterClass(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">جميع الأقسام</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* History Items Feed */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {isHistoryLoading ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      جاري تحميل السجل...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      لم يتم تسجيل أي عمليات قرعة بعد
                    </div>
                  ) : (
                    history.map((record) => (
                      <div
                        key={record.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {record.studentName}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {record.className}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[140px] text-slate-500 dark:text-slate-400">
                            {record.purpose || 'مشاركة عامة'}
                          </span>
                          <span className="font-mono">{record.timeString} • {record.dateString}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Exclude Students Modal */}
      {currentClass && (
        <ExcludeStudentsModal
          isOpen={isExcludeModalOpen}
          onClose={() => setIsExcludeModalOpen(false)}
          className={currentClass.name}
          students={classStudents}
          excludedStudentIds={excludedStudentIds}
          onSaveExcluded={handleSaveExcludedFromModal}
          todayAttendanceRecord={todayAttendanceRecord}
        />
      )}
    </div>
  );
};
