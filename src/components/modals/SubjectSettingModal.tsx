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
  ArrowRight,
  Delete,
  RotateCcw,
  Plus,
  AlertCircle,
  Hash,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { 
  SubjectSetting, 
  SubjectCalculationMethodType, 
  SubjectCalculationConfig,
  FormulaToken 
} from '../../types';
import { 
  SUBJECT_CALCULATION_METHODS, 
  COMMON_SUBJECTS 
} from '../../data/algerianData';
import { calculateSubjectGrade } from '../../utils/gradeCalculations';
import { 
  FORMULA_COMPONENTS_LIST, 
  FORMULA_PRESETS, 
  validateFormula, 
  evaluateFormulaTokens, 
  formatFormulaTokens,
  ComponentId
} from '../../utils/formulaParser';

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
  const [coefficient, setCoefficient] = useState<number | string>(2);
  const [selectedMethod, setSelectedMethod] = useState<SubjectCalculationMethodType>('custom_formula');
  
  // Formula builder tokens
  const [formulaTokens, setFormulaTokens] = useState<FormulaToken[]>([
    { type: 'parenthesis', value: '(', label: '(' },
    { type: 'component', value: 'continuous', label: 'التقويم' },
    { type: 'operator', value: '+', label: '+' },
    { type: 'component', value: 'test1', label: 'فرض 1' },
    { type: 'operator', value: '+', label: '+' },
    { type: 'component', value: 'test2', label: 'فرض 2' },
    { type: 'operator', value: '+', label: '+' },
    { type: 'component', value: 'exam', label: 'الاختبار' },
    { type: 'operator', value: '*', label: '×' },
    { type: 'number', value: '2', label: '2' },
    { type: 'parenthesis', value: ')', label: ')' },
    { type: 'operator', value: '/', label: '÷' },
    { type: 'number', value: '5', label: '5' },
  ]);

  // Custom number manual input state
  const [customNumberInput, setCustomNumberInput] = useState<string>('');

  // Interactive Live Preview / Test Simulator
  const [simContinuousScore, setSimContinuousScore] = useState<number | string>(16);
  const [simTest1Score, setSimTest1Score] = useState<number | string>(14);
  const [simTest2Score, setSimTest2Score] = useState<number | string>(15);
  const [simExamScore, setSimExamScore] = useState<number | string>(15.5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'presets'>('calculator');

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setCoefficient(
        typeof editingSubject.coefficient === 'number' && !isNaN(editingSubject.coefficient)
          ? editingSubject.coefficient
          : ''
      );
      if (editingSubject.calculationMethod) {
        setSelectedMethod(editingSubject.calculationMethod.method || 'custom_formula');
        if (editingSubject.calculationMethod.customFormulaTokens && editingSubject.calculationMethod.customFormulaTokens.length > 0) {
          setFormulaTokens(editingSubject.calculationMethod.customFormulaTokens);
        } else {
          // Default to comprehensive preset
          const preset = FORMULA_PRESETS[0];
          setFormulaTokens(preset.tokens);
        }
      }
    } else {
      setName('');
      setCoefficient(2);
      setSelectedMethod('custom_formula');
      setFormulaTokens(FORMULA_PRESETS[0].tokens);
    }
  }, [editingSubject, isOpen]);

  // Safe parsing helper for scores
  const parseSimScore = (val: number | string): number | null => {
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string' && val.trim() === '') return null;
    const parsed = parseFloat(String(val).trim());
    return isNaN(parsed) ? null : Math.max(0, Math.min(20, parsed));
  };

  const parsedCoeff: number | null = typeof coefficient === 'number'
    ? (!isNaN(coefficient) && coefficient > 0 ? coefficient : null)
    : (typeof coefficient === 'string' && coefficient.trim() !== '' && !isNaN(parseFloat(coefficient)) && parseFloat(coefficient) > 0 ? parseFloat(coefficient) : null);

  // Validation
  const validation = validateFormula(formulaTokens);
  const formulaStringDisplay = formatFormulaTokens(formulaTokens);

  // Token adding helpers
  const handleAddComponent = (component: typeof FORMULA_COMPONENTS_LIST[number]) => {
    setFormulaTokens((prev) => [
      ...prev,
      {
        type: 'component',
        value: component.id,
        label: component.label,
      },
    ]);
  };

  const handleAddOperator = (op: '+' | '-' | '*' | '/') => {
    const label = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : '+';
    setFormulaTokens((prev) => [
      ...prev,
      {
        type: 'operator',
        value: op,
        label,
      },
    ]);
  };

  const handleAddParenthesis = (p: '(' | ')') => {
    setFormulaTokens((prev) => [
      ...prev,
      {
        type: 'parenthesis',
        value: p,
        label: p,
      },
    ]);
  };

  const handleAddNumber = (numStr: string) => {
    if (!numStr || numStr.trim() === '') return;
    setFormulaTokens((prev) => [
      ...prev,
      {
        type: 'number',
        value: numStr.trim(),
        label: numStr.trim(),
      },
    ]);
    setCustomNumberInput('');
  };

  const handleRemoveLastToken = () => {
    setFormulaTokens((prev) => prev.slice(0, -1));
  };

  const handleRemoveTokenAtIndex = (index: number) => {
    setFormulaTokens((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearFormula = () => {
    setFormulaTokens([]);
  };

  const handleSelectPreset = (preset: typeof FORMULA_PRESETS[number]) => {
    setFormulaTokens(preset.tokens);
    setSelectedMethod('custom_formula');
    setActiveTab('calculator');
  };

  // Build current SubjectSetting candidate for live simulation
  const currentCalculationConfig: SubjectCalculationConfig = {
    method: selectedMethod,
    customFormulaTokens: formulaTokens,
    customFormulaString: formulaStringDisplay,
    description: formulaStringDisplay || 'معادلة مخصصة',
  };

  const dummySubjectSetting: SubjectSetting = {
    id: editingSubject?.id || 'sim_subject',
    name: name || 'المادة',
    coefficient: parsedCoeff,
    calculationMethod: currentCalculationConfig,
  };

  // Real-time calculation result
  const liveResult = calculateSubjectGrade(
    { rawScore: parseSimScore(simTest1Score), maxScore: 20 },
    { rawScore: parseSimScore(simTest2Score), maxScore: 20 },
    { rawScore: parseSimScore(simExamScore), maxScore: 20 },
    dummySubjectSetting,
    { rawScore: parseSimScore(simContinuousScore), maxScore: 20 }
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة اسم المادة');
      return;
    }

    if (!validation.isValid) {
      alert(`يرجى تصحيح المعادلة قبل الحفظ:\n${validation.error}`);
      return;
    }

    const payload: SubjectSetting = {
      id: editingSubject?.id || `subj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      coefficient: parsedCoeff,
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
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingSubject ? 'تعديل إعدادات المادة وبناء المعادلة' : 'إضافة مادة وبناء معادلة المعدل'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحديد اسم المادة، المعامل المحفوظ، وبناء طريقة حساب المعدل بالآلة الحاسبة التفاعلية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-5 space-y-5 max-h-[78vh] overflow-y-auto">
            
            {/* 1. Subject Name & Unified Coefficient */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
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
                    className="w-full h-11 px-3.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <datalist id="subjects-datalist">
                    {COMMON_SUBJECTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>معامل المادة</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">(إعداد محفوظ)</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max="10"
                    placeholder="—"
                    value={coefficient}
                    onChange={(e) => setCoefficient(e.target.value)}
                    className="w-full h-11 px-2 text-center rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 text-sm font-black focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    title="معامل المادة الخاص بها"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCoefficient(num)}
                        className={`w-7 h-11 rounded-lg border text-xs font-bold transition ${
                          Number(coefficient) === num
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  معامل المادة خاص بالمادة ومحفوظ معها ويُعتمد لحساب المجموع والنقاط بالمعامل والمعدل العام.
                </span>
              </div>
            </div>

            {/* 2. Formula Builder Header & Tabs */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>طريقة حساب معدل المادة (محرر المعادلة)</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('calculator')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === 'calculator'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>الآلة الحاسبة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === 'presets'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>قوالب جاهزة ({FORMULA_PRESETS.length})</span>
                  </button>
                </div>
              </div>

              {activeTab === 'presets' && (
                /* Preset Templates Selection */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
                  {FORMULA_PRESETS.map((p) => {
                    const isMatchesCurrent = formatFormulaTokens(p.tokens) === formulaStringDisplay;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                          isMatchesCurrent
                            ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {p.badge}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 text-center my-1.5 dir-ltr">
                            {p.formulaString}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {p.description}
                          </p>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 mr-2 flex items-center gap-0.5">
                            تطبيق القالب ←
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. The Calculator & Formula Screen */}
              <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-900 dark:bg-slate-950 p-4 shadow-inner space-y-3">
                {/* Equation Screen Display */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">شاشة المعادلة:</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {formulaTokens.length} عنصر
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveLastToken}
                      disabled={formulaTokens.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      title="حذف آخر عنصر مضاف (تراجع)"
                    >
                      <Delete className="w-3.5 h-3.5" />
                      <span>تراجع ⌫</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFormula}
                      disabled={formulaTokens.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-300 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      title="مسح المعادلة بالكامل"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>مسح C</span>
                    </button>
                  </div>
                </div>

                {/* Tokens Visual Sequence */}
                <div className="min-h-[64px] bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 flex flex-wrap items-center gap-1.5 text-right dir-rtl">
                  {formulaTokens.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      المعادلة فارغة، اضغط على أزرار المكونات والعمليات الحسابية أدناه لبنائها...
                    </span>
                  ) : (
                    formulaTokens.map((t, idx) => {
                      if (t.type === 'component') {
                        const isCoeff = t.value === 'coefficient';
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRemoveTokenAtIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-xs transition group flex items-center gap-1 ${
                              isCoeff
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : t.value === 'continuous'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : t.value === 'test1'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : t.value === 'test2'
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                            title="انقر لحذف هذا العنصر"
                          >
                            <span>{t.label}</span>
                            {isCoeff && (
                              <span className="text-[10px] opacity-80 font-mono">
                                ({parsedCoeff ?? '؟'})
                              </span>
                            )}
                            <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          </button>
                        );
                      }
                      if (t.type === 'operator') {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRemoveTokenAtIndex(idx)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-sm flex items-center justify-center transition group shadow-xs"
                            title="انقر لحذف هذه العملية"
                          >
                            <span>{t.label}</span>
                          </button>
                        );
                      }
                      if (t.type === 'parenthesis') {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRemoveTokenAtIndex(idx)}
                            className="w-7 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-black text-sm flex items-center justify-center transition shadow-xs"
                            title="انقر لحذف القوس"
                          >
                            <span>{t.label}</span>
                          </button>
                        );
                      }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRemoveTokenAtIndex(idx)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-black text-xs flex items-center gap-1 transition shadow-xs"
                          title="انقر لحذف هذا الرقم"
                        >
                          <span>{t.label}</span>
                          <X className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Validation Banner Indicator */}
                <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                  validation.isValid
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>
                      {validation.isValid
                        ? 'صيغة المعادلة الحسابية صحيحة وجاهزة للتطبيق'
                        : validation.error}
                    </span>
                  </div>
                  {validation.warning && (
                    <span className="text-[10px] text-amber-300 font-normal">
                      {validation.warning}
                    </span>
                  )}
                </div>

                {/* 4. Calculator Keypad Controls */}
                <div className="space-y-2.5 pt-1">
                  
                  {/* Row 1: Ready Assessment Components */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                      1. مكونات العلامات (اضغط لإدراج المكون في المعادلة):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FORMULA_COMPONENTS_LIST.map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => handleAddComponent(comp)}
                          className={`p-2.5 rounded-xl border text-xs font-black transition active:scale-95 flex flex-col items-center justify-center gap-1 shadow-xs ${
                            comp.id === 'continuous'
                              ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
                              : comp.id === 'test1'
                              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                              : comp.id === 'test2'
                              ? 'bg-teal-600 hover:bg-teal-500 border-teal-500 text-white'
                              : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white'
                          }`}
                        >
                          <span className="text-xs">{comp.label}</span>
                          <span className="text-[10px] opacity-80 font-normal">
                            علامة من 20
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Operators & Numbers Keypad Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                    
                    {/* Operators & Parentheses */}
                    <div className="sm:col-span-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        2. العمليات الحسابية والأقواس:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddOperator('+')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-black text-lg transition active:scale-95 flex items-center justify-center"
                          title="عملية الجمع (+)"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOperator('-')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-black text-lg transition active:scale-95 flex items-center justify-center"
                          title="عملية الطرح (−)"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOperator('*')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-black text-lg transition active:scale-95 flex items-center justify-center"
                          title="عملية الضرب (×)"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOperator('/')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-black text-lg transition active:scale-95 flex items-center justify-center"
                          title="عملية القسمة (÷)"
                        >
                          ÷
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddParenthesis('(')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-black text-base transition active:scale-95 flex items-center justify-center"
                          title="قوس فتح ("
                        >
                          (
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddParenthesis(')')}
                          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-black text-base transition active:scale-95 flex items-center justify-center"
                          title="قوس إغلاق )"
                        >
                          )
                        </button>
                      </div>
                    </div>

                    {/* Numbers Keypad */}
                    <div className="sm:col-span-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        3. الأرقام والأوزان:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '0.5'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAddNumber(num)}
                            className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/80 font-mono font-bold text-xs transition active:scale-95 flex items-center justify-center"
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      {/* Custom Number Adder */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="number"
                          step="any"
                          value={customNumberInput}
                          onChange={(e) => setCustomNumberInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNumber(customNumberInput);
                            }
                          }}
                          placeholder="رقم آخر (مثلاً: 1.5)"
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNumber(customNumberInput)}
                          disabled={!customNumberInput.trim()}
                          className="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* 4. Interactive Live Simulator: "وأن يظهر له الناتج بوضوح" */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      محاكي وتجربة المعادلة (نتائج حية وفورية)
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      يختبر المعادلة بالعلامات المدخلة أدناه ويعرض خطوات الحساب والمجموع الموزون
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  تحديث تلقائي
                </span>
              </div>

              {/* Sample Grades Inputs for the 4 Algerian Components */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Continuous */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 text-center">
                    التقويم
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={simContinuousScore}
                      onChange={(e) => setSimContinuousScore(e.target.value)}
                      className="w-16 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                      title="التقويم المستمر"
                    />
                    <span className="text-xs text-slate-400 font-bold">/ 20</span>
                  </div>
                </div>

                {/* Test 1 */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1 text-center">
                    الفرض الأول
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={simTest1Score}
                      onChange={(e) => setSimTest1Score(e.target.value)}
                      className="w-16 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                      title="الفرض الأول"
                    />
                    <span className="text-xs text-slate-400 font-bold">/ 20</span>
                  </div>
                </div>

                {/* Test 2 */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/60">
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block mb-1 text-center">
                    الفرض الثاني
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={simTest2Score}
                      onChange={(e) => setSimTest2Score(e.target.value)}
                      className="w-16 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-teal-500"
                      title="الفرض الثاني"
                    />
                    <span className="text-xs text-slate-400 font-bold">/ 20</span>
                  </div>
                </div>

                {/* Exam */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 block mb-1 text-center">
                    الاختبار
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={simExamScore}
                      onChange={(e) => setSimExamScore(e.target.value)}
                      className="w-16 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                      title="الاختبار الفصلي"
                    />
                    <span className="text-xs text-slate-400 font-bold">/ 20</span>
                  </div>
                </div>
              </div>

              {/* Calculated Results Panel (CLEAR AND PROMINENT) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 shadow-xs">
                <div className="text-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">معدل المادة الناتج (من 20):</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {liveResult.averageOutOf20 !== null ? liveResult.averageOutOf20.toFixed(2) : '—'}
                  </span>
                </div>

                {/* Calculation Breakdown Steps */}
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                    خطوات التعويض والحساب:
                  </span>
                  {liveResult.calculationSteps.map((step, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 font-mono">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-800/50">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {validation.isValid ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  المعادلة جاهزة للحفظ
                </span>
              ) : (
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  يرجى ضبط المعادلة
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !validation.isValid}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الحفظ...' : editingSubject ? 'حفظ تعديلات المادة' : 'إضافة المادة'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
