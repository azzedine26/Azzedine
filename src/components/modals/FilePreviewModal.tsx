import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Printer, 
  Copy, 
  Check, 
  Folder, 
  GraduationCap, 
  Calendar, 
  HardDrive,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { LibraryItem, LibraryFileRecord } from '../../types';
import { databaseService } from '../../db/databaseService';

interface FilePreviewModalProps {
  item: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ item, isOpen, onClose }) => {
  const [fileRecord, setFileRecord] = useState<LibraryFileRecord | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
      setFileRecord(null);
      return;
    }

    if (item.itemType === 'file' && item.fileId) {
      setLoading(true);
      databaseService.getLibraryFile(item.fileId)
        .then((record) => {
          if (record && record.blob) {
            setFileRecord(record);
            const url = URL.createObjectURL(record.blob);
            setFileUrl(url);
          } else {
            setFileRecord(null);
            setFileUrl(null);
          }
        })
        .catch((err) => {
          console.error('Failed to load library file blob:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleCopyNote = () => {
    if (item.content) {
      navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintNote = () => {
    window.print();
  };

  const handleDownload = () => {
    if (fileUrl && item.fileName) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.itemType === 'note' && item.content) {
      const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 كيلوبايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImage = item.fileExtension && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(item.fileExtension.toLowerCase());
  const isPdf = item.fileExtension && item.fileExtension.toLowerCase() === 'pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              item.itemType === 'note'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                : isPdf
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                : isImage
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
            }`}>
              {item.itemType === 'note' ? (
                <BookOpen className="w-5 h-5" />
              ) : isPdf ? (
                <FileText className="w-5 h-5" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {item.folderName}
                </span>
                <span>•</span>
                <span>{item.subject}</span>
                {item.className && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {item.className}
                    </span>
                  </>
                )}
                {item.fileSize && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatFileSize(item.fileSize)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.itemType === 'note' && (
              <>
                <button
                  onClick={handleCopyNote}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="نسخ النص"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handlePrintNote}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
              title="تحميل إلى الجهاز"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 dark:bg-slate-950/40">
          {item.description && (
            <div className="mb-4 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <strong className="block font-bold text-slate-900 dark:text-slate-100 mb-1">الوصف البيداغوجي:</strong>
              {item.description}
            </div>
          )}

          {/* If Note / Text */}
          {item.itemType === 'note' && (
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 selection:bg-emerald-100 dark:selection:bg-emerald-950">
                {item.content || 'لا يوجد محتوى نصي.'}
              </div>
            </div>
          )}

          {/* If File */}
          {item.itemType === 'file' && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {loading ? (
                <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">جاري تحميل واسترجاع الملف محلياً من جهازك...</p>
                </div>
              ) : fileUrl ? (
                isImage ? (
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-hidden flex items-center justify-center">
                    <img 
                      src={fileUrl} 
                      alt={item.title} 
                      className="max-h-[60vh] max-w-full object-contain rounded-xl"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="w-full h-[65vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                    <iframe 
                      src={fileUrl} 
                      title={item.title} 
                      className="w-full flex-1 border-0"
                    />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                      {item.fileName || item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      ملف بصيغة ({item.fileExtension?.toUpperCase() || 'مستند'}) محفوظ محلياً بأمان داخل المتصفح. يمكنك فتحه أو حفظه مباشرة.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>فتح / تنزيل الملف على جهازك</span>
                    </button>
                  </div>
                )
              ) : (
                /* Fallback when sample item has no blob stored yet */
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md w-full">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <File className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                    {item.fileName || item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    هذا نموذج استرشادي من المكتبة الأولية. عند رفع ملفاتك الحقيقية من جهازك، ستتمكن من معاينتها وفتحها مباشرة وبشكل دائم حتى دون اتصال بالإنترنت.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        // Create a dummy sample text blob if user clicks download
                        const dummyContent = `المؤسسة التعليمية: ثانوية العقيد لطفي\nعنوان الوثيقة: ${item.title}\nالمادة: ${item.subject}\nالقسم: ${item.className || 'عام'}\nالمجلد: ${item.folderName}\n\nهذه وثيقة بيداغوجية نموذجية خاصة بتطبيق أستاذ ديزاد.`;
                        const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${item.title}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل ملخص الوثيقة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>أُضيف بتاريخ: {new Date(item.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
