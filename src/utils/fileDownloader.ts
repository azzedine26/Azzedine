/**
 * Safe client-side file downloader for Mobile (Android/iOS) and Desktop
 * 100% offline, zero server calls.
 */
export function downloadFile(blob: Blob, filename: string): void {
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  const mimeType = isPdf 
    ? 'application/pdf' 
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });

  try {
    const url = window.URL.createObjectURL(typedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    }, 4000);
  } catch (err) {
    console.warn('URL.createObjectURL download failed, attempting FileReader dataURL fallback:', err);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 4000);
      };
      reader.readAsDataURL(typedBlob);
    } catch (fallbackErr) {
      console.error('All client download mechanisms failed:', fallbackErr);
      throw new Error('تعذر تنزيل الملف، يرجى التحقق من أذونات المتصفح.');
    }
  }
}

/**
 * Clean sanitization for Algerian Arabic file names
 */
export function sanitizeFileName(name: string, extension: string): string {
  // Replace slashes, colons, question marks, asterisks with underscores
  const clean = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${clean}${ext}`;
}
