import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ImageIcon, 
  FileSpreadsheet, 
  BookOpen, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  Folder, 
  File,
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { LibraryItem } from '../../types';
import { databaseService } from '../../db/databaseService';
import { generateLibraryItemThumbnail } from '../../utils/fileThumbnailService';
import { formatFileSize, downloadBlobFile } from '../../utils/fileHelpers';

interface LibraryItemCardProps {
  item: LibraryItem;
  onOpen: (item: LibraryItem) => void;
  onEdit: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  onThumbnailGenerated?: (id: string, thumbnailUrl: string) => void;
}

export const LibraryItemCard: React.FC<LibraryItemCardProps> = ({
  item,
  onOpen,
  onEdit,
  onDelete,
  onThumbnailGenerated
}) => {
  const [thumbnail, setThumbnail] = useState<string | undefined>(item.thumbnailUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // If item doesn't have a thumbnail yet, generate it on demand and persist to IndexedDB
  useEffect(() => {
    if (item.thumbnailUrl) {
      setThumbnail(item.thumbnailUrl);
      return;
    }

    let isCancelled = false;

    async function loadAndGenerateThumbnail() {
      setIsGenerating(true);
      try {
        let blob: Blob | undefined = undefined;
        if (item.itemType === 'file' && item.fileId) {
          const fileRecord = await databaseService.getLibraryFile(item.fileId);
          if (fileRecord && fileRecord.blob) {
            blob = fileRecord.blob;
          }
        }

        const generatedUrl = await generateLibraryItemThumbnail(item, blob);

        if (!isCancelled && isMountedRef.current && generatedUrl) {
          setThumbnail(generatedUrl);
          // Persist back to IndexedDB so it's only generated once
          const updatedItem: LibraryItem = {
            ...item,
            thumbnailUrl: generatedUrl,
            updatedAt: Date.now()
          };
          await databaseService.saveLibraryItem(updatedItem);
          if (onThumbnailGenerated) {
            onThumbnailGenerated(item.id, generatedUrl);
          }
        }
      } catch (err) {
        console.warn('Background thumbnail generation error:', err);
      } finally {
        if (!isCancelled && isMountedRef.current) {
          setIsGenerating(false);
        }
      }
    }

    loadAndGenerateThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [item.id, item.thumbnailUrl, item.fileId]);

  const ext = (item.fileExtension || '').toLowerCase();

  // Type styling details
  const getTypeBadge = () => {
    if (item.itemType === 'note') {
      return {
        label: 'مذكرة / درس',
        typeShort: 'Note',
        badgeColor: 'bg-amber-500 text-white shadow-sm',
        icon: BookOpen,
        borderAccent: 'group-hover:border-amber-400 dark:group-hover:border-amber-600',
        bgCover: 'bg-amber-50 dark:bg-amber-950/30'
      };
    }
    if (ext === 'pdf') {
      return {
        label: 'مستند PDF',
        typeShort: 'PDF',
        badgeColor: 'bg-rose-600 text-white shadow-sm',
        icon: FileText,
        borderAccent: 'group-hover:border-rose-400 dark:group-hover:border-rose-600',
        bgCover: 'bg-rose-50 dark:bg-rose-950/30'
      };
    }
    if (['doc', 'docx', 'odt'].includes(ext)) {
      return {
        label: 'مستند Word',
        typeShort: 'Word',
        badgeColor: 'bg-blue-600 text-white shadow-sm',
        icon: FileText,
        borderAccent: 'group-hover:border-blue-400 dark:group-hover:border-blue-600',
        bgCover: 'bg-blue-50 dark:bg-blue-950/30'
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return {
        label: 'جدول Excel',
        typeShort: 'Excel',
        badgeColor: 'bg-emerald-600 text-white shadow-sm',
        icon: FileSpreadsheet,
        borderAccent: 'group-hover:border-emerald-400 dark:group-hover:border-emerald-600',
        bgCover: 'bg-emerald-50 dark:bg-emerald-950/30'
      };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return {
        label: 'صورة',
        typeShort: 'Image',
        badgeColor: 'bg-teal-600 text-white shadow-sm',
        icon: ImageIcon,
        borderAccent: 'group-hover:border-teal-400 dark:group-hover:border-teal-600',
        bgCover: 'bg-teal-50 dark:bg-teal-950/30'
      };
    }
    return {
      label: ext.toUpperCase() || 'ملف',
      typeShort: ext.toUpperCase() || 'DOC',
      badgeColor: 'bg-slate-700 text-white shadow-sm',
      icon: File,
      borderAccent: 'group-hover:border-slate-400 dark:group-hover:border-slate-600',
      bgCover: 'bg-slate-100 dark:bg-slate-800'
    };
  };

  const badge = getTypeBadge();
  const TypeIcon = badge.icon;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);

    try {
      if (item.itemType === 'note') {
        const noteText = `${item.title}\n\nالمادة: ${item.subject}${item.className ? ` | القسم: ${item.className}` : ''}\nالتاريخ: ${new Date(item.createdAt).toLocaleDateString('ar-DZ')}\n\n---\n\n${item.content || ''}`;
        const blob = new Blob([noteText], { type: 'text/markdown;charset=utf-8' });
        const cleanName = `${item.title.replace(/[\/\\?%*:|"<>]/g, '_')}.md`;
        downloadBlobFile(blob, cleanName);
      } else if (item.fileId) {
        const fileRecord = await databaseService.getLibraryFile(item.fileId);
        if (fileRecord && fileRecord.blob) {
          const downloadName = item.fileName || `${item.title}.${item.fileExtension || 'bin'}`;
          downloadBlobFile(fileRecord.blob, downloadName);
        } else {
          // If record missing, create clean text representation
          const blob = new Blob([item.title], { type: 'text/plain;charset=utf-8' });
          downloadBlobFile(blob, item.fileName || `${item.title}.txt`);
        }
      } else {
        // Sample item download
        const blob = new Blob([`${item.title}\n${item.description || ''}`], { type: 'text/plain;charset=utf-8' });
        downloadBlobFile(blob, item.fileName || `${item.title}.txt`);
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        if (isMountedRef.current) setDownloadSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      if (isMountedRef.current) setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={() => onOpen(item)}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer ${badge.borderAccent}`}
    >
      <div>
        {/* ================= 1. VISUAL PREVIEW SECTION (TOP) ================= */}
        <div className={`relative h-44 sm:h-48 w-full ${badge.bgCover} overflow-hidden border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-center`}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover sm:object-contain bg-slate-950/5 dark:bg-slate-950/40 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-slate-400 dark:text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold">جاري إنشاء المعاينة...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-sm flex items-center justify-center">
                <TypeIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {badge.label}
              </span>
            </div>
          )}

          {/* Type Badge in Top Right Corner */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 ${badge.badgeColor}`}>
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{badge.typeShort}</span>
            </span>
          </div>

          {/* Folder Tag in Top Left Corner */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/75 text-white backdrop-blur-sm flex items-center gap-1">
              <Folder className="w-3 h-3 text-emerald-400" />
              <span className="max-w-[110px] truncate">{item.folderName}</span>
            </span>
          </div>

          {/* Hover Overlay with Quick "فتح المعاينة" action */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
            <span className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-black shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>معاينة المستند</span>
            </span>
          </div>
        </div>

        {/* ================= 2. FILE INFO & METADATA SECTION ================= */}
        <div className="p-3.5 sm:p-4">
          {/* File Title */}
          <h3 
            className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug"
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Original File Name if different */}
          {item.itemType === 'file' && item.fileName && item.fileName !== item.title ? (
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mb-2 dir-ltr text-right">
              {item.fileName}
            </div>
          ) : item.description ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">
              {item.description}
            </p>
          ) : (
            <div className="h-2 mb-1" />
          )}

          {/* Subject & Class Tags */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 dark:text-slate-300 mb-2">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
              {item.subject}
            </span>
            {item.className && (
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded font-bold truncate max-w-[130px]">
                {item.className}
              </span>
            )}
          </div>

          {/* Size & Date metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {item.fileSize ? formatFileSize(item.fileSize) : 'مذكرة نصية'}
            </span>
            <span>•</span>
            <span className="text-[11px]">
              {new Date(item.createdAt).toLocaleDateString('ar-DZ')}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 3. ACTIONS BAR (BOTTOM) ================= */}
      <div 
        className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Quick Open and Direct Download buttons */}
        <div className="flex items-center gap-1.5">
          {/* فتح (Open) */}
          <button
            onClick={() => onOpen(item)}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="فتح ومعاينة المستند"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>فتح</span>
          </button>

          {/* تحميل (Download) */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="تنزيل الملف مباشرة إلى جهازك"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {downloadSuccess ? 'تم التحميل' : 'تحميل'}
            </span>
          </button>
        </div>

        {/* Right: Edit & Delete buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
            title="إعادة تسمية / تعديل"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
            title="حذف من المكتبة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
