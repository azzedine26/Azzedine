import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
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

// Common border style for clean Algerian official documents
const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '94A3B8', // slate-400
};

const commonBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

const headerShading = { fill: 'F1F5F9' }; // slate-100
const subHeaderShading = { fill: 'F8FAFC' }; // slate-50

/**
 * Type-safe Paragraph Creator with Cairo font and RTL
 */
function createP(
  text: string,
  options?: {
    bold?: boolean;
    size?: number; // half-points (24 = 12pt)
    color?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    underline?: boolean;
    spacing?: { before?: number; after?: number };
  }
): Paragraph {
  return new Paragraph({
    alignment: options?.alignment || AlignmentType.RIGHT,
    bidirectional: true,
    spacing: options?.spacing,
    children: [
      new TextRun({
        text,
        bold: options?.bold ?? false,
        size: options?.size || 18,
        color: options?.color,
        underline: options?.underline ? {} : undefined,
        font: 'Cairo',
      }),
    ],
  });
}

/**
 * Creates standard Algerian National Education Header for Word Documents
 */
function createAlgerianHeader(profile: TeacherProfile, subtitle?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [
    createP('الجمهورية الجزائرية الديمقراطية الشعبية', {
      bold: true,
      size: 24,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    createP('وزارة التربية الوطنية', {
      bold: true,
      size: 20,
      color: '334155',
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `مديرية التربية لولاية: ${profile.wilaya || '...................'}   •   `, bold: true, size: 18, font: 'Cairo' }),
        new TextRun({ text: `المؤسسة التعليمية: ${profile.schoolName || '...................'}   •   `, bold: true, size: 18, font: 'Cairo' }),
        new TextRun({ text: `السنة الدراسية: ${profile.academicYear || '2024 - 2025'}`, bold: true, size: 18, font: 'Cairo' }),
      ],
    }),
  ];

  if (profile.fullName || profile.subject) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: `الأستاذ(ة): ${profile.fullName || '...................'}   •   `, size: 18, font: 'Cairo' }),
          new TextRun({ text: `المادة: ${profile.subject || '...................'}`, size: 18, font: 'Cairo' }),
        ],
      })
    );
  }

  if (subtitle) {
    paragraphs.push(
      createP(subtitle, {
        bold: true,
        size: 24,
        underline: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 180 },
      })
    );
  }

  return paragraphs;
}

/**
 * 1. EXPORT STUDENTS LIST TO WORD (.docx)
 */
export async function exportStudentsListDocx(
  students: StudentItem[],
  classItem: ClassItem | null | undefined,
  profile: TeacherProfile
): Promise<void> {
  const title = classItem 
    ? `قائمة تلاميذ القسم: ${classItem.name} (${classItem.grade})`
    : 'قائمة كافة التلاميذ المسجلين';

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [createP('#', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [createP('رقم التعريف', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 22, type: WidthType.PERCENTAGE },
          children: [createP('اللقب', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 22, type: WidthType.PERCENTAGE },
          children: [createP('الاسم', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 8, type: WidthType.PERCENTAGE },
          children: [createP('الجنس', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [createP('تاريخ الميلاد', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [createP('هاتف الولي', { bold: true, alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
  ];

  students.forEach((st, idx) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: commonBorders,
            children: [createP(`${idx + 1}`, { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.studentNumber || '-', { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.lastName, { bold: true, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.firstName, { alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.gender === 'female' ? 'أنثى' : 'ذكر', { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.birthDate || '-', { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(st.guardianPhone || '-', { alignment: AlignmentType.CENTER })],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 120 },
            children: [
              new TextRun({ text: `العدد الإجمالي للتلاميذ: ${students.length}`, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `  (ذكور: ${students.filter(s => s.gender === 'male').length} • إناث: ${students.filter(s => s.gender === 'female').length})`, size: 16, font: 'Cairo' }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Qaimat_Talaba_${classItem ? classItem.name : 'AlKull'}`,
    'docx'
  );
  downloadFile(blob, filename);
}

/**
 * 2. EXPORT GRADES & DELIBERATION SHEET TO WORD (.docx)
 */
export async function exportGradesSheetDocx(
  classItem: ClassItem,
  assessments: AssessmentItem[],
  students: StudentItem[],
  trimester: Trimester | 'ALL',
  profile: TeacherProfile,
  subjectSetting?: SubjectSetting
): Promise<void> {
  const trimesterLabel = trimester === 'ALL' ? 'كامل الموسم' : TRIMESTER_INFO[trimester].label;
  const title = `محضر نقاط ومداولات مادة ${classItem.subject} - ${trimesterLabel}`;

  // Filter assessments for this class and trimester
  const classAssessments = assessments
    .filter((a) => a.classId === classItem.id && (trimester === 'ALL' || a.trimester === trimester))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find standard Algerian test1, test2, and exam if present
  const test1Assessment = classAssessments.find((a) => a.type === 'test1');
  const test2Assessment = classAssessments.find((a) => a.type === 'test2');
  const examAssessment = classAssessments.find((a) => a.type === 'exam');

  // Table headers
  const headerCells: TableCell[] = [
    new TableCell({
      borders: commonBorders,
      shading: headerShading,
      width: { size: 4, type: WidthType.PERCENTAGE },
      children: [createP('#', { bold: true, alignment: AlignmentType.CENTER })],
    }),
    new TableCell({
      borders: commonBorders,
      shading: headerShading,
      width: { size: 22, type: WidthType.PERCENTAGE },
      children: [createP('اللقب والاسم', { bold: true, alignment: AlignmentType.RIGHT })],
    }),
    new TableCell({
      borders: commonBorders,
      shading: headerShading,
      width: { size: 12, type: WidthType.PERCENTAGE },
      children: [createP('رقم التعريف', { bold: true, alignment: AlignmentType.CENTER })],
    }),
  ];

  classAssessments.forEach((a) => {
    headerCells.push(
      new TableCell({
        borders: commonBorders,
        shading: headerShading,
        children: [
          createP(a.title, { bold: true, alignment: AlignmentType.CENTER }),
          createP(`(م ${a.coefficient || 1} / ${a.maxScore || 20})`, { size: 14, alignment: AlignmentType.CENTER }),
        ],
      })
    );
  });

  headerCells.push(
    new TableCell({
      borders: commonBorders,
      shading: { fill: 'E2E8F0' }, // slate-200
      width: { size: 12, type: WidthType.PERCENTAGE },
      children: [createP('المعدل / 20', { bold: true, alignment: AlignmentType.CENTER })],
    }),
    new TableCell({
      borders: commonBorders,
      shading: headerShading,
      width: { size: 16, type: WidthType.PERCENTAGE },
      children: [createP('التقدير البيداغوجي', { bold: true, alignment: AlignmentType.CENTER })],
    })
  );

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: headerCells,
    }),
  ];

  // Compute student rows
  const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  let totalScoreSum = 0;
  let gradedStudentsCount = 0;
  let passedStudentsCount = 0;
  let highestScore = -1;
  let lowestScore = 999;

  sortedStudents.forEach((student, idx) => {
    // Look up scores
    const t1Entry = test1Assessment?.grades?.[student.id] || (test1Assessment as any)?.scores?.[student.id];
    const t2Entry = test2Assessment?.grades?.[student.id] || (test2Assessment as any)?.scores?.[student.id];
    const exEntry = examAssessment?.grades?.[student.id] || (examAssessment as any)?.scores?.[student.id];

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
      gradedStudentsCount++;
      totalScoreSum += avg;
      if (avg >= 10) passedStudentsCount++;
      if (avg > highestScore) highestScore = avg;
      if (avg < lowestScore) lowestScore = avg;
    }

    const rowCells: TableCell[] = [
      new TableCell({
        borders: commonBorders,
        children: [createP(`${idx + 1}`, { alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        borders: commonBorders,
        children: [createP(`${student.lastName} ${student.firstName}`, { bold: true, alignment: AlignmentType.RIGHT })],
      }),
      new TableCell({
        borders: commonBorders,
        children: [createP(student.studentNumber || '-', { alignment: AlignmentType.CENTER })],
      }),
    ];

    // Score cells for each assessment in the class
    classAssessments.forEach((a) => {
      const rec = a.grades?.[student.id] || (a as any)?.scores?.[student.id];
      let text = '-';
      if (rec?.isAbsent) {
        text = 'غائب';
      } else if (rec?.score !== undefined && rec?.score !== null) {
        text = typeof rec.score === 'number' ? rec.score.toFixed(2).replace(/\.00$/, '') : `${rec.score}`;
      }

      rowCells.push(
        new TableCell({
          borders: commonBorders,
          children: [createP(text, { alignment: AlignmentType.CENTER })],
        })
      );
    });

    // Average cell
    rowCells.push(
      new TableCell({
        borders: commonBorders,
        shading: avg !== null && avg >= 10 ? { fill: 'ECFDF5' } : avg !== null ? { fill: 'FFF1F2' } : undefined,
        children: [
          createP(avg !== null ? avg.toFixed(2) : '-', {
            bold: true,
            alignment: AlignmentType.CENTER,
          }),
        ],
      })
    );

    // Appraisal cell
    const appraisal = avg !== null ? getAlgerianAppraisal(avg) : null;
    rowCells.push(
      new TableCell({
        borders: commonBorders,
        children: [
          createP(appraisal?.label || '-', { alignment: AlignmentType.CENTER }),
        ],
      })
    );

    rows.push(new TableRow({ children: rowCells }));
  });

  const classAverage = gradedStudentsCount > 0 ? (totalScoreSum / gradedStudentsCount).toFixed(2) : '-';
  const successRate = gradedStudentsCount > 0 ? ((passedStudentsCount / gradedStudentsCount) * 100).toFixed(1) : '-';

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `القسم: ${classItem.name} (${classItem.grade})   •   `, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `المادة: ${classItem.subject}   •   `, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `الفصل: ${trimesterLabel}   •   `, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `معامل المادة: ${subjectSetting?.coefficient || 1}`, bold: true, size: 18, font: 'Cairo' }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows,
          }),
          new Paragraph({ spacing: { before: 160 } }),
          // Statistical summary block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('المعدل العام للقسم', { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('نسبة النجاح (≥ 10)', { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('أعلى معدل', { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('أدنى معدل', { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('عدد التلاميذ المقيمين', { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(`${classAverage} / 20`, { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(`${successRate}%`, { bold: true, alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(highestScore >= 0 ? `${highestScore.toFixed(2)} / 20` : '-', { alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(lowestScore <= 20 ? `${lowestScore.toFixed(2)} / 20` : '-', { alignment: AlignmentType.CENTER })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(`${gradedStudentsCount} / ${sortedStudents.length}`, { alignment: AlignmentType.CENTER })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 200 } }),
          // Signatures block
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({ text: 'تأشيرة الأستاذ: .......................................                             ختم وتأشيرة مدير المؤسسة: .......................................', bold: true, size: 18, font: 'Cairo' }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Kashf_Noqat_${classItem.name}_${trimester}`,
    'docx'
  );
  downloadFile(blob, filename);
}

/**
 * 3. EXPORT INDIVIDUAL STUDENT REPORT CARD TO WORD (.docx)
 */
export async function exportStudentReportCardDocx(
  student: StudentItem,
  classItem: ClassItem,
  assessments: AssessmentItem[],
  attendanceStats: {
    totalSessions: number;
    daysPresent: number;
    daysAbsent: number;
    daysExcused: number;
    daysLate: number;
    rate: number;
  } | null,
  profile: TeacherProfile,
  trimester: Trimester | 'ALL',
  customRemark?: string,
  subjectSetting?: SubjectSetting
): Promise<void> {
  const trimesterLabel = trimester === 'ALL' ? 'كامل الموسم' : TRIMESTER_INFO[trimester].label;
  const title = `كشف المتابعة البيداغوجية الشاملة للتلميذ - ${trimesterLabel}`;

  const classAssessments = assessments
    .filter((a) => a.classId === classItem.id && (trimester === 'ALL' || a.trimester === trimester))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const test1Assessment = classAssessments.find((a) => a.type === 'test1');
  const test2Assessment = classAssessments.find((a) => a.type === 'test2');
  const examAssessment = classAssessments.find((a) => a.type === 'exam');

  const t1Entry = test1Assessment?.grades?.[student.id] || (test1Assessment as any)?.scores?.[student.id];
  const t2Entry = test2Assessment?.grades?.[student.id] || (test2Assessment as any)?.scores?.[student.id];
  const exEntry = examAssessment?.grades?.[student.id] || (examAssessment as any)?.scores?.[student.id];

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
  const appraisal = avg !== null ? getAlgerianAppraisal(avg) : null;

  // Assessments breakdown table
  const assessmentRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          children: [createP('التقييم البيداغوجي', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          children: [createP('العلامة المتحصل عليها', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          children: [createP('المعامل', { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: headerShading,
          children: [createP('ملاحظة الأستاذ', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
      ],
    }),
  ];

  classAssessments.forEach((a) => {
    const rec = a.grades?.[student.id] || (a as any)?.scores?.[student.id];
    let scoreText = '-';
    if (rec?.isAbsent) {
      scoreText = 'غائب (غير مقيم)';
    } else if (rec?.score !== undefined && rec?.score !== null) {
      scoreText = `${typeof rec.score === 'number' ? rec.score.toFixed(2).replace(/\.00$/, '') : rec.score} / ${a.maxScore || 20}`;
    }

    assessmentRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: commonBorders,
            children: [createP(a.title, { bold: true, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(scoreText, { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(`${a.coefficient || 1}`, { alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: commonBorders,
            children: [createP(rec?.note || '-', { alignment: AlignmentType.RIGHT })],
          }),
        ],
      })
    );
  });

  // Final average row
  assessmentRows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: commonBorders,
          shading: { fill: 'E2E8F0' },
          children: [createP('معدل المادة الفصلي النهائي', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: { fill: 'E2E8F0' },
          children: [
            createP(avg !== null ? `${avg.toFixed(2)} / 20` : 'غير محسوب', {
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
        new TableCell({
          borders: commonBorders,
          shading: { fill: 'E2E8F0' },
          children: [createP(`معامل: ${subjectSetting?.coefficient || 1}`, { bold: true, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          borders: commonBorders,
          shading: { fill: 'E2E8F0' },
          children: [createP(appraisal?.label || '-', { bold: true, alignment: AlignmentType.RIGHT })],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          // Student identity table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    shading: subHeaderShading,
                    children: [createP('اللقب والاسم:', { bold: true })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(`${student.lastName} ${student.firstName}`, { bold: true })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: subHeaderShading,
                    children: [createP('رقم التعريف المدرسي:', { bold: true })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(student.studentNumber || 'غير محدد')],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    shading: subHeaderShading,
                    children: [createP('القسم والفوج:', { bold: true })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(`${classItem.name} (${classItem.grade})`)],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    shading: subHeaderShading,
                    children: [createP('تاريخ الميلاد:', { bold: true })],
                  }),
                  new TableCell({
                    borders: commonBorders,
                    children: [createP(student.birthDate || 'غير محدد')],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 120 } }),
          createP('نتائج التقييمات البيداغوجية والامتحانات:', { bold: true, size: 20, spacing: { after: 60 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: assessmentRows,
          }),
          ...(attendanceStats ? [
            new Paragraph({ spacing: { before: 140 } }),
            createP('ملخص المواظبة والغيابات:', { bold: true, size: 20, spacing: { after: 60 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              visuallyRightToLeft: true,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ borders: commonBorders, shading: headerShading, children: [createP('الحصص المرصودة', { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, shading: headerShading, children: [createP('أيام الحضور', { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, shading: headerShading, children: [createP('غياب غير مبرر', { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, shading: headerShading, children: [createP('غياب مبرر', { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, shading: headerShading, children: [createP('نسبة الحضور', { bold: true, alignment: AlignmentType.CENTER })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ borders: commonBorders, children: [createP(`${attendanceStats.totalSessions}`, { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, children: [createP(`${attendanceStats.daysPresent}`, { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, children: [createP(`${attendanceStats.daysAbsent}`, { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, children: [createP(`${attendanceStats.daysExcused}`, { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders: commonBorders, children: [createP(`${attendanceStats.rate}%`, { bold: true, alignment: AlignmentType.CENTER })] }),
                  ],
                }),
              ],
            }),
          ] : []),
          new Paragraph({ spacing: { before: 140 } }),
          // Teacher remark block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    shading: headerShading,
                    children: [createP('ملاحظة وتوجيهات أستاذ المادة:', { bold: true })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: commonBorders,
                    children: [
                      createP(
                        customRemark || (appraisal ? `تلميذ ذو مستوى ${appraisal.label}. يُرجى مواصلة الجهد والمواظبة.` : 'لا توجد ملاحظات إضافية.'),
                        { spacing: { before: 80, after: 80 } }
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 200 } }),
          // Three signature columns
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: commonBorders, children: [createP('توقيع أستاذ المادة:\n\n\n..........................', { alignment: AlignmentType.CENTER })] }),
                  new TableCell({ borders: commonBorders, children: [createP('ختم وتأشيرة الإدارة:\n\n\n..........................', { alignment: AlignmentType.CENTER })] }),
                  new TableCell({ borders: commonBorders, children: [createP('توقيع وملاحظة الولي:\n\n\n..........................', { alignment: AlignmentType.CENTER })] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Kashf_Tilmidh_${student.lastName}_${student.firstName}_${trimester}`,
    'docx'
  );
  downloadFile(blob, filename);
}

/**
 * 4. EXPORT ATTENDANCE SHEET TO WORD (.docx)
 */
export async function exportAttendanceSheetDocx(
  classItem: ClassItem,
  dateStr: string,
  students: StudentItem[],
  attendanceRecords: AttendanceRecord[],
  profile: TeacherProfile
): Promise<void> {
  const title = `سجل مواظبة وغياب القسم: ${classItem.name} (${classItem.grade}) - تاريخ ${dateStr || 'اليوم'}`;

  // Find attendance records for this class & date
  const targetRecord = attendanceRecords.find(
    (r) => r.classId === classItem.id && (!dateStr || r.date === dateStr)
  );

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 5, type: WidthType.PERCENTAGE }, children: [createP('#', { bold: true, alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 15, type: WidthType.PERCENTAGE }, children: [createP('رقم التعريف', { bold: true, alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 30, type: WidthType.PERCENTAGE }, children: [createP('اللقب والاسم', { bold: true, alignment: AlignmentType.RIGHT })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 20, type: WidthType.PERCENTAGE }, children: [createP('الحالة', { bold: true, alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 30, type: WidthType.PERCENTAGE }, children: [createP('ملاحظة / سبب الغياب', { bold: true, alignment: AlignmentType.RIGHT })] }),
      ],
    }),
  ];

  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let lateCount = 0;

  const sortedStudents = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));

  sortedStudents.forEach((st, idx) => {
    const entry = targetRecord?.records?.[st.id];
    let statusLabel = 'حاضر';
    if (!entry || entry.status === 'present') {
      presentCount++;
      statusLabel = 'حاضر';
    } else if (entry.status === 'absent') {
      absentCount++;
      statusLabel = 'غائب غير مبرر';
    } else if (entry.status === 'excused') {
      excusedCount++;
      statusLabel = 'غائب مبرر';
    } else if (entry.status === 'late') {
      lateCount++;
      statusLabel = 'متأخر';
    }

    rows.push(
      new TableRow({
        children: [
          new TableCell({ borders: commonBorders, children: [createP(`${idx + 1}`, { alignment: AlignmentType.CENTER })] }),
          new TableCell({ borders: commonBorders, children: [createP(st.studentNumber || '-', { alignment: AlignmentType.CENTER })] }),
          new TableCell({ borders: commonBorders, children: [createP(`${st.lastName} ${st.firstName}`, { bold: true, alignment: AlignmentType.RIGHT })] }),
          new TableCell({ borders: commonBorders, children: [createP(statusLabel, { alignment: AlignmentType.CENTER })] }),
          new TableCell({ borders: commonBorders, children: [createP(entry?.note || '-', { alignment: AlignmentType.RIGHT })] }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `القسم: ${classItem.name}   •   `, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `تاريخ الحصة: ${dateStr || 'اليوم'}   •   `, bold: true, size: 18, font: 'Cairo' }),
              new TextRun({ text: `إجمالي الحضور: ${presentCount}   •   `, size: 18, font: 'Cairo' }),
              new TextRun({ text: `الغياب: ${absentCount + excusedCount} (مبرر: ${excusedCount}، غير مبرر: ${absentCount})   •   `, size: 18, font: 'Cairo' }),
              new TextRun({ text: `التأخرات: ${lateCount}`, size: 18, font: 'Cairo' }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows,
          }),
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({ text: 'توقيع الأستاذ(ة): .......................................                               ختم مستشار التربية / المساعد التربوي: .......................................', bold: true, size: 18, font: 'Cairo' }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Kashf_Ghiyab_${classItem.name}_${dateStr || 'Yawmi'}`,
    'docx'
  );
  downloadFile(blob, filename);
}

/**
 * 5. EXPORT ABSENCE NOTICE / SUMMONS TO WORD (.docx)
 */
export async function exportAbsenceNoticeDocx(
  student: StudentItem,
  classItem: ClassItem,
  absenceCount: number,
  lastAbsenceDate: string,
  profile: TeacherProfile
): Promise<void> {
  const title = 'إشعار بالغياب واستدعاء ولي التلميذ';

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({ text: 'إلى السيد(ة) ولي أمر التلميذ(ة): ', bold: true, size: 22, font: 'Cairo' }),
              new TextRun({ text: `${student.lastName} ${student.firstName}`, bold: true, size: 22, underline: {}, font: 'Cairo' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `القسم والفوج: ${classItem.name} (${classItem.grade})   •   `, size: 20, font: 'Cairo' }),
              new TextRun({ text: `رقم التعريف المدرسي: ${student.studentNumber || 'غير محدد'}`, size: 20, font: 'Cairo' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({
                text: 'تحية طيبة وبعد،\n\nنحيطكم علماً بأن ابنكم (ابنتكم) المسجل(ة) بمؤسستنا قد تغيب(ت) عن مقاعد الدراسة بصورة غير مبررة، حيث بلغ مجموع الغيابات المسجلة بحقه: ',
                size: 20,
                font: 'Cairo',
              }),
              new TextRun({ text: `${absenceCount} حصة (حصص)`, bold: true, size: 20, color: 'DC2626', font: 'Cairo' }),
              new TextRun({ text: `، وكان آخر غياب مسجل بتاريخ: `, size: 20, font: 'Cairo' }),
              new TextRun({ text: `${lastAbsenceDate || 'المحدد في السجل'}.`, bold: true, size: 20, font: 'Cairo' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: 'وعليه، ونظراً للأثر السلبي لهذا التغيب على مستواه(ا) الدراسي، نرجو منكم الحضور إلى المؤسسة أو تبرير هذه الغيابات بشهادة قانونية (طبية أو عذر رسمي) خلال 48 ساعة من تاريخ استلام هذا الإشعار.',
                size: 20,
                font: 'Cairo',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'حرر بالمؤسسة بتاريخ: ...........................................',
                size: 18,
                font: 'Cairo',
              }),
            ],
          }),
          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: commonBorders, children: [createP('أستاذ المادة:\n\n\n........................', { alignment: AlignmentType.CENTER })] }),
                  new TableCell({ borders: commonBorders, children: [createP('مستشار التربية:\n\n\n........................', { alignment: AlignmentType.CENTER })] }),
                  new TableCell({ borders: commonBorders, children: [createP('مدير المؤسسة:\n\n\n........................', { alignment: AlignmentType.CENTER })] }),
                ],
              }),
            ],
          }),
          // Tear-off return receipt slip
          new Paragraph({ spacing: { before: 200, after: 80 } }),
          createP('✂----------------------- (وصل استلام إشعار الغياب يعاد للمؤسسة) -----------------------✂', {
            size: 16,
            color: '64748B',
            alignment: AlignmentType.CENTER,
          }),
          createP(`أنا الموقع أسفله ولي أمر التلميذ(ة): ${student.lastName} ${student.firstName}، قسم: ${classItem.name}.`, {
            size: 18,
            spacing: { before: 80, after: 60 },
          }),
          createP('أشهد أنني اطلعت على إشعار الغياب هذا وسأقوم بتسوية وضعيته بصفة رسمية.', {
            size: 18,
            spacing: { after: 80 },
          }),
          createP('تاريخ الاستلام: ....................                 توقيع الولي: ....................', {
            bold: true,
            size: 18,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Istid3aa_Wali_${student.lastName}_${student.firstName}`,
    'docx'
  );
  downloadFile(blob, filename);
}

/**
 * 6. EXPORT LESSON PLAN TO WORD (.docx)
 */
export async function exportLessonPlanDocx(
  lesson: LessonPlan,
  profile: TeacherProfile
): Promise<void> {
  const title = `مذكرة تربوية: ${lesson.title}`;

  const stageRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 25, type: WidthType.PERCENTAGE }, children: [createP('المرحلة / المحطة', { bold: true, alignment: AlignmentType.RIGHT })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 15, type: WidthType.PERCENTAGE }, children: [createP('المدة الزمنية', { bold: true, alignment: AlignmentType.CENTER })] }),
        new TableCell({ borders: commonBorders, shading: headerShading, width: { size: 60, type: WidthType.PERCENTAGE }, children: [createP('سير الأنشطة والتعلمات', { bold: true, alignment: AlignmentType.RIGHT })] }),
      ],
    }),
  ];

  lesson.stages.forEach((st) => {
    stageRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: commonBorders, children: [createP(st.title, { bold: true, alignment: AlignmentType.RIGHT })] }),
          new TableCell({ borders: commonBorders, children: [createP(st.duration || '-', { alignment: AlignmentType.CENTER })] }),
          new TableCell({ borders: commonBorders, children: [createP(st.content, { alignment: AlignmentType.RIGHT })] }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          ...createAlgerianHeader(profile, title),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: commonBorders, shading: subHeaderShading, children: [createP('المادة:', { bold: true })] }),
                  new TableCell({ borders: commonBorders, children: [createP(lesson.subject)] }),
                  new TableCell({ borders: commonBorders, shading: subHeaderShading, children: [createP('القسم:', { bold: true })] }),
                  new TableCell({ borders: commonBorders, children: [createP(lesson.className || lesson.classId)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: commonBorders, shading: subHeaderShading, children: [createP('تاريخ الحصة:', { bold: true })] }),
                  new TableCell({ borders: commonBorders, children: [createP(lesson.date)] }),
                  new TableCell({ borders: commonBorders, shading: subHeaderShading, children: [createP('المدة المقدرة:', { bold: true })] }),
                  new TableCell({ borders: commonBorders, children: [createP(lesson.duration)] }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 120 } }),
          createP('الأهداف والكفاءات المستهدفة:', { bold: true, size: 20, spacing: { after: 60 } }),
          createP(lesson.objectives, { spacing: { after: 120 } }),
          createP('الوسائل والسندات التعليمية:', { bold: true, size: 20, spacing: { after: 60 } }),
          createP(lesson.teachingAids || 'الكتاب المدرسي، السبورة، أوراق الأنشطة', { spacing: { after: 120 } }),
          createP('مراحل وسير الدرس:', { bold: true, size: 20, spacing: { after: 60 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: true,
            rows: stageRows,
          }),
          ...(lesson.teacherNotes ? [
            new Paragraph({ spacing: { before: 120 } }),
            createP('ملاحظات وتقويم الأستاذ(ة):', { bold: true, size: 20, spacing: { after: 60 } }),
            createP(lesson.teacherNotes),
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFileName(
    `OstadDZ_Moudhakira_${lesson.title.replace(/\s+/g, '_')}`,
    'docx'
  );
  downloadFile(blob, filename);
}
