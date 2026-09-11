import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Calculator, 
  Sparkles, 
  HelpCircle,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { SubjectSetting } from '../../types';
import { SUBJECT_CALCULATION_METHODS } from '../../data/algerianData';

interface SubjectSettingsSectionProps {
  subjectSettings: SubjectSetting[];
  onOpenAddSubject: () => void;
  onOpenEditSubject: (subject: SubjectSetting) => void;
  onDeleteSubject: (subject: SubjectSetting) => void;
}

export const SubjectSettingsSection: React.FC<SubjectSettingsSectionProps> = ({
  subjectSettings,
  onOpenAddSubject,
  onOpenEditSubject,
  onDeleteSubject,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            إعدادات المواد وطرق الحساب (كيفية الحساب)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تحديد اسم المادة، المعامل الواحد فقط للمادة، وخانة كيفية الحساب (من فرض 1، فرض 2، والاختبار).
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddSubject}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة جديدة</span>
        </button>
      </div>

      {/* Constraints Reminder */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>المعامل واحد فقط للمادة</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>فرض 1 وفرض 2 فقط</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>اختبار فصلي واحد</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>تخزين دائم في IndexedDB</span>
        </div>
      </div>

      {/* Subjects Grid */}
      {subjectSettings.length === 0 ? (
        <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <Calculator className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">لم يتم تسجيل أي مادة بعد. انقر على «إضافة مادة جديدة» للبدء.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {subjectSettings.map((sub) => {
            const methodInfo = SUBJECT_CALCULATION_METHODS.find(
              (m) => m.id === sub.calculationMethod?.method
            ) || SUBJECT_CALCULATION_METHODS[0];

            return (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition shadow-xs flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{sub.name}</span>
                      </h4>
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        المعامل: {sub.coefficient}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditSubject(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                        title="تعديل المادة وكيفية الحساب"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="حذف إعداد المادة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calculation Method Display Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        كيفية الحساب:
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {methodInfo.title}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 dir-ltr bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200/60 dark:border-slate-700/60 text-center">
                      {sub.calculationMethod?.method === 'custom_weights'
                        ? `(فرض1×${sub.calculationMethod.customTest1Weight ?? 1} + فرض2×${sub.calculationMethod.customTest2Weight ?? 1} + اختبار×${sub.calculationMethod.customExamWeight ?? 2}) ÷ الأوزان`
                        : methodInfo.formula}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {methodInfo.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">محفوظة في الذاكرة المحلية</span>
                  <button
                    type="button"
                    onClick={() => onOpenEditSubject(sub)}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>تجربة النتيجة / تعديل</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
