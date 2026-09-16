import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  ClassItem, 
  StudentItem, 
  AssessmentItem, 
  TeacherProfile, 
  Trimester, 
  AttendanceRecord, 
  LessonPlan, 
  SubjectSetting 
} from '../types';
import { 
  computeClassGradesReport,
  getAlgerianAppraisal, 
  TRIMESTER_INFO 
} from './gradeCalculations';
import { downloadFile, sanitizeFileName } from './fileDownloader';
import { sanitizeElementTreeColors, sanitizeClonedDocument } from './pdfColorSanitizer';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  scale?: number;
}

/**
 * Standard font family fallback for Arabic on all operating systems:
 * Windows, macOS, Android, iOS, and Linux.
 */
const ARABIC_FONT_STACK = "'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Tahoma, 'Traditional Arabic', sans-serif";

/**
 * Generates Algerian Official Header HTML with Ministry branding
 */
export function getAlgerianHeaderHtml(profile: TeacherProfile, title: string, subtitle?: string): string {
  return `
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; font-family: ${ARABIC_FONT_STACK}; direction: rtl;">
      <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
      <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #334155;">وزارة التربية الوطنية</h4>
      <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
        <div><strong>مديرية التربية لولاية:</strong> ${profile.wilaya || '...................'}</div>
        <div><strong>المؤسسة التعليمية:</strong> ${profile.schoolName || '...................'}</div>
        <div><strong>السنة الدراسية:</strong> ${profile.academicYear || '2024 - 2025'}</div>
      </div>
      <div style="margin-top: 12px; padding: 8px 14px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; text-decoration: underline;">${title}</h2>
        ${subtitle ? `<p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #475569;">${subtitle}</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * Exports any DOM element (or element ID) to a high-resolution A4 PDF.
 * Uses an isolated sandbox clone to ensure 100% clean rendering, immune to
 * page scroll, mobile viewport constraints, and dark-mode styles.
 */
export async function exportElementToPdf(
  target: HTMLElement | string,
  rawFilename: string,
  options: PdfExportOptions & { isPrebuiltContainer?: boolean } = {}
): Promise<void> {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) {
    throw new Error(`عنصر الوثيقة المطلوب تصديرها غير موجود: ${target}`);
  }

  const orientation = options.orientation || 'portrait';
  const marginMm = options.marginMm ?? 8;
  const scale = options.scale ?? 2; // 2x gives 300DPI equivalent quality

  let renderTarget: HTMLElement = element;
  let tempWrapper: HTMLElement | null = null;

  // If not already an isolated off-screen container, clone into a clean, dedicated sandbox
  if (!options.isPrebuiltContainer) {
    tempWrapper = document.createElement('div');
    tempWrapper.id = 'ostad-pdf-sandbox-wrapper';
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.top = '0';
    tempWrapper.style.left = '0';
    tempWrapper.style.width = orientation === 'landscape' ? '1120px' : '820px';
    tempWrapper.style.backgroundColor = '#ffffff';
    tempWrapper.style.color = '#0f172a';
    tempWrapper.style.direction = 'rtl';
    tempWrapper.setAttribute('dir', 'rtl');
    tempWrapper.style.fontFamily = ARABIC_FONT_STACK;
    tempWrapper.style.zIndex = '-99999';
    tempWrapper.style.pointerEvents = 'none';
    tempWrapper.style.opacity = '1';
    tempWrapper.style.boxSizing = 'border-box';
    tempWrapper.style.padding = '24px';

    const clone = element.cloneNode(true) as HTMLElement;
    // Strip interactive buttons and print:hidden elements
    clone.querySelectorAll('.no-print, [class*="print:hidden"], button, .hidden-in-pdf').forEach((el) => el.remove());
    // Convert inputs and textareas to static text
    clone.querySelectorAll('input, textarea, select').forEach((inp: any) => {
      const span = document.createElement('span');
      span.textContent = inp.value || inp.placeholder || '';
      span.style.fontWeight = '700';
      span.style.display = 'inline-block';
      inp.parentNode?.replaceChild(span, inp);
    });

    // Remove dark classes to ensure crisp print colors on pure white paper
    clone.classList.remove('dark');
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';

    tempWrapper.appendChild(clone);
    document.body.appendChild(tempWrapper);
    renderTarget = tempWrapper;
  }

  try {
    // 1. Sanitize element colors on the export copy before passing to html2canvas
    sanitizeElementTreeColors(renderTarget, options.isPrebuiltContainer ? undefined : element);

    // Settle layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    const canvas = await html2canvas(renderTarget, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      width: renderTarget.offsetWidth || (orientation === 'landscape' ? 1120 : 820),
      windowWidth: orientation === 'landscape' ? 1200 : 900,
      onclone: (clonedDoc, clonedEl) => {
        // 2. Sanitize stylesheets, CSS variables, and all cloned nodes
        sanitizeClonedDocument(clonedDoc, clonedEl);
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('فشل إنشاء لوحة المستند لتصدير PDF.');
    }

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 page dimensions in mm
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;

    const usableWidth = pageWidth - marginMm * 2;
    const usableHeight = pageHeight - marginMm * 2;

    const mmPerPixel = usableWidth / canvas.width;
    const totalHeightMm = canvas.height * mmPerPixel;

    if (totalHeightMm <= usableHeight + 6) {
      // Single Page
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, usableWidth, totalHeightMm, undefined, 'FAST');
    } else {
      // Multi-Page Slicing
      const pageCanvasHeight = Math.floor(usableHeight / mmPerPixel);
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - currentY);
        if (sliceHeight <= 0) break;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');

        if (sliceCtx) {
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          sliceCtx.drawImage(
            canvas,
            0,
            currentY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          if (pageIndex > 0) {
            pdf.addPage('a4', orientation);
          }

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          const sliceHeightMm = sliceHeight * mmPerPixel;
          pdf.addImage(sliceImgData, 'JPEG', marginMm, marginMm, usableWidth, sliceHeightMm, undefined, 'FAST');
        }

        currentY += sliceHeight;
        pageIndex++;
      }
    }

    const filename = sanitizeFileName(rawFilename, 'pdf');
    const pdfBlob = pdf.output('blob');
    downloadFile(pdfBlob, filename);
  } finally {
    if (tempWrapper && document.body.contains(tempWrapper)) {
      document.body.removeChild(tempWrapper);
    }
  }
}

/**
 * Creates an isolated off-screen container for rendering HTML documents to PDF.
 * Positioned safely at top:0; left:0; z-index:-99999 so html2canvas renders
 * with 100% accurate coordinates without displaying over user UI.
 */
async function renderHtmlToPdf(
  htmlContent: string, 
  filename: string, 
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  const container = document.createElement('div');
  container.id = 'ostad-pdf-render-box';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = orientation === 'landscape' ? '1120px' : '820px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = ARABIC_FONT_STACK;
  container.style.direction = 'rtl';
  container.setAttribute('dir', 'rtl');
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-99999';
  container.style.pointerEvents = 'none';
  container.style.opacity = '1';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    await exportElementToPdf(container, filename, { 
      orientation, 
      isPrebuiltContainer: true 
    });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * 1. EXPORT STUDENTS LIST TO PDF
 */
export async function exportStudentsListPdf(
  students: StudentItem[],
  classItem: ClassItem | null | undefined,
  profile: TeacherProfile
): Promise<void> {
  const title = classItem 
    ? `قائمة تلاميذ القسم: ${classItem.name} (${classItem.grade})`
    : 'قائمة كافة التلاميذ المسجلين';
  const subtitle = classItem ? `المادة: ${classItem.subject} • الأستاذ: ${profile.fullName || 'أستاذ المادة'}` : '';

  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;

  const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));

  const rowsHtml = sortedStudents.map((st, idx) => `
    <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 7px 4px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
      <td style="padding: 7px 6px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${st.studentNumber || '-'}</td>
      <td style="padding: 7px 8px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${st.lastName}</td>
      <td style="padding: 7px 8px; text-align: right; font-weight: 600; border: 1px solid #cbd5e1;">${st.firstName}</td>
      <td style="padding: 7px 4px; text-align: center; border: 1px solid #cbd5e1;">${st.gender === 'female' ? 'أنثى' : 'ذكر'}</td>
      <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1;">${st.birthDate || '-'}</td>
      <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; direction: ltr;">${st.guardianPhone || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 6px; font-family: ${ARABIC_FONT_STACK};">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 12px; font-weight: 700;">
        <span>العدد الإجمالي للتلاميذ: <strong>${students.length}</strong> تلميذ</span>
        <span style="color: #475569;">(ذكور: <strong>${maleCount}</strong> • إناث: <strong>${femaleCount}</strong>)</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 2px solid #0f172a;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">#</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #cbd5e1; width: 110px;">رقم التعريف</th>
            <th style="padding: 8px 8px; text-align: right; border: 1px solid #cbd5e1;">اللقب</th>
            <th style="padding: 8px 8px; text-align: right; border: 1px solid #cbd5e1;">الاسم</th>
            <th style="padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">الجنس</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #cbd5e1; width: 95px;">تاريخ الميلاد</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #cbd5e1; width: 105px;">هاتف الولي</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 12px;">لا يوجد تلاميذ مسجلين</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 28px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 0 16px;">
        <div>توقيع الأستاذ(ة): .......................................</div>
        <div>ختم وتأشيرة الإدارة: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Qaimat_Talaba_${classItem ? classItem.name : 'AlKull'}`;
  await renderHtmlToPdf(html, filename, 'portrait');
}

/**
 * 2. EXPORT GRADES DELIBERATION SHEET TO PDF
 * Generates official Algerian deliberation sheet in landscape A4.
 */
export async function exportGradesSheetPdf(
  classItem: ClassItem,
  assessments: AssessmentItem[],
  students: StudentItem[],
  trimester: Trimester | 'ALL',
  profile: TeacherProfile,
  subjectSetting?: SubjectSetting
): Promise<void> {
  const trimesterLabel = trimester === 'ALL' ? 'كامل الموسم' : TRIMESTER_INFO[trimester].label;
  const title = `محضر نقاط ومداولات مادة ${classItem.subject} - ${trimesterLabel}`;
  const subtitle = `القسم: ${classItem.name} (${classItem.grade}) • الأستاذ: ${profile.fullName || 'أستاذ المادة'} • معامل المادة: ${subjectSetting?.coefficient || 1}`;

  // Filter assessments for class & trimester and strictly enforce test1 & test2 to /20
  const classAssessments = assessments
    .filter((a) => a.classId === classItem.id && (trimester === 'ALL' || a.trimester === trimester))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => {
      const isT1 = a.type === 'test1' || (a.title && (a.title.includes('الفرض الأول') || a.title.includes('فرض 1')));
      const isT2 = a.type === 'test2' || (a.title && (a.title.includes('الفرض الثاني') || a.title.includes('فرض 2')));
      if (isT1) {
        return { ...a, type: 'test1' as const, title: 'الفرض الأول', maxScore: 20 };
      }
      if (isT2) {
        return { ...a, type: 'test2' as const, title: 'الفرض الثاني', maxScore: 20 };
      }
      return a;
    });

  // Use robust grade report calculation
  const report = computeClassGradesReport(students, classAssessments, 'subject_method', subjectSetting);

  const defaultCoeff = subjectSetting?.coefficient || 1;

  const rowsHtml = report.studentResults.map((r, idx) => {
    const coeff = (typeof r.subjectCalculation?.coefficient === 'number' && r.subjectCalculation.coefficient > 0)
      ? r.subjectCalculation.coefficient
      : defaultCoeff;
    const rawAvg = r.rawAverage ?? r.subjectCalculation?.rawAverageOutOf20 ?? r.average;
    const weightedScore = r.weightedScore ?? (r.subjectCalculation?.weightedTotal !== null && r.subjectCalculation?.weightedTotal !== undefined
      ? r.subjectCalculation.weightedTotal
      : (rawAvg !== null ? Math.round(rawAvg * coeff * 100) / 100 : null));
    const avgBg = r.average !== null && r.average >= 10 ? '#ecfdf5' : r.average !== null ? '#fff1f2' : '';
    const avgColor = r.average !== null && r.average >= 10 ? '#047857' : r.average !== null ? '#be123c' : '#0f172a';

    const assessmentCells = classAssessments.map((a) => {
      const sc = r.scoresByAssessmentId[a.id];
      let txt = '—';
      if (sc?.isAbsent) {
        txt = '<span style="color: #dc2626; font-weight: bold;">غائب</span>';
      } else if (sc?.rawScore !== undefined && sc?.rawScore !== null) {
        txt = typeof sc.rawScore === 'number' ? sc.rawScore.toFixed(2).replace(/\.00$/, '') : `${sc.rawScore}`;
      }
      return `<td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1; font-family: monospace;">${txt}</td>`;
    }).join('');

    return `
      <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 6px 4px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${r.student.lastName} ${r.student.firstName}</td>
        <td style="padding: 6px 4px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${r.student.studentNumber || '-'}</td>
        ${assessmentCells}
        <td style="padding: 6px; text-align: center; font-weight: 800; border: 1px solid #cbd5e1; background-color: ${avgBg}; color: ${avgColor}; font-size: 11px; font-family: monospace;">
          ${r.average !== null ? r.average.toFixed(2) : '—'}
        </td>
        <td style="padding: 6px; text-align: center; font-weight: 900; border: 1px solid #cbd5e1; background-color: #f1f5f9; color: #0f172a; font-size: 11px; font-family: monospace;">
          ${weightedScore !== null ? weightedScore.toFixed(2) : '—'}
        </td>
        <td style="padding: 6px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1; font-size: 11px;">
          ${r.appraisal?.label || '—'}
        </td>
        <td style="padding: 6px; text-align: center; font-weight: 800; border: 1px solid #cbd5e1; width: 45px;">
          ${r.rank !== null ? `${r.rank}` : '—'}
        </td>
      </tr>
    `;
  }).join('');

  const assessmentHeaderCols = classAssessments.map((a) => {
    const isT1 = a.type === 'test1' || (a.title && (a.title.includes('الفرض الأول') || a.title.includes('فرض 1')));
    const isT2 = a.type === 'test2' || (a.title && (a.title.includes('الفرض الثاني') || a.title.includes('فرض 2')));
    const displayTitle = isT1 ? 'الفرض الأول' : isT2 ? 'الفرض الثاني' : a.title;
    const effectiveMax = isT1 || isT2 ? 20 : (a.maxScore || 20);

    return `
      <th style="padding: 6px 4px; text-align: center; border: 1px solid #cbd5e1;">
        <div>${displayTitle}</div>
        <div style="font-size: 9px; font-weight: normal; color: #64748b;">(/ ${effectiveMax})</div>
      </th>
    `;
  }).join('');

  const classAvg = report.classAverage !== null ? `${report.classAverage.toFixed(2)} / 20` : '—';
  const successRate = `${report.passRate}%`;
  const highestScore = report.highestAverage ? `${report.highestAverage.value.toFixed(2)} / 20` : '—';
  const lowestScore = report.lowestAverage ? `${report.lowestAverage.value.toFixed(2)} / 20` : '—';

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 6px; font-family: ${ARABIC_FONT_STACK};">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 2px solid #0f172a; margin-bottom: 14px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 7px 4px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">#</th>
            <th style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; width: 180px;">اللقب والاسم</th>
            <th style="padding: 7px 4px; text-align: center; border: 1px solid #cbd5e1; width: 85px;">رقم التعريف</th>
            ${assessmentHeaderCols}
            <th style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; width: 85px; background-color: #e2e8f0;">معدل المادة (/20)</th>
            <th style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; width: 85px; background-color: #cbd5e1;">النقطة بالمعامل</th>
            <th style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; width: 95px;">التقدير</th>
            <th style="padding: 7px 4px; text-align: center; border: 1px solid #cbd5e1; width: 45px;">الرتبة</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="${5 + classAssessments.length + 2}" style="text-align: center; padding: 12px;">لا توجد بيانات مسجلة لهذا القسم</td></tr>`}
        </tbody>
      </table>

      <!-- Summary Statistics Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #0f172a; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: 800; text-align: center;">
            <td style="padding: 6px; border: 1px solid #cbd5e1;">المعدل العام للقسم</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">نسبة النجاح (≥ 10)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">أعلى معدل</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">أدنى معدل</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">عدد التلاميذ المقيمين</td>
          </tr>
        </thead>
        <tbody>
          <tr style="text-align: center; font-weight: 700; font-size: 12px;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 900; color: #047857;">${classAvg}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 900; color: #0284c7;">${successRate}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${highestScore}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${lowestScore}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${report.totalEvaluatedStudents} / ${students.length}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 0 16px;">
        <div>تأشيرة الأستاذ(ة): .......................................</div>
        <div>ختم وتأشيرة مدير المؤسسة: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Kashf_Noqat_${classItem.name}_${trimester}`;
  await renderHtmlToPdf(html, filename, 'landscape');
}

/**
 * 3. EXPORT ATTENDANCE SHEET TO PDF
 */
export async function exportAttendanceSheetPdf(
  classItem: ClassItem,
  dateStr: string,
  students: StudentItem[],
  attendanceRecords: AttendanceRecord[],
  profile: TeacherProfile
): Promise<void> {
  const title = `سجل مواظبة وغياب القسم: ${classItem.name} (${classItem.grade})`;
  const subtitle = `التاريخ: ${dateStr || 'اليوم'} • المادة: ${classItem.subject} • الأستاذ: ${profile.fullName || 'أستاذ المادة'}`;

  const targetRecord = attendanceRecords.find(
    (r) => r.classId === classItem.id && (!dateStr || r.date === dateStr)
  );

  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let lateCount = 0;

  const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));

  const rowsHtml = sortedStudents.map((st, idx) => {
    const entry = targetRecord?.records?.[st.id];
    let statusBadge = '<span style="color: #047857; font-weight: 700;">حاضر</span>';
    if (!entry || entry.status === 'present') {
      presentCount++;
    } else if (entry.status === 'absent') {
      absentCount++;
      statusBadge = '<span style="color: #be123c; font-weight: 800;">غائب غير مبرر</span>';
    } else if (entry.status === 'excused') {
      excusedCount++;
      statusBadge = '<span style="color: #b45309; font-weight: 700;">غائب مبرر</span>';
    } else if (entry.status === 'late') {
      lateCount++;
      statusBadge = '<span style="color: #0369a1; font-weight: 700;">متأخر</span>';
    }

    return `
      <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 7px 4px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 7px 6px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${st.studentNumber || '-'}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${st.lastName} ${st.firstName}</td>
        <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1;">${statusBadge}</td>
        <td style="padding: 7px 10px; text-align: right; border: 1px solid #cbd5e1; color: #475569;">${entry?.note || '-'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 6px; font-family: ${ARABIC_FONT_STACK};">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}

      <div style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 11px;">
        <div style="flex: 1; padding: 6px; border: 1px solid #a7f3d0; background-color: #ecfdf5; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #065f46; font-size: 10px;">إجمالي الحاضرين</span>
          <strong style="font-size: 15px; color: #047857;">${presentCount}</strong>
        </div>
        <div style="flex: 1; padding: 6px; border: 1px solid #fecdd3; background-color: #fff1f2; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #9f1239; font-size: 10px;">غياب غير مبرر</span>
          <strong style="font-size: 15px; color: #be123c;">${absentCount}</strong>
        </div>
        <div style="flex: 1; padding: 6px; border: 1px solid #fde68a; background-color: #fffbeb; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #92400e; font-size: 10px;">غياب مبرر</span>
          <strong style="font-size: 15px; color: #b45309;">${excusedCount}</strong>
        </div>
        <div style="flex: 1; padding: 6px; border: 1px solid #bae6fd; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #075985; font-size: 10px;">التأخرات</span>
          <strong style="font-size: 15px; color: #0369a1;">${lateCount}</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 2px solid #0f172a; margin-bottom: 18px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 7px 4px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">#</th>
            <th style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; width: 110px;">رقم التعريف</th>
            <th style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1;">اللقب والاسم</th>
            <th style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; width: 120px;">الحالة</th>
            <th style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; width: 200px;">ملاحظة / سبب الغياب</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 12px;">لا يوجد تسجيلات غياب لهذا اليوم</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 0 16px;">
        <div>توقيع الأستاذ(ة): .......................................</div>
        <div>ختم مستشار التربية: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Kashf_Ghiyab_${classItem.name}_${dateStr || 'Yawmi'}`;
  await renderHtmlToPdf(html, filename, 'portrait');
}

/**
 * 4. EXPORT LESSON PLAN TO PDF
 */
export async function exportLessonPlanPdf(
  lesson: LessonPlan,
  classItem: ClassItem | null,
  profile?: TeacherProfile
): Promise<void> {
  const prof: TeacherProfile = profile || {
    fullName: 'أستاذ المادة',
    schoolName: '',
    subject: lesson.subject || '',
    academicYear: '2024 - 2025',
    wilaya: '',
  };

  const className = lesson.className || classItem?.name || 'القسم';
  const title = `مذكرة بيداغوجية تربوية: ${lesson.title}`;
  const subtitle = `المادة: ${lesson.subject} • القسم: ${className} • التاريخ: ${lesson.date || '-'} • المدة: ${lesson.duration || '-'}`;

  const stagesHtml = (lesson.stages || [])
    .map(
      (stage, idx) => `
        <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; text-align: center; width: 140px;">${stage.title}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; text-align: center; width: 75px;">${stage.duration || '-'}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; line-height: 1.6; text-align: right; white-space: pre-wrap;">${stage.content || '-'}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 6px; font-family: ${ARABIC_FONT_STACK};">
      ${getAlgerianHeaderHtml(prof, title, subtitle)}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 900; color: #047857;">🎯 الأهداف والكفاءات المستهدفة:</h4>
          <div style="font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #1e293b;">
            ${lesson.objectives || 'لم يتم تحديد أهداف'}
          </div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 900; color: #0284c7;">🛠️ الوسائل والدعائم التعليمية:</h4>
          <div style="font-size: 11px; line-height: 1.5; white-space: pre-wrap; color: #1e293b;">
            ${lesson.teachingAids || 'الكتاب المدرسي، السبورة، وثائق الأنشطة'}
          </div>
          ${lesson.teacherNotes ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #475569;">
              <strong style="color: #0f172a;">ملاحظات الأستاذ(ة):</strong> ${lesson.teacherNotes}
            </div>
          ` : ''}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 2px solid #0f172a; margin-bottom: 18px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a; font-weight: 900; text-align: center;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 140px;">المرحلة / المحطة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 75px;">المدة</th>
            <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">سير الأنشطة والتعلمات</th>
          </tr>
        </thead>
        <tbody>
          ${stagesHtml || '<tr><td colspan="3" style="text-align: center; padding: 12px;">لا توجد مراحل مسجلة</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 0 16px;">
        <div>إمضاء وتأشيرة الأستاذ(ة): .......................................</div>
        <div>تأشيرة المفتش / المدير: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Moudhakira_${lesson.title.replace(/\s+/g, '_')}`;
  await renderHtmlToPdf(html, filename, 'landscape');
}
