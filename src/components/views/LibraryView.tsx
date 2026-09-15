import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Search, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  File, 
  BookOpen, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  HardDrive, 
  Layers, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  LayoutGrid, 
  List, 
  UploadCloud,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { ClassItem, LibraryItem, LibraryItemType, TeacherProfile } from '../../types';
import { AddLibraryItemModal } from '../modals/AddLibraryItemModal';
import { FilePreviewModal } from '../modals/FilePreviewModal';
import { RenameLibraryItemModal } from '../modals/RenameLibraryItemModal';
import { LibraryItemCard } from '../library/LibraryItemCard';
import { getSubjectsForGradeAndStage } from '../../data/algerianData';
import { downloadBlobFile } from '../../utils/fileHelpers';
import { databaseService } from '../../db/databaseService';

interface LibraryViewProps {
  items: LibraryItem[];
  classes: ClassItem[];
  profile: TeacherProfile;
  onAddItem: (item: LibraryItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onRenameItem: (id: string, newTitle: string, newFolderName: string, newFileName?: string) => Promise<void>;
  onNavigateToClasses?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  items,
  classes,
  profile,
  onAddItem,
  onDeleteItem,
  onRenameItem,
  onNavigateToClasses,
}) => {
  // Navigation & Filter state
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'pdf' | 'word' | 'image' | 'note'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract all existing unique folders
  const existingFolders = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.folderName) set.add(item.folderName.trim());
    });
    return Array.from(set);
  }, [items]);

  // Extract all unique subjects (grade-aware for primary classes)
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (selectedClassId !== 'ALL') {
      const matched = classes.find((c) => c.id === selectedClassId);
      if (matched) {
        const gradeSubs = getSubjectsForGradeAndStage(matched.stage, matched.grade, [matched.subject]);
        gradeSubs.forEach((s) => set.add(s));
      }
      items
        .filter((i) => i.classId === selectedClassId)
        .forEach((i) => {
          if (i.subject) set.add(i.subject.trim());
        });
    } else {
      if (profile.subject) set.add(profile.subject.trim());
      classes.forEach((c) => {
        if (c.subject) set.add(c.subject.trim());
        const gradeSubs = getSubjectsForGradeAndStage(c.stage, c.grade, [c.subject]);
        gradeSubs.forEach((s) => set.add(s));
      });
      items.forEach((i) => {
        if (i.subject) set.add(i.subject.trim());
      });
    }
    return Array.from(set);
  }, [profile, classes, items, selectedClassId]);

  // Global Statistics
  const stats = useMemo(() => {
    let totalSize = 0;
    let filesCount = 0;
    let notesCount = 0;

    items.forEach((i) => {
      if (i.itemType === 'file') {
        filesCount++;
        totalSize += i.fileSize || 0;
      } else {
        notesCount++;
      }
    });

    return {
      totalItems: items.length,
      filesCount,
      notesCount,
      totalSize,
    };
  }, [items]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 كيلوبايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Folder filter
      if (selectedFolder !== 'ALL' && item.folderName !== selectedFolder) {
        return false;
      }

      // 2. Subject filter
      if (selectedSubject !== 'ALL' && item.subject !== selectedSubject) {
        return false;
      }

      // 3. Class filter
      if (selectedClassId !== 'ALL' && item.classId !== selectedClassId) {
        return false;
      }

      // 4. Type filter (pdf, word, image, note)
      if (selectedTypeFilter !== 'ALL') {
        if (selectedTypeFilter === 'note') {
          if (item.itemType !== 'note') return false;
        } else if (selectedTypeFilter === 'pdf') {
          if (item.fileExtension?.toLowerCase() !== 'pdf') return false;
        } else if (selectedTypeFilter === 'word') {
          const ext = item.fileExtension?.toLowerCase() || '';
          if (!['doc', 'docx', 'odt'].includes(ext)) return false;
        } else if (selectedTypeFilter === 'image') {
          const ext = item.fileExtension?.toLowerCase() || '';
          if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inFileName = (item.fileName || '').toLowerCase().includes(q);
        const inDesc = (item.description || '').toLowerCase().includes(q);
        const inContent = (item.content || '').toLowerCase().includes(q);
        const inFolder = item.folderName.toLowerCase().includes(q);
        const inSubject = item.subject.toLowerCase().includes(q);
        if (!inTitle && !inFileName && !inDesc && !inContent && !inFolder && !inSubject) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ar');
      if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return 0;
    });
  }, [items, selectedFolder, selectedSubject, selectedClassId, selectedTypeFilter, searchQuery, sortBy]);

  const confirmDelete = async () => {
    if (!deletingItemId) return;
    setIsDeleting(true);
    try {
      await onDeleteItem(deletingItemId);
      setDeletingItemId(null);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const getItemTypeDetails = (item: LibraryItem) => {
    if (item.itemType === 'note') {
      return {
        label: 'ملاحظة / درس',
        bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
        badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
        icon: BookOpen,
      };
    }
    const ext = (item.fileExtension || '').toLowerCase();
    if (ext === 'pdf') {
      return {
        label: 'PDF مستند',
        bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
        badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
        icon: FileText,
      };
    }
    if (['doc', 'docx', 'odt'].includes(ext)) {
      return {
        label: 'Word مستند',
        bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
        badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60',
        icon: FileText,
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return {
        label: 'Excel جدول',
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
        badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
        icon: FileSpreadsheet,
      };
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      return {
        label: 'صورة توضيحية',
        bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
        badge: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/60',
        icon: ImageIcon,
      };
    }
    return {
      label: ext.toUpperCase() || 'ملف',
      bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
      badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60',
      icon: File,
    };
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-l from-emerald-900 via-emerald-850 to-emerald-800 dark:from-slate-900 dark:via-slate-850 dark:to-emerald-950/80 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/30 text-[11px] font-black text-emerald-200 flex items-center gap-1">
                <Folder className="w-3 h-3" />
                مكتبة الأستاذ التربوية
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>مكتبة الدروس والملفات</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              تنظيم وإدارة الدروس، الفروض، المذكرات، وسلاسل التمارين بصيغ (PDF، Word، صور وملاحظات) مصنفة حسب الأقسام والمواد.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-black shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-700 stroke-[3]" />
              <span>إضافة ملف أو درس جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-emerald-700/50 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-800/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 text-emerald-200 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black">{stats.totalItems}</div>
              <div className="text-[11px] text-emerald-200/80">إجمالي العناصر</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-800/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 text-emerald-200 flex items-center justify-center shrink-0">
              <File className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black">{stats.filesCount}</div>
              <div className="text-[11px] text-emerald-200/80">ملف محفوظ</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-800/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 text-emerald-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black">{stats.notesCount}</div>
              <div className="text-[11px] text-emerald-200/80">مذكرة / درس</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-800/40 dark:bg-slate-800/60 border border-emerald-600/30 dark:border-slate-700/50 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 text-emerald-200 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black">{formatFileSize(stats.totalSize)}</div>
              <div className="text-[11px] text-emerald-200/80">إجمالي حجم الملفات</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Folders Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
            <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>المجلدات والتصنيفات:</span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ مجلد جديد</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedFolder('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 ${
              selectedFolder === 'ALL'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>جميع المجلدات</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              selectedFolder === 'ALL' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {items.length}
            </span>
          </button>

          {existingFolders.map((folder) => {
            const count = items.filter((i) => i.folderName === folder).length;
            const isSelected = selectedFolder === folder;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                <span>{folder}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، العنوان، المادة، أو محتوى المذكرة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                مسح
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">جميع المواد</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">جميع الأقسام</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="عرض شبكي"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Type Filter Pills & Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-slate-500 font-bold ml-1 shrink-0">النوع:</span>
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'pdf', label: 'PDF مستندات' },
              { id: 'word', label: 'Word ملفات' },
              { id: 'image', label: 'صور ورسومات' },
              { id: 'note', label: 'مذكرات وملاحظات' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeFilter(t.id as any)}
                className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  selectedTypeFilter === t.id
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-slate-500 font-bold">الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
            >
              <option value="newest">الأحدث إضافة</option>
              <option value="oldest">الأقدم</option>
              <option value="title">أبجدياً بالاسم</option>
              <option value="size">الأكبر حجماً</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Grid or List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 mb-1">
            لا توجد دروس أو ملفات مطابقة
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5">
            {searchQuery || selectedFolder !== 'ALL' || selectedTypeFilter !== 'ALL'
              ? 'جرّب تعديل كلمات البحث أو إلغاء التصفية لإظهار كافة عناصر المكتبة.'
              : 'ابدأ بإضافة أول ملف أو درس إلى مكتبتك لتتمكن من الوصول إليه في أي وقت.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة درس أو ملف جديد الآن</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW WITH VISUAL PREVIEW CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <LibraryItemCard
              key={item.id}
              item={item}
              onOpen={(selected) => setPreviewItem(selected)}
              onEdit={(selected) => setEditingItem(selected)}
              onDelete={(id) => setDeletingItemId(id)}
              onThumbnailGenerated={(id, thumb) => {
                // Update in-memory item state if needed
                item.thumbnailUrl = thumb;
              }}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map((item) => {
            const details = getItemTypeDetails(item);
            const TypeIcon = details.icon;

            const handleListDownload = async (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'note') {
                const noteText = `${item.title}\n\nالمادة: ${item.subject}\n\n---\n\n${item.content || ''}`;
                const blob = new Blob([noteText], { type: 'text/markdown;charset=utf-8' });
                downloadBlobFile(blob, `${item.title.replace(/\s+/g, '_')}.md`);
              } else if (item.fileId) {
                const fileRecord = await databaseService.getLibraryFile(item.fileId);
                if (fileRecord && fileRecord.blob) {
                  downloadBlobFile(fileRecord.blob, item.fileName || `${item.title}.${item.fileExtension || 'bin'}`);
                }
              }
            };

            return (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Thumbnail / Icon preview box */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 ${details.bg}`}>
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <TypeIcon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${details.badge}`}>
                        {details.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <Folder className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {item.folderName}
                      </span>
                      <span>•</span>
                      <span>{item.subject}</span>
                      {item.className && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-400">{item.className}</span>
                        </>
                      )}
                      {item.fileName && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{item.fileName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">
                      {item.fileSize ? formatFileSize(item.fileSize) : 'مذكرة نصية'}
                    </span>
                    <span className="text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('ar-DZ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1"
                      title="فتح ومعاينة"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">فتح</span>
                    </button>
                    <button
                      onClick={handleListDownload}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                      title="تحميل الملف"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span className="hidden sm:inline">تحميل</span>
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                      title="إعادة تسمية"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Item Modal */}
      <AddLibraryItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classes={classes}
        existingFolders={existingFolders}
        defaultSubject={profile.subject}
        defaultFolder={selectedFolder !== 'ALL' ? selectedFolder : 'عام'}
        defaultClassId={selectedClassId !== 'ALL' ? selectedClassId : ''}
        onItemAdded={(item) => {
          onAddItem(item);
        }}
      />

      {/* 2. File Preview / Viewer Modal */}
      <FilePreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* 3. Rename Modal */}
      <RenameLibraryItemModal
        item={editingItem}
        isOpen={!!editingItem}
        existingFolders={existingFolders}
        onClose={() => setEditingItem(null)}
        onSave={onRenameItem}
      />

      {/* 4. Delete Confirmation Dialog */}
      {deletingItemId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white text-center mb-1">
              تأكيد حذف العنصر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا العنصر وملفاته نهائياً من المكتبة؟ لن يمكنك استرجاعه بعد الحذف.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeletingItemId(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
