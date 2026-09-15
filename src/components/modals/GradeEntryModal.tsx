import React, { useState, useEffect, useMemo } from 'react';
import { X, Award, Save, Search, UserX, CheckCircle, Calculator, Info, Sparkles } from 'lucide-react';
import { AssessmentItem, StudentItem, StudentScoreRecord } from '../../types';
import { ASSESSMENT_TYPE_INFO, getAlgerianAppraisal, normalizeTo20, TRIMESTER_INFO } from '../../utils/gradeCalculations';

interface GradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentItem | null;
  students: StudentItem[];
  onSaveGrades: (assessmentId: string, grades: Record<string, StudentScoreRecord>) => Promise<void>;
}

export const GradeEntryModal: React.FC<GradeEntryModalProps> = ({
  isOpen,
  onClose,
  assessment,
  students,
  onSaveGrades,
}) => {
  const [gradesMap, setGradesMap] = useState<Record<string, StudentScoreRecord>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unrecorded' | 'absent'>('all');

  // Filter students belonging to this assessment's class
  const classStudents = useMemo(() => {
    if (!assessment) return [];
    return students
      .filter((s) => s.classId === assessment.classId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [students, assessment]);

  // Load existing grades on open
  useEffect(() => {
    if (!isOpen || !assessment) return;

    const initial: Record<string, StudentScoreRecord> = {};
    classStudents.forEach((student) => {
      const existing = assessment.grades?.[student.id];
      if (existing) {
        initial[student.id] = {
          score: typeof existing.score === 'number' ? existing.score : null,
          isAbsent: !!existing.isAbsent,
          note: existing.note || '',
        };
      } else {
        initial[student.id] = {
          score: null,
          isAbsent: false,
          note: '',
        };
      }
    });

    setGradesMap(initial);
    setSearchQuery('');
    setFilterMode('all');
  }, [isOpen, assessment, classStudents]);

  if (!isOpen || !assessment) return null;

  const maxScore = (assessment.maxScore !== undefined && assessment.maxScore !== null && assessment.maxScore > 0)
    ? assessment.maxScore
    : 20;

  const handleScoreChange = (studentId: string, valStr: string) => {
    if (valStr.trim() === '') {
      setGradesMap((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          score: null,
          isAbsent: false,
        },
      }));
      return;
    }

    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      // Clamp between 0 and maxScore
      const clamped = Math.max(0, Math.min(num, maxScore));
      setGradesMap((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          score: clamped,
          isAbsent: false,
        },
      }));
    }
  };

  const toggleAbsent = (studentId: string) => {
    setGradesMap((prev) => {
      const current = prev[studentId] || {};
      const newAbsent = !current.isAbsent;
      return {
        ...prev,
        [studentId]: {
          ...current,
          isAbsent: newAbsent,
          score: newAbsent ? null : current.score,
        },
      };
    });
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Filter students based on search and tab
  const filteredStudents = classStudents.filter((s) => {
    const rec = gradesMap[s.id];
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentNumber && s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'absent') {
      return !!rec?.isAbsent;
    }
    if (filterMode === 'unrecorded') {
      return !rec?.isAbsent && (rec?.score === null || rec?.score === undefined);
    }
    return true;
  });

  // Calculate quick stats of the current batch
  const totalStudentsCount = classStudents.length;
  let gradedCount = 0;
  let absentCount = 0;
  let scoresSum = 0;

  (Object.values(gradesMap) as StudentScoreRecord[]).forEach((rec) => {
    if (rec.isAbsent) {
      absentCount++;
    } else if (typeof rec.score === 'number' && !isNaN(rec.score)) {
      gradedCount++;
      scoresSum += normalizeTo20(rec.score, maxScore);
    }
  });

  const batchAverage = gradedCount > 0 ? Math.round((scoresSum / gradedCount) * 100) / 100 : null;
  const progressPercent = totalStudentsCount > 0 ? Math.round(((gradedCount + absentCount) / totalStudentsCount) * 100) : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanedGrades: Record<string, StudentScoreRecord> = {};
      Object.entries(gradesMap).forEach(([sId, rec]) => {
        const record = rec as StudentScoreRecord;
        if (record && (record.isAbsent || (typeof record.score === 'number' && !isNaN(record.score)) || (record.note && record.note.trim() !== ''))) {
          cleanedGrades[sId] = {
            score: typeof record.score === 'number' && !isNaN(record.score) ? record.score : null,
            isAbsent: !!record.isAbsent,
            note: record.note?.trim() || undefined,
          };
        }
      });
      await onSaveGrades(assessment.id, cleanedGrades);
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ النقاط');
    } finally {
      setIsSaving(false);
    }
  };

  const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {assessment.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.colorBg} ${typeInfo.colorText} ${typeInfo.colorBorder}`}>
                  {typeInfo.label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {TRIMESTER_INFO[assessment.trimester]?.label || 'الفصل الأول'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {assessment.className} • المادة: {assessment.subject} {assessment.type !== 'test' && assessment.type !== 'test1' && assessment.type !== 'test2' ? `• المعامل: ${assessment.coefficient}` : ''} • العلامة القصوى: /{maxScore}
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

        {/* Real-time Summary Stats Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">المرصود:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {gradedCount} / {totalStudentsCount} <span className="text-[11px] text-emerald-600 font-bold">({progressPercent}%)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">الغيابات:</span>
            <span className={`font-bold ${absentCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {absentCount} تلميذ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">معدل التقييم:</span>
            <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
              {batchAverage !== null ? `${batchAverage} / 20` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            {batchAverage !== null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAlgerianAppraisal(batchAverage).badgeBg} ${getAlgerianAppraisal(batchAverage).badgeText} ${getAlgerianAppraisal(batchAverage).badgeBorder}`}>
                {getAlgerianAppraisal(batchAverage).label}
              </span>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، اللقب، أو رقم التسجيل..."
              className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل ({classStudents.length})
            </button>
            <button
              onClick={() => setFilterMode('unrecorded')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'unrecorded'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              غير المرصود ({totalStudentsCount - (gradedCount + absentCount)})
            </button>
            <button
              onClick={() => setFilterMode('absent')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'absent'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              الغيابات ({absentCount})
            </button>
          </div>
        </div>

        {/* Grade Table / List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا يوجد طلاب يطابقون معايير البحث أو التصفية الحالية.
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const rec = gradesMap[student.id] || { score: null, isAbsent: false, note: '' };
              const isAbsent = !!rec.isAbsent;
              const hasScore = typeof rec.score === 'number' && !isNaN(rec.score);
              const scoreOutOf20 = hasScore ? normalizeTo20(rec.score!, maxScore) : null;
              const appraisal = scoreOutOf20 !== null ? getAlgerianAppraisal(scoreOutOf20) : null;

              return (
                <div
                  key={student.id}
                  className={`py-2.5 px-3 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAbsent
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40'
                      : hasScore
                      ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      : 'bg-slate-50/40 dark:bg-slate-800/20'
                  }`}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {student.lastName} {student.firstName}
                        </span>
                        {student.studentNumber && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            {student.studentNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>{student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                        {student.notes && <span className="truncate max-w-xs">• {student.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Grading Controls */}
                  <div className="flex items-center flex-wrap gap-2.5 mr-auto sm:mr-0">
                    {/* Score Input */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="0.25"
                          disabled={isAbsent}
                          value={isAbsent ? '' : rec.score !== null && rec.score !== undefined ? rec.score : ''}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          placeholder="—"
                          className={`w-20 sm:w-24 h-10 px-2 text-center rounded-xl border text-sm font-black transition focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                            isAbsent
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : hasScore
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-emerald-500/80 dark:border-emerald-500 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400">/{maxScore}</span>
                    </div>

                    {/* Absent Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleAbsent(student.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                        isAbsent
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{isAbsent ? 'غائب' : 'حاضر'}</span>
                    </button>

                    {/* Normalized /20 & Appraisal preview */}
                    <div className="min-w-[110px] flex flex-col items-start justify-center">
                      {isAbsent ? (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          غياب مسجل
                        </span>
                      ) : hasScore && appraisal ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appraisal.badgeBg} ${appraisal.badgeText} ${appraisal.badgeBorder}`}>
                            {appraisal.label}
                          </span>
                          {maxScore !== 20 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({scoreOutOf20}/20)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">
                          لم تُرصد بعد
                        </span>
                      )}
                    </div>

                    {/* Teacher note on student */}
                    <input
                      type="text"
                      value={rec.note || ''}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      placeholder="ملاحظة خاصة (اختياري)..."
                      className="w-36 sm:w-44 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>يتم الحفظ محلياً 100% في ذاكرة المتصفح دون الحاجة للإنترنت.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ النقاط'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
