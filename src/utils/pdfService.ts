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
  calculateSubjectGrade, 
  getAlgerianAppraisal, 
  TRIMESTER_INFO 
} from './gradeCalculations';
import { downloadFile, sanitizeFileName } from './fileDownloader';

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  scale?: number;
}

/**
 * Exports any DOM element (or element ID) to a high-resolution A4 PDF.
 * Supports multi-page splitting, Arabic RTL layout, and mobile devices.
 */
export async function exportElementToPdf(
  target: HTMLElement | string,
  rawFilename: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) {
    throw new Error(`PDF Export target element not found: ${target}`);
  }

  const orientation = options.orientation || 'portrait';
  const marginMm = options.marginMm ?? 8;
  const scale = options.scale ?? 2; // 2x for sharp print quality

  // Temporarily force white background and standard text color for rendering
  const originalBg = element.style.backgroundColor;
  const originalColor = element.style.color;
  const originalBoxShadow = element.style.boxShadow;

  element.style.backgroundColor = '#ffffff';
  element.style.color = '#0f172a';
  element.style.boxShadow = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(element.scrollWidth, 1024),
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 dimensions in mm
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;

    const usableWidth = pageWidth - marginMm * 2;
    const usableHeight = pageHeight - marginMm * 2;

    // Scale factor: mm per canvas pixel
    const mmPerPixel = usableWidth / canvas.width;
    const totalHeightMm = canvas.height * mmPerPixel;

    if (totalHeightMm <= usableHeight) {
      // Single Page
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, usableWidth, totalHeightMm, undefined, 'FAST');
    } else {
      // Multi-Page Slicing
      const pageCanvasHeight = Math.floor(usableHeight / mmPerPixel);
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - currentY);
        
        // Create temporary canvas for slice
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

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.96);
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
    // Restore element styles
    element.style.backgroundColor = originalBg;
    element.style.color = originalColor;
    element.style.boxShadow = originalBoxShadow;
  }
}

/**
 * Creates an off-screen container for rendering documents to PDF
 */
async function renderHtmlToPdf(htmlContent: string, filename: string, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = orientation === 'landscape' ? '1200px' : '900px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
  container.style.direction = 'rtl';
  container.style.padding = '30px';
  container.style.zIndex = '-1000';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    await exportElementToPdf(container, filename, { orientation });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generates Algerian Official Header HTML
 */
function getAlgerianHeaderHtml(profile: TeacherProfile, title: string, subtitle?: string): string {
  return `
    <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; font-family: 'Cairo', sans-serif;">
      <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #0f172a;">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
      <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #334155;">وزارة التربية الوطنية</h4>
      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
        <div><strong>مديرية التربية لولاية:</strong> ${profile.wilaya || '...................'}</div>
        <div><strong>المؤسسة التعليمية:</strong> ${profile.schoolName || '...................'}</div>
        <div><strong>السنة الدراسية:</strong> ${profile.academicYear || '2024 - 2025'}</div>
      </div>
      <div style="margin-top: 14px; padding: 10px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a; text-decoration: underline;">${title}</h2>
        ${subtitle ? `<p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 700; color: #475569;">${subtitle}</p>` : ''}
      </div>
    </div>
  `;
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
      <td style="padding: 8px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
      <td style="padding: 8px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${st.studentNumber || '-'}</td>
      <td style="padding: 8px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${st.lastName}</td>
      <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #cbd5e1;">${st.firstName}</td>
      <td style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">${st.gender === 'female' ? 'أنثى' : 'ذكر'}</td>
      <td style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">${st.birthDate || '-'}</td>
      <td style="padding: 8px; text-align: center; border: 1px solid #cbd5e1; direction: ltr;">${st.guardianPhone || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 10px;">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; font-weight: 700;">
        <span>العدد الإجمالي للتلاميذ: ${students.length} تلميذ</span>
        <span style="color: #475569;">(ذكور: ${maleCount} • إناث: ${femaleCount})</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 2px solid #0f172a;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 10px 6px; text-align: center; border: 1px solid #cbd5e1; width: 40px;">#</th>
            <th style="padding: 10px 6px; text-align: center; border: 1px solid #cbd5e1; width: 110px;">رقم التعريف</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1;">اللقب</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1;">الاسم</th>
            <th style="padding: 10px 6px; text-align: center; border: 1px solid #cbd5e1; width: 60px;">الجنس</th>
            <th style="padding: 10px 6px; text-align: center; border: 1px solid #cbd5e1; width: 100px;">تاريخ الميلاد</th>
            <th style="padding: 10px 6px; text-align: center; border: 1px solid #cbd5e1; width: 110px;">هاتف الولي</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; padding: 0 20px;">
        <div>توقيع الأستاذ: .......................................</div>
        <div>ختم وتأشيرة الإدارة: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Qaimat_Talaba_${classItem ? classItem.name : 'AlKull'}`;
  await renderHtmlToPdf(html, filename, 'portrait');
}

/**
 * 2. EXPORT GRADES DELIBERATION SHEET TO PDF
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

  const classAssessments = assessments
    .filter((a) => a.classId === classItem.id && (trimester === 'ALL' || a.trimester === trimester))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const test1Assessment = classAssessments.find((a) => a.type === 'test1');
  const test2Assessment = classAssessments.find((a) => a.type === 'test2');
  const examAssessment = classAssessments.find((a) => a.type === 'exam');

  const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));

  let totalScoreSum = 0;
  let gradedCount = 0;
  let passedCount = 0;
  let highest = -1;
  let lowest = 999;

  const rowsHtml = sortedStudents.map((st, idx) => {
    const t1Entry = test1Assessment?.grades?.[st.id] || (test1Assessment as any)?.scores?.[st.id];
    const t2Entry = test2Assessment?.grades?.[st.id] || (test2Assessment as any)?.scores?.[st.id];
    const exEntry = examAssessment?.grades?.[st.id] || (examAssessment as any)?.scores?.[st.id];

    const calculation = calculateSubjectGrade(
      {
        rawScore: t1Entry?.score,
        maxScore: test1Assessment?.maxScore || 20,
        isAbsent: t1Entry?.isAbsent,
        note: t1Entry?.note,
        title: test1Assessment?.title,
      },
      {
        rawScore: t2Entry?.score,
        maxScore: test2Assessment?.maxScore || 20,
        isAbsent: t2Entry?.isAbsent,
        note: t2Entry?.note,
        title: test2Assessment?.title,
      },
      {
        rawScore: exEntry?.score,
        maxScore: examAssessment?.maxScore || 20,
        isAbsent: exEntry?.isAbsent,
        note: exEntry?.note,
        title: examAssessment?.title,
      },
      subjectSetting
    );

    const avg = calculation.averageOutOf20;
    if (avg !== null) {
      gradedCount++;
      totalScoreSum += avg;
      if (avg >= 10) passedCount++;
      if (avg > highest) highest = avg;
      if (avg < lowest) lowest = avg;
    }

    const appraisal = avg !== null ? getAlgerianAppraisal(avg) : null;

    const assessmentCells = classAssessments.map((a) => {
      const rec = a.grades?.[st.id] || (a as any)?.scores?.[st.id];
      let txt = '-';
      if (rec?.isAbsent) {
        txt = '<span style="color: #dc2626; font-weight: bold;">غائب</span>';
      } else if (rec?.score !== undefined && rec?.score !== null) {
        txt = typeof rec.score === 'number' ? rec.score.toFixed(2).replace(/\.00$/, '') : `${rec.score}`;
      }
      return `<td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">${txt}</td>`;
    }).join('');

    const avgBg = avg !== null && avg >= 10 ? '#ecfdf5' : avg !== null ? '#fff1f2' : '';
    const avgColor = avg !== null && avg >= 10 ? '#047857' : avg !== null ? '#be123c' : '#0f172a';

    return `
      <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 6px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${st.lastName} ${st.firstName}</td>
        <td style="padding: 6px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${st.studentNumber || '-'}</td>
        ${assessmentCells}
        <td style="padding: 6px; text-align: center; font-weight: 900; border: 1px solid #cbd5e1; background-color: ${avgBg}; color: ${avgColor}; font-size: 13px;">
          ${avg !== null ? avg.toFixed(2) : '-'}
        </td>
        <td style="padding: 6px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1; font-size: 11px;">
          ${appraisal?.label || '-'}
        </td>
      </tr>
    `;
  }).join('');

  const classAvg = gradedCount > 0 ? (totalScoreSum / gradedCount).toFixed(2) : '-';
  const successRate = gradedCount > 0 ? ((passedCount / gradedCount) * 100).toFixed(1) : '-';

  const assessmentHeaderCols = classAssessments.map((a) => `
    <th style="padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1;">
      <div>${a.title}</div>
      <div style="font-size: 10px; font-weight: normal; color: #64748b;">(م ${a.coefficient || 1} / ${a.maxScore || 20})</div>
    </th>
  `).join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 10px;">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 2px solid #0f172a; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1; width: 35px;">#</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; width: 180px;">اللقب والاسم</th>
            <th style="padding: 8px 4px; text-align: center; border: 1px solid #cbd5e1; width: 85px;">رقم التعريف</th>
            ${assessmentHeaderCols}
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #cbd5e1; width: 85px; background-color: #e2e8f0;">المعدل / 20</th>
            <th style="padding: 8px 6px; text-align: center; border: 1px solid #cbd5e1; width: 100px;">التقدير</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Summary Statistics Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #0f172a; margin-bottom: 24px;">
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
          <tr style="text-align: center; font-weight: 700; font-size: 13px;">
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 900; color: #047857;">${classAvg} / 20</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 900; color: #0284c7;">${successRate}%</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${highest >= 0 ? `${highest.toFixed(2)} / 20` : '-'}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${lowest <= 20 ? `${lowest.toFixed(2)} / 20` : '-'}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${gradedCount} / ${sortedStudents.length}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; padding: 0 20px;">
        <div>تأشيرة الأستاذ(ة): .......................................</div>
        <div>ختم وتأشيرة مدير المؤسسة: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Kashf_Noqat_${classItem.name}_${trimester}`;
  // Landscape is preferred if multiple assessments exist
  const orientation = classAssessments.length >= 3 ? 'landscape' : 'portrait';
  await renderHtmlToPdf(html, filename, orientation);
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
        <td style="padding: 7px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 7px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${st.studentNumber || '-'}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 800; border: 1px solid #cbd5e1;">${st.lastName} ${st.firstName}</td>
        <td style="padding: 7px; text-align: center; border: 1px solid #cbd5e1;">${statusBadge}</td>
        <td style="padding: 7px 10px; text-align: right; border: 1px solid #cbd5e1; color: #475569;">${entry?.note || '-'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 10px;">
      ${getAlgerianHeaderHtml(profile, title, subtitle)}

      <div style="display: flex; gap: 12px; margin-bottom: 14px; font-size: 12px;">
        <div style="flex: 1; padding: 8px; border: 1px solid #a7f3d0; background-color: #ecfdf5; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #065f46; font-size: 11px;">إجمالي الحاضرين</span>
          <strong style="font-size: 16px; color: #047857;">${presentCount}</strong>
        </div>
        <div style="flex: 1; padding: 8px; border: 1px solid #fecdd3; background-color: #fff1f2; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #9f1239; font-size: 11px;">غياب غير مبرر</span>
          <strong style="font-size: 16px; color: #be123c;">${absentCount}</strong>
        </div>
        <div style="flex: 1; padding: 8px; border: 1px solid #fde68a; background-color: #fffbeb; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #92400e; font-size: 11px;">غياب مبرر</span>
          <strong style="font-size: 16px; color: #b45309;">${excusedCount}</strong>
        </div>
        <div style="flex: 1; padding: 8px; border: 1px solid #bae6fd; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
          <span style="display: block; color: #075985; font-size: 11px;">التأخرات</span>
          <strong style="font-size: 16px; color: #0369a1;">${lateCount}</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 2px solid #0f172a; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a;">
            <th style="padding: 8px; text-align: center; border: 1px solid #cbd5e1; width: 40px;">#</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #cbd5e1; width: 120px;">رقم التعريف</th>
            <th style="padding: 8px 10px; text-align: right; border: 1px solid #cbd5e1;">اللقب والاسم</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #cbd5e1; width: 130px;">الحالة</th>
            <th style="padding: 8px 10px; text-align: right; border: 1px solid #cbd5e1; width: 220px;">ملاحظة / سبب الغياب</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; padding: 0 20px;">
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
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 800; text-align: center; width: 150px;">${stage.title}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700; text-align: center; width: 80px;">${stage.duration || '-'}</td>
          <td style="padding: 10px 14px; border: 1px solid #cbd5e1; line-height: 1.6; text-align: right; white-space: pre-wrap;">${stage.content || '-'}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <div style="background: #ffffff; color: #0f172a; padding: 10px;">
      ${getAlgerianHeaderHtml(prof, title, subtitle)}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 900; color: #047857;">🎯 الأهداف والكفاءات المستهدفة:</h4>
          <div style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">
            ${lesson.objectives || 'لم يتم تحديد أهداف'}
          </div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 900; color: #0284c7;">🛠️ الوسائل والدعائم التعليمية:</h4>
          <div style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #1e293b;">
            ${lesson.teachingAids || 'الكتاب المدرسي، السبورة، وثائق الأنشطة'}
          </div>
          ${lesson.teacherNotes ? `
            <div style="margin-top: 10px; pt: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569;">
              <strong style="color: #0f172a;">ملاحظات الأستاذ(ة):</strong> ${lesson.teacherNotes}
            </div>
          ` : ''}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 2px solid #0f172a; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #0f172a; font-weight: 900; text-align: center;">
            <th style="padding: 10px; border: 1px solid #cbd5e1; width: 150px;">المرحلة / المحطة</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; width: 80px;">المدة</th>
            <th style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: right;">سير الأنشطة والتعلمات</th>
          </tr>
        </thead>
        <tbody>
          ${stagesHtml || '<tr><td colspan="3" style="text-align: center; padding: 12px;">لا توجد مراحل مسجلة</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; padding: 0 20px;">
        <div>إمضاء وتأشيرة الأستاذ(ة): .......................................</div>
        <div>تأشيرة المفتش / المدير: .......................................</div>
      </div>
    </div>
  `;

  const filename = `OstadDZ_Moudhakira_${lesson.title.replace(/\s+/g, '_')}`;
  await renderHtmlToPdf(html, filename, 'landscape');
}

