import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Database, 
  Download, 
  Upload, 
  Smartphone, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  User,
  School,
  MapPin,
  BookOpen,
  Info,
  GraduationCap,
  Check,
  Plus,
  Layers,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { AppSettings, TeacherProfile, ThemeMode, SubjectSetting, EducationalStage } from '../../types';
import { 
  ALGERIAN_WILAYAS, 
  COMMON_SUBJECTS,
  MIDDLE_SUBJECTS_LIST,
  SECONDARY_SUBJECTS_LIST
} from '../../data/algerianData';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { SubjectSettingsSection } from '../settings/SubjectSettingsSection';

interface SettingsViewProps {
  settings: AppSettings;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onSaveProfile: (profile: TeacherProfile) => Promise<void>;
  onSaveStage?: (stage: EducationalStage, specializedSubject: string) => Promise<void>;
  onOpenStageWizard?: () => void;
  onExportBackup: () => Promise<void>;
  onImportBackup: (jsonString: string) => Promise<{ classesCount: number; studentsCount: number }>;
  onResetToSampleData: () => Promise<void>;
  classesCount: number;
  studentsCount: number;
  subjectSettings?: SubjectSetting[];
  onOpenAddSubject?: () => void;
  onOpenEditSubject?: (subject: SubjectSetting) => void;
  onDeleteSubject?: (subject: SubjectSetting) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  theme,
  onThemeChange,
  onSaveProfile,
  onSaveStage,
  onOpenStageWizard,
  onExportBackup,
  onImportBackup,
  onResetToSampleData,
  classesCount,
  studentsCount,
  subjectSettings = [],
  onOpenAddSubject,
  onOpenEditSubject,
  onDeleteSubject,
}) => {
  const { isInstallable, install, isIOS, isInstalled } = usePWAInstall();

  // Stage & Subject State
  const [stage, setStage] = useState<EducationalStage>(settings.educationalStage || 'secondary');
  const [specializedSubject, setSpecializedSubject] = useState<string>(settings.profile.subject || COMMON_SUBJECTS[0]);
  const [customSpecializedInput, setCustomSpecializedInput] = useState<string>('');
  const [stageSavedFeedback, setStageSavedFeedback] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  // Profile Form state
  const [fullName, setFullName] = useState(settings.profile.fullName || '');
  const [wilaya, setWilaya] = useState(settings.profile.wilaya || ALGERIAN_WILAYAS[15]);
  const [schoolName, setSchoolName] = useState(settings.profile.schoolName || '');
  const [subject, setSubject] = useState(settings.profile.subject || COMMON_SUBJECTS[0]);
  const [academicYear, setAcademicYear] = useState(settings.profile.academicYear || '2024 - 2025');
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Sync settings when they change externally
  useEffect(() => {
    if (settings.educationalStage) {
      setStage(settings.educationalStage);
    }
    if (settings.profile.subject) {
      setSpecializedSubject(settings.profile.subject);
      setSubject(settings.profile.subject);
    }
  }, [settings]);

  // Handle stage selection
  const handleStageChange = (newStage: EducationalStage) => {
    setStage(newStage);
    setStageError(null);
    if (newStage === 'middle') {
      if (!MIDDLE_SUBJECTS_LIST.includes(specializedSubject)) {
        setSpecializedSubject(MIDDLE_SUBJECTS_LIST[0]);
      }
    } else if (newStage === 'secondary') {
      if (!SECONDARY_SUBJECTS_LIST.includes(specializedSubject)) {
        setSpecializedSubject(SECONDARY_SUBJECTS_LIST[0]);
      }
    }
  };

  const handleSaveStageSettings = async () => {
    setStageError(null);
    let finalSpec = specializedSubject.trim();
    if (customSpecializedInput.trim()) {
      finalSpec = customSpecializedInput.trim();
    }

    if (!finalSpec) {
      setStageError('يرجى تحديد مادة التخصص الواحدة.');
      return;
    }

    if (onSaveStage) {
      await onSaveStage(stage, finalSpec);
    } else {
      await onSaveProfile({
        ...settings.profile,
        subject: finalSpec,
        stage,
      });
    }

    setSubject(finalSpec);
    setStageSavedFeedback(true);
    setTimeout(() => setStageSavedFeedback(false), 3500);
  };

  // Backup & Restore states
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    await onSaveProfile({
      fullName: fullName.trim(),
      wilaya,
      schoolName: schoolName.trim(),
      subject: cleanSubject,
      academicYear: academicYear.trim(),
    });
    setSpecializedSubject(cleanSubject);
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await onImportBackup(text);
      setBackupMessage({
        type: 'success',
        text: `تم استرجاع النسخة الاحتياطية بنجاح! (${res.classesCount} قسم، ${res.studentsCount} طالب).`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'فشل قراءة الملف';
      setBackupMessage({
        type: 'error',
        text: `خطأ أثناء الاستيراد: ${errorMessage}`,
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في استعادة البيانات الافتراضية؟ سيتم تعويض البيانات الحالية بنماذج تجريبية للمتوسط والثانوي.')) {
      setIsResetting(true);
      try {
        await onResetToSampleData();
        setBackupMessage({
          type: 'success',
          text: 'تمت استعادة البيانات النموذجية بنجاح.',
        });
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            الإعدادات وتفضيلات التطبيق
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          تخصيص بيانات الأستاذ، المظهر، وإدارة النسخ الاحتياطي واسترجاع السجلات.
        </p>
      </div>

      {/* Feedback Messages */}
      {backupMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold border ${
            backupMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {backupMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{backupMessage.text}</span>
          </div>
          <button
            onClick={() => setBackupMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 1. Theme Setting */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          مظهر التطبيق (Light / Dark Mode)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          اختر النمط المناسب لراحتك البصرية أثناء تسيير الحصص أو العمل ليلاً.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Sun className="w-4 h-4" />
            الوضع النهاري
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Moon className="w-4 h-4" />
            الوضع الليلي
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              theme === 'system'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            تلقائي (حسب الجهاز)
          </button>
        </div>
      </div>

      {/* 2. Educational Stage & Subjects System (نظام الطور التعليمي) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                نظام الطور التعليمي ومادة التدريس
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {stage === 'middle' ? 'التعليم المتوسط' : 'التعليم الثانوي'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              في المتوسط والثانوي: الأستاذ يستطيع تدريس عدة مستويات وأقسام مع تخصيص المادة لكل قسم باستقلالية.
            </p>
          </div>

          {onOpenStageWizard && (
            <button
              type="button"
              onClick={onOpenStageWizard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>معالج الطور السريع</span>
            </button>
          )}
        </div>

        {stageError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stageError}</span>
          </div>
        )}

        {/* 2 Stage Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Middle */}
          <div
            onClick={() => handleStageChange('middle')}
            className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-right ${
              stage === 'middle'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">📚</span>
              {stage === 'middle' && (
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
              التعليم المتوسط
            </h4>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
              تدريس عدة مستويات (1م - 4م)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              تدريس عدة مستويات وأفواج (من 1 إلى 4 متوسط BEM) وتعيين مادة كل قسم باستقلالية.
            </p>
          </div>

          {/* Secondary */}
          <div
            onClick={() => handleStageChange('secondary')}
            className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-right ${
              stage === 'secondary'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">🎓</span>
              {stage === 'secondary' && (
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
              التعليم الثانوي
            </h4>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 text-[10px] font-bold">
              تدريس عدة مستويات وشعب (1ث - 3ث)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              تدريس عدة مستويات وشعب (1 إلى 3 ثانوي بكالوريا) مع تعيين المادة لكل قسم بحرية.
            </p>
          </div>
        </div>

        {/* Specialized / Taught Subject Selection */}
        <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 space-y-3">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>مادة التدريس المعتمدة للأستاذ</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              اختر مادة تدريسك المقررة في الطور {stage === 'middle' ? 'المتوسط' : 'الثانوي'}، مع إمكانية تدريس عدة مستويات وأفواج وتعديل مادة أي قسم بشكل مستقل:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
            {(stage === 'middle' ? MIDDLE_SUBJECTS_LIST : SECONDARY_SUBJECTS_LIST).map((subj) => {
              const isSelected = specializedSubject === subj && !customSpecializedInput.trim();
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => {
                    setSpecializedSubject(subj);
                    setCustomSpecializedInput('');
                    setStageError(null);
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between text-right ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  <span className="truncate">{subj}</span>
                  {isSelected && <Check className="w-3 h-3 mr-1 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Custom Subject field */}
          <div className="pt-2 border-t border-sky-200/60 dark:border-sky-900/40">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              أو اكتب مادة التخصص يدوياً:
            </label>
            <input
              type="text"
              value={customSpecializedInput}
              onChange={(e) => {
                setCustomSpecializedInput(e.target.value);
                if (e.target.value.trim()) {
                  setSpecializedSubject(e.target.value.trim());
                }
                setStageError(null);
              }}
              placeholder="مثال: هندسة الطرائق، الإعلام الآلي، الفلسفة..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
        </div>

        {/* Save Stage Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs">
            {stageSavedFeedback && (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                تم حفظ الطور والمادة بنجاح!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveStageSettings}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition transform active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>حفظ إعدادات الطور والمادة</span>
          </button>
        </div>
      </div>

      {/* 3. Teacher Profile */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              بيانات الأستاذ والمؤسسة التربوية
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تظهر هذه البيانات في ترويسة التقارير ولوحة التحكم.
            </p>
          </div>
          {profileSavedFeedback && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              تم الحفظ!
            </span>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم ولقب الأستاذ
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أ. عبد القادر بن العربي"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المؤسسة التربوية
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="ثانوية الإخوة حامية أو متوسطة ابن باديس"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الولاية (مديرية التربية)
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              >
                {ALGERIAN_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مادة التخصص / التدريس المركزية
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="المادة الرسمية (مثال: الرياضيات)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                المصدر المركزي لكافة نماذج التطبيق (الأقسام، الحصص، التحضير، التقييمات والمكتبة).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الموسم الدراسي
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024 - 2025"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
            >
              حفظ معلومات الأستاذ
            </button>
          </div>
        </form>
      </div>

      {/* 3. Subject Settings & Calculation Methods (كيفية الحساب) */}
      <SubjectSettingsSection
        subjectSettings={subjectSettings}
        onOpenAddSubject={onOpenAddSubject || (() => {})}
        onOpenEditSubject={onOpenEditSubject || (() => {})}
        onDeleteSubject={onDeleteSubject || (() => {})}
      />

      {/* 4. Backup Management */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              النسخ الاحتياطي واسترجاع البيانات
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              يمكنك تصدير نسخة احتياطية من جميع السجلات والملفات واسترجاعها في أي وقت.
            </p>
          </div>
        </div>

        {/* Database records summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">الأقسام المحفوظة:</span>
            <span className="text-base font-black text-slate-900 dark:text-white">{classesCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block">الطلاب المسجلين:</span>
            <span className="text-base font-black text-slate-900 dark:text-white">{studentsCount}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block">حالة السجلات:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">نشطة ومحدثة</span>
          </div>
        </div>

        {/* Actions: Export, Import, Reset */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold hover:opacity-90 transition active:scale-95 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer active:scale-95 shadow-xs">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>استيراد نسخة احتياطية</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mr-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>استعادة البيانات النموذجية</span>
          </button>
        </div>
      </div>

      {/* 5. App Installation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          تثبيت التطبيق على الهاتف
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          يمكنك تثبيت تطبيق أستاذ ديزاد مباشرة على هاتفك أو حاسوبك للوصول السريع بضغطة واحدة من الشاشة الرئيسية.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-emerald-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق على هذا الجهاز</span>
            </button>
          )}

          {isInstalled && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>التطبيق مثبت وجاهز للاستخدام المباشر</span>
            </div>
          )}

          {isIOS && (
            <div className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              📱 <strong>للتثبيت على iPhone / iPad:</strong> اضغط على زر المشاركة (Share) في أسفل متصفح Safari، ثم اختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
