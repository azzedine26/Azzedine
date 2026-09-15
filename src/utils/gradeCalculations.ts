import { AssessmentItem, AssessmentType, CalculationFormula, StudentItem, Trimester, SubjectSetting } from '../types';

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
  coefficient: number | null; // معامل المادة (المعامل الوحيد للمادة)
  weightedTotal: number | null; // معدل المادة × معامل المادة
  appraisal: AlgerianAppraisal | null;
  methodName: string;
  methodFormula: string;
  calculationSteps: string[];
  test1: AssessmentGradeDetail;
  test2: AssessmentGradeDetail;
  exam: AssessmentGradeDetail;
  completedCount: number;
}

/**
 * دالة حساب معدل المادة وفق "كيفية الحساب" المحددة في إعدادات المادة.
 * تأخذ بعين الاعتبار:
 * - المعامل واحد فقط للمادة
 * - فرض 1 وفرض 2 فقط
 * - اختبار واحد فقط
 * - لا يوجد فرض 3
 * - لا توجد معاملات للتقييمات
 * - العلامة المتحصل عليها والعدد الأقصى لكل تقييم
 */
export function calculateSubjectGrade(
  test1: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  test2: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  exam: { rawScore?: number | null; maxScore?: number; isAbsent?: boolean; note?: string; title?: string },
  subjectSetting?: SubjectSetting | null
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

  const t1Max = test1.maxScore && test1.maxScore > 0 ? test1.maxScore : 20;
  const t2Max = test2.maxScore && test2.maxScore > 0 ? test2.maxScore : 20;
  const exMax = exam.maxScore && exam.maxScore > 0 ? exam.maxScore : 20;

  const t1Raw = typeof test1.rawScore === 'number' && !isNaN(test1.rawScore) && !test1.isAbsent ? test1.rawScore : null;
  const t2Raw = typeof test2.rawScore === 'number' && !isNaN(test2.rawScore) && !test2.isAbsent ? test2.rawScore : null;
  const exRaw = typeof exam.rawScore === 'number' && !isNaN(exam.rawScore) && !exam.isAbsent ? exam.rawScore : null;

  const t1Norm = t1Raw !== null ? normalizeTo20(t1Raw, t1Max) : null;
  const t2Norm = t2Raw !== null ? normalizeTo20(t2Raw, t2Max) : null;
  const exNorm = exRaw !== null ? normalizeTo20(exRaw, exMax) : null;

  let completedCount = 0;
  if (t1Norm !== null) completedCount++;
  if (t2Norm !== null) completedCount++;
  if (exNorm !== null) completedCount++;

  const steps: string[] = [];
  let calculatedAvg: number | null = null;
  let methodName = 'معدل الفرضين + الاختبار مضاعف ÷ 3';
  let methodFormula = '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3';

  // خطوة 1: عرض العلامات المتحصل عليها والعدد الأقصى
  const scoresDisplayParts: string[] = [];
  if (t1Raw !== null) {
    scoresDisplayParts.push(`فرض 1: ${t1Raw}/${t1Max}${t1Max !== 20 ? ` (المسواة: ${t1Norm}/20)` : ''}`);
  } else if (test1.isAbsent) {
    scoresDisplayParts.push('فرض 1: غائب');
  } else {
    scoresDisplayParts.push('فرض 1: غير مدخل');
  }

  if (t2Raw !== null) {
    scoresDisplayParts.push(`فرض 2: ${t2Raw}/${t2Max}${t2Max !== 20 ? ` (المسواة: ${t2Norm}/20)` : ''}`);
  } else if (test2.isAbsent) {
    scoresDisplayParts.push('فرض 2: غائب');
  } else {
    scoresDisplayParts.push('فرض 2: غير مدخل');
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
      test1: { rawScore: t1Raw, maxScore: t1Max, normalizedScore: t1Norm, isAbsent: test1.isAbsent, note: test1.note, assessmentTitle: test1.title },
      test2: { rawScore: t2Raw, maxScore: t2Max, normalizedScore: t2Norm, isAbsent: test2.isAbsent, note: test2.note, assessmentTitle: test2.title },
      exam: { rawScore: exRaw, maxScore: exMax, normalizedScore: exNorm, isAbsent: exam.isAbsent, note: exam.note, assessmentTitle: exam.title },
      completedCount,
    };
  }

  switch (config.method) {
    case 'tests_avg_plus_exam_x2_div_3': {
      methodName = 'معدل الفرضين + الاختبار مضاعف ÷ 3';
      methodFormula = '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3';

      let testsAvg: number | null = null;
      if (t1Norm !== null && t2Norm !== null) {
        testsAvg = (t1Norm + t2Norm) / 2;
        steps.push(`متوسط الفرضين: (${t1Norm} + ${t2Norm}) ÷ 2 = ${testsAvg.toFixed(2)} / 20`);
      } else if (t1Norm !== null) {
        testsAvg = t1Norm;
        steps.push(`اعتماد نقطة الفرض الأول: ${t1Norm.toFixed(2)} / 20`);
      } else if (t2Norm !== null) {
        testsAvg = t2Norm;
        steps.push(`اعتماد نقطة الفرض الثاني: ${t2Norm.toFixed(2)} / 20`);
      }

      if (testsAvg !== null && exNorm !== null) {
        calculatedAvg = (testsAvg + exNorm * 2) / 3;
        steps.push(`تطبيق طريقة الحساب: (${testsAvg.toFixed(2)} + ${exNorm} × 2) ÷ 3 = (${testsAvg.toFixed(2)} + ${(exNorm * 2).toFixed(2)}) ÷ 3 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (testsAvg !== null) {
        calculatedAvg = testsAvg;
        steps.push(`غياب الاختبار: احتساب متوسط الفروض فقط = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (exNorm !== null) {
        calculatedAvg = exNorm;
        steps.push(`غياب الفروض: احتساب علامة الاختبار = ${calculatedAvg.toFixed(2)} / 20`);
      }
      break;
    }

    case 'tests_sum_plus_exam_x2_div_4': {
      methodName = 'مجموع الفرضين + الاختبار مضاعف ÷ 4';
      methodFormula = '(فرض 1 + فرض 2 + الاختبار × 2) ÷ 4';

      if (t1Norm !== null && t2Norm !== null && exNorm !== null) {
        calculatedAvg = (t1Norm + t2Norm + exNorm * 2) / 4;
        steps.push(`تطبيق طريقة الحساب: (${t1Norm} + ${t2Norm} + ${exNorm} × 2) ÷ 4 = ${(t1Norm + t2Norm + exNorm * 2).toFixed(2)} ÷ 4 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if ((t1Norm !== null || t2Norm !== null) && exNorm !== null) {
        const t = t1Norm !== null ? t1Norm : t2Norm!;
        calculatedAvg = (t + exNorm * 2) / 3;
        steps.push(`حساب بفرض واحد واختبار مضاعف: (${t} + ${exNorm} × 2) ÷ 3 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (t1Norm !== null && t2Norm !== null) {
        calculatedAvg = (t1Norm + t2Norm) / 2;
        steps.push(`حساب بفرضي المراقبة فقط: (${t1Norm} + ${t2Norm}) ÷ 2 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (exNorm !== null) {
        calculatedAvg = exNorm;
        steps.push(`حساب بعلامة الاختبار فقط: ${exNorm.toFixed(2)} / 20`);
      } else {
        calculatedAvg = t1Norm !== null ? t1Norm : t2Norm;
      }
      break;
    }

    case 'best_test_plus_exam_x2_div_3': {
      methodName = 'أفضل فرض + الاختبار مضاعف ÷ 3';
      methodFormula = '(الأعلى بين [فرض 1، فرض 2] + الاختبار × 2) ÷ 3';

      let bestTest: number | null = null;
      if (t1Norm !== null && t2Norm !== null) {
        bestTest = Math.max(t1Norm, t2Norm);
        steps.push(`اختيار الفرض الأفضل: الأعلى بين (${t1Norm}، ${t2Norm}) = ${bestTest} / 20`);
      } else if (t1Norm !== null) {
        bestTest = t1Norm;
        steps.push(`اعتماد الفرض المتاح: ${bestTest} / 20`);
      } else if (t2Norm !== null) {
        bestTest = t2Norm;
        steps.push(`اعتماد الفرض المتاح: ${bestTest} / 20`);
      }

      if (bestTest !== null && exNorm !== null) {
        calculatedAvg = (bestTest + exNorm * 2) / 3;
        steps.push(`تطبيق طريقة الحساب: (${bestTest} + ${exNorm} × 2) ÷ 3 = (${bestTest} + ${(exNorm * 2).toFixed(2)}) ÷ 3 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (bestTest !== null) {
        calculatedAvg = bestTest;
      } else if (exNorm !== null) {
        calculatedAvg = exNorm;
      }
      break;
    }

    case 'test1_only_plus_exam_x2_div_3': {
      methodName = 'فرض 1 فقط + الاختبار مضاعف ÷ 3';
      methodFormula = '(فرض 1 + الاختبار × 2) ÷ 3';

      const t1 = t1Norm !== null ? t1Norm : t2Norm; // fallback to test 2 if test 1 empty
      if (t1 !== null && exNorm !== null) {
        calculatedAvg = (t1 + exNorm * 2) / 3;
        steps.push(`تطبيق طريقة الحساب: (${t1} + ${exNorm} × 2) ÷ 3 = ${calculatedAvg.toFixed(2)} / 20`);
      } else if (t1 !== null) {
        calculatedAvg = t1;
        steps.push(`اعتماد علامة الفرض: ${t1.toFixed(2)} / 20`);
      } else if (exNorm !== null) {
        calculatedAvg = exNorm;
        steps.push(`اعتماد علامة الاختبار: ${exNorm.toFixed(2)} / 20`);
      }
      break;
    }

    case 'arithmetic_mean': {
      methodName = 'المتوسط الحسابي البسيط';
      methodFormula = '(فرض 1 + فرض 2 + الاختبار) ÷ 3';

      const validList: number[] = [];
      if (t1Norm !== null) validList.push(t1Norm);
      if (t2Norm !== null) validList.push(t2Norm);
      if (exNorm !== null) validList.push(exNorm);

      const sum = validList.reduce((acc, v) => acc + v, 0);
      calculatedAvg = validList.length > 0 ? sum / validList.length : null;
      steps.push(`المتوسط الحسابي: (${validList.join(' + ')}) ÷ ${validList.length} = ${calculatedAvg?.toFixed(2)} / 20`);
      break;
    }

    case 'custom_weights': {
      const w1 = config.customTest1Weight ?? 1;
      const w2 = config.customTest2Weight ?? 1;
      const w3 = config.customExamWeight ?? 2;
      methodName = 'أوزان مخصصة يحددها الأستاذ';
      methodFormula = `(فرض 1 × ${w1} + فرض 2 × ${w2} + اختبار × ${w3}) ÷ الأوزان`;

      let numerator = 0;
      let denominator = 0;
      const numTerms: string[] = [];

      if (t1Norm !== null) {
        numerator += t1Norm * w1;
        denominator += w1;
        numTerms.push(`${t1Norm} × ${w1}`);
      }
      if (t2Norm !== null) {
        numerator += t2Norm * w2;
        denominator += w2;
        numTerms.push(`${t2Norm} × ${w2}`);
      }
      if (exNorm !== null) {
        numerator += exNorm * w3;
        denominator += w3;
        numTerms.push(`${exNorm} × ${w3}`);
      }

      if (denominator > 0) {
        calculatedAvg = numerator / denominator;
        steps.push(`تطبيق الأوزان المخصصة: (${numTerms.join(' + ')}) ÷ ${denominator} = ${calculatedAvg.toFixed(2)} / 20`);
      }
      break;
    }

    default: {
      // Fallback to tests_avg_plus_exam_x2_div_3
      const testsAvg = t1Norm !== null && t2Norm !== null ? (t1Norm + t2Norm) / 2 : (t1Norm ?? t2Norm);
      if (testsAvg !== null && exNorm !== null) {
        calculatedAvg = (testsAvg + exNorm * 2) / 3;
      } else {
        calculatedAvg = testsAvg ?? exNorm;
      }
      break;
    }
  }

  const finalAvg = calculatedAvg !== null ? Math.round(calculatedAvg * 100) / 100 : null;
  const weightedTotal = finalAvg !== null && coeff !== null ? Math.round(finalAvg * coeff * 100) / 100 : null;
  const appraisal = finalAvg !== null ? getAlgerianAppraisal(finalAvg) : null;

  if (finalAvg !== null) {
    steps.push(`الناتج النهائي لمعدل المادة: ${finalAvg.toFixed(2)} / 20 (${appraisal?.label || ''})`);
    if (coeff !== null) {
      steps.push(`المجموع الموزون بمعامل المادة (${coeff}): ${finalAvg.toFixed(2)} × ${coeff} = ${weightedTotal?.toFixed(2)} نقطة`);
    } else {
      steps.push('معامل المادة غير محدد (لم يتم حساب المجموع الموزون).');
    }
  }

  return {
    averageOutOf20: finalAvg,
    coefficient: coeff,
    weightedTotal,
    appraisal,
    methodName,
    methodFormula,
    calculationSteps: steps,
    test1: { rawScore: t1Raw, maxScore: t1Max, normalizedScore: t1Norm, isAbsent: test1.isAbsent, note: test1.note, assessmentTitle: test1.title },
    test2: { rawScore: t2Raw, maxScore: t2Max, normalizedScore: t2Norm, isAbsent: test2.isAbsent, note: test2.note, assessmentTitle: test2.title },
    exam: { rawScore: exRaw, maxScore: exMax, normalizedScore: exNorm, isAbsent: exam.isAbsent, note: exam.note, assessmentTitle: exam.title },
    completedCount,
  };
}

export interface StudentCalculationResult {
  studentId: string;
  average: number | null; // Calculated out of 20
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

  // Identify Test 1, Test 2, and Exam specifically
  let test1Assessment: AssessmentItem | null = null;
  let test2Assessment: AssessmentItem | null = null;
  let examAssessment: AssessmentItem | null = null;

  assessments.forEach((assessment) => {
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
        const normalized = normalizeTo20(record.score, assessment.maxScore || 20);
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

    // Classify into test1, test2, exam (Strict constraint: NO test 3!)
    if (assessment.type === 'test1') {
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
  const t1Record = test1Assessment ? (test1Assessment as AssessmentItem).grades?.[studentId] : undefined;
  const t2Record = test2Assessment ? (test2Assessment as AssessmentItem).grades?.[studentId] : undefined;
  const exRecord = examAssessment ? (examAssessment as AssessmentItem).grades?.[studentId] : undefined;

  const subjectDetail = calculateSubjectGrade(
    {
      rawScore: t1Record?.score,
      maxScore: test1Assessment ? (test1Assessment as AssessmentItem).maxScore : 20,
      isAbsent: t1Record?.isAbsent,
      note: t1Record?.note,
      title: test1Assessment ? (test1Assessment as AssessmentItem).title : undefined,
    },
    {
      rawScore: t2Record?.score,
      maxScore: test2Assessment ? (test2Assessment as AssessmentItem).maxScore : 20,
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
    subjectSetting
  );

  if (completedCount === 0) {
    return {
      studentId,
      average: null,
      appraisal: null,
      completedCount,
      absentCount,
      scoresByAssessmentId,
      subjectCalculation: subjectDetail,
    };
  }

  // If subjectSetting is provided or formula is 'subject_method', use subjectDetail.averageOutOf20!
  if (subjectSetting || formula === 'subject_method') {
    return {
      studentId,
      average: subjectDetail.averageOutOf20,
      appraisal: subjectDetail.appraisal,
      completedCount,
      absentCount,
      scoresByAssessmentId,
      subjectCalculation: subjectDetail,
    };
  }

  let finalAverage: number | null = null;

  if (formula === 'arithmetic') {
    // Simple average of completed assessments
    let sum = 0;
    assessments.forEach((a) => {
      const scoreObj = scoresByAssessmentId[a.id];
      if (scoreObj && scoreObj.scoreOutOf20 !== null) {
        sum += scoreObj.scoreOutOf20;
      }
    });
    finalAverage = Math.round((sum / completedCount) * 100) / 100;
  } else if (formula === 'standard_algerian') {
    // Official Algerian Ministerial Formula:
    // Continuous = mean of continuous & activities
    // Tests = mean of tests
    // Exam = exam score * exam coeff (default 2 or its coeff)
    // Formula = (Continuous + Tests + Exam * 2) / (1 + 1 + 2)
    const continuousScores: number[] = [];
    const testScores: number[] = [];
    let examScore: number | null = null;
    let examCoeff = 2;

    assessments.forEach((a) => {
      const scoreObj = scoresByAssessmentId[a.id];
      if (scoreObj && scoreObj.scoreOutOf20 !== null) {
        if (a.type === 'continuous' || a.type === 'activity') {
          continuousScores.push(scoreObj.scoreOutOf20);
        } else if (a.type === 'test') {
          testScores.push(scoreObj.scoreOutOf20);
        } else if (a.type === 'exam') {
          examScore = scoreObj.scoreOutOf20;
          examCoeff = (typeof a.coefficient === 'number' && a.coefficient > 0) ? a.coefficient : 2;
        }
      }
    });

    let numerator = 0;
    let denominator = 0;

    if (continuousScores.length > 0) {
      const contAvg = continuousScores.reduce((acc, v) => acc + v, 0) / continuousScores.length;
      numerator += contAvg * 1;
      denominator += 1;
    }

    if (testScores.length > 0) {
      const testAvg = testScores.reduce((acc, v) => acc + v, 0) / testScores.length;
      numerator += testAvg * 1;
      denominator += 1;
    }

    if (examScore !== null) {
      numerator += examScore * examCoeff;
      denominator += examCoeff;
    }

    if (denominator > 0) {
      finalAverage = Math.round((numerator / denominator) * 100) / 100;
    } else {
      // fallback to weighted
      let weightedSum = 0;
      let coeffSum = 0;
      assessments.forEach((a) => {
        const scoreObj = scoresByAssessmentId[a.id];
        if (scoreObj && scoreObj.scoreOutOf20 !== null) {
          const c = a.coefficient > 0 ? a.coefficient : 1;
          weightedSum += scoreObj.scoreOutOf20 * c;
          coeffSum += c;
        }
      });
      finalAverage = coeffSum > 0 ? Math.round((weightedSum / coeffSum) * 100) / 100 : null;
    }
  } else {
    // 'weighted' (default & flexible)
    let weightedSum = 0;
    let coeffSum = 0;

    assessments.forEach((a) => {
      const scoreObj = scoresByAssessmentId[a.id];
      if (scoreObj && scoreObj.scoreOutOf20 !== null) {
        const c = a.coefficient > 0 ? a.coefficient : 1;
        weightedSum += scoreObj.scoreOutOf20 * c;
        coeffSum += c;
      }
    });

    finalAverage = coeffSum > 0 ? Math.round((weightedSum / coeffSum) * 100) / 100 : null;
  }

  const appraisal = finalAverage !== null ? getAlgerianAppraisal(finalAverage) : null;

  return {
    studentId,
    average: finalAverage,
    appraisal,
    completedCount,
    absentCount,
    scoresByAssessmentId,
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

  return {
    studentResults: finalStudentResults,
    classAverage,
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
        validScores.push(normalizeTo20(rec.score, assessment.maxScore || 20));
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
