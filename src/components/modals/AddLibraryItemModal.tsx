import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  ImageIcon, 
  File, 
  FolderPlus, 
  Folder, 
  GraduationCap, 
  BookOpen, 
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { ClassItem, LibraryItem, LibraryItemType, LibraryFileRecord } from '../../types';
import { databaseService } from '../../db/databaseService';
import { getSubjectsForGradeAndStage } from '../../data/algerianData';

interface AddLibraryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  existingFolders: string[];
  defaultSubject?: string;
  defaultFolder?: string;
  defaultClassId?: string;
  onItemAdded: (item: LibraryItem) => void;
}

const DEFAULT_PRESET_FOLDERS = [
  'فروض واختبارات',
  'ملخصات ودروس',
  'سلاسل تمارين',
  'وثائق بيداغوجية',
  'مخططات وتوزيعات',
  'عام'
];

export const AddLibraryItemModal: React.FC<AddLibraryItemModalProps> = ({
  isOpen,
  onClose,
  classes,
  existingFolders,
  defaultSubject = '',
  defaultFolder = 'عام',
  defaultClassId = '',
  onItemAdded,
}) => {
  const [tab, setTab] = useState<LibraryItemType>('file');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderName, setFolderName] = useState(defaultFolder);
  const [customFolder, setCustomFolder] = useState('');
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [subject, setSubject] = useState(defaultSubject || (classes[0]?.subject || 'الرياضيات'));
  const [classId, setClassId] = useState(defaultClassId);
  const [noteContent, setNoteContent] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync subject when modal opens or defaultSubject changes
  React.useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject || 'الرياضيات');
      setFolderName(defaultFolder);
      setClassId(defaultClassId);
    }
  }, [isOpen, defaultSubject, defaultFolder, defaultClassId]);

  // Combine default preset folders and existing teacher folders
  const allFolderOptions = Array.from(new Set([...DEFAULT_PRESET_FOLDERS, ...existingFolders]));

  // Selected class
  const selectedClass = classes.find((c) => c.id === classId) || null;

  const subjectOptions = React.useMemo(() => {
    if (selectedClass) {
      const gradeSubs = getSubjectsForGradeAndStage(selectedClass.stage, selectedClass.grade, [selectedClass.subject]);
      if (gradeSubs.length > 0) {
        return gradeSubs;
      }
    }
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.subject) set.add(c.subject.trim());
      const gradeSubs = getSubjectsForGradeAndStage(c.stage, c.grade, [c.subject]);
      gradeSubs.forEach((s) => set.add(s));
    });
    if (defaultSubject) set.add(defaultSubject.trim());
    if (set.size === 0) set.add('الرياضيات');
    return Array.from(set);
  }, [selectedClass, classes, defaultSubject]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
    // Auto populate title from filename without extension if empty
    if (!title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('يرجى كتابة عنوان للدرس أو الملف.');
      return;
    }

    const finalFolder = isCustomFolder ? (customFolder.trim() || 'عام') : folderName;
    const matchedClass = classes.find((c) => c.id === classId);

    if (tab === 'file') {
      if (!selectedFile) {
        setError('يرجى اختيار ملف من جهازك لحفظه في المكتبة.');
        return;
      }

      setIsSaving(true);
      try {
        const fileId = `lib_file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const ext = getFileExtension(selectedFile.name);

        // 1. Save large binary blob into IndexedDB LIBRARY_FILES object store
        const fileRecord: LibraryFileRecord = {
          id: fileId,
          name: selectedFile.name,
          type: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size,
          blob: selectedFile,
          updatedAt: Date.now(),
        };
        await databaseService.saveLibraryFile(fileRecord);

        // 2. Save metadata into IndexedDB LIBRARY store
        const newItem: LibraryItem = {
          id: `lib_item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: title.trim(),
          description: description.trim() || undefined,
          itemType: 'file',
          subject: (defaultSubject || subject || 'الرياضيات').trim(),
          classId: classId || undefined,
          className: matchedClass ? `${matchedClass.name} (${matchedClass.division || matchedClass.subject})` : undefined,
          folderName: finalFolder,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileExtension: ext,
          fileSize: selectedFile.size,
          fileId: fileId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await databaseService.saveLibraryItem(newItem);
        onItemAdded(newItem);
        onClose();
      } catch (err) {
        console.error('Failed to save file to IndexedDB:', err);
        setError('حدث خطأ أثناء حفظ الملف محلياً في IndexedDB.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Tab is 'note'
      if (!noteContent.trim()) {
        setError('يرجى كتابة محتوى الدرس أو الملاحظة.');
        return;
      }

      setIsSaving(true);
      try {
        const newItem: LibraryItem = {
          id: `lib_item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: title.trim(),
          description: description.trim() || undefined,
          itemType: 'note',
          subject: (defaultSubject || subject || 'الرياضيات').trim(),
          classId: classId || undefined,
          className: matchedClass ? `${matchedClass.name} (${matchedClass.division || matchedClass.subject})` : undefined,
          folderName: finalFolder,
          content: noteContent.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await databaseService.saveLibraryItem(newItem);
        onItemAdded(newItem);
        onClose();
      } catch (err) {
        console.error('Failed to save note to IndexedDB:', err);
        setError('حدث خطأ أثناء حفظ الملاحظة في IndexedDB.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                إضافة إلى مكتبة الدروس والملفات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حفظ محلي فوري وآمن داخل جهازك يعمل بدون إنترنت (IndexedDB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (File Upload vs Written Note) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setTab('file'); setError(null); }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                tab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف من الجهاز (PDF / Word / صور)</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('note'); setError(null); }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                tab === 'note'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>إضافة درس أو ملاحظة مكتوبة</span>
            </button>
          </div>

          {/* File Upload Drag & Drop Area */}
          {tab === 'file' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الملف التعليمي المراد حفظه محلياً:
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/70 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      اضغط لاختيار ملف من جهازك أو اسحبه وأفلته هنا
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      ندعم ملفات PDF، مستندات Word، العروض التقديمية، الجداول، والصور (PNG, JPG, WEBP)
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    تخزين غير محدود عبر IndexedDB (بدون إنترنت)
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        الحجم: {formatFileSize(selectedFile.size)} • النوع: {getFileExtension(selectedFile.name).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 rounded-xl transition"
                    title="إزالة الملف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان الملف أو الدرس: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: فرض محروس رقم 1 للفصل الأول، ملخص الدوال العددية..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              required
            />
          </div>

          {/* Folder, Subject and Class Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Folder selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المجلد:
              </label>
              {!isCustomFolder ? (
                <div className="space-y-1.5">
                  <select
                    value={folderName}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomFolder(true);
                      } else {
                        setFolderName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  >
                    {allFolderOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="__NEW__">+ إنشاء مجلد جديد...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    placeholder="اسم المجلد الجديد"
                    className="flex-1 px-3 py-2 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomFolder(false)}
                    className="px-2 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* Subject (تلقائي من مادة تدريس الأستاذ) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>المادة</span>
              </label>
              <div className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {defaultSubject || subject || 'الرياضيات'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  تلقائي من إعدادات الأستاذ
                </span>
              </div>
            </div>

            {/* Class selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                القسم (اختياري):
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="">(عام لجميع الأقسام)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.division || cls.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات أو وصف بيداغوجي (اختياري):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: موجه لأقسام البكالوريا، يشمل سلم التنقيط وسلم توزيع النقاط..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Written Note Content if tab is note */}
          {tab === 'note' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                محتوى الدرس أو الملاحظة البيداغوجية: <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={7}
                placeholder="اكتب هنا عناصر الدرس، القوانين، الملاحظات الإرشادية، أو أسئلة التقويم..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-sans focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none leading-relaxed"
                required
              />
            </div>
          )}

          {/* Offline notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>سيتم حفظ هذا العنصر وملفاته مباشرة في متصفحك محلياً (IndexedDB) للاستخدام الدائم بدون إنترنت.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ في IndexedDB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ في المكتبة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
