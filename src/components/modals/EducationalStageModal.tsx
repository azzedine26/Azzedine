import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Check, 
  AlertCircle,
  X
} from 'lucide-react';
import { EducationalStage } from '../../types';
import { 
  MIDDLE_SUBJECTS_LIST, 
  SECONDARY_SUBJECTS_LIST 
} from '../../data/algerianData';

interface EducationalStageModalProps {
  isOpen: boolean;
  isFirstLaunch?: boolean;
  currentStage?: EducationalStage;
  currentSpecializedSubject?: string;
  onSave: (stage: EducationalStage, specializedSubject: string) => Promise<void>;
  onClose?: () => void;
}

export const EducationalStageModal: React.FC<EducationalStageModalProps> = ({
  isOpen,
  isFirstLaunch = false,
  currentStage = 'secondary',
  currentSpecializedSubject = '',
  onSave,
  onClose,
}) => {
  const [selectedStage, setSelectedStage] = useState<EducationalStage>(currentStage);
  const [specializedSubject, setSpecializedSubject] = useState<string>(currentSpecializedSubject);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedStage(currentStage || 'secondary');
      
      if (currentSpecializedSubject) {
        setSpecializedSubject(currentSpecializedSubject);
      } else {
        if (currentStage === 'middle') {
          setSpecializedSubject(MIDDLE_SUBJECTS_LIST[0]);
        } else {
          setSpecializedSubject(SECONDARY_SUBJECTS_LIST[0]);
        }
      }
      setError(null);
    }
  }, [isOpen, currentStage, currentSpecializedSubject]);

  const handleStageSelect = (stage: EducationalStage) => {
    setSelectedStage(stage);
    setError(null);
    if (stage === 'middle') {
      if (!MIDDLE_SUBJECTS_LIST.includes(specializedSubject)) {
        setSpecializedSubject(MIDDLE_SUBJECTS_LIST[0]);
      }
    } else if (stage === 'secondary') {
      if (!SECONDARY_SUBJECTS_LIST.includes(specializedSubject)) {
        setSpecializedSubject(SECONDARY_SUBJECTS_LIST[0]);
      }
    }
  };

  const handleSubmit = async () => {
    setError(null);

    let finalSpecialized = specializedSubject.trim();
    if (customSubjectInput.trim()) {
      finalSpecialized = customSubjectInput.trim();
    }

    if (!finalSpecialized) {
      setError('يرجى تحديد مادة تدريسك المقررة.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedStage, finalSpecialized);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to save stage:', err);
      setError('حدث خطأ أثناء حفظ الإعدادات في الذاكرة المحلية. يرجى المحاولة ثانية.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentAvailableList = selectedStage === 'middle' ? MIDDLE_SUBJECTS_LIST : SECONDARY_SUBJECTS_LIST;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isFirstLaunch ? 'مرحباً بك! اختر طورك التعليمي' : 'تعديل الطور التعليمي ونظام التدريس'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Ostad DZ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFirstLaunch 
                  ? 'نسخة خاصة بالتعليم المتوسط والتعليم الثانوي في الجزائر' 
                  : 'يمكنك تغيير الطور ومادة التدريس في أي وقت'}
              </p>
            </div>
          </div>

          {!isFirstLaunch && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Stage Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              الخطوة 1: حدد الطور التعليمي <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Middle */}
              <div
                onClick={() => handleStageSelect('middle')}
                className={`cursor-pointer relative p-4 rounded-2xl border transition-all text-right ${
                  selectedStage === 'middle'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-base">
                    📚
                  </div>
                  {selectedStage === 'middle' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  التعليم المتوسط
                </h4>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                  تدريس عدة مستويات وأقسام (1م - 4م)
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  أستاذ مرحلة التعليم المتوسط، تدريس عدة مستويات وأفواج (من 1 متوسط إلى 4 متوسط BEM) مع تحديد مادة التدريس.
                </p>
              </div>

              {/* Secondary */}
              <div
                onClick={() => handleStageSelect('secondary')}
                className={`cursor-pointer relative p-4 rounded-2xl border transition-all text-right ${
                  selectedStage === 'secondary'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-base">
                    🎓
                  </div>
                  {selectedStage === 'secondary' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  التعليم الثانوي
                </h4>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
                  تدريس عدة مستويات وشعب (1ث - 3ث)
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  أستاذ مرحلة التعليم الثانوي، تدريس عدة أقسام ومستويات (1 ثانوي إلى 3 ثانوي بكالوريا) بمختلف الشعب.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Subject Selection with multi-level awareness */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>الخطوة 2: حدد مادة تدريسك الأساسية</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 text-[11px] font-bold">
                  مادة التدريس
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                اختر مادتك المقررة. الأستاذ يستطيع تدريس عدة مستويات وأقسام مع ربط كل قسم بمستواه ومادته بشكل مستقل:
              </p>
            </div>

            {/* Quick Subjects Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-52 overflow-y-auto scrollbar-thin p-1">
              {currentAvailableList.map((subj) => {
                const isSelected = specializedSubject === subj && !customSubjectInput.trim();
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setSpecializedSubject(subj);
                      setCustomSubjectInput('');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between text-right ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    <span className="truncate">{subj}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 mr-1.5 shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Or Custom Subject Input */}
            <div className="pt-2 border-t border-sky-200/60 dark:border-sky-900/40">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                أو اكتب مادة التخصص إذا لم تكن في القائمة أعلاه:
              </label>
              <input
                type="text"
                value={customSubjectInput}
                onChange={(e) => {
                  setCustomSubjectInput(e.target.value);
                  if (e.target.value.trim()) {
                    setSpecializedSubject(e.target.value.trim());
                  }
                  setError(null);
                }}
                placeholder="مثال: الإعلام الآلي، هندسة الطرائق، لغة أجنبية..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          </div>

          {/* Privacy & Offline Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              يتم حفظ هذا الاختيار محلياً على جهازك دون حاجة للإنترنت، ولن يُطلب منك مجدداً. يمكنك تعديله لاحقاً من صفحة الإعدادات.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
          {!isFirstLaunch && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              خطوة أولى لتهيئة بيئة العمل البيداغوجية
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 flex items-center gap-2 mr-auto"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>{isFirstLaunch ? 'تأكيد وبدء الاستخدام' : 'حفظ إعدادات الطور والمادة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
