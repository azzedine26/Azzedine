import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Users,
  Settings2,
  Filter,
  ArrowRight
} from 'lucide-react';
import { ClassItem, EducationalStage, StudentItem } from '../../types';
import {
  ExcelColumnMapping,
  ParsedStudentRow,
  autoDetectColumnMapping,
  parseExcelFile,
  validateAndAnalyzeExcelRows,
} from '../../utils/excelService';
import { EDUCATIONAL_STAGES, CLASS_COLORS } from '../../data/algerianData';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  existingStudents: StudentItem[];
  defaultClassId?: string;
  defaultAcademicYear?: string;
  defaultSubject?: string;
  defaultStage?: EducationalStage;
  onImportComplete: (
    importedStudents: StudentItem[],
    updatedStudents: StudentItem[],
    newClassCreated?: ClassItem
  ) => Promise<void>;
  onDownloadTemplate: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  existingStudents,
  defaultClassId = 'all',
  defaultAcademicYear = '2024 - 2025',
  defaultSubject = 'الرياضيات',
  defaultStage = 'middle',
  onImportComplete,
  onDownloadTemplate,
}) => {
  // Navigation & File state
  const [file, setFile] = useState<File | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Config state
  const [mapping, setMapping] = useState<ExcelColumnMapping>({
    firstName: '',
    lastName: '',
  });
  const [targetClassId, setTargetClassId] = useState<string>(
    defaultClassId !== 'all' && classes.some((c) => c.id === defaultClassId)
      ? defaultClassId
      : classes.length > 0
      ? classes[0].id
      : 'new_class'
  );
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'duplicate' | 'invalid'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New class inline creation state (if teacher decides to create class on the fly)
  const [newClassName, setNewClassName] = useState('');
  const [newClassStage, setNewClassStage] = useState<EducationalStage>(defaultStage);
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSubject, setNewClassSubject] = useState(defaultSubject);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize initial target class when opening
  useEffect(() => {
    if (isOpen) {
      if (defaultClassId !== 'all' && classes.some((c) => c.id === defaultClassId)) {
        setTargetClassId(defaultClassId);
      } else if (classes.length > 0) {
        setTargetClassId(classes[0].id);
      } else {
        setTargetClassId('new_class');
      }

      // Initialize new class defaults
      const currentStageGrades =
        EDUCATIONAL_STAGES.find((s) => s.id === defaultStage)?.grades || [];
      setNewClassGrade(currentStageGrades[0] || '');
      setNewClassStage(defaultStage);
      setNewClassSubject(defaultSubject);
    }
  }, [isOpen, defaultClassId, classes, defaultStage, defaultSubject]);

  // Reset modal state
  const resetState = () => {
    setFile(null);
    setIsReading(false);
    setErrorMessage('');
    setHeaders([]);
    setRawRows([]);
    setMapping({ firstName: '', lastName: '' });
    setShowMappingSettings(false);
    setFilterTab('all');
    setIsSubmitting(false);
    setNewClassName('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Process file upload
  const handleFileChange = async (selectedFile: File) => {
    setErrorMessage('');
    if (!selectedFile) return;

    // Check extension
    const validExts = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = selectedFile.name.toLowerCase();
    const isValidExt = validExts.some((ext) => fileNameLower.endsWith(ext));

    if (!isValidExt) {
      setErrorMessage('صيغة الملف غير مدعومة. يرجى اختيار ملف Excel بصيغة .xlsx أو .xls.');
      return;
    }

    setFile(selectedFile);
    setIsReading(true);

    try {
      const { headers: parsedHeaders, rawRows: rows } = await parseExcelFile(selectedFile);

      if (rows.length === 0) {
        setErrorMessage('الملف المرفق فارغ ولا يحتوي على أي صفوف أو بيانات تلاميذ.');
        setIsReading(false);
        return;
      }

      setHeaders(parsedHeaders);
      setRawRows(rows);

      // Auto-detect columns
      const detectedMapping = autoDetectColumnMapping(parsedHeaders);
      setMapping(detectedMapping);

      // If excel has a class column, suggest from_excel if no classes or if matches
      if (detectedMapping.className && targetClassId !== 'new_class') {
        // keep current targetClassId or allow user to switch
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء قراءة ملف Excel.');
    } finally {
      setIsReading(false);
    }
  };

  // Perform validation analysis whenever rawRows, mapping, targetClassId, or classes change
  const analysis = useMemo(() => {
    if (rawRows.length === 0) {
      return {
        totalRows: 0,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        rows: [] as ParsedStudentRow[],
      };
    }

    return validateAndAnalyzeExcelRows(
      rawRows,
      mapping,
      existingStudents,
      targetClassId,
      classes
    );
  }, [rawRows, mapping, existingStudents, targetClassId, classes]);

  // Filtered rows for table view
  const displayedRows = useMemo(() => {
    if (filterTab === 'all') return analysis.rows;
    return analysis.rows.filter((r) => r.status === filterTab);
  }, [analysis.rows, filterTab]);

  // Number of students that will actually be imported or updated
  const actionableCount = useMemo(() => {
    if (duplicateMode === 'skip') {
      return analysis.validCount;
    }
    return analysis.validCount + analysis.duplicateCount;
  }, [duplicateMode, analysis.validCount, analysis.duplicateCount]);

  // Handle final submission
  const handleConfirmImport = async () => {
    if (actionableCount === 0) return;

    let finalClassId = targetClassId;
    let newlyCreatedClass: ClassItem | undefined = undefined;

    // If teacher selected "new_class"
    if (targetClassId === 'new_class') {
      if (!newClassName.trim()) {
        setErrorMessage('يرجى كتابة اسم للقسم الجديد قبل تأكيد الاستيراد.');
        return;
      }

      newlyCreatedClass = {
        id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: newClassName.trim(),
        stage: newClassStage,
        grade: newClassGrade || 'السنة الرابعة متوسط',
        subject: newClassSubject || defaultSubject,
        academicYear: defaultAcademicYear,
        color: CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      finalClassId = newlyCreatedClass.id;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const studentsToAdd: StudentItem[] = [];
      const studentsToUpdate: StudentItem[] = [];

      for (const row of analysis.rows) {
        if (row.status === 'invalid') continue;

        // Determine destination class
        let classForThisStudent = finalClassId;
        if (finalClassId === 'from_excel' && row.className) {
          const matchedCls = classes.find(
            (c) =>
              c.name.trim().toLowerCase() === row.className.trim().toLowerCase()
          );
          if (matchedCls) {
            classForThisStudent = matchedCls.id;
          } else if (newlyCreatedClass) {
            classForThisStudent = newlyCreatedClass.id;
          } else if (classes.length > 0) {
            classForThisStudent = classes[0].id;
          }
        }

        if (row.status === 'valid') {
          studentsToAdd.push({
            id: row.id,
            classId: classForThisStudent,
            studentNumber: row.studentNumber || undefined,
            firstName: row.firstName,
            lastName: row.lastName,
            gender: row.gender,
            birthDate: row.birthDate || undefined,
            guardianPhone: row.guardianPhone || undefined,
            notes: row.notes || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else if (row.status === 'duplicate' && duplicateMode === 'update') {
          if (row.matchedExistingStudent) {
            studentsToUpdate.push({
              ...row.matchedExistingStudent,
              classId: classForThisStudent || row.matchedExistingStudent.classId,
              studentNumber: row.studentNumber || row.matchedExistingStudent.studentNumber,
              firstName: row.firstName || row.matchedExistingStudent.firstName,
              lastName: row.lastName || row.matchedExistingStudent.lastName,
              gender: row.gender,
              birthDate: row.birthDate || row.matchedExistingStudent.birthDate,
              guardianPhone: row.guardianPhone || row.matchedExistingStudent.guardianPhone,
              notes: row.notes || row.matchedExistingStudent.notes,
              updatedAt: Date.now(),
            });
          }
        }
      }

      await onImportComplete(studentsToAdd, studentsToUpdate, newlyCreatedClass);
      handleClose();
    } catch (err: any) {
      console.error('Error completing Excel import:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء حفظ التلاميذ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                استيراد قائمة التلاميذ من ملف Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                معالجة محلية آمنة 100% داخل المتصفح دون نقل بياناتك إلى أي خادم خارجي
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-slate-800 dark:text-slate-200">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: Upload & File Selection */}
          {!file || rawRows.length === 0 ? (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 transition shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>

                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    اضغط لاختيار ملف Excel من جهازك أو اسحبه إلى هنا
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    الملفات المدعومة: <span className="font-mono font-semibold">.xlsx</span>, <span className="font-mono font-semibold">.xls</span> (الحد الأقصى الموصى به: 500 تلميذ في الملف)
                  </p>
                </div>

                <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تحديد ملف من الهاتف أو الحاسوب</span>
                </div>
              </div>

              {/* Template Download Prompt */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-right">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      هل تحتاج إلى نموذج جاهز لتعبئة التلاميذ؟
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      يمكنك تنزيل نموذج Excel معتمد يحتوي على كافة الأعمدة المطلوبة وتعبئته مباشرة.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs font-bold transition flex items-center gap-2 shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تحميل نموذج Excel جاهز</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Preview & Validation Analysis */
            <div className="space-y-4">
              {/* Top File info bar with Change File button */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    الملف المحدد: {file.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setRawRows([]);
                    setHeaders([]);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 transition shrink-0"
                >
                  اختيار ملف آخر
                </button>
              </div>

              {/* Status Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-right">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    إجمالي الصفوف
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {analysis.totalRows}
                  </div>
                </div>

                {/* Valid */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-right">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>جاهز للاستيراد</span>
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {analysis.validCount}
                  </div>
                </div>

                {/* Duplicate */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-right">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>تلاميذ مكررين</span>
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {analysis.duplicateCount}
                  </div>
                </div>

                {/* Invalid */}
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-right">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>بيانات ناقصة</span>
                  </div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {analysis.invalidCount}
                  </div>
                </div>
              </div>

              {/* Clarification Alert */}
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>
                  تم العثور على <strong>{analysis.validCount}</strong> تلميذًا صالحًا
                  {analysis.duplicateCount > 0 && (
                    <> و <strong>{analysis.duplicateCount}</strong> تلميذًا مكررًا</>
                  )}
                  {analysis.invalidCount > 0 && (
                    <> و <strong>{analysis.invalidCount}</strong> تلميذًا به بيانات ناقصة (تم استبعادهم)</>
                  )}
                  . راجع الجدول أدناه قبل الضغط على تأكيد الاستيراد.
                </span>
              </div>

              {/* Class Destination & Duplicate Strategy */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Target Class Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      القسم المستهدف لإلحاق التلاميذ:
                    </label>
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          قسم: {c.name} ({c.grade})
                        </option>
                      ))}
                      {mapping.className && (
                        <option value="from_excel">
                          استخدام عمود القسم من ملف Excel تلقائياً ({mapping.className})
                        </option>
                      )}
                      <option value="new_class">
                        + إنشاء قسم جديد خصيصاً لهذه القائمة
                      </option>
                    </select>
                  </div>

                  {/* 2. Duplicate Strategy Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      كيفية التعامل مع التلاميذ المكررين:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDuplicateMode('skip')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          duplicateMode === 'skip'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        تخطي المكررين (تجاهلهم)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateMode('update')}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center ${
                          duplicateMode === 'update'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        تحديث بيانات المكررين
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline New Class Fields if selected */}
                {targetClassId === 'new_class' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        اسم القسم الجديد *
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 4 متوسط 2 أو 3 ع ت 1"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        الطور والمستوى
                      </label>
                      <select
                        value={newClassGrade}
                        onChange={(e) => setNewClassGrade(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      >
                        {(EDUCATIONAL_STAGES.find((s) => s.id === newClassStage)?.grades || []).map(
                          (g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        المادة
                      </label>
                      <input
                        type="text"
                        value={newClassSubject}
                        onChange={(e) => setNewClassSubject(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Column Mapping Collapsible */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMappingSettings(!showMappingSettings)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مطابقة وتعيين الأعمدة يدوياً (انقر للتعديل إذا اختلفت التسميات)</span>
                  </div>
                  {showMappingSettings ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showMappingSettings && (
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Last Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        عمود اللقب *
                      </label>
                      <select
                        value={mapping.lastName}
                        onChange={(e) => setMapping((m) => ({ ...m, lastName: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختر عمود اللقب --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        عمود اسم التلميذ *
                      </label>
                      <select
                        value={mapping.firstName}
                        onChange={(e) => setMapping((m) => ({ ...m, firstName: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختر عمود الاسم --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Student Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم التسجيل
                      </label>
                      <select
                        value={mapping.studentNumber || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, studentNumber: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        الجنس
                      </label>
                      <select
                        value={mapping.gender || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, gender: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* BirthDate */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        تاريخ الميلاد
                      </label>
                      <select
                        value={mapping.birthDate || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, birthDate: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Guardian Phone */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        هاتف الولي
                      </label>
                      <select
                        value={mapping.guardianPhone || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, guardianPhone: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        القسم في Excel
                      </label>
                      <select
                        value={mapping.className || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, className: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        ملاحظات
                      </label>
                      <select
                        value={mapping.notes || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, notes: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- اختياري --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Tabs for Preview Table */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg transition ${
                      filterTab === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    الكل ({analysis.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('valid')}
                    className={`px-3 py-1 rounded-lg transition ${
                      filterTab === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-emerald-700 dark:text-slate-400'
                    }`}
                  >
                    جاهز ({analysis.validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('duplicate')}
                    className={`px-3 py-1 rounded-lg transition ${
                      filterTab === 'duplicate'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-amber-700 dark:text-slate-400'
                    }`}
                  >
                    مكرر ({analysis.duplicateCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('invalid')}
                    className={`px-3 py-1 rounded-lg transition ${
                      filterTab === 'invalid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-rose-700 dark:text-slate-400'
                    }`}
                  >
                    ناقص ({analysis.invalidCount})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">
                  عرض {displayedRows.length} من أصل {analysis.totalRows}
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">الحالة</th>
                      <th className="py-2.5 px-3">اللقب</th>
                      <th className="py-2.5 px-3">الاسم</th>
                      <th className="py-2.5 px-3">رقم التسجيل</th>
                      <th className="py-2.5 px-3">الجنس</th>
                      <th className="py-2.5 px-3">الميلاد</th>
                      <th className="py-2.5 px-3">توضيح التدقيق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          لا توجد عناصر توافق هذا الفلتر
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`transition ${
                            row.status === 'valid'
                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                              : row.status === 'duplicate'
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>صالح</span>
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="w-3 h-3" />
                                <span>مكرر</span>
                              </span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                <AlertCircle className="w-3 h-3" />
                                <span>ناقص</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                            {row.lastName || <span className="text-rose-500 italic">مفقود</span>}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                            {row.firstName || <span className="text-rose-500 italic">مفقود</span>}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {row.studentNumber || '-'}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.gender === 'female'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                  : 'bg-sky-100 dark:bg-sky-950 text-sky-600'
                              }`}
                            >
                              {row.gender === 'female' ? 'أنثى' : 'ذكر'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                            {row.birthDate || '-'}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {row.validationMessage}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إلغاء
          </button>

          {file && rawRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting || actionableCount === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition flex items-center gap-2 transform active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ محلياً...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      تأكيد استيراد ({actionableCount}) {actionableCount === 1 ? 'تلميذ' : 'تلاميذ'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
