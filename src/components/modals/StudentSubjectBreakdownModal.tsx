import React from 'react';
import { 
  X, 
  Award, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  User,
  Sliders
} from 'lucide-react';
import { StudentItem, SubjectSetting } from '../../types';
import { SubjectCalculationDetailResult } from '../../utils/gradeCalculations';

interface StudentSubjectBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  subjectName: string;
  subjectSetting?: SubjectSetting | null;
  calculationResult?: SubjectCalculationDetailResult | null;
  onEditCalculationMethod?: () => void;
}

export const StudentSubjectBreakdownModal: React.FC<StudentSubjectBreakdownModalProps> = ({
  isOpen,
  onClose,
  student,
  subjectName,
  subjectSetting,
  calculationResult,
  onEditCalculationMethod,
}) => {
  if (!isOpen || !student || !calculationResult) return null;

  const {
    averageOutOf20,
    coefficient,
    weightedTotal,
    appraisal,
    methodName,
    methodFormula,
    calculationSteps,
    test1,
    test2,
    exam,
  } = calculationResult;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                تفاصيل حساب معدل المادة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student.firstName} {student.lastName} • {subjectName}
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">معدل المادة:</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                {averageOutOf20 !== null ? averageOutOf20.toFixed(2) : '-'}
              </span>
              <span className="text-[9px] text-slate-400 block">من 20</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">معامل المادة:</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">
                {typeof coefficient === 'number' && coefficient > 0 ? `× ${coefficient}` : '—'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                {typeof coefficient === 'number' && coefficient > 0 ? 'معامل واحد' : 'غير محدد'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">المجموع:</span>
              <span className="text-xl font-black text-purple-700 dark:text-purple-300">
                {weightedTotal !== null ? weightedTotal.toFixed(2) : '—'}
              </span>
              <span className="text-[9px] text-slate-400 block">نقطة</span>
            </div>
          </div>

          {/* Appraisal */}
          {appraisal && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 font-medium">التقدير الوزاري:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-md ${appraisal.colorBg} ${appraisal.colorText}`}>
                {appraisal.label}
              </span>
            </div>
          )}

          {/* 1. Assessment Scores Breakdown (العلامة المتحصل عليها والعدد الأقصى) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>العلامات والتقييمات المسجلة:</span>
              <span className="text-[10px] font-normal text-slate-400">فرض 1 وفرض 2 واختبار فقط</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {/* Test 1 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  فرض 1
                </span>
                {test1.isAbsent ? (
                  <span className="text-xs font-bold text-amber-600">غائب</span>
                ) : test1.rawScore !== null ? (
                  <>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {test1.rawScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block">من {test1.maxScore}</span>
                    {test1.maxScore !== 20 && test1.normalizedScore !== null && (
                      <span className="text-[9px] text-emerald-600 block mt-0.5">
                        ({test1.normalizedScore.toFixed(2)}/20)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-slate-400">غير مدخل</span>
                )}
              </div>

              {/* Test 2 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block mb-1">
                  فرض 2
                </span>
                {test2.isAbsent ? (
                  <span className="text-xs font-bold text-amber-600">غائب</span>
                ) : test2.rawScore !== null ? (
                  <>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {test2.rawScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block">من {test2.maxScore}</span>
                    {test2.maxScore !== 20 && test2.normalizedScore !== null && (
                      <span className="text-[9px] text-teal-600 block mt-0.5">
                        ({test2.normalizedScore.toFixed(2)}/20)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-slate-400">غير مدخل</span>
                )}
              </div>

              {/* Exam */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 block mb-1">
                  الاختبار
                </span>
                {exam.isAbsent ? (
                  <span className="text-xs font-bold text-amber-600">غائب</span>
                ) : exam.rawScore !== null ? (
                  <>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {exam.rawScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block">من {exam.maxScore}</span>
                    {exam.maxScore !== 20 && exam.normalizedScore !== null && (
                      <span className="text-[9px] text-purple-600 block mt-0.5">
                        ({exam.normalizedScore.toFixed(2)}/20)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-slate-400">غير مدخل</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Calculation Method Applied */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                كيفية الحساب المطبقة:
              </span>
              {onEditCalculationMethod && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditCalculationMethod();
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  تغيير طريقة الحساب
                </button>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {methodName}
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 text-center dir-ltr">
              {methodFormula}
            </div>
          </div>

          {/* 3. Step-by-Step Breakdown */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              مراحل العملية الحسابية:
            </span>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              {calculationSteps.map((step, idx) => (
                <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/80 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
