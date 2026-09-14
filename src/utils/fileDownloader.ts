/**
 * Safe client-side file downloader for Mobile (Android/iOS) and Desktop
 * 100% offline, zero server calls.
 */
export function downloadFile(blob: Blob, filename: string): void {
  // Check if browser supports standard createObjectURL
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;

  // Append to body to ensure click works across all mobile browsers (especially Android Chrome & iOS Safari)
  document.body.appendChild(a);
  
  try {
    a.click();
  } catch (err) {
    console.error('Trigger click failed, falling back to window.location', err);
    window.location.href = url;
  }

  // Cleanup after safe timeout
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url);
  }, 3000);
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
