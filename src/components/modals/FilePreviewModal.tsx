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
  BookOpen,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { LibraryItem, LibraryFileRecord } from '../../types';
import { databaseService } from '../../db/databaseService';
import { convertDocxBlobToHtml } from '../../utils/docxPreviewService';
import { downloadBlobFile, openBlobInNewTab, formatFileSize } from '../../utils/fileHelpers';

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

  // Local DOCX preview state
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
      setFileRecord(null);
      setDocxHtml(null);
      setDocxError(null);
      return;
    }

    const ext = (item.fileExtension || '').toLowerCase();
    const isDocx = ext === 'docx';

    if (item.itemType === 'file' && item.fileId) {
      setLoading(true);
      setDocxHtml(null);
      setDocxError(null);

      databaseService.getLibraryFile(item.fileId)
        .then(async (record) => {
          if (record && record.blob) {
            setFileRecord(record);
            
            // Ensure proper MIME for PDF if needed
            let displayBlob = record.blob;
            if (ext === 'pdf' && displayBlob.type !== 'application/pdf') {
              displayBlob = new Blob([displayBlob], { type: 'application/pdf' });
            }
            
            const url = URL.createObjectURL(displayBlob);
            setFileUrl(url);

            // If it's a Word .docx document, parse its content locally with mammoth
            if (isDocx) {
              setDocxLoading(true);
              try {
                const result = await convertDocxBlobToHtml(record.blob);
                if (result.success && result.html) {
                  setDocxHtml(result.html);
                } else {
                  setDocxError(result.error || 'تعذر استخراج النص من المستند');
                }
              } catch (err: any) {
                setDocxError('حدث خطأ أثناء معالجة المستند محلياً');
              } finally {
                setDocxLoading(false);
              }
            }
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
    } else if (docxHtml) {
      // Copy raw text extracted from docx
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = docxHtml;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (fileRecord && fileRecord.blob && item.fileName) {
      downloadBlobFile(fileRecord.blob, item.fileName);
    } else if (fileUrl && item.fileName) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.itemType === 'note' && item.content) {
      const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' });
      downloadBlobFile(blob, `${item.title.replace(/\s+/g, '_')}.txt`);
    }
  };

  const handleOpenPdfInNewTab = () => {
    if (fileRecord && fileRecord.blob) {
      let pdfBlob = fileRecord.blob;
      if (pdfBlob.type !== 'application/pdf') {
        pdfBlob = new Blob([pdfBlob], { type: 'application/pdf' });
      }
      openBlobInNewTab(pdfBlob, item.fileName);
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const ext = (item.fileExtension || '').toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isPdf = ext === 'pdf';
  const isDocx = ext === 'docx';
  const isDoc = ext === 'doc';
  const isWord = isDocx || isDoc;

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
                  onClick={handlePrint}
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
                  <p className="text-sm font-medium">جاري فتح وتجهيز الملف...</p>
                </div>
              ) : fileUrl ? (
                isImage ? (
                  /* Image Viewer */
                  <div className="w-full flex flex-col items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-hidden flex items-center justify-center">
                      <img 
                        src={fileUrl} 
                        alt={item.title} 
                        className="max-h-[65vh] max-w-full object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownload}
                        className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow transition flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل الصورة</span>
                      </button>
                      <button
                        onClick={handlePrint}
                        className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة</span>
                      </button>
                    </div>
                  </div>
                ) : isPdf ? (
                  /* PDF Viewer */
                  <div className="w-full flex flex-col gap-3">
                    {/* PDF Toolbar */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>مستند PDF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenPdfInNewTab}
                          className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center gap-1.5"
                          title="عرض المستند في نافذة كاملة أو عبر قارئ PDF بهاتفك"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح في قارئ الهاتف / تبويب جديد</span>
                        </button>
                        <button
                          onClick={handleDownload}
                          className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل الملف</span>
                        </button>
                      </div>
                    </div>

                    {/* PDF Embedded View */}
                    <div className="w-full h-[60vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
                      <iframe 
                        src={fileUrl} 
                        title={item.title} 
                        className="w-full flex-1 border-0"
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                      💡 في الهواتف المحمولة: إذا لم يظهر المستند داخل الإطار، اضغط على زر "فتح في قارئ الهاتف" لعرضه بملء الشاشة عبر قارئ PDF المدمج بجهازك.
                    </p>
                  </div>
                ) : isDocx ? (
                  /* Local Word (.docx) Preview */
                  <div className="w-full flex flex-col gap-3">
                    {/* DOCX Toolbar */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>معاينة محتوى مستند Word</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {docxHtml && (
                          <>
                            <button
                              onClick={handleCopyNote}
                              className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                              title="نسخ نص المستند"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                            </button>
                            <button
                              onClick={handlePrint}
                              className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleDownload}
                          className="py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل ملف Word الأصلي (.docx)</span>
                        </button>
                      </div>
                    </div>

                    {/* DOCX Content Render */}
                    {docxLoading ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                          جاري استخراج ومعاينة نص مستند Word...
                        </p>
                      </div>
                    ) : docxHtml ? (
                      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[65vh] overflow-y-auto">
                        <div 
                          className="prose dark:prose-invert max-w-none font-sans text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 text-right [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mb-3 [&_h1]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:dark:text-slate-100 [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-700 [&_h3]:dark:text-slate-200 [&_h3]:mb-2 [&_p]:mb-2.5 [&_p]:leading-relaxed [&_p]:text-slate-800 [&_p]:dark:text-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-slate-700 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_td]:border [&_td]:border-slate-300 [&_td]:dark:border-slate-700 [&_td]:p-2 [&_ul]:list-disc [&_ul]:mr-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:mr-5 [&_ol]:mb-3"
                          dir="auto"
                          dangerouslySetInnerHTML={{ __html: docxHtml }}
                        />
                      </div>
                    ) : (
                      /* If docx parsing failed or had no text, provide full fallback card */
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md w-full mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                          {item.fileName || item.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                          مستند Microsoft Word محفوظ بأمان. يمكنك تحميله وتشغيله مباشرة بأي تطبيق متوافق (Word، WPS، LibreOffice).
                        </p>
                        <button
                          onClick={handleDownload}
                          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>تنزيل وفتح ملف Word</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Other files (Word .doc, Excel, PowerPoint, etc.) */
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md w-full">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isWord 
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                      {item.fileName || item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      ملف بصيغة ({item.fileExtension?.toUpperCase() || 'مستند'}) محفوظ بأمان. يمكنك فتحه أو حفظه مباشرة في جهازك.
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
                    هذا نموذج استرشادي من المكتبة الأولية. عند استيراد ملفاتك الخاصة (PDF، Word، صور)، ستتمكن من معاينتها وفتحها وتنزيلها بسهولة.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const dummyContent = `المؤسسة التعليمية: ثانوية العقيد لطفي\nعنوان الوثيقة: ${item.title}\nالمادة: ${item.subject}\nالقسم: ${item.className || 'عام'}\nالمجلد: ${item.folderName}\n\nهذه وثيقة بيداغوجية نموذجية خاصة بتطبيق أستاذ ديزاد.`;
                        const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
                        downloadBlobFile(blob, `${item.title}.txt`);
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
