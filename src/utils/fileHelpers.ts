/**
 * Ostad DZ - Educational File Utilities & Validators
 * 
 * Handles file type detection, MIME normalization, client-side validation,
 * and seamless offline file downloads and openings.
 */

export const ACCEPTED_FILE_TYPES_ATTR = 
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedExt: string;
  detectedMime: string;
  category: 'pdf' | 'word' | 'image' | 'excel' | 'powerpoint' | 'text' | 'other';
}

const SUPPORTED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'doc',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
]);

/**
 * Normalizes file extension from file name.
 */
export function getNormalizedExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.trim().toLowerCase() || '';
}

/**
 * Resolves standard MIME type given extension and raw file.type.
 * Mobile operating systems often report blank or application/octet-stream
 * for Word and PDF documents.
 */
export function resolveMimeType(filename: string, rawMime?: string): string {
  const ext = getNormalizedExtension(filename);

  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'txt':
      return 'text/plain';
    default:
      if (rawMime && rawMime !== 'application/octet-stream') {
        return rawMime;
      }
      return 'application/octet-stream';
  }
}

/**
 * Categorizes a file for icon and preview rendering.
 */
export function getFileCategory(ext: string, mime?: string): FileValidationResult['category'] {
  const cleanExt = ext.toLowerCase();
  if (cleanExt === 'pdf' || mime === 'application/pdf' || mime === 'application/x-pdf') {
    return 'pdf';
  }
  if (['docx', 'doc'].includes(cleanExt) || mime?.includes('word') || mime?.includes('officedocument.wordprocessingml')) {
    return 'word';
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(cleanExt) || mime?.startsWith('image/')) {
    return 'image';
  }
  if (['xls', 'xlsx', 'csv'].includes(cleanExt) || mime?.includes('spreadsheet') || mime?.includes('excel')) {
    return 'excel';
  }
  if (['ppt', 'pptx'].includes(cleanExt) || mime?.includes('presentation') || mime?.includes('powerpoint')) {
    return 'powerpoint';
  }
  if (cleanExt === 'txt' || mime === 'text/plain') {
    return 'text';
  }
  return 'other';
}

/**
 * Thoroughly validates any uploaded educational file.
 * Explicitly accepts PDF, Word (.docx, .doc), and Images without restriction.
 */
export function validateSelectedFile(file: File): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'لم يتم اختيار أي ملف.',
      detectedExt: '',
      detectedMime: '',
      category: 'other',
    };
  }

  // 1. Zero size check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'الملف المختار فارغ (0 بايت). يرجى اختيار ملف صالح.',
      detectedExt: '',
      detectedMime: '',
      category: 'other',
    };
  }

  // 2. Large size sanity limit (100 MB for IndexedDB offline safety)
  const MAX_SIZE_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: 'حجم الملف كبير جداً (أكثر من 100 ميغابايت). يُرجى اختيار ملف أصغر حجماً لتوفير مساحة التخزين في جهازك.',
      detectedExt: '',
      detectedMime: '',
      category: 'other',
    };
  }

  // 3. Extract and normalize extension and mime
  const detectedExt = getNormalizedExtension(file.name);
  const detectedMime = resolveMimeType(file.name, file.type);
  const category = getFileCategory(detectedExt, detectedMime);

  // 4. Validate support
  const isExtensionSupported = SUPPORTED_EXTENSIONS.has(detectedExt);
  const isMimeSupported = 
    detectedMime.startsWith('image/') ||
    detectedMime.includes('pdf') ||
    detectedMime.includes('word') ||
    detectedMime.includes('officedocument') ||
    detectedMime.includes('excel') ||
    detectedMime.includes('powerpoint') ||
    detectedMime === 'text/plain';

  if (!isExtensionSupported && !isMimeSupported) {
    return {
      valid: false,
      error: `نوع الملف (.${detectedExt || 'غير معروف'}) غير مدعوم حالياً. الأنواع المدعومة: PDF، مستندات Word (.docx, .doc)، والصور (PNG, JPG, WEBP).`,
      detectedExt,
      detectedMime,
      category,
    };
  }

  return {
    valid: true,
    detectedExt,
    detectedMime,
    category,
  };
}

/**
 * Formats file size in Arabic units (بايت، ك.ب، م.ب، ج.ب).
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Triggers a local browser download for a blob or file without any external server.
 */
export function downloadBlobFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revoke to ensure browser completes the download stream
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Opens a blob (e.g. PDF or Image) in a new tab or triggers mobile PDF reader.
 */
export function openBlobInNewTab(blob: Blob, fileName?: string): void {
  const url = URL.createObjectURL(blob);
  const newWin = window.open(url, '_blank');
  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
    // Popup was blocked or mobile device requires download link
    downloadBlobFile(blob, fileName || 'document');
  }
}
