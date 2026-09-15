import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Calculator, 
  Printer, 
  Layers, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  BookOpen, 
  ChevronDown,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  ListOrdered,
  HelpCircle,
  Sliders,
  X,
  FileDown,
  Loader2,
  FileText
} from 'lucide-react';
import { 
  AssessmentItem, 
  AssessmentType, 
  ClassItem, 
  StudentItem, 
  Trimester, 
  CalculationFormula, 
  TeacherProfile,
  SubjectSetting,
  SubjectCalculationMethodType,
  StudentScoreRecord
} from '../../types';
import { 
  ASSESSMENT_TYPE_INFO, 
  PRIMARY_ASSESSMENT_TYPES,
  TRIMESTER_INFO, 
  computeClassGradesReport, 
  computeAssessmentStats, 
  getAlgerianAppraisal,
  SubjectCalculationDetailResult 
} from '../../utils/gradeCalculations';
import { StudentSubjectBreakdownModal } from '../modals/StudentSubjectBreakdownModal';
import { getSubjectsForGradeAndStage, SUBJECT_CALCULATION_METHODS } from '../../data/algerianData';
import { exportGradesSheetDocx } from '../../utils/docxService';
import { exportElementToPdf, exportGradesSheetPdf } from '../../utils/pdfService';
import { databaseService } from '../../db/databaseService';

interface GradesViewProps {
  assessments: AssessmentItem[];
  classes: ClassItem[];
  students: StudentItem[];
  profile: TeacherProfile;
  subjectSettings?: SubjectSetting[];
  onOpenAddAssessment: (defaultClassId?: string) => void;
  onEditAssessment: (assessment: AssessmentItem) => void;
  onDeleteAssessment: (assessment: AssessmentItem) => void;
  onOpenGradeEntry: (assessment: AssessmentItem) => void;
  onNavigateToClasses: () => void;
  onOpenAddSubject?: () => void;
  onOpenEditSubject?: (subject: SubjectSetting) => void;
  onSaveGrades?: (assessmentId: string, grades: Record<string, StudentScoreRecord>) => Promise<void> | void;
  onSaveAssessment?: (assessment: AssessmentItem) => Promise<void> | void;
  onSaveSubjectSetting?: (setting: SubjectSetting) => Promise<void> | void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  assessments,
  classes,
  students,
  profile,
  subjectSettings = [],
  onOpenAddAssessment,
  onEditAssessment,
  onDeleteAssessment,
  onOpenGradeEntry,
  onNavigateToClasses,
  onOpenAddSubject,
  onOpenEditSubject,
  onSaveGrades,
  onSaveAssessment,
  onSaveSubjectSetting,
}) => {
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  // Filters
  const [selectedTrimester, setSelectedTrimester] = useState<Trimester | 'ALL'>('T1');
  const [selectedType, setSelectedType] = useState<AssessmentType | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'assessments'>('table');
  const [formula, setFormula] = useState<CalculationFormula>('subject_method');
  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);

  // PDF & Word export states
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  // PDF Export Handler
  const handleExportGradesPdf = async () => {
    if (!activeClass || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportErrorMessage(null);
    try {
      const filename = `OstadDZ_Kashf_Noqat_${activeClass.name}_${selectedTrimester}`;
      const printableEl = document.getElementById('printable-deliberation-sheet');
      if (printableEl && isPrintPreviewOpen) {
        await exportElementToPdf(printableEl, filename, { orientation: 'landscape' });
      } else {
        await exportGradesSheetPdf(
          activeClass,
          assessments,
          classStudents,
          selectedTrimester,
          profile,
          effectiveSubjectSetting || undefined
        );
      }
      setExportSuccessMessage('تم تصدير كشف النقاط كملف PDF بنجاح وحفظه في جهازك');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setExportErrorMessage(err?.message || 'تعذر تصدير كشف النقاط كملف PDF، يرجى إعادة المحاولة.');
      setTimeout(() => setExportErrorMessage(null), 6000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Word (.docx) Export Handler
  const handleExportGradesWord = async () => {
    if (!activeClass || isExportingWord) return;
    setIsExportingWord(true);
    try {
      await exportGradesSheetDocx(
        activeClass,
        assessments,
        classStudents,
        selectedTrimester,
        profile,
        effectiveSubjectSetting || undefined
      );
      setExportSuccessMessage('تم تصدير كشف النقاط كملف Word (.docx) قابل للتعديل بنجاح');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Breakdown modal state
  const [breakdownModalData, setBreakdownModalData] = useState<{
    student: StudentItem;
    calculationResult: SubjectCalculationDetailResult;
  } | null>(null);

  // Sync selectedClassId if it gets deleted
  const activeClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Local state for instant optimistic updates and offline reactivity
  const [localAssessments, setLocalAssessments] = useState<AssessmentItem[]>(assessments);
  const [localSubjectSettings, setLocalSubjectSettings] = useState<SubjectSetting[]>(subjectSettings);

  useEffect(() => {
    setLocalAssessments(assessments);
  }, [assessments]);

  useEffect(() => {
    let isMounted = true;
    databaseService.cleanupDuplicateAssessments().then((cleaned) => {
      if (isMounted && cleaned && cleaned.length > 0) {
        setLocalAssessments(cleaned);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setLocalSubjectSettings(subjectSettings);
  }, [subjectSettings]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return students
      .filter((s) => s.classId === activeClass.id)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [students, activeClass]);

  // Assessments for selected class (strictly deduplicated and unified per category/trimester/subject)
  const classAssessments = useMemo(() => {
    if (!activeClass) return [];
    const map = new Map<string, AssessmentItem>();
    
    for (const a of localAssessments) {
      if (a.classId !== activeClass.id) continue;
      let cat: 'continuous' | 'test1' | 'test2' | 'exam' | string = a.type;
      if (a.type === 'test') {
        const l = (a.title || '').toLowerCase();
        cat = (l.includes('2') || l.includes('ثان') || l.includes('ثاني')) ? 'test2' : 'test1';
      } else if (a.type === 'continuous' || (a.title || '').includes('تقويم')) {
        cat = 'continuous';
      }
      
      const itemSubj = (a.subject || '').trim().toLowerCase();
      const key = `${a.classId}_${a.trimester}_${cat}_${itemSubj}`;
      const catTitle =
        cat === 'continuous'
          ? 'التقويم'
          : cat === 'test1'
          ? 'الفرض الأول'
          : cat === 'test2'
          ? 'الفرض الثاني'
          : cat === 'exam'
          ? 'اختبار الفصل'
          : a.title;

      if (!map.has(key)) {
        map.set(key, {
          ...a,
          type: cat as any,
          title: catTitle,
          coefficient: cat === 'exam' ? 2 : 1,
          grades: { ...(a.grades || {}) },
        });
      } else {
        const existing = map.get(key)!;
        const mergedGrades = { ...(existing.grades || {}), ...(a.grades || {}) };
        const isNewer = (a.updatedAt || a.createdAt || 0) >= (existing.updatedAt || existing.createdAt || 0);
        const base = isNewer ? a : existing;
        map.set(key, {
          ...base,
          type: cat as any,
          title: catTitle,
          coefficient: cat === 'exam' ? 2 : 1,
          grades: mergedGrades,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [localAssessments, activeClass]);

  // Available subjects for selected class
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (activeClass) {
      if (activeClass.subject?.trim()) set.add(activeClass.subject.trim());
      if (profile.subject?.trim()) set.add(profile.subject.trim());
      const gradeSubs = getSubjectsForGradeAndStage(activeClass.stage, activeClass.grade, [activeClass.subject]);
      gradeSubs.forEach((s) => set.add(s));
      localSubjectSettings.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
    } else {
      localSubjectSettings.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
      if (profile.subject?.trim()) {
        set.add(profile.subject.trim());
      }
    }
    classAssessments.forEach((a) => {
      if (a.subject?.trim()) set.add(a.subject.trim());
    });
    return Array.from(set);
  }, [activeClass, classAssessments, localSubjectSettings, profile.subject]);

  // Active Subject Name
  const activeSubjectName = useMemo(() => {
    if (selectedSubject !== 'ALL') return selectedSubject;
    return availableSubjects[0] || profile.subject || 'المادة';
  }, [selectedSubject, availableSubjects, profile.subject]);

  // Matched Subject Setting (with single coefficient and calculation method for whole subject)
  const currentSubjectSetting = useMemo(() => {
    const target = (activeSubjectName || '').trim().toLowerCase();
    return (
      localSubjectSettings.find(
        (s) => (s?.name || '').trim().toLowerCase() === target
      ) || null
    );
  }, [localSubjectSettings, activeSubjectName]);

  const [coeffInput, setCoeffInput] = useState<string>(() => {
    const target = (activeSubjectName || '').trim().toLowerCase();
    const found = localSubjectSettings.find(
      (s) => (s?.name || '').trim().toLowerCase() === target
    );
    if (found && typeof found.coefficient === 'number' && !isNaN(found.coefficient)) {
      return String(found.coefficient);
    }
    return '2';
  });

  // Keep track of active subject to update coeffInput when subject switches
  const prevSubjectRef = useRef<string>(activeSubjectName);
  useEffect(() => {
    if (prevSubjectRef.current !== activeSubjectName) {
      prevSubjectRef.current = activeSubjectName;
      const target = (activeSubjectName || '').trim().toLowerCase();
      const match = localSubjectSettings.find(
        (s) => (s?.name || '').trim().toLowerCase() === target
      );
      if (match && typeof match.coefficient === 'number' && !isNaN(match.coefficient)) {
        setCoeffInput(String(match.coefficient));
      } else {
        setCoeffInput('2');
      }
    }
  }, [activeSubjectName, localSubjectSettings]);

  // Live Effective Subject Setting:
  // Dynamically constructed from live coeffInput and selected calculation method.
  // Guarantees zero-lag instantaneous recalculation across the entire page!
  const effectiveSubjectSetting = useMemo<SubjectSetting>(() => {
    const target = (activeSubjectName || '').trim().toLowerCase();
    const existing = localSubjectSettings.find(
      (s) => (s?.name || '').trim().toLowerCase() === target
    );

    let parsedCoeff: number | null = null;
    const trimmed = coeffInput.trim();
    if (trimmed !== '') {
      const num = parseFloat(trimmed);
      if (!isNaN(num) && num >= 0) {
        parsedCoeff = Math.min(10, num);
      }
    }

    const currentMethod = existing?.calculationMethod?.method || 'tests_avg_plus_exam_x2_div_3';

    return {
      id: existing?.id || `subj-setting-${activeSubjectName.trim().replace(/\s+/g, '_')}`,
      name: activeSubjectName,
      coefficient: parsedCoeff as any,
      calculationMethod: existing?.calculationMethod || {
        method: currentMethod,
        customTest1Weight: 1,
        customTest2Weight: 1,
        customExamWeight: 2,
        description: SUBJECT_CALCULATION_METHODS.find((m) => m.id === currentMethod)?.formula || '',
      },
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }, [localSubjectSettings, activeSubjectName, coeffInput]);

  // Handlers for subject coefficient & calculation method
  const handleSubjectCoeffChange = async (newCoeffRaw: string | number) => {
    let parsedCoeff: number | null = null;
    if (typeof newCoeffRaw === 'number') {
      if (!isNaN(newCoeffRaw) && newCoeffRaw >= 0) {
        parsedCoeff = Math.min(10, newCoeffRaw);
      }
    } else if (typeof newCoeffRaw === 'string') {
      const trimmed = newCoeffRaw.trim();
      if (trimmed !== '') {
        const num = parseFloat(trimmed);
        if (!isNaN(num) && num >= 0) {
          parsedCoeff = Math.min(10, num);
        }
      }
    }

    const currentMethod = effectiveSubjectSetting?.calculationMethod?.method || 'tests_avg_plus_exam_x2_div_3';
    
    const updatedSetting: SubjectSetting = {
      id: currentSubjectSetting?.id || `subj-setting-${activeSubjectName.trim().replace(/\s+/g, '_')}`,
      name: activeSubjectName,
      coefficient: parsedCoeff as any,
      calculationMethod: currentSubjectSetting?.calculationMethod || {
        method: currentMethod,
        customTest1Weight: 1,
        customTest2Weight: 1,
        customExamWeight: 2,
        description: SUBJECT_CALCULATION_METHODS.find((m) => m.id === currentMethod)?.formula || '',
      },
      createdAt: currentSubjectSetting?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setLocalSubjectSettings((prev) => {
      const idx = prev.findIndex((s) => s.name.trim().toLowerCase() === activeSubjectName.trim().toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSetting;
        return copy;
      }
      return [...prev, updatedSetting];
    });

    await databaseService.saveSubjectSetting(updatedSetting);
    if (onSaveSubjectSetting) {
      await onSaveSubjectSetting(updatedSetting);
    }
  };

  const handleCalculationMethodChange = async (newMethod: SubjectCalculationMethodType) => {
    const coeff = effectiveSubjectSetting?.coefficient ?? 2;
    
    const updatedSetting: SubjectSetting = {
      id: currentSubjectSetting?.id || `subj-setting-${activeSubjectName.trim().replace(/\s+/g, '_')}`,
      name: activeSubjectName,
      coefficient: coeff as any,
      calculationMethod: {
        method: newMethod,
        customTest1Weight: 1,
        customTest2Weight: 1,
        customExamWeight: 2,
        description: SUBJECT_CALCULATION_METHODS.find((m) => m.id === newMethod)?.formula || '',
      },
      createdAt: currentSubjectSetting?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setLocalSubjectSettings((prev) => {
      const idx = prev.findIndex((s) => s.name.trim().toLowerCase() === activeSubjectName.trim().toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSetting;
        return copy;
      }
      return [...prev, updatedSetting];
    });

    await databaseService.saveSubjectSetting(updatedSetting);
    if (onSaveSubjectSetting) {
      await onSaveSubjectSetting(updatedSetting);
    }
  };

  // Dedicated canonical assessments for التقويم, الفرض الأول, الفرض الثاني, and الاختبار
  const continuousAssessment = useMemo(() => {
    if (!activeClass) return null;
    const matches = localAssessments.filter((a) => {
      const matchClass = a.classId === activeClass.id;
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchSubject = selectedSubject === 'ALL' || !a.subject || (a.subject || '').trim() === selectedSubject.trim();
      const isContinuous = a.type === 'continuous' || (a.title || '').includes('تقويم');
      return matchClass && matchTrimester && matchSubject && isContinuous;
    });

    if (matches.length === 0) return null;
    const sorted = [...matches].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const mergedGrades: Record<string, StudentScoreRecord> = {};
    for (const m of matches) {
      if (m.grades) {
        const entries = Object.entries(m.grades) as [string, StudentScoreRecord][];
        for (const [stId, rec] of entries) {
          if (rec && (rec.score !== undefined || rec.isAbsent)) {
            if (!mergedGrades[stId] || (m.updatedAt || 0) >= (sorted[0].updatedAt || 0)) {
              mergedGrades[stId] = rec;
            }
          }
        }
      }
    }
    return { ...sorted[0], type: 'continuous' as const, title: 'التقويم', grades: mergedGrades };
  }, [localAssessments, selectedTrimester, selectedSubject, activeClass?.id]);

  const test1Assessment = useMemo(() => {
    if (!activeClass) return null;
    const matches = localAssessments.filter((a) => {
      const matchClass = a.classId === activeClass.id;
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchSubject = selectedSubject === 'ALL' || !a.subject || (a.subject || '').trim() === selectedSubject.trim();
      const isTest1 = a.type === 'test1' || (a.type === 'test' && !a.title.includes('2') && !a.title.includes('ثان') && !a.title.includes('ثاني'));
      return matchClass && matchTrimester && matchSubject && isTest1;
    });

    if (matches.length === 0) return null;
    const sorted = [...matches].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const mergedGrades: Record<string, StudentScoreRecord> = {};
    for (const m of matches) {
      if (m.grades) {
        const entries = Object.entries(m.grades) as [string, StudentScoreRecord][];
        for (const [stId, rec] of entries) {
          if (rec && (rec.score !== undefined || rec.isAbsent)) {
            if (!mergedGrades[stId] || (m.updatedAt || 0) >= (sorted[0].updatedAt || 0)) {
              mergedGrades[stId] = rec;
            }
          }
        }
      }
    }
    return { ...sorted[0], type: 'test1' as const, title: 'الفرض الأول', grades: mergedGrades };
  }, [localAssessments, selectedTrimester, selectedSubject, activeClass?.id]);

  const test2Assessment = useMemo(() => {
    if (!activeClass) return null;
    const matches = localAssessments.filter((a) => {
      const matchClass = a.classId === activeClass.id;
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchSubject = selectedSubject === 'ALL' || !a.subject || (a.subject || '').trim() === selectedSubject.trim();
      const isTest2 = a.type === 'test2' || (a.type === 'test' && (a.title.includes('2') || a.title.includes('ثان') || a.title.includes('ثاني')));
      return matchClass && matchTrimester && matchSubject && isTest2;
    });

    if (matches.length === 0) return null;
    const sorted = [...matches].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const mergedGrades: Record<string, StudentScoreRecord> = {};
    for (const m of matches) {
      if (m.grades) {
        const entries = Object.entries(m.grades) as [string, StudentScoreRecord][];
        for (const [stId, rec] of entries) {
          if (rec && (rec.score !== undefined || rec.isAbsent)) {
            if (!mergedGrades[stId] || (m.updatedAt || 0) >= (sorted[0].updatedAt || 0)) {
              mergedGrades[stId] = rec;
            }
          }
        }
      }
    }
    return { ...sorted[0], type: 'test2' as const, title: 'الفرض الثاني', grades: mergedGrades };
  }, [localAssessments, selectedTrimester, selectedSubject, activeClass?.id]);

  const examAssessment = useMemo(() => {
    if (!activeClass) return null;
    const matches = localAssessments.filter((a) => {
      const matchClass = a.classId === activeClass.id;
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchSubject = selectedSubject === 'ALL' || !a.subject || (a.subject || '').trim() === selectedSubject.trim();
      const isExam = a.type === 'exam' || (a.title || '').includes('اختبار');
      return matchClass && matchTrimester && matchSubject && isExam;
    });

    if (matches.length === 0) return null;
    const sorted = [...matches].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const mergedGrades: Record<string, StudentScoreRecord> = {};
    for (const m of matches) {
      if (m.grades) {
        const entries = Object.entries(m.grades) as [string, StudentScoreRecord][];
        for (const [stId, rec] of entries) {
          if (rec && (rec.score !== undefined || rec.isAbsent)) {
            if (!mergedGrades[stId] || (m.updatedAt || 0) >= (sorted[0].updatedAt || 0)) {
              mergedGrades[stId] = rec;
            }
          }
        }
      }
    }
    return { ...sorted[0], type: 'exam' as const, title: 'اختبار الفصل', grades: mergedGrades };
  }, [localAssessments, selectedTrimester, selectedSubject, activeClass?.id]);

  // Canonical assessments list for grading calculations
  const canonicalAssessments = useMemo(() => {
    const list: AssessmentItem[] = [];
    if (continuousAssessment) list.push(continuousAssessment);
    if (test1Assessment) list.push(test1Assessment);
    if (test2Assessment) list.push(test2Assessment);
    if (examAssessment) list.push(examAssessment);
    return list;
  }, [continuousAssessment, test1Assessment, test2Assessment, examAssessment]);

  // Filtered assessments according to trimester, type, and subject (for card view and assessments view)
  const filteredAssessments = useMemo(() => {
    return classAssessments.filter((a) => {
      const matchTrimester = selectedTrimester === 'ALL' || a.trimester === selectedTrimester;
      const matchType =
        selectedType === 'ALL' ||
        a.type === selectedType ||
        (selectedType === 'test1' && (a.type === 'test1' || a.type === 'test'));
      const matchSubject = selectedSubject === 'ALL' || (a.subject || '').trim() === selectedSubject.trim();
      return matchTrimester && matchType && matchSubject;
    });
  }, [classAssessments, selectedTrimester, selectedType, selectedSubject]);

  // Score retrieval and direct entry helpers
  const getStudentScoreValue = (studentId: string, category: 'continuous' | 'test1' | 'test2' | 'exam'): string | number => {
    const assess =
      category === 'continuous'
        ? continuousAssessment
        : category === 'test1'
        ? test1Assessment
        : category === 'test2'
        ? test2Assessment
        : examAssessment;
    if (!assess || !assess.grades) return '';
    const record = assess.grades[studentId];
    if (!record || record.isAbsent) return '';
    if (typeof record.score !== 'number' || isNaN(record.score)) return '';
    return record.score;
  };

  const handleDirectScoreInput = async (studentId: string, category: 'continuous' | 'test1' | 'test2' | 'exam', rawVal: string) => {
    if (!activeClass) return;
    let targetAssessment =
      category === 'continuous'
        ? continuousAssessment
        : category === 'test1'
        ? test1Assessment
        : category === 'test2'
        ? test2Assessment
        : examAssessment;
    const effectiveTrimester: Trimester = selectedTrimester !== 'ALL' ? selectedTrimester : 'T1';

    if (!targetAssessment) {
      const newAssessment: AssessmentItem = {
        id: `assess-${category}-${activeClass.id}-${effectiveTrimester}-${activeSubjectName.replace(/\s+/g, '_')}`,
        title:
          category === 'continuous'
            ? 'التقويم'
            : category === 'test1'
            ? 'الفرض الأول'
            : category === 'test2'
            ? 'الفرض الثاني'
            : 'اختبار الفصل',
        type: category,
        classId: activeClass.id,
        className: activeClass.name,
        subject: activeSubjectName,
        trimester: effectiveTrimester,
        date: new Date().toISOString().slice(0, 10),
        coefficient: 1, // assessments have no individual coefficient
        maxScore: 20,
        grades: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await databaseService.addAssessment(newAssessment);
      if (onSaveAssessment) {
        await onSaveAssessment(newAssessment);
      }
      targetAssessment = newAssessment;
    }

    const updatedGrades: Record<string, StudentScoreRecord> = { ...(targetAssessment.grades || {}) };

    if (rawVal.trim() === '') {
      delete updatedGrades[studentId];
    } else {
      const parsed = parseFloat(rawVal);
      if (!isNaN(parsed)) {
        const num = Math.max(0, Math.min(20, parsed));
        updatedGrades[studentId] = {
          score: num,
          isAbsent: false,
        };
      } else {
        delete updatedGrades[studentId];
      }
    }

    const updatedAssessment: AssessmentItem = {
      ...targetAssessment,
      grades: updatedGrades,
      updatedAt: Date.now(),
    };

    setLocalAssessments((prev) => {
      const cleaned = prev.filter((a) => {
        if (a.id === updatedAssessment.id) return false;
        if (a.classId !== activeClass.id) return true;
        if (a.trimester !== effectiveTrimester) return true;
        const subjMatches = !a.subject || !activeSubjectName || a.subject.trim() === activeSubjectName.trim();
        if (!subjMatches) return true;
        let aCat = a.type;
        if (a.type === 'test') {
          const l = (a.title || '').toLowerCase();
          aCat = (l.includes('2') || l.includes('ثان') || l.includes('ثاني')) ? 'test2' : 'test1';
        } else if (a.type === 'continuous' || (a.title || '').includes('تقويم')) {
          aCat = 'continuous';
        }
        return aCat !== category;
      });
      return [...cleaned, updatedAssessment];
    });

    await databaseService.saveBatchGrades(updatedAssessment.id, updatedGrades);
    if (onSaveGrades) {
      await onSaveGrades(updatedAssessment.id, updatedGrades);
    }
  };

  // Comprehensive report for class with canonical assessments, formula, and subject setting
  const gradesReport = useMemo(() => {
    return computeClassGradesReport(classStudents, canonicalAssessments, formula, effectiveSubjectSetting);
  }, [classStudents, canonicalAssessments, formula, effectiveSubjectSetting]);

  // Filter student rows by search query
  const displayedStudentResults = useMemo(() => {
    if (!searchStudent.trim()) return gradesReport.studentResults;
    const query = searchStudent.toLowerCase();
    return gradesReport.studentResults.filter((item) => {
      const name = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();
      const num = item.student.studentNumber?.toLowerCase() || '';
      return name.includes(query) || num.includes(query);
    });
  }, [gradesReport.studentResults, searchStudent]);

  // Column visibility flags and averages
  const showContinuousCol = selectedType === 'ALL' || selectedType === 'continuous';
  const showTest1Col = selectedType === 'ALL' || selectedType === 'test1';
  const showTest2Col = selectedType === 'ALL' || selectedType === 'test2';
  const showExamCol = selectedType === 'ALL' || selectedType === 'exam';
  const showAverageCol = selectedType === 'ALL' || selectedType === 'exam';
  const showAppraisalAndRankCol = selectedType === 'ALL';
  const totalAssessmentCols =
    (showContinuousCol ? 1 : 0) +
    (showTest1Col ? 1 : 0) +
    (showTest2Col ? 1 : 0) +
    (showExamCol ? 1 : 0) +
    (showAverageCol ? 1 : 0) +
    (showAppraisalAndRankCol ? 2 : 0);

  const continuousAvg = useMemo(() => {
    if (!continuousAssessment?.grades) return null;
    const vals = (Object.values(continuousAssessment.grades) as StudentScoreRecord[])
      .filter((g) => !g.isAbsent && typeof g.score === 'number' && !isNaN(g.score))
      .map((g) => g.score as number);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }, [continuousAssessment]);

  const test1Avg = useMemo(() => {
    if (!test1Assessment?.grades) return null;
    const vals = (Object.values(test1Assessment.grades) as StudentScoreRecord[])
      .filter((g) => !g.isAbsent && typeof g.score === 'number' && !isNaN(g.score))
      .map((g) => g.score as number);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }, [test1Assessment]);

  const test2Avg = useMemo(() => {
    if (!test2Assessment?.grades) return null;
    const vals = (Object.values(test2Assessment.grades) as StudentScoreRecord[])
      .filter((g) => !g.isAbsent && typeof g.score === 'number' && !isNaN(g.score))
      .map((g) => g.score as number);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }, [test2Assessment]);

  const examAvg = useMemo(() => {
    if (!examAssessment?.grades) return null;
    const vals = (Object.values(examAssessment.grades) as StudentScoreRecord[])
      .filter((g) => !g.isAbsent && typeof g.score === 'number' && !isNaN(g.score))
      .map((g) => g.score as number);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }, [examAssessment]);

  if (classes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          لا توجد أقسام مسجلة بعد
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          يرجى إضافة قسم تربوي أولاً وإضافة الطلاب إليه للبدء في تسجيل الفروض والاختبارات وحساب المعدلات.
        </p>
        <button
          onClick={onNavigateToClasses}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition"
        >
          إدارة الأقسام والطلاب
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                النقاط والمعدلات
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {activeClass?.name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              رصد نقاط الفروض والاختبارات وحساب المعدلات الفردية والجماعية بدقة
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Export PDF Button */}
          <button
            onClick={handleExportGradesPdf}
            disabled={isExportingPdf || !activeClass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="تصدير كشف النقاط والمداولات كملف PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-600" />
            )}
            <span>تصدير PDF</span>
          </button>

          {/* Export Word Button */}
          <button
            onClick={handleExportGradesWord}
            disabled={isExportingWord || !activeClass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 disabled:opacity-50 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="تصدير كشف النقاط والمداولات كملف Word (.docx) قابل للتعديل"
          >
            {isExportingWord ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <FileText className="w-4 h-4 text-blue-600" />
            )}
            <span>تصدير Word</span>
          </button>

          {/* Printable Sheet Button */}
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs"
            title="معاينة وطباعة كشف نقاط القسم ومحضر المداولة"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>كشف النقاط (معاينة)</span>
          </button>

          {/* Add Assessment Button */}
          <button
            onClick={() => onOpenAddAssessment(activeClass?.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تقييم جديد</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {exportSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {exportErrorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-4 h-4 text-rose-600 dark:text-rose-400 font-bold shrink-0">⚠️</span>
          <span>{exportErrorMessage}</span>
        </div>
      )}

      {/* 2. Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-400 pl-2 shrink-0">الأقسام:</span>
        {classes.map((cls) => {
          const isSelected = cls.id === activeClass?.id;
          const classStudentsCount = students.filter((s) => s.classId === cls.id).length;
          const classAssessmentsCount = assessments.filter((a) => a.classId === cls.id).length;

          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70'
              }`}
            >
              <span>{cls.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {classStudentsCount} ط • {classAssessmentsCount} ت
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Class Statistics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Class Average */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">معدل القسم العام</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {gradesReport.classAverage !== null ? gradesReport.classAverage : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          {gradesReport.classAverage !== null && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAlgerianAppraisal(gradesReport.classAverage).badgeBg} ${getAlgerianAppraisal(gradesReport.classAverage).badgeText} ${getAlgerianAppraisal(gradesReport.classAverage).badgeBorder}`}>
                {getAlgerianAppraisal(gradesReport.classAverage).label}
              </span>
            </div>
          )}
        </div>

        {/* Pass Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة النجاح (≥ 10/20)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {gradesReport.totalEvaluatedStudents > 0 ? `${gradesReport.passRate}%` : '—'}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${gradesReport.passRate}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex justify-between">
            <span>الناجحين: {gradesReport.passCount}</span>
            <span>المتعثرين: {gradesReport.failCount}</span>
          </div>
        </div>

        {/* Highest Mark */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">أعلى معدل في القسم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {gradesReport.highestAverage ? gradesReport.highestAverage.value : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {gradesReport.highestAverage ? gradesReport.highestAverage.studentName : 'لا توجد تقييمات'}
          </p>
        </div>

        {/* Lowest Mark */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">أدنى معدل في القسم</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {gradesReport.lowestAverage ? gradesReport.lowestAverage.value : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 20</span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {gradesReport.lowestAverage ? gradesReport.lowestAverage.studentName : 'لا توجد تقييمات'}
          </p>
        </div>
      </div>

      {/* 4. Controls, Filters & Calculation Formula */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Row 1: Search, View Mode, and Formula Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search student */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="ابحث عن تلميذ بالاسم، اللقب أو رقم التعريف..."
              className="w-full h-10 pl-3 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            {searchStudent && (
              <button
                onClick={() => setSearchStudent('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Calculation formula selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">نظام الحساب:</span>
              </div>
              <select
                value={formula}
                onChange={(e) => setFormula(e.target.value as CalculationFormula)}
                className="h-8 px-2 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="subject_method">كيفية حساب المادة المحددة (الرسمي)</option>
                <option value="weighted">المعدل الموزون بالمعاملات</option>
                <option value="standard_algerian">النظام الوزاري الجزائري (تقويم + فرض + اختبار×2)</option>
                <option value="arithmetic">المعدل الحسابي البسيط</option>
              </select>
              <button
                onClick={() => setIsFormulaHelpOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="شرح طريقة حساب المعدل"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>جدول شامل</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>بطاقات الطلاب</span>
              </button>
              <button
                onClick={() => setViewMode('assessments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'assessments'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>التقييمات ({classAssessments.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Trimester & Assessment Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Trimester Tabs */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold ml-1">الفصل:</span>
            {(Object.keys(TRIMESTER_INFO) as Trimester[]).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setSelectedTrimester(tKey)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  selectedTrimester === tKey
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {TRIMESTER_INFO[tKey].label}
              </button>
            ))}
          </div>

          {/* Assessment Type Pills */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold ml-1">النوع:</span>
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                selectedType === 'ALL'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              الكل
            </button>
            {PRIMARY_ASSESSMENT_TYPES.map((tKey) => (
              <button
                key={tKey}
                onClick={() => setSelectedType(tKey)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedType === tKey
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {ASSESSMENT_TYPE_INFO[tKey].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Subject Selection, Subject Coefficient, & Calculation Method */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 p-3.5 rounded-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Subject Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المادة:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-7 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">كل المواد في القسم</option>
                {availableSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Coefficient Field (حقل المعامل الخاص بالمادة) */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                معامل المادة:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                placeholder="—"
                value={coeffInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCoeffInput(val);
                  handleSubjectCoeffChange(val);
                }}
                className="w-14 h-7 text-center font-black text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                title="معامل المادة كاملة فقط (لا يوجد معامل خاص بالفرض الأول أو الفرض الثاني)"
              />
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (المعامل للمادة كاملة فقط)
              </span>
            </div>

            {/* Calculation Method Field (حقل كيفية الحساب الموجود في الصفحة) */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                كيفية الحساب:
              </label>
              <select
                value={effectiveSubjectSetting?.calculationMethod?.method || 'tests_avg_plus_exam_x2_div_3'}
                onChange={(e) => handleCalculationMethodChange(e.target.value as SubjectCalculationMethodType)}
                className="h-7 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-[260px] sm:max-w-none"
              >
                <option value="tests_avg_plus_exam_x2_div_3">
                  ((ف1 + ف2) ÷ 2 + اختبار × 2) ÷ 3 — معدل الفرضين + الاختبار مضاعف
                </option>
                <option value="tests_sum_plus_exam_x2_div_4">
                  (ف1 + ف2 + اختبار × 2) ÷ 4 — مجموع الفرضين + الاختبار مضاعف
                </option>
                <option value="best_test_plus_exam_x2_div_3">
                  (أفضل فرض + اختبار × 2) ÷ 3 — الفرض الأعلى + الاختبار مضاعف
                </option>
                <option value="test1_only_plus_exam_x2_div_3">
                  (فرض 1 فقط + اختبار × 2) ÷ 3 — فرض واحد واختبار
                </option>
                <option value="arithmetic_mean">
                  (فرض 1 + فرض 2 + اختبار) ÷ 3 — المتوسط الحسابي البسيط
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(currentSubjectSetting || effectiveSubjectSetting) && onOpenEditSubject ? (
              <button
                type="button"
                onClick={() => onOpenEditSubject(effectiveSubjectSetting || currentSubjectSetting)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>محاكي وتفاصيل الحساب</span>
              </button>
            ) : onOpenAddSubject ? (
              <button
                type="button"
                onClick={onOpenAddSubject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إعداد مادة وطريقة حسابها</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 5. Main Content Area */}
      {viewMode === 'assessments' ? (
        /* ================= ASSESSMENTS LIST VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              قائمة التقييمات المسجلة لقسم {activeClass.name} ({filteredAssessments.length})
            </h2>
            <button
              onClick={() => onOpenAddAssessment(activeClass.id)}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تقييم جديد</span>
            </button>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                لا توجد تقييمات مطابقة لهذا القسم والفصل
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                اضغط على الزر أسفله لإنشاء فرض محروس، اختبار فصلي، أو تقويم مستمر.
              </p>
              <button
                onClick={() => onOpenAddAssessment(activeClass.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
              >
                + إنشاء أول تقييم لهذا القسم
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssessments.map((assessment) => {
                const stats = computeAssessmentStats(assessment, students);
                const typeInfo = ASSESSMENT_TYPE_INFO[assessment.type];

                return (
                  <div
                    key={assessment.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/40 transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Badge header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.colorBg} ${typeInfo.colorText} ${typeInfo.colorBorder}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {TRIMESTER_INFO[assessment.trimester]?.label || 'الفصل الأول'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {assessment.date}
                        </span>
                      </div>

                      {/* Title & Subject */}
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {assessment.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        المادة: {assessment.subject}
                        {assessment.type !== 'test1' && assessment.type !== 'test2' && assessment.type !== 'test' && (
                          <span> • المعامل: {assessment.coefficient}</span>
                        )}
                        <span> • العلامة على: /{assessment.maxScore || 20}</span>
                      </p>

                      {assessment.notes && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl line-clamp-2">
                          {assessment.notes}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">معدل الفرض:</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            {stats.average !== null ? `${stats.average}/20` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">المرصودين:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {stats.gradedCount} / {stats.totalStudents}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">الغيابات:</span>
                          <span className={`text-xs font-bold ${stats.absentCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {stats.absentCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditAssessment(assessment)}
                          className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          title="تعديل تفاصيل التقييم"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAssessment(assessment)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="حذف هذا التقييم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenGradeEntry(assessment)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>رصد وتعديل النقاط</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARDS VIEW (PER-STUDENT) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStudentResults.map((result) => {
            const avg = result.average;
            const appraisal = result.appraisal;

            return (
              <div
                key={result.studentId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {result.student.lastName} {result.student.firstName}
                        </span>
                        {showAppraisalAndRankCol && result.rank !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            المرتبة {result.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {result.student.studentNumber ? `رقم: ${result.student.studentNumber} • ` : ''}
                        {result.student.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </p>
                    </div>

                    {/* Average badge with breakdown link (فقط في الاختبار والكل) */}
                    {showAverageCol && (
                      <div 
                        className="text-left cursor-pointer group"
                        onClick={() => {
                          if (result.subjectCalculation) {
                            setBreakdownModalData({
                              student: result.student,
                              calculationResult: result.subjectCalculation,
                            });
                          }
                        }}
                        title="انقر لعرض تفاصيل وخطوات كيفية الحساب"
                      >
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`text-lg font-black ${avg !== null && avg >= 10 ? 'text-emerald-600 dark:text-emerald-400' : avg !== null ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                            {avg !== null ? `${avg}/20` : '—'}
                          </span>
                          {result.subjectCalculation && (
                            <Calculator className="w-3.5 h-3.5 text-emerald-500 opacity-60 group-hover:opacity-100 transition" />
                          )}
                        </div>
                        {result.subjectCalculation?.weightedTotal !== null && typeof result.subjectCalculation?.coefficient === 'number' && result.subjectCalculation.coefficient > 0 && (
                          <span className="text-[10px] text-slate-400 block text-left font-mono">
                            المجموع: {result.subjectCalculation.weightedTotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {showAppraisalAndRankCol && appraisal && (
                    <div className="mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appraisal.badgeBg} ${appraisal.badgeText} ${appraisal.badgeBorder}`}>
                        {appraisal.label}
                      </span>
                    </div>
                  )}

                  {/* Individual Scores breakdown */}
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">النقاط المرصودة:</span>
                    {filteredAssessments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">لا توجد تقييمات منشأة بعد</p>
                    ) : (
                      filteredAssessments.map((a) => {
                        const scoreData = result.scoresByAssessmentId[a.id];
                        const typeInfo = ASSESSMENT_TYPE_INFO[a.type];

                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                          >
                            <span className="truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                              {a.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {scoreData?.isAbsent ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                                  غائب
                                </span>
                              ) : scoreData && scoreData.scoreOutOf20 !== null ? (
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                  {scoreData.rawScore} /{a.maxScore || 20}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                                  —
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= COMPREHENSIVE TABLE VIEW (RESPONSIVE) ================= */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Table Header Controls */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>جدول كشف النقاط والمعدلات الكامل</span>
              <span className="text-slate-400 font-normal">
                ({displayedStudentResults.length} تلميذ • {filteredAssessments.length} تقييم)
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              * انقر على عنوان أي تقييم لفتح واجهة رصد النقاط السريعة
            </div>
          </div>

          {/* Table Wrapper (Horizontal Scrollable with RTL freeze) */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 font-bold text-slate-500 w-10 text-center sticky right-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                    #
                  </th>
                  <th className="p-3 font-bold text-slate-900 dark:text-white min-w-[160px] sticky right-10 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs">
                    التلميذ(ة)
                  </th>

                  {/* التقويم: خانة واحدة فقط للنقطة المتحصل عليها */}
                  {showContinuousCol && (
                    <th className="p-2.5 font-bold min-w-[130px] text-center border-l border-slate-200/80 dark:border-slate-700/80 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          التقويم
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          التقويم المستمر
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          النقطة المتحصل عليها (/20)
                        </span>
                      </div>
                    </th>
                  )}

                  {/* الفرض الأول: خانة واحدة فقط للنقطة المتحصل عليها */}
                  {showTest1Col && (
                    <th className="p-2.5 font-bold min-w-[130px] text-center border-l border-slate-200/80 dark:border-slate-700/80 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          الفرض 1
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          الفرض الأول
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          النقطة المتحصل عليها (/20)
                        </span>
                      </div>
                    </th>
                  )}

                  {/* الفرض الثاني: خانة واحدة فقط للنقطة المتحصل عليها */}
                  {showTest2Col && (
                    <th className="p-2.5 font-bold min-w-[130px] text-center border-l border-slate-200/80 dark:border-slate-700/80 bg-teal-50/50 dark:bg-teal-950/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                          الفرض 2
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          الفرض الثاني
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          النقطة المتحصل عليها (/20)
                        </span>
                      </div>
                    </th>
                  )}

                  {/* اختبار الفصل: خانة واحدة فقط للنقطة المتحصل عليها */}
                  {showExamCol && (
                    <th className="p-2.5 font-bold min-w-[130px] text-center border-l border-slate-200/80 dark:border-slate-700/80 bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                          الاختبار
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          اختبار الفصل
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          النقطة المتحصل عليها (/20)
                        </span>
                      </div>
                    </th>
                  )}

                  {/* Calculated Average Column (يظهر فقط في الاختبار وفي الكل) */}
                  {showAverageCol && (
                    <th className="p-3 font-black text-emerald-800 dark:text-emerald-300 min-w-[100px] text-center bg-emerald-50/80 dark:bg-emerald-950/50 border-r border-emerald-200 dark:border-emerald-900">
                      معدل المادة (/20)
                    </th>
                  )}

                  {/* Appreciation Column */}
                  {showAppraisalAndRankCol && (
                    <th className="p-3 font-bold text-slate-700 dark:text-slate-300 min-w-[110px] text-center">
                      التقدير والملاحظة
                    </th>
                  )}

                  {/* Rank Column */}
                  {showAppraisalAndRankCol && (
                    <th className="p-3 font-bold text-slate-700 dark:text-slate-300 min-w-[70px] text-center">
                      الرتبة
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedStudentResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2 + totalAssessmentCols}
                      className="py-12 text-center text-slate-400"
                    >
                      لا توجد بيانات مطابقة لخيارات البحث أو التصفية
                    </td>
                  </tr>
                ) : (
                  displayedStudentResults.map((row, idx) => {
                    const avg = row.average;
                    const appraisal = row.appraisal;

                    return (
                      <tr
                        key={row.studentId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Index */}
                        <td className="p-3 text-center text-slate-400 font-bold sticky right-0 z-10 bg-white dark:bg-slate-900">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="p-3 font-bold text-slate-900 dark:text-white sticky right-10 z-10 bg-white dark:bg-slate-900 shadow-xs">
                          <div>
                            <span className="block text-xs">
                              {row.student.lastName} {row.student.firstName}
                            </span>
                            {row.student.studentNumber && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {row.student.studentNumber}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* التقويم: خانة واحدة فقط لإدخال النقطة */}
                        {showContinuousCol && (
                          <td className="p-2 text-center border-l border-slate-100 dark:border-slate-800 bg-amber-50/10 dark:bg-amber-950/10">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={getStudentScoreValue(row.student.id, 'continuous')}
                                onChange={(e) => handleDirectScoreInput(row.student.id, 'continuous', e.target.value)}
                                className="w-20 h-8 px-2 text-center font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono shadow-2xs transition"
                                title="التقويم: النقطة المتحصل عليها (من 20)"
                              />
                            </div>
                          </td>
                        )}

                        {/* الفرض الأول: خانة واحدة فقط لإدخال النقطة */}
                        {showTest1Col && (
                          <td className="p-2 text-center border-l border-slate-100 dark:border-slate-800 bg-emerald-50/10 dark:bg-emerald-950/10">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={getStudentScoreValue(row.student.id, 'test1')}
                                onChange={(e) => handleDirectScoreInput(row.student.id, 'test1', e.target.value)}
                                className="w-20 h-8 px-2 text-center font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs transition"
                                title="الفرض الأول: النقطة المتحصل عليها (من 20)"
                              />
                            </div>
                          </td>
                        )}

                        {/* الفرض الثاني: خانة واحدة فقط لإدخال النقطة */}
                        {showTest2Col && (
                          <td className="p-2 text-center border-l border-slate-100 dark:border-slate-800 bg-teal-50/10 dark:bg-teal-950/10">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={getStudentScoreValue(row.student.id, 'test2')}
                                onChange={(e) => handleDirectScoreInput(row.student.id, 'test2', e.target.value)}
                                className="w-20 h-8 px-2 text-center font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono shadow-2xs transition"
                                title="الفرض الثاني: النقطة المتحصل عليها (من 20)"
                              />
                            </div>
                          </td>
                        )}

                        {/* اختبار الفصل: خانة واحدة فقط لإدخال النقطة */}
                        {showExamCol && (
                          <td className="p-2 text-center border-l border-slate-100 dark:border-slate-800 bg-purple-50/10 dark:bg-purple-950/10">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                placeholder="—"
                                value={getStudentScoreValue(row.student.id, 'exam')}
                                onChange={(e) => handleDirectScoreInput(row.student.id, 'exam', e.target.value)}
                                className="w-20 h-8 px-2 text-center font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono shadow-2xs transition"
                                title="اختبار الفصل: النقطة المتحصل عليها (من 20)"
                              />
                            </div>
                          </td>
                        )}

                        {/* Calculated Average */}
                        {showAverageCol && (
                          <td 
                            className="p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-emerald-100 dark:border-emerald-900/60 font-mono cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition group"
                            onClick={() => {
                              if (row.subjectCalculation) {
                                setBreakdownModalData({
                                  student: row.student,
                                  calculationResult: row.subjectCalculation,
                                });
                              }
                            }}
                            title="انقر لعرض تفاصيل وخطوات كيفية الحساب"
                          >
                            {avg !== null ? (
                              <div className="flex flex-col items-center justify-center">
                                <span
                                  className={`text-sm font-black flex items-center gap-1 ${
                                    avg >= 10
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {avg.toFixed(2)}
                                  <Calculator className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition" />
                                </span>
                                {row.subjectCalculation?.weightedTotal !== null && typeof row.subjectCalculation?.coefficient === 'number' && row.subjectCalculation.coefficient > 0 && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal font-mono">
                                    المجموع: {row.subjectCalculation.weightedTotal.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        )}

                        {/* Appraisal */}
                        {showAppraisalAndRankCol && (
                          <td className="p-3 text-center">
                            {appraisal ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${appraisal.badgeBg} ${appraisal.badgeText} ${appraisal.badgeBorder}`}
                              >
                                {appraisal.label}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Rank */}
                        {showAppraisalAndRankCol && (
                          <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {row.rank !== null ? (
                              <span className={`px-2 py-0.5 rounded-md text-xs ${row.rank === 1 ? 'bg-amber-100 text-amber-800 font-black' : ''}`}>
                                {row.rank}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Summary Row */}
              {displayedStudentResults.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                    <td colSpan={2} className="p-3 text-slate-900 dark:text-white sticky right-0 z-10 bg-slate-100 dark:bg-slate-800">
                      معدل التقييمات في القسم:
                    </td>
                    {showContinuousCol && (
                      <td className="p-2.5 text-center font-mono text-amber-700 dark:text-amber-400 border-l border-slate-200 dark:border-slate-700">
                        {continuousAvg !== null ? `${continuousAvg}` : '—'}
                      </td>
                    )}
                    {showTest1Col && (
                      <td className="p-2.5 text-center font-mono text-emerald-700 dark:text-emerald-400 border-l border-slate-200 dark:border-slate-700">
                        {test1Avg !== null ? `${test1Avg}` : '—'}
                      </td>
                    )}
                    {showTest2Col && (
                      <td className="p-2.5 text-center font-mono text-teal-700 dark:text-teal-400 border-l border-slate-200 dark:border-slate-700">
                        {test2Avg !== null ? `${test2Avg}` : '—'}
                      </td>
                    )}
                    {showExamCol && (
                      <td className="p-2.5 text-center font-mono text-purple-700 dark:text-purple-400 border-l border-slate-200 dark:border-slate-700">
                        {examAvg !== null ? `${examAvg}` : '—'}
                      </td>
                    )}
                    {showAverageCol && (
                      <td className="p-3 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 font-mono text-sm">
                        {gradesReport.classAverage !== null ? gradesReport.classAverage.toFixed(2) : '—'}
                      </td>
                    )}
                    {showAppraisalAndRankCol && (
                      <td colSpan={2} className="p-3 text-center text-slate-500 font-normal">
                        نسبة النجاح: {gradesReport.passRate}%
                      </td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 6. Formula Explanation Modal */}
      {isFormulaHelpOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span>أنظمة وطرق حساب المعدلات في Ostad DZ</span>
              </div>
              <button
                onClick={() => setIsFormulaHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  1. المعدل الموزون بالمعاملات (الافتراضي والمرن)
                </h4>
                <p>
                  يتم حساب معدل كل تلميذ بضرب علامته في كل تقييم بمعامله المحدد ثم قسمة المجموع على مجموع المعاملات:
                </p>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded-lg mt-1.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                  المعدل = (نقطة 1 × م1 + نقطة 2 × م2 + ...) ÷ (م1 + م2 + ...)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  2. النظام الوزاري الجزائري للتعليم المتوسط والثانوي
                </h4>
                <p>
                  يعتمد المنشور الوزاري للتقويم التربوي: التقويم المستمر (معامل 1) + معدل الفروض (معامل 1) + الاختبار الفصلي (معامل 2 أو 3):
                </p>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded-lg mt-1.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">
                  المعدل = (التقويم + معدل الفروض + الاختبار × المعامل) ÷ (2 + المعامل)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  3. المعدل الحسابي البسيط
                </h4>
                <p>
                  جمع علامات التقييمات المقامة وقسمتها على عددها دون تطبيق أي معاملات تفضيلية.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsFormulaHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Official Printable Deliberation / Grade Sheet Modal */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div 
            id="printable-deliberation-sheet"
            className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-4 print:p-0 print:shadow-none print:w-full"
          >
            {/* Action buttons (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>محضر النقاط والمداولات الرسمي (جاهز للتصدير والطباعة)</span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {/* Export PDF */}
                <button
                  onClick={handleExportGradesPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="تصدير محضر النقاط إلى ملف PDF حقيقي"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>تصدير PDF</span>
                    </>
                  )}
                </button>

                {/* Export Word */}
                <button
                  onClick={handleExportGradesWord}
                  disabled={isExportingWord}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  title="تصدير محضر النقاط إلى ملف Word (.docx) قابل للتعديل"
                >
                  {isExportingWord ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التجهيز...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>تصدير Word</span>
                    </>
                  )}
                </button>

                {/* Direct Print */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>طباعة سريعة</span>
                </button>

                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification message inside modal */}
            {exportSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            {exportErrorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in">
                <span className="w-4 h-4 text-rose-600 shrink-0 font-bold">⚠️</span>
                <span>{exportErrorMessage}</span>
              </div>
            )}

            {/* Official Algerian School Header */}
            <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
              <h3 className="font-bold text-sm sm:text-base">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
              <h4 className="font-bold text-xs sm:text-sm text-slate-700">وزارة التربية الوطنية</h4>
              <div className="flex items-center justify-between text-xs pt-2 font-semibold">
                <span>مديرية التربية لولاية: {profile.wilaya || 'الجزائر'}</span>
                <span>المؤسسة: {profile.schoolName || 'ثانوية الإخوة حامية'}</span>
                <span>السنة الدراسية: {profile.academicYear || '2024 - 2025'}</span>
              </div>
              <div className="pt-3">
                <h2 className="text-lg font-black underline tracking-wide">
                  محضر نقاط ومداولات مادة {activeClass.subject} - {TRIMESTER_INFO[selectedTrimester === 'ALL' ? 'T1' : selectedTrimester].label}
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  القسم: {activeClass.name} • الأستاذ: {profile.fullName || 'أستاذ المادة'}
                </p>
              </div>
            </div>

            {/* Printable Table */}
            <table className="w-full text-right border-collapse text-xs border border-slate-400">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-8">#</th>
                  <th className="border border-slate-400 p-2 text-right">اللقب والاسم</th>
                  {showContinuousCol && (
                    <th className="border border-slate-400 p-2">
                      <div>التقويم المستمر</div>
                      <div className="text-[10px] font-normal text-slate-600">(/20)</div>
                    </th>
                  )}
                  {showTest1Col && (
                    <th className="border border-slate-400 p-2">
                      <div>الفرض الأول</div>
                      <div className="text-[10px] font-normal text-slate-600">(/20)</div>
                    </th>
                  )}
                  {showTest2Col && (
                    <th className="border border-slate-400 p-2">
                      <div>الفرض الثاني</div>
                      <div className="text-[10px] font-normal text-slate-600">(/20)</div>
                    </th>
                  )}
                  {showExamCol && (
                    <th className="border border-slate-400 p-2">
                      <div>اختبار الفصل</div>
                      <div className="text-[10px] font-normal text-slate-600">(/20)</div>
                    </th>
                  )}
                  <th className="border border-slate-400 p-2 bg-slate-200">المعدل / 20</th>
                  <th className="border border-slate-400 p-2">التقدير</th>
                  <th className="border border-slate-400 p-2 w-12">الرتبة</th>
                </tr>
              </thead>
              <tbody>
                {gradesReport.studentResults.map((r, idx) => (
                  <tr key={r.studentId} className="border-b border-slate-300">
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-bold">
                      {r.student.lastName} {r.student.firstName}
                    </td>
                    {showContinuousCol && (
                      <td className="border border-slate-300 p-1.5 text-center font-mono">
                        {getStudentScoreValue(r.studentId, 'continuous') !== '' ? getStudentScoreValue(r.studentId, 'continuous') : '—'}
                      </td>
                    )}
                    {showTest1Col && (
                      <td className="border border-slate-300 p-1.5 text-center font-mono">
                        {getStudentScoreValue(r.studentId, 'test1') !== '' ? getStudentScoreValue(r.studentId, 'test1') : '—'}
                      </td>
                    )}
                    {showTest2Col && (
                      <td className="border border-slate-300 p-1.5 text-center font-mono">
                        {getStudentScoreValue(r.studentId, 'test2') !== '' ? getStudentScoreValue(r.studentId, 'test2') : '—'}
                      </td>
                    )}
                    {showExamCol && (
                      <td className="border border-slate-300 p-1.5 text-center font-mono">
                        {getStudentScoreValue(r.studentId, 'exam') !== '' ? getStudentScoreValue(r.studentId, 'exam') : '—'}
                      </td>
                    )}
                    <td className="border border-slate-300 p-1.5 text-center font-black font-mono bg-slate-50">
                      {r.average !== null ? r.average.toFixed(2) : '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-semibold">
                      {r.appraisal?.label || '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">
                      {r.rank || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Official Summary & Signatures Footer */}
            <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 text-xs">
              <div className="space-y-1">
                <p><strong>معدل القسم:</strong> {gradesReport.classAverage ? `${gradesReport.classAverage} / 20` : '—'}</p>
                <p><strong>نسبة النجاح:</strong> {gradesReport.passRate}% ({gradesReport.passCount} تلميذ ناجح)</p>
                <p><strong>أعلى معدل:</strong> {gradesReport.highestAverage?.value || '—'}</p>
              </div>
              <div className="text-left space-y-8 pl-4">
                <p>حرر بـ: {profile.wilaya?.slice(5) || 'الجزائر'} في: {new Date().toLocaleDateString('ar-DZ')}</p>
                <p className="font-bold underline">توقيع وختم أستاذ المادة:</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Student Subject Calculation Breakdown Modal */}
      {breakdownModalData && (
        <StudentSubjectBreakdownModal
          isOpen={Boolean(breakdownModalData)}
          onClose={() => setBreakdownModalData(null)}
          student={breakdownModalData.student}
          calculationResult={breakdownModalData.calculationResult}
          subjectName={activeSubjectName}
        />
      )}
    </div>
  );
};
