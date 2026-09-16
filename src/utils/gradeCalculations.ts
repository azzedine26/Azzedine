import { AssessmentItem, AssessmentType, CalculationFormula, StudentItem, Trimester, SubjectSetting } from '../types';
import { evaluateFormulaTokens, formatFormulaTokens, DEFAULT_FORMULA_TOKENS, DEFAULT_FORMULA_STRING } from './formulaParser';

/**
 * Normalizes any score to base 20 (Algerian standard scale)
 */
export function normalizeTo20(score: number, maxScore: number = 20): number {
  if (maxScore <= 0) return 0;
  const val = (score / maxScore) * 20;
  return Math.round(val * 100) / 100;
}

/**
 * Algerian educational system appraisals (ملاحظات وتقديرات المنظومة التربوية الجزائرية)
 */
export interface AlgerianAppraisal {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  colorHex: string;
  category: 'excellent' | 'very_good' | 'good' | 'fair' | 'pass' | 'below_average' | 'weak';
}

export function getAlgerianAppraisal(scoreOutOf20: number): AlgerianAppraisal {
  if (scoreOutOf20 >= 18) {
    return {
      label: 'ممتاز',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-300 dark:border-emerald-800',
      colorHex: '#059669',
      category: 'excellent',
    };
  }
  if (scoreOutOf20 >= 16) {
    return {
      label: 'جيد جداً',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/70',
      badgeText: 'text-teal-700 dark:text-teal-300',
      badgeBorder: 'border-teal-300 dark:border-teal-800',
      colorHex: '#0d9488',
      category: 'very_good',
    };
  }
  if (scoreOutOf20 >= 14) {
    return {
      label: 'جيد',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/70',
      badgeText: 'text-sky-700 dark:text-sky-300',
      badgeBorder: 'border-sky-300 dark:border-sky-800',
      colorHex: '#0284c7',
      category: 'good',
    };
  }
  if (scoreOutOf20 >= 12) {
    return {
      label: 'قريب من الجيد',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/70',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-300 dark:border-blue-800',
      colorHex: '#2563eb',
      category: 'fair',
    };
  }
  if (scoreOutOf20 >= 10) {
    return {
      label: 'متوسط (مقبول)',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/70',
      badgeText: 'text-amber-700 dark:text-amber-300',
      badgeBorder: 'border-amber-300 dark:border-amber-800',
      colorHex: '#d97706',
      category: 'pass',
    };
  }
  if (scoreOutOf20 >= 8) {
    return {
      label: 'دون المتوسط',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/70',
      badgeText: 'text-orange-700 dark:text-orange-300',
      badgeBorder: 'border-orange-300 dark:border-orange-800',
      colorHex: '#ea580c',
      category: 'below_average',
    };
  }
  return {
    label: 'ضعيف (يحتاج استدراك)',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/70',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    colorHex: '#e11d48',
    category: 'weak',
  };
}

export const PRIMARY_ASSESSMENT_TYPES: AssessmentType[] = ['continuous', 'test1', 'test2', 'exam'];

export const ASSESSMENT_TYPE_INFO: Record<
  AssessmentType,
  {
    label: string;
    shortLabel: string;
    colorBg: string;
    colorText: string;
    colorBorder: string;
    defaultCoeff: number;
  }
> = {
  continuous: {
    label: 'التقويم (المستمر)',
    shortLabel: 'التقويم',
    colorBg: 'bg-amber-100 dark:bg-amber-950/80',
    colorText: 'text-amber-800 dark:text-amber-300',
    colorBorder: 'border-amber-300 dark:border-amber-800',
    defaultCoeff: 1,
  },
  test1: {
    label: 'فرض 1 (الفرض الأول)',
    shortLabel: 'فرض 1',
    colorBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    colorText: 'text-emerald-800 dark:text-emerald-300',
    colorBorder: 'border-emerald-300 dark:border-emerald-800',
    defaultCoeff: 1,
  },
  test2: {
    label: 'فرض 2 (الفرض الثاني)',
    shortLabel: 'فرض 2',
    colorBg: 'bg-teal-100 dark:bg-teal-950/80',
    colorText: 'text-teal-800 dark:text-teal-300',
    colorBorder: 'border-teal-300 dark:border-teal-800',
    defaultCoeff: 1,
  },
  exam: {
    label: 'الاختبار (الفصلي)',
    shortLabel: 'الاختبار',
    colorBg: 'bg-purple-100 dark:bg-purple-950/80',
    colorText: 'text-purple-800 dark:text-purple-300',
    colorBorder: 'border-purple-300 dark:border-purple-800',
    defaultCoeff: 2,
  },
  test: {
    label: 'فرض محروس',
    shortLabel: 'فرض',
    colorBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    colorText: 'text-emerald-800 dark:text-emerald-300',
    colorBorder: 'border-emerald-300 dark:border-emerald-800',
    defaultCoeff: 1,
  },
  activity: {
    label: 'نشاط / أعمال تطبيقية',
    shortLabel: 'نشاط/أ.ت',
    colorBg: 'bg-sky-100 dark:bg-sky-950/80',
    colorText: 'text-sky-800 dark:text-sky-300',
    colorBorder: 'border-sky-300 dark:border-sky-800',
    defaultCoeff: 1,
  },
};

export const TRIMESTER_INFO: Record<Trimester, { label: string; short: string }> = {
  T1: { label: 'الفصل الأول', short: 'ف 1' },
  T2: { label: 'الفصل الثاني', short: 'ف 2' },
  T3: { label: 'الفصل الثالث', short: 'ف 3' },
};

export interface AssessmentGradeDetail {
  rawScore: number | null; // العلامة المتحصل عليها
  maxScore: number; // العدد الأقصى للتقييم (مثلاً 20 أو 40)
  normalizedScore: number | null; // العلامة المسواة من 20
  isAbsent?: boolean;
  note?: string;
  assessmentTitle?: string;
}

export interface SubjectCalculationDetailResult {
  averageOutOf20: number | null; // معدل المادة (من 20)
  rawAverageOutOf20?: number | null; // القيمة الأصلية الدقيقة لمعدل المادة قبل التقريب
  coefficient: number | null; // معامل المادة (المعامل الوحيد للمادة)
  weightedTotal: number | null; // النقطة بالمعامل = معدل المادة × معامل المادة (محسوبة بالقيمة الأصلية الدقيقة)
  appraisal: AlgerianAppraisal | null; // التقدير يتم تحديده اعتماداً على معدل المادة (/20) فقط
  methodName: string;
  methodFormula: string;
  calculationSteps: string[];
  continuous?: AssessmentGradeDetail;
  test1: AssessmentGradeDetail;
  test2: AssessmentGradeDetail;
  exam: AssessmentGradeDetail;
  completedCount: number;
}

/**
 * دالة حساب معدل المادة وفق "كيفية الحساب" أو "المعادلة المخصصة" المحددة في إعدادات المادة.
 * تأخذ بعين الاعتبار:
 * - المعامل واحد فقط للمادة (ويمكن استخدامه داخل المعادلة كمتغير ديناميكي)
 * - التقويم، فرض 1، فرض 2، والاختبار
 * - العلامة المتحصل عليها والعدد الأقصى لكل تقييم
 * - دعم بناء وتطبيق المعادلات المخصصة عبر Parser آمن
 */
export function calculateSubjectGrade(
  test1: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  test2: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  exam: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  subjectSetting?: SubjectSetting | null,
  continuous?: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string }
): SubjectCalculationDetailResult {
  const hasValidCoeff = typeof subjectSetting?.coefficient === 'number' && !isNaN(subjectSetting.coefficient) && subjectSetting.coefficient > 0;
  const coeff: number | null = hasValidCoeff ? (subjectSetting!.coefficient as number) : null;
  const config = subjectSetting?.calculationMethod || {
    method: 'tests_avg_plus_exam_x2_div_3',
    customTest1Weight: 1,
    customTest2Weight: 1,
    customExamWeight: 2,
    description: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
  };

  const contMax = continuous?.maxScore && continuous.maxScore > 0 ? continuous.maxScore : 20;
  // الفرض الأول والفرض الثاني دائماً رسمياً من 20 في المنظومة الجزائرية
  const t1Max = 20;
  const t2Max = 20;
  const exMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 20;

  const contRaw = continuous && typeof continuous.rawScore === 'number' && !isNaN(continuous.rawScore) && !continuous.isAbsent ? continuous.rawScore : null;
  const t1Raw = typeof test1.rawScore === 'number' && !isNaN(test1.rawScore) && !test1.isAbsent ? test1.rawScore : null;
  const t2Raw = typeof test2.rawScore === 'number' && !isNaN(test2.rawScore) && !test2.isAbsent ? test2.rawScore : null;
  const exRaw = typeof exam.rawScore === 'number' && !isNaN(exam.rawScore) && !exam.isAbsent ? exam.rawScore : null;

  const contNorm = contRaw !== null ? normalizeTo20(contRaw, contMax) : null;
  // العلامة المدخلة من 20 مباشرة (مثلاً 12 تعني 12/20 وليس 12/40، ولا تُقسم أو تُضاعف)
  const t1Norm = t1Raw !== null ? Math.round(t1Raw * 100) / 100 : null;
  const t2Norm = t2Raw !== null ? Math.round(t2Raw * 100) / 100 : null;
  const exNorm = exRaw !== null ? normalizeTo20(exRaw, exMax) : null;

  let completedCount = 0;
  if (contNorm !== null) completedCount++;
  if (t1Norm !== null) completedCount++;
  if (t2Norm !== null) completedCount++;
  if (exNorm !== null) completedCount++;

  const steps: string[] = [];
  let calculatedAvg: number | null = null;
  let methodName = 'معدل الفرضين + الاختبار مضاعف ÷ 3';
  let methodFormula = '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3';

  // عرض العلامات المتحصل عليها
  const scoresDisplayParts: string[] = [];
  if (contRaw !== null) {
    scoresDisplayParts.push(`التقويم: ${contRaw}/${contMax}${contMax !== 20 ? ` (المسواة: ${contNorm}/20)` : ''}`);
  } else if (continuous?.isAbsent) {
    scoresDisplayParts.push('التقويم: غائب');
  } else {
    scoresDisplayParts.push('التقويم: غير مدخل');
  }

  if (t1Raw !== null) {
    scoresDisplayParts.push(`الفرض الأول: ${t1Raw}/20`);
  } else if (test1.isAbsent) {
    scoresDisplayParts.push('الفرض الأول: غائب');
  } else {
    scoresDisplayParts.push('الفرض الأول: غير مدخل');
  }

  if (t2Raw !== null) {
    scoresDisplayParts.push(`الفرض الثاني: ${t2Raw}/20`);
  } else if (test2.isAbsent) {
    scoresDisplayParts.push('الفرض الثاني: غائب');
  } else {
    scoresDisplayParts.push('الفرض الثاني: غير مدخل');
  }

  if (exRaw !== null) {
    scoresDisplayParts.push(`الاختبار: ${exRaw}/${exMax}${exMax !== 20 ? ` (المسواة: ${exNorm}/20)` : ''}`);
  } else if (exam.isAbsent) {
    scoresDisplayParts.push('الاختبار: غائب');
  } else {
    scoresDisplayParts.push('الاختبار: غير مدخل');
  }

  steps.push(`النقاط المسجلة: ${scoresDisplayParts.join(' | ')}`);

  if (completedCount === 0) {
    steps.push('لا توجد علامات مدخلة لحساب المعدل.');
    return {
      averageOutOf20: null,
      coefficient: coeff,
      weightedTotal: null,
      appraisal: null,
      methodName,
      methodFormula,
      calculationSteps: steps,
      continuous: { rawScore: contRaw, maxScore: contMax, normalizedScore: contNorm, isAbsent: continuous?.isAbsent, note: continuous?.note, assessmentTitle: continuous?.title },
      test1: { rawScore: t1Raw, maxScore: 20, normalizedScore: t1Norm, isAbsent: test1.isAbsent, note: test1.note, assessmentTitle: test1.title },
      test2: { rawScore: t2Raw, maxScore: 20, normalizedScore: t2Norm, isAbsent: test2.isAbsent, note: test2.note, assessmentTitle: test2.title },
      exam: { rawScore: exRaw, maxScore: exMax, normalizedScore: exNorm, isAbsent: exam.isAbsent, note: exam.note, assessmentTitle: exam.title },
      completedCount,
    };
  }

  // Always evaluate the manual custom formula defined by the teacher (or default formula)
  const tokens = (config.customFormulaTokens && config.customFormulaTokens.length > 0)
    ? config.customFormulaTokens
    : DEFAULT_FORMULA_TOKENS;

  methodName = 'المعادلة اليدوية للمادة';
  methodFormula = config.customFormulaString || formatFormulaTokens(tokens) || DEFAULT_FORMULA_STRING;

  const evalResult = evaluateFormulaTokens(tokens, {
    continuous: contNorm,
    test1: t1Norm,
    test2: t2Norm,
    exam: exNorm,
    coefficient: coeff,
  });

  if (evalResult.value !== null) {
    calculatedAvg = evalResult.value;
    steps.push(...evalResult.steps);
  } else {
    steps.push(evalResult.error || 'تعذر حساب المعادلة نظراً لغياب بعض العلامات المطلوبة.');
  }

  const rawAvg = calculatedAvg !== null ? calculatedAvg : null;
  const finalAvg = calculatedAvg !== null ? Math.round(calculatedAvg * 100) / 100 : null;
  // النقطة بالمعامل = معدل المادة × معامل المادة (مع الاحتفاظ بالقيمة الدقيقة لمعدل المادة داخلياً لتجنب أخطاء التقريب)
  const weightedTotal = rawAvg !== null && coeff !== null ? Math.round(rawAvg * coeff * 100) / 100 : null;
  // التقدير يتم تحديده اعتماداً على معدل المادة (/20) فقط، وليس النقطة بالمعامل
  const appraisal = finalAvg !== null ? getAlgerianAppraisal(finalAvg) : null;

  if (finalAvg !== null) {
    steps.push(`الناتج النهائي لمعدل المادة (/20): ${finalAvg.toFixed(2)} / 20 (${appraisal?.label || ''})`);
    if (coeff !== null) {
      steps.push(`النقطة بالمعامل (${coeff}): ${rawAvg.toFixed(3)} × ${coeff} = ${weightedTotal?.toFixed(2)}`);
    } else {
      steps.push('معامل المادة غير محدد (لم يتم حساب النقطة بالمعامل).');
    }
  }

  return {
    averageOutOf20: finalAvg,
    rawAverageOutOf20: rawAvg,
    coefficient: coeff,
    weightedTotal,
    appraisal,
    methodName,
    methodFormula,
    calculationSteps: steps,
    continuous: { rawScore: contRaw, maxScore: contMax, normalizedScore: contNorm, isAbsent: continuous?.isAbsent, note: continuous?.note, assessmentTitle: continuous?.title },
    test1: { rawScore: t1Raw, maxScore: 20, normalizedScore: t1Norm, isAbsent: test1.isAbsent, note: test1.note, assessmentTitle: test1.title },
    test2: { rawScore: t2Raw, maxScore: 20, normalizedScore: t2Norm, isAbsent: test2.isAbsent, note: test2.note, assessmentTitle: test2.title },
    exam: { rawScore: exRaw, maxScore: exMax, normalizedScore: exNorm, isAbsent: exam.isAbsent, note: exam.note, assessmentTitle: exam.title },
    completedCount,
  };
}

export interface StudentCalculationResult {
  studentId: string;
  average: number | null; // Calculated out of 20 (معدل المادة / 20)
  rawAverage?: number | null; // القيمة الأصلية الدقيقة لمعدل المادة قبل التقريب
  weightedScore?: number | null; // النقطة بالمعامل = معدل المادة × معامل المادة
  appraisal: AlgerianAppraisal | null;
  completedCount: number;
  absentCount: number;
  scoresByAssessmentId: Record<string, { scoreOutOf20: number | null; rawScore: number | null; isAbsent?: boolean; note?: string }>;
  subjectCalculation?: SubjectCalculationDetailResult;
}

/**
 * Calculates a single student's subject average given a list of assessments and formula or subjectSetting
 */
export function calculateStudentAverage(
  studentId: string,
  assessments: AssessmentItem[],
  formula: CalculationFormula = 'weighted',
  subjectSetting?: SubjectSetting | null
): StudentCalculationResult {
  const scoresByAssessmentId: StudentCalculationResult['scoresByAssessmentId'] = {};
  let completedCount = 0;
  let absentCount = 0;

  // Identify Continuous, Test 1, Test 2, and Exam specifically
  let continuousAssessment: AssessmentItem | null = null;
  let test1Assessment: AssessmentItem | null = null;
  let test2Assessment: AssessmentItem | null = null;
  let examAssessment: AssessmentItem | null = null;

  assessments.forEach((assessment) => {
    const isTest1 = assessment.type === 'test1' || (assessment.title && (assessment.title.includes('الفرض الأول') || assessment.title.includes('فرض 1')));
    const isTest2 = assessment.type === 'test2' || (assessment.title && (assessment.title.includes('الفرض الثاني') || assessment.title.includes('فرض 2')));
    const isAnyTest = isTest1 || isTest2;
    const effectiveAssessmentMax = isAnyTest ? 20 : (assessment.maxScore || 20);

    const record = assessment.grades?.[studentId];
    if (record) {
      if (record.isAbsent) {
        absentCount++;
        scoresByAssessmentId[assessment.id] = {
          scoreOutOf20: null,
          rawScore: null,
          isAbsent: true,
          note: record.note,
        };
      } else if (typeof record.score === 'number' && !isNaN(record.score)) {
        completedCount++;
        // للفرض الأول والفرض الثاني: العلامة من 20 مباشرة ولا تقسم على 40
        const normalized = isAnyTest
          ? Math.round(record.score * 100) / 100
          : normalizeTo20(record.score, effectiveAssessmentMax);
        scoresByAssessmentId[assessment.id] = {
          scoreOutOf20: normalized,
          rawScore: record.score,
          isAbsent: false,
          note: record.note,
        };
      } else {
        scoresByAssessmentId[assessment.id] = {
          scoreOutOf20: null,
          rawScore: null,
          isAbsent: false,
          note: record.note,
        };
      }
    } else {
      scoresByAssessmentId[assessment.id] = {
        scoreOutOf20: null,
        rawScore: null,
        isAbsent: false,
      };
    }

    // Classify into continuous, test1, test2, exam
    if (assessment.type === 'continuous' || (assessment.title || '').includes('تقويم')) {
      if (!continuousAssessment) continuousAssessment = assessment;
    } else if (assessment.type === 'test1') {
      test1Assessment = assessment;
    } else if (assessment.type === 'test2') {
      test2Assessment = assessment;
    } else if (assessment.type === 'exam') {
      examAssessment = assessment;
    } else if (assessment.type === 'test') {
      const lowerTitle = assessment.title.toLowerCase();
      if (lowerTitle.includes('2') || lowerTitle.includes('ثان') || lowerTitle.includes('ثاني')) {
        if (!test2Assessment) test2Assessment = assessment;
      } else {
        if (!test1Assessment) test1Assessment = assessment;
        else if (!test2Assessment) test2Assessment = assessment;
      }
    }
  });

  // Calculate detailed subject grade
  const contRecord = continuousAssessment ? (continuousAssessment as AssessmentItem).grades?.[studentId] : undefined;
  const t1Record = test1Assessment ? (test1Assessment as AssessmentItem).grades?.[studentId] : undefined;
  const t2Record = test2Assessment ? (test2Assessment as AssessmentItem).grades?.[studentId] : undefined;
  const exRecord = examAssessment ? (examAssessment as AssessmentItem).grades?.[studentId] : undefined;

  const subjectDetail = calculateSubjectGrade(
    {
      rawScore: t1Record?.score,
      maxScore: 20, // الفرض الأول دائمًا من 20 رسمياً
      isAbsent: t1Record?.isAbsent,
      note: t1Record?.note,
      title: test1Assessment ? (test1Assessment as AssessmentItem).title : undefined,
    },
    {
      rawScore: t2Record?.score,
      maxScore: 20, // الفرض الثاني دائمًا من 20 رسمياً
      isAbsent: t2Record?.isAbsent,
      note: t2Record?.note,
      title: test2Assessment ? (test2Assessment as AssessmentItem).title : undefined,
    },
    {
      rawScore: exRecord?.score,
      maxScore: examAssessment ? (examAssessment as AssessmentItem).maxScore : 20,
      isAbsent: exRecord?.isAbsent,
      note: exRecord?.note,
      title: examAssessment ? (examAssessment as AssessmentItem).title : undefined,
    },
    subjectSetting,
    {
      rawScore: contRecord?.score,
      maxScore: continuousAssessment ? (continuousAssessment as AssessmentItem).maxScore : 20,
      isAbsent: contRecord?.isAbsent,
      note: contRecord?.note,
      title: continuousAssessment ? (continuousAssessment as AssessmentItem).title : undefined,
    }
  );

  const coeff = (typeof subjectDetail.coefficient === 'number' && subjectDetail.coefficient > 0)
    ? subjectDetail.coefficient
    : (subjectSetting?.coefficient || 1);
  const rawAvg = subjectDetail.rawAverageOutOf20 ?? subjectDetail.averageOutOf20;
  const weightedScore = subjectDetail.weightedTotal !== null && subjectDetail.weightedTotal !== undefined
    ? subjectDetail.weightedTotal
    : (rawAvg !== null ? Math.round(rawAvg * coeff * 100) / 100 : null);

  if (completedCount === 0) {
    return {
      studentId,
      average: null,
      rawAverage: null,
      weightedScore: null,
      appraisal: null,
      completedCount,
      absentCount,
      scoresByAssessmentId,
      subjectCalculation: subjectDetail,
    };
  }

  return {
    studentId,
    average: subjectDetail.averageOutOf20,
    rawAverage: rawAvg,
    weightedScore,
    appraisal: subjectDetail.appraisal,
    completedCount,
    absentCount,
    scoresByAssessmentId,
    subjectCalculation: subjectDetail,
  };
}

/**
 * Full Class Statistics & Ranks
 */
export interface ClassGradesReport {
  studentResults: (StudentCalculationResult & {
    student: StudentItem;
    rank: number | null;
  })[];
  classAverage: number | null;
  classWeightedAverage?: number | null;
  totalWeightedSum?: number | null;
  highestAverage: { value: number; studentName: string } | null;
  lowestAverage: { value: number; studentName: string } | null;
  passCount: number; // >= 10
  failCount: number; // < 10
  passRate: number; // percentage 0 - 100
  totalEvaluatedStudents: number;
  totalStudents: number;
}

export function computeClassGradesReport(
  students: StudentItem[],
  assessments: AssessmentItem[],
  formula: CalculationFormula = 'subject_method',
  subjectSetting?: SubjectSetting | null
): ClassGradesReport {
  const studentResultsWithoutRank = students.map((student) => {
    const res = calculateStudentAverage(student.id, assessments, formula, subjectSetting);
    return {
      ...res,
      student,
    };
  });

  // Calculate Ranks for students with valid average
  const evaluatedStudents = studentResultsWithoutRank
    .filter((s) => s.average !== null)
    .sort((a, b) => (b.average || 0) - (a.average || 0));

  const rankMap = new Map<string, number>();
  let currentRank = 1;
  evaluatedStudents.forEach((st, idx) => {
    if (idx > 0 && st.average === evaluatedStudents[idx - 1].average) {
      // Tie in rank
      rankMap.set(st.studentId, rankMap.get(evaluatedStudents[idx - 1].studentId) || currentRank);
    } else {
      currentRank = idx + 1;
      rankMap.set(st.studentId, currentRank);
    }
  });

  const finalStudentResults = studentResultsWithoutRank.map((s) => ({
    ...s,
    rank: rankMap.get(s.studentId) || null,
  }));

  // Summary Metrics
  const averagesList = evaluatedStudents.map((s) => s.average as number);
  const totalEvaluated = averagesList.length;

  let classAverage: number | null = null;
  let highestAverage: { value: number; studentName: string } | null = null;
  let lowestAverage: { value: number; studentName: string } | null = null;
  let passCount = 0;
  let failCount = 0;
  let passRate = 0;

  if (totalEvaluated > 0) {
    const sum = averagesList.reduce((acc, v) => acc + v, 0);
    classAverage = Math.round((sum / totalEvaluated) * 100) / 100;

    const top = evaluatedStudents[0];
    highestAverage = {
      value: top.average as number,
      studentName: `${top.student.firstName} ${top.student.lastName}`,
    };

    const bottom = evaluatedStudents[evaluatedStudents.length - 1];
    lowestAverage = {
      value: bottom.average as number,
      studentName: `${bottom.student.firstName} ${bottom.student.lastName}`,
    };

    passCount = averagesList.filter((a) => a >= 10).length;
    failCount = totalEvaluated - passCount;
    passRate = Math.round((passCount / totalEvaluated) * 100);
  }

  // Calculate class weighted totals
  const validWeighted = finalStudentResults
    .map((s) => s.weightedScore)
    .filter((w): w is number => typeof w === 'number' && !isNaN(w));
  let classWeightedAverage: number | null = null;
  let totalWeightedSum: number | null = null;
  if (validWeighted.length > 0) {
    totalWeightedSum = Math.round(validWeighted.reduce((a, b) => a + b, 0) * 100) / 100;
    classWeightedAverage = Math.round((totalWeightedSum / validWeighted.length) * 100) / 100;
  }

  return {
    studentResults: finalStudentResults,
    classAverage,
    classWeightedAverage,
    totalWeightedSum,
    highestAverage,
    lowestAverage,
    passCount,
    failCount,
    passRate,
    totalEvaluatedStudents: totalEvaluated,
    totalStudents: students.length,
  };
}

/**
 * Quick assessment statistics (for an individual assessment card)
 */
export function computeAssessmentStats(assessment: AssessmentItem, students: StudentItem[]): {
  average: number | null;
  gradedCount: number;
  absentCount: number;
  totalStudents: number;
  highestScore: number | null;
  lowestScore: number | null;
} {
  const classStudents = students.filter((s) => s.classId === assessment.classId);
  const validScores: number[] = [];
  let absentCount = 0;

  classStudents.forEach((student) => {
    const rec = assessment.grades?.[student.id];
    if (rec) {
      if (rec.isAbsent) {
        absentCount++;
      } else if (typeof rec.score === 'number' && !isNaN(rec.score)) {
        const isTest = assessment.type === 'test1' || assessment.type === 'test2' || (assessment.title && (assessment.title.includes('الفرض الأول') || assessment.title.includes('الفرض الثاني') || assessment.title.includes('فرض 1') || assessment.title.includes('فرض 2')));
        const effMax = isTest ? 20 : (assessment.maxScore || 20);
        validScores.push(isTest ? Math.round(rec.score * 100) / 100 : normalizeTo20(rec.score, effMax));
      }
    }
  });

  if (validScores.length === 0) {
    return {
      average: null,
      gradedCount: 0,
      absentCount,
      totalStudents: classStudents.length,
      highestScore: null,
      lowestScore: null,
    };
  }

  const sum = validScores.reduce((acc, v) => acc + v, 0);
  const avg = Math.round((sum / validScores.length) * 100) / 100;
  const highest = Math.max(...validScores);
  const lowest = Math.min(...validScores);

  return {
    average: avg,
    gradedCount: validScores.length,
    absentCount,
    totalStudents: classStudents.length,
    highestScore: highest,
    lowestScore: lowest,
  };
}
