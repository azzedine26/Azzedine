/**
 * Ostad DZ - Educational File Thumbnail & Visual Preview Service
 * 
 * 100% Offline, Zero External APIs, Zero Server Uploads.
 * Generates and caches visual previews for PDF, Word, Excel, Images, and Notes.
 */

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { LibraryItem } from '../types';

// Configure PDF.js worker for offline client bundle
try {
  // Use local Vite bundled worker asset
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

/**
 * Utility to wrap text on a 2D canvas
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 6
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        // Last line with ellipsis
        ctx.fillText(line + '...', x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * 1. PDF THUMBNAIL GENERATOR (First Page Render)
 */
export async function generatePdfThumbnail(blob: Blob, title?: string): Promise<string> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages < 1) {
      throw new Error('PDF document has no pages');
    }

    const page = await pdfDoc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Target thumbnail width ~360px
    const targetWidth = 360;
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    // Fill white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext as any).promise;

    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.warn('PDF thumbnail generation fallback:', err);
    return generatePdfFallbackThumbnail(title || 'مستند PDF');
  }
}

/**
 * PDF Fallback Visual Thumbnail
 */
export function generatePdfFallbackThumbnail(title: string): string {
  const width = 360;
  const height = 230;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - clean card with subtle PDF red theme
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top header banner (PDF Crimson)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, width, 38);

  // PDF Badge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('PDF • مستند بيداغوجي', 18, 24);

  // Paper content mock
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(16, 50, width - 32, height - 66);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(16, 50, width - 32, height - 66);

  // Document Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.direction = 'rtl';
  wrapCanvasText(ctx, title, width - 32, 78, width - 64, 22, 2);

  // Document lines simulation
  ctx.fillStyle = '#cbd5e1';
  const lineYStart = 125;
  for (let i = 0; i < 4; i++) {
    const lineWidth = i % 2 === 0 ? width - 80 : width - 120;
    ctx.fillRect(width - 32 - lineWidth, lineYStart + i * 16, lineWidth, 6);
  }

  // Footer seal
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(42, height - 34, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText('1', 39, height - 30);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * 2. WORD THUMBNAIL GENERATOR (DOCX / DOC)
 */
export async function generateWordThumbnail(blob: Blob, title?: string, ext?: string): Promise<string> {
  const isDocx = (ext || '').toLowerCase() === 'docx';
  let extractedText = '';

  if (isDocx) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const extractFn = (mammoth as any).extractRawText || (mammoth as any).default?.extractRawText;
      if (typeof extractFn === 'function') {
        const res = await extractFn({ arrayBuffer });
        extractedText = (res.value || '').trim();
      }
    } catch (e) {
      console.warn('Word text extraction for thumbnail:', e);
    }
  }

  const width = 360;
  const height = 230;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Crisp document page
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top header banner (Word Blue)
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(0, 0, width, 38);

  // Word Badge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText('Word • مستند نصي', 18, 24);

  // Document Container
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(14, 48, width - 28, height - 60);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(14, 48, width - 28, height - 60);

  // Document Title
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.direction = 'rtl';
  const startY = wrapCanvasText(ctx, title || 'مستند وورد', width - 28, 72, width - 56, 20, 2);

  // Real extracted text preview if available
  if (extractedText && extractedText.length > 5) {
    ctx.fillStyle = '#334155';
    ctx.font = '11px system-ui, sans-serif';
    // Clean multiple empty lines
    const cleanText = extractedText.replace(/\n\s*\n/g, '\n').trim();
    wrapCanvasText(ctx, cleanText, width - 28, startY + 14, width - 56, 17, 5);
  } else {
    // Elegant paragraph skeleton
    ctx.fillStyle = '#cbd5e1';
    const skeletonY = Math.max(startY + 15, 115);
    for (let i = 0; i < 4; i++) {
      const lineWidth = i === 3 ? (width - 130) : (width - 60 - (i % 2) * 30);
      ctx.fillRect(width - 28 - lineWidth, skeletonY + i * 16, lineWidth, 6);
    }
  }

  // Footer page number
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText('صفحة 1', width / 2 - 18, height - 20);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * 3. EXCEL THUMBNAIL GENERATOR (XLSX / XLS / CSV)
 */
export async function generateExcelThumbnail(blob: Blob, title?: string): Promise<string> {
  let sheetName = 'ورقة 1';
  let rows: string[][] = [];

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    if (workbook.SheetNames.length > 0) {
      sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
      rows = data.slice(0, 8).map(row => 
        (Array.isArray(row) ? row : []).slice(0, 6).map(cell => String(cell != null ? cell : ''))
      );
    }
  } catch (err) {
    console.warn('Excel thumbnail generation parsing error:', err);
  }

  const width = 360;
  const height = 230;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top header banner (Excel Green)
  ctx.fillStyle = '#047857';
  ctx.fillRect(0, 0, width, 34);

  // Excel title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.direction = 'rtl';
  ctx.fillText(`Excel • ${sheetName}`, width - 14, 22);

  // Grid Configuration
  const startX = 10;
  const startY = 42;
  const rowHeight = 22;
  const rowNumWidth = 24;
  const totalGridWidth = width - 20;
  const numCols = 4;
  const colWidth = (totalGridWidth - rowNumWidth) / numCols;

  // Draw Column Headers (A, B, C, D)
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(startX, startY, totalGridWidth, rowHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(startX, startY, totalGridWidth, rowHeight);

  // Row 0 corner cell
  ctx.strokeRect(startX, startY, rowNumWidth, rowHeight);

  // Column letters
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.direction = 'ltr';
  for (let c = 0; c < numCols; c++) {
    const cx = startX + rowNumWidth + c * colWidth;
    ctx.strokeRect(cx, startY, colWidth, rowHeight);
    ctx.fillText(colLetters[c] || '', cx + colWidth / 2 - 4, startY + 15);
  }

  // Draw Rows
  const totalRows = 7;
  for (let r = 0; r < totalRows; r++) {
    const ry = startY + (r + 1) * rowHeight;
    if (ry + rowHeight > height - 6) break;

    // Row Number Cell
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(startX, ry, rowNumWidth, rowHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(startX, ry, rowNumWidth, rowHeight);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, sans-serif';
    ctx.direction = 'ltr';
    ctx.fillText(String(r + 1), startX + 7, ry + 15);

    // Row Data Cells
    const rowData = rows[r] || [];
    for (let c = 0; c < numCols; c++) {
      const cx = startX + rowNumWidth + c * colWidth;
      
      // Cell background (alternating or header-like for first row)
      ctx.fillStyle = r === 0 && rowData.length > 0 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(cx, ry, colWidth, rowHeight);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(cx, ry, colWidth, rowHeight);

      // Cell text value
      const val = rowData[c] !== undefined ? String(rowData[c]).trim() : '';
      if (val) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx + 2, ry + 2, colWidth - 4, rowHeight - 4);
        ctx.clip();

        ctx.fillStyle = r === 0 ? '#0f172a' : '#334155';
        ctx.font = r === 0 ? 'bold 10px system-ui, sans-serif' : '10px system-ui, sans-serif';
        // Test if arabic
        const hasArabic = /[\u0600-\u06FF]/.test(val);
        ctx.direction = hasArabic ? 'rtl' : 'ltr';
        
        if (hasArabic) {
          ctx.fillText(val, cx + colWidth - 4, ry + 15);
        } else {
          ctx.fillText(val, cx + 4, ry + 15);
        }
        ctx.restore();
      }
    }
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * 4. IMAGE THUMBNAIL GENERATOR
 */
export async function generateImageThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const targetWidth = 360;
      const targetHeight = 230;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(objectUrl);
        return;
      }

      // Fill elegant background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Calculate aspect ratio cover / contain
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (targetWidth - scaledW) / 2;
      const offsetY = (targetHeight - scaledH) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('');
    };

    img.src = objectUrl;
  });
}

/**
 * 5. NOTE / LESSON TEXT THUMBNAIL GENERATOR
 */
export function generateNoteThumbnail(content: string, title: string, subject?: string): string {
  const width = 360;
  const height = 230;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Warm notebook paper background
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, width, height);

  // Top header banner (Amber / Gold theme)
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, width, 34);

  // Badge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.direction = 'rtl';
  ctx.fillText(`مذكرة درس • ${subject || 'عام'}`, width - 14, 22);

  // Notebook horizontal rules
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 1;
  for (let y = 60; y < height - 10; y += 22) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(width - 14, y);
    ctx.stroke();
  }

  // Margin vertical line
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width - 40, 34);
  ctx.lineTo(width - 40, height);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.direction = 'rtl';
  const startY = wrapCanvasText(ctx, title, width - 48, 62, width - 64, 22, 2);

  // Content snippet lines
  const cleanSnippet = (content || '')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`]/g, '')
    .trim();

  ctx.fillStyle = '#334155';
  ctx.font = '11px system-ui, sans-serif';
  wrapCanvasText(ctx, cleanSnippet, width - 48, startY + 12, width - 64, 20, 5);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * MASTER THUMBNAIL CREATOR DISPATCHER
 */
export async function createThumbnailForFile(
  blob: Blob,
  fileName: string,
  fileExtension?: string,
  title?: string
): Promise<string> {
  const ext = (fileExtension || fileName.split('.').pop() || '').toLowerCase();

  try {
    if (ext === 'pdf') {
      return await generatePdfThumbnail(blob, title || fileName);
    }
    if (['docx', 'doc', 'odt'].includes(ext)) {
      return await generateWordThumbnail(blob, title || fileName, ext);
    }
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return await generateExcelThumbnail(blob, title || fileName);
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return await generateImageThumbnail(blob);
    }
    // Generic document fallback
    return generatePdfFallbackThumbnail(title || fileName);
  } catch (err) {
    console.error('Failed creating thumbnail:', err);
    return generatePdfFallbackThumbnail(title || fileName);
  }
}

/**
 * Generate thumbnail for any LibraryItem (handles both files and notes)
 */
export async function generateLibraryItemThumbnail(
  item: LibraryItem,
  blob?: Blob
): Promise<string> {
  if (item.itemType === 'note') {
    return generateNoteThumbnail(item.content || '', item.title, item.subject);
  }

  if (blob) {
    return createThumbnailForFile(blob, item.fileName || item.title, item.fileExtension, item.title);
  }

  // If no blob is currently loaded (e.g. initial demo item or offline metadata), create stylized cover
  const ext = (item.fileExtension || '').toLowerCase();
  if (ext === 'pdf') {
    return generatePdfFallbackThumbnail(item.title);
  }
  if (['docx', 'doc', 'odt'].includes(ext)) {
    return generateWordThumbnail(new Blob([]), item.title, ext);
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return generateExcelThumbnail(new Blob([]), item.title);
  }
  return generatePdfFallbackThumbnail(item.title);
}
