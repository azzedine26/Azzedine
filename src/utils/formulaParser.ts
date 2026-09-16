import { AssessmentType } from '../types';

export type TokenType = 'component' | 'operator' | 'parenthesis' | 'number';
export type ComponentId = 'continuous' | 'test1' | 'test2' | 'exam' | 'coefficient';

export interface FormulaToken {
  type: TokenType;
  value: string; // 'continuous' | 'test1' | 'test2' | 'exam' | 'coefficient' | '+' | '-' | '*' | '/' | '(' | ')' | string numbers like '2', '5', '0.5'
  label: string; // e.g. 'التقويم', 'فرض 1', 'فرض 2', 'الاختبار', 'معامل المادة', '+', '−', '×', '÷', '(', ')'
}

export interface FormulaComponentMeta {
  id: ComponentId;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  colorHex: string;
  description: string;
}

export const FORMULA_COMPONENTS_LIST: FormulaComponentMeta[] = [
  {
    id: 'continuous',
    label: 'التقويم',
    shortLabel: 'التقويم',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    colorHex: '#d97706',
    description: 'علامة المراقبة المستمرة والتقويم التكويني (من 20)',
  },
  {
    id: 'test1',
    label: 'فرض 1',
    shortLabel: 'فرض 1',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    colorHex: '#059669',
    description: 'علامة الفرض المحروس الأول (من 20)',
  },
  {
    id: 'test2',
    label: 'فرض 2',
    shortLabel: 'فرض 2',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/80',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-300 dark:border-teal-800',
    colorHex: '#0d9488',
    description: 'علامة الفرض المحروس الثاني (من 20)',
  },
  {
    id: 'exam',
    label: 'الاختبار',
    shortLabel: 'الاختبار',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    colorHex: '#7c3aed',
    description: 'علامة الاختبار الفصلي الشامل (من 20)',
  },
];

export interface FormulaPreset {
  id: string;
  name: string;
  tokens: FormulaToken[];
  formulaString: string;
  badge: string;
  description: string;
}

export const DEFAULT_FORMULA_STRING = '(التقويم + فرض 1 + فرض 2 + الاختبار × 2) ÷ 5';

export const DEFAULT_FORMULA_TOKENS: FormulaToken[] = [
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
];

export const FORMULA_PRESETS: FormulaPreset[] = [
  {
    id: 'official_comprehensive',
    name: 'النموذج الوزاري الشامل بالتقويم',
    formulaString: '(التقويم + فرض 1 + فرض 2 + الاختبار × 2) ÷ 5',
    badge: 'الوزاري الشامل',
    description: 'جمع التقويم والفرضين مع مضاعفة الاختبار وقسمة المجموع على 5.',
    tokens: [...DEFAULT_FORMULA_TOKENS],
  },
  {
    id: 'tests_avg_exam_x2_div_3',
    name: 'معدل الفرضين + الاختبار مضاعف ÷ 3',
    formulaString: '((فرض 1 + فرض 2) ÷ 2 + الاختبار × 2) ÷ 3',
    badge: 'الأكثر شيوعاً',
    description: 'متوسط الفرضين مضافاً إليه ضعف الاختبار ومقسوماً على 3.',
    tokens: [
      { type: 'parenthesis', value: '(', label: '(' },
      { type: 'parenthesis', value: '(', label: '(' },
      { type: 'component', value: 'test1', label: 'فرض 1' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'test2', label: 'فرض 2' },
      { type: 'parenthesis', value: ')', label: ')' },
      { type: 'operator', value: '/', label: '÷' },
      { type: 'number', value: '2', label: '2' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'exam', label: 'الاختبار' },
      { type: 'operator', value: '*', label: '×' },
      { type: 'number', value: '2', label: '2' },
      { type: 'parenthesis', value: ')', label: ')' },
      { type: 'operator', value: '/', label: '÷' },
      { type: 'number', value: '3', label: '3' },
    ],
  },
  {
    id: 'direct_sum_four_div_4',
    name: 'مجموع الفرضين + الاختبار مضاعف ÷ 4',
    formulaString: '(فرض 1 + فرض 2 + الاختبار × 2) ÷ 4',
    badge: 'النظام الوزاري المباشر',
    description: 'جمع الفرض 1 والفرض 2 مع ضعف الاختبار والقسمة على 4 بالتساوي.',
    tokens: [
      { type: 'parenthesis', value: '(', label: '(' },
      { type: 'component', value: 'test1', label: 'فرض 1' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'test2', label: 'فرض 2' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'exam', label: 'الاختبار' },
      { type: 'operator', value: '*', label: '×' },
      { type: 'number', value: '2', label: '2' },
      { type: 'parenthesis', value: ')', label: ')' },
      { type: 'operator', value: '/', label: '÷' },
      { type: 'number', value: '4', label: '4' },
    ],
  },
  {
    id: 'continuous_one_test_exam',
    name: 'التقويم + فرض 1 + الاختبار مضاعف ÷ 4',
    formulaString: '(التقويم + فرض 1 + الاختبار × 2) ÷ 4',
    badge: 'فرض واحد وتقويم',
    description: 'مناسب للمواد ذات الفرض الواحد والتقويم المستمر.',
    tokens: [
      { type: 'parenthesis', value: '(', label: '(' },
      { type: 'component', value: 'continuous', label: 'التقويم' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'test1', label: 'فرض 1' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'exam', label: 'الاختبار' },
      { type: 'operator', value: '*', label: '×' },
      { type: 'number', value: '2', label: '2' },
      { type: 'parenthesis', value: ')', label: ')' },
      { type: 'operator', value: '/', label: '÷' },
      { type: 'number', value: '4', label: '4' },
    ],
  },
  {
    id: 'simple_arithmetic_all_4',
    name: 'المتوسط الحسابي البسيط لجميع المكونات',
    formulaString: '(التقويم + فرض 1 + فرض 2 + الاختبار) ÷ 4',
    badge: 'أوزان متساوية',
    description: 'جمع المكونات الأربعة وقسمتها على 4 بالتساوي.',
    tokens: [
      { type: 'parenthesis', value: '(', label: '(' },
      { type: 'component', value: 'continuous', label: 'التقويم' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'test1', label: 'فرض 1' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'test2', label: 'فرض 2' },
      { type: 'operator', value: '+', label: '+' },
      { type: 'component', value: 'exam', label: 'الاختبار' },
      { type: 'parenthesis', value: ')', label: ')' },
      { type: 'operator', value: '/', label: '÷' },
      { type: 'number', value: '4', label: '4' },
    ],
  },
];

/**
 * Formats a list of tokens into a clean Arabic readable formula string
 */
export function formatFormulaTokens(tokens: FormulaToken[]): string {
  if (!tokens || tokens.length === 0) return '';
  return tokens
    .map((t, idx) => {
      if (t.type === 'operator') {
        const opSymbol = t.value === '*' ? '×' : t.value === '/' ? '÷' : t.value === '-' ? '−' : '+';
        return ` ${opSymbol} `;
      }
      if (t.type === 'parenthesis') {
        return t.value;
      }
      if (t.type === 'component') {
        return t.label;
      }
      return t.value;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates formula tokens for mathematical syntax and rules
 */
export interface FormulaValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  unclosedParens: number;
}

export function validateFormula(tokens: FormulaToken[]): FormulaValidationResult {
  if (!tokens || tokens.length === 0) {
    return {
      isValid: false,
      error: 'المعادلة فارغة، يرجى إضافة مكونات وعمليات حسابية.',
      unclosedParens: 0,
    };
  }

  let openParens = 0;
  let hasComponent = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;

    if (t.type === 'component') {
      hasComponent = true;
    }

    // Parentheses check
    if (t.type === 'parenthesis') {
      if (t.value === '(') {
        openParens++;
        // Cannot have number or component immediately before '(' without an operator
        if (prev && (prev.type === 'component' || prev.type === 'number' || (prev.type === 'parenthesis' && prev.value === ')'))) {
          return {
            isValid: false,
            error: `يجب وضع عملية حسابية (+ أو − أو × أو ÷) قبل فتح القوس عند الموضع ${i + 1}.`,
            unclosedParens: openParens,
          };
        }
      } else if (t.value === ')') {
        openParens--;
        if (openParens < 0) {
          return {
            isValid: false,
            error: 'يوجد قوس إغلاق ")" إضافي بدون قوس فتح مقابل.',
            unclosedParens: openParens,
          };
        }
        if (prev && prev.type === 'parenthesis' && prev.value === '(') {
          return {
            isValid: false,
            error: 'لا يمكن ترك قوس فارغ "()".',
            unclosedParens: openParens,
          };
        }
        if (prev && prev.type === 'operator') {
          return {
            isValid: false,
            error: 'لا يمكن وضع عملية حسابية قبل إغلاق القوس مباشرة.',
            unclosedParens: openParens,
          };
        }
      }
    }

    // Operator checks
    if (t.type === 'operator') {
      if (i === 0) {
        if (t.value !== '+' && t.value !== '-') {
          return {
            isValid: false,
            error: 'لا يمكن بدء المعادلة بعملية ضرب أو قسمة.',
            unclosedParens: openParens,
          };
        }
      }
      if (prev && prev.type === 'operator') {
        return {
          isValid: false,
          error: 'لا يمكن وضع عمليتين حسابيتين متتاليتين.',
          unclosedParens: openParens,
        };
      }
      if (prev && prev.type === 'parenthesis' && prev.value === '(') {
        if (t.value !== '+' && t.value !== '-') {
          return {
            isValid: false,
            error: 'لا يمكن وضع عملية ضرب أو قسمة بعد فتح القوس مباشرة.',
            unclosedParens: openParens,
          };
        }
      }
    }

    // Value adjacent to value check (e.g. [test1] [test2] without operator)
    if ((t.type === 'component' || t.type === 'number') && prev) {
      if (prev.type === 'component' || prev.type === 'number' || (prev.type === 'parenthesis' && prev.value === ')')) {
        return {
          isValid: false,
          error: `يجب وضع عملية حسابية (+ أو − أو × أو ÷) بين "${prev.label || prev.value}" و "${t.label || t.value}".`,
          unclosedParens: openParens,
        };
      }
    }

    // Check division by literal zero
    if (t.type === 'number' && (parseFloat(t.value) === 0 || t.value === '0') && prev && prev.type === 'operator' && prev.value === '/') {
      return {
        isValid: false,
        error: 'لا يمكن القسمة على الصفر.',
        unclosedParens: openParens,
      };
    }
  }

  // Check end token
  const last = tokens[tokens.length - 1];
  if (last.type === 'operator') {
    return {
      isValid: false,
      error: 'المعادلة تنتهي بعملية حسابية غير مكتملة.',
      unclosedParens: openParens,
    };
  }

  if (last.type === 'parenthesis' && last.value === '(') {
    return {
      isValid: false,
      error: 'المعادلة تنتهي بقوس فتح غير مغلق.',
      unclosedParens: openParens,
    };
  }

  if (openParens > 0) {
    return {
      isValid: false,
      error: `يوجد ${openParens} قوس مفتوح بحاجة إلى إغلاق.`,
      unclosedParens: openParens,
    };
  }

  if (!hasComponent) {
    return {
      isValid: true,
      warning: 'المعادلة تحتوي على أرقام فقط دون مكونات تقييم.',
      unclosedParens: 0,
    };
  }

  return {
    isValid: true,
    unclosedParens: 0,
  };
}

/**
 * Score context supplied for expression evaluation
 */
export interface EvaluationContext {
  continuous?: number | null; // التقويم
  test1?: number | null;      // فرض 1
  test2?: number | null;      // فرض 2
  exam?: number | null;       // الاختبار
  coefficient?: number | null;// معامل المادة
}

export interface FormulaEvaluationResult {
  value: number | null;
  error?: string;
  steps: string[];
  resolvedContext: Record<string, number | string>;
  usedComponents: ComponentId[];
  missingComponents: ComponentId[];
  isComplete: boolean;
}

/**
 * Safe Arithmetic AST / Shunting-Yard Parser & Evaluator (No eval!)
 */
export function evaluateFormulaTokens(
  tokens: FormulaToken[],
  context: EvaluationContext
): FormulaEvaluationResult {
  const steps: string[] = [];
  const resolvedContext: Record<string, number | string> = {};
  const usedComponents: ComponentId[] = [];
  const missingComponents: ComponentId[] = [];

  const valResult = validateFormula(tokens);
  if (!valResult.isValid) {
    return {
      value: null,
      error: valResult.error || 'معادلة غير صالحة',
      steps: ['صيغة المعادلة غير مكتملة أو تحتوي على أخطاء.'],
      resolvedContext,
      usedComponents,
      missingComponents,
      isComplete: false,
    };
  }

  // Resolve components and check presence
  const coeffValue = typeof context.coefficient === 'number' && !isNaN(context.coefficient) && context.coefficient > 0
    ? context.coefficient
    : 1;

  tokens.forEach((t) => {
    if (t.type === 'component') {
      const cid = t.value as ComponentId;
      if (!usedComponents.includes(cid)) {
        usedComponents.push(cid);
      }
    }
  });

  // Track resolved values
  usedComponents.forEach((cid) => {
    if (cid === 'coefficient') {
      resolvedContext['معامل المادة'] = coeffValue;
    } else if (cid === 'continuous') {
      if (typeof context.continuous === 'number' && !isNaN(context.continuous)) {
        resolvedContext['التقويم'] = context.continuous;
      } else {
        missingComponents.push('continuous');
        resolvedContext['التقويم'] = 'غير مدخل';
      }
    } else if (cid === 'test1') {
      if (typeof context.test1 === 'number' && !isNaN(context.test1)) {
        resolvedContext['فرض 1'] = context.test1;
      } else {
        missingComponents.push('test1');
        resolvedContext['فرض 1'] = 'غير مدخل';
      }
    } else if (cid === 'test2') {
      if (typeof context.test2 === 'number' && !isNaN(context.test2)) {
        resolvedContext['فرض 2'] = context.test2;
      } else {
        missingComponents.push('test2');
        resolvedContext['فرض 2'] = 'غير مدخل';
      }
    } else if (cid === 'exam') {
      if (typeof context.exam === 'number' && !isNaN(context.exam)) {
        resolvedContext['الاختبار'] = context.exam;
      } else {
        missingComponents.push('exam');
        resolvedContext['الاختبار'] = 'غير مدخل';
      }
    }
  });

  // If all assessment components used in formula are missing, return null (never force 0 or 1!)
  const assessmentComponents = usedComponents.filter((c) => c !== 'coefficient');
  if (assessmentComponents.length > 0 && assessmentComponents.every((c) => missingComponents.includes(c))) {
    return {
      value: null,
      error: undefined,
      steps: ['لا توجد علامات مدخلة للمكونات المستخدمة في المعادلة.'],
      resolvedContext,
      usedComponents,
      missingComponents,
      isComplete: false,
    };
  }

  // If any required component is missing in this strict formula
  if (missingComponents.length > 0) {
    const missingLabels = missingComponents
      .map((c) => FORMULA_COMPONENTS_LIST.find((m) => m.id === c)?.label || c)
      .join('، ');

    return {
      value: null,
      error: `العلامات التالية غير مدخلة: ${missingLabels}`,
      steps: [`بانتظار إدخال علامات: ${missingLabels}`],
      resolvedContext,
      usedComponents,
      missingComponents,
      isComplete: false,
    };
  }

  // Convert tokens into evaluated stream
  // Shunting-yard algorithm to Reverse Polish Notation (RPN)
  type RPNToken = { type: 'num'; val: number } | { type: 'op'; op: '+' | '-' | '*' | '/' };
  const rpn: RPNToken[] = [];
  const opStack: ('+' | '-' | '*' | '/' | '(')[] = [];

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  try {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.type === 'number') {
        const num = parseFloat(t.value);
        if (isNaN(num)) throw new Error(`قيمة عددية غير صالحة: ${t.value}`);
        rpn.push({ type: 'num', val: num });
      } else if (t.type === 'component') {
        const cid = t.value as ComponentId;
        let val: number;
        if (cid === 'coefficient') {
          val = coeffValue;
        } else if (cid === 'continuous') {
          val = context.continuous as number;
        } else if (cid === 'test1') {
          val = context.test1 as number;
        } else if (cid === 'test2') {
          val = context.test2 as number;
        } else if (cid === 'exam') {
          val = context.exam as number;
        } else {
          val = 0;
        }
        rpn.push({ type: 'num', val });
      } else if (t.type === 'operator') {
        const op = t.value as '+' | '-' | '*' | '/';
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1] !== '(' &&
          precedence[opStack[opStack.length - 1]] >= precedence[op]
        ) {
          rpn.push({ type: 'op', op: opStack.pop() as any });
        }
        opStack.push(op);
      } else if (t.type === 'parenthesis') {
        if (t.value === '(') {
          opStack.push('(');
        } else if (t.value === ')') {
          while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
            rpn.push({ type: 'op', op: opStack.pop() as any });
          }
          if (opStack.length > 0 && opStack[opStack.length - 1] === '(') {
            opStack.pop(); // remove '('
          }
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop()!;
      if (top !== '(') {
        rpn.push({ type: 'op', op: top as any });
      }
    }

    // Evaluate RPN
    const evalStack: number[] = [];
    for (const item of rpn) {
      if (item.type === 'num') {
        evalStack.push(item.val);
      } else if (item.type === 'op') {
        if (evalStack.length < 2) {
          throw new Error('خطأ في تركيب المعادلة الحسابية.');
        }
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;
        let res: number;
        switch (item.op) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (b === 0) throw new Error('القسمة على الصفر غير معرفة.');
            res = a / b;
            break;
          default:
            throw new Error(`عملية غير مدعومة: ${item.op}`);
        }
        evalStack.push(res);
      }
    }

    if (evalStack.length !== 1) {
      throw new Error('تعذر تقييم المعادلة.');
    }

    const finalVal = Math.round(evalStack[0] * 100) / 100;
    
    // Add step-by-step resolution
    const renderedFormula = formatFormulaTokens(tokens);
    const renderedWithValues = tokens
      .map((t) => {
        if (t.type === 'component') {
          const cid = t.value as ComponentId;
          if (cid === 'coefficient') return coeffValue.toString();
          if (cid === 'continuous') return context.continuous?.toString() || '؟';
          if (cid === 'test1') return context.test1?.toString() || '؟';
          if (cid === 'test2') return context.test2?.toString() || '؟';
          if (cid === 'exam') return context.exam?.toString() || '؟';
        }
        if (t.type === 'operator') {
          return t.value === '*' ? '×' : t.value === '/' ? '÷' : t.value === '-' ? '−' : '+';
        }
        return t.label || t.value;
      })
      .join(' ');

    steps.push(`المعادلة: ${renderedFormula}`);
    steps.push(`التعويض بالعلامات: ${renderedWithValues}`);
    steps.push(`النتيجة المحسوبة: ${finalVal.toFixed(2)} / 20`);

    return {
      value: finalVal,
      steps,
      resolvedContext,
      usedComponents,
      missingComponents: [],
      isComplete: true,
    };
  } catch (err: any) {
    return {
      value: null,
      error: err?.message || 'خطأ أثناء حساب المعادلة',
      steps: [err?.message || 'حدث خطأ في تقييم المعادلة.'],
      resolvedContext,
      usedComponents,
      missingComponents,
      isComplete: false,
    };
  }
}
