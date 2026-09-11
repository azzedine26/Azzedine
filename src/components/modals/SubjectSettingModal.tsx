import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  Sliders, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  SubjectSetting, 
  SubjectCalculationMethodType, 
  SubjectCalculationConfig 
} from '../../types';
import { 
  SUBJECT_CALCULATION_METHODS, 
  COMMON_SUBJECTS 
} from '../../data/algerianData';
import { calculateSubjectGrade } from '../../utils/gradeCalculations';

interface SubjectSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setting: SubjectSetting) => Promise<void>;
  editingSubject?: SubjectSetting | null;
}

export const SubjectSettingModal: React.FC<SubjectSettingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSubject,
}) => {
  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState<number>(2);
  const [selectedMethod, setSelectedMethod] = useState<SubjectCalculationMethodType>('tests_avg_plus_exam_x2_div_3');
  const [customTest1Weight, setCustomTest1Weight] = useState<number>(1);
  const [customTest2Weight, setCustomTest2Weight] = useState<number>(1);
  const [customExamWeight, setCustomExamWeight] = useState<number>(2);

  // Interactive Live Preview / Test Simulator
  const [simTest1Score, setSimTest1Score] = useState<number>(14);
  const [simTest1Max, setSimTest1Max] = useState<number>(20);
  const [simTest2Score, setSimTest2Score] = useState<number>(16);
  const [simTest2Max, setSimTest2Max] = useState<number>(20);
  const [simExamScore, setSimExamScore] = useState<number>(15);
  const [simExamMax, setSimExamMax] = useState<number>(20);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setCoefficient(editingSubject.coefficient || 1);
      if (editingSubject.calculationMethod) {
        setSelectedMethod(editingSubject.calculationMethod.method);
        setCustomTest1Weight(editingSubject.calculationMethod.customTest1Weight ?? 1);
        setCustomTest2Weight(editingSubject.calculationMethod.customTest2Weight ?? 1);
        setCustomExamWeight(editingSubject.calculationMethod.customExamWeight ?? 2);
      }
    } else {
      setName('');
      setCoefficient(2);
      setSelectedMethod('tests_avg_plus_exam_x2_div_3');
      setCustomTest1Weight(1);
      setCustomTest2Weight(1);
      setCustomExamWeight(2);
    }
  }, [editingSubject, isOpen]);

  // Build current SubjectSetting candidate for live simulation
  const currentCalculationConfig: SubjectCalculationConfig = {
    method: selectedMethod,
    customTest1Weight: customTest1Weight > 0 ? customTest1Weight : 1,
    customTest2Weight: customTest2Weight > 0 ? customTest2Weight : 1,
    customExamWeight: customExamWeight > 0 ? customExamWeight : 2,
    description: SUBJECT_CALCULATION_METHODS.find((m) => m.id === selectedMethod)?.formula,
  };

  const dummySubjectSetting: SubjectSetting = {
    id: editingSubject?.id || 'sim_subject',
    name: name || 'المادة',
    coefficient: coefficient > 0 ? coefficient : 1,
    calculationMethod: currentCalculationConfig,
  };

  // Real-time calculation result
  const liveResult = calculateSubjectGrade(
    { rawScore: simTest1Score, maxScore: simTest1Max },
    { rawScore: simTest2Score, maxScore: simTest2Max },
    { rawScore: simExamScore, maxScore: simExamMax },
    dummySubjectSetting
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة اسم المادة');
      return;
    }
    if (coefficient <= 0) {
      alert('معامل المادة يجب أن يكون أكبر من الصفر');
      return;
    }

    const payload: SubjectSetting = {
      id: editingSubject?.id || `subj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      coefficient: Number(coefficient),
      calculationMethod: currentCalculationConfig,
      createdAt: editingSubject?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ إعدادات المادة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingSubject ? 'تعديل إعدادات المادة وكيفية الحساب' : 'إضافة إعداد مادة جديدة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديد اسم المادة، المعامل الواحد، وخانة كيفية الحساب المعتمدة
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

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
            
            {/* 1. Subject Name and Coefficient */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المادة <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="subjects-datalist"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: الرياضيات، علوم الطبيعة والحياة..."
                    required
                    className="w-full h-10 px-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <datalist id="subjects-datalist">
                    {COMMON_SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    معامل المادة <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">معامل واحد فقط</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max="10"
                    value={coefficient}
                    onChange={(e) => setCoefficient(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCoefficient(num)}
                        className={`w-7 h-10 rounded-lg border text-xs font-bold transition ${
                          coefficient === num
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Pedagogy Rules Banner */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>شروط ومعايير منظومة التقويم:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800 dark:text-amber-300 pr-1">
                <li><strong>المعامل واحد فقط للمادة:</strong> لا توجد معاملات فرعية للتقييمات.</li>
                <li><strong>يوجد فرض 1 وفرض 2 فقط:</strong> لا يوجد فرض 3.</li>
                <li><strong>يوجد اختبار واحد فقط:</strong> يتم إجراء اختبار واحد في الفصل.</li>
                <li><strong>العلامة المتحصل عليها والعدد الأقصى:</strong> مسجلة لكل تقييم (افتراضياً على 20).</li>
              </ul>
            </div>

            {/* 2. Calculation Method (كيفية الحساب) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>خانة «كيفية الحساب» لمعدل المادة <span className="text-rose-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showExplanation ? 'إخفاء الشرح' : 'دليل طرق الحساب'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUBJECT_CALCULATION_METHODS.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.title}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 text-center my-1.5 dir-ltr">
                          {m.formula}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {m.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Custom weights inputs if custom_weights is chosen */}
              {selectedMethod === 'custom_weights' && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    حدد أوزان التقييمات في طريقة الحساب:
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">وزن فرض 1:</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        max="10"
                        value={customTest1Weight}
                        onChange={(e) => setCustomTest1Weight(parseFloat(e.target.value) || 1)}
                        className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">وزن فرض 2:</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        max="10"
                        value={customTest2Weight}
                        onChange={(e) => setCustomTest2Weight(parseFloat(e.target.value) || 1)}
                        className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">وزن الاختبار:</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        max="10"
                        value={customExamWeight}
                        onChange={(e) => setCustomExamWeight(parseFloat(e.target.value) || 2)}
                        className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Interactive Live Simulator: "وأن يظهر له الناتج بوضوح" */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      محاكي وعارض النتيجة المباشرة
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      يظهر ناتج كيفية الحساب مباشرة وخطوة بخطوة
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  تحديث فوري
                </span>
              </div>

              {/* Sample Grades Inputs */}
              <div className="grid grid-cols-3 gap-2">
                {/* Test 1 */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1 text-center">
                    فرض 1
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={simTest1Max}
                      step="0.25"
                      value={simTest1Score}
                      onChange={(e) => setSimTest1Score(parseFloat(e.target.value) || 0)}
                      className="w-14 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-400">/</span>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={simTest1Max}
                      onChange={(e) => setSimTest1Max(parseInt(e.target.value) || 20)}
                      className="w-10 h-8 text-center text-[10px] text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Test 2 */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block mb-1 text-center">
                    فرض 2
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={simTest2Max}
                      step="0.25"
                      value={simTest2Score}
                      onChange={(e) => setSimTest2Score(parseFloat(e.target.value) || 0)}
                      className="w-14 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-400">/</span>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={simTest2Max}
                      onChange={(e) => setSimTest2Max(parseInt(e.target.value) || 20)}
                      className="w-10 h-8 text-center text-[10px] text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Exam */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 block mb-1 text-center">
                    الاختبار
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={simExamMax}
                      step="0.25"
                      value={simExamScore}
                      onChange={(e) => setSimExamScore(parseFloat(e.target.value) || 0)}
                      className="w-14 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-400">/</span>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={simExamMax}
                      onChange={(e) => setSimExamMax(parseInt(e.target.value) || 20)}
                      className="w-10 h-8 text-center text-[10px] text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Results Panel (CLEAR AND PROMINENT) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">معدل المادة (من 20):</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {liveResult.averageOutOf20?.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">المعامل الوحيد للمادة:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      × {liveResult.coefficient}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">المجموع (المعدل × المعامل):</span>
                    <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                      {liveResult.weightedTotal?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Calculation Breakdown Steps */}
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                    خطوات الحساب التوضيحية:
                  </span>
                  {liveResult.calculationSteps.map((step, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/80 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : editingSubject ? 'حفظ تعديلات المادة' : 'إضافة المادة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
