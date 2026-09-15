/**
 * Ostad DZ - Local DOCX Document Preview Service
 * 
 * Parses Microsoft Word (.docx) documents completely locally in the browser
 * using Mammoth (pure client-side JavaScript) with zero external APIs,
 * zero Google Docs dependence, and 100% offline capability.
 */

import mammoth from 'mammoth';

export interface DocxPreviewResult {
  success: boolean;
  html?: string;
  error?: string;
}

export async function convertDocxBlobToHtml(blob: Blob): Promise<DocxPreviewResult> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    
    // Convert ArrayBuffer to HTML using mammoth
    const options = {
      // Clean, semantic style map for educational documents
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1.doc-title:fresh",
        "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
      ]
    };

    const convertFn = (mammoth as any).convertToHtml || (mammoth as any).default?.convertToHtml;
    if (typeof convertFn !== 'function') {
      return {
        success: false,
        error: 'محرك قراءة مستندات Word غير متاح حالياً.',
      };
    }

    const result = await convertFn({ arrayBuffer }, options);
    const rawHtml = result.value || '';

    if (!rawHtml.trim()) {
      return {
        success: false,
        error: 'لم نتمكن من استخراج نص من هذا المستند، قد يكون فارغاً أو بتنسيق قديم.',
      };
    }

    return {
      success: true,
      html: rawHtml,
    };
  } catch (err: any) {
    console.warn('Local DOCX conversion error:', err);
    return {
      success: false,
      error: err?.message || 'تعذر استخراج المعاينة المحلية لهذا المستند.',
    };
  }
}
