import * as XLSX from 'xlsx';
import { ClassItem, StudentItem } from '../types';

export interface ExcelColumnMapping {
  firstName: string;
  lastName: string;
  studentNumber?: string;
  gender?: string;
  birthDate?: string;
  guardianPhone?: string;
  className?: string;
  notes?: string;
}

export interface ParsedStudentRow {
  rowNumber: number;
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: 'male' | 'female';
  birthDate: string;
  guardianPhone: string;
  className: string;
  notes: string;
  status: 'valid' | 'duplicate' | 'invalid';
  validationMessage: string;
  matchedExistingStudent?: StudentItem;
  duplicateReason?: 'student_number' | 'name_in_class' | 'in_file';
}

export interface ExcelImportAnalysis {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: ParsedStudentRow[];
}

/**
 * Normalizes Arabic string for fuzzy matching (removes accents, normalizes hamza, alef, etc.)
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/\s+/g, ' ');
}

/**
 * Format Excel dates (handles date objects, serial numbers, and common string formats)
 */
export function formatExcelDateValue(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel date serial number
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  // If DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }
  return str;
}

/**
 * Normalizes gender input to 'male' or 'female'
 */
export function normalizeGender(val: any): 'male' | 'female' {
  if (!val) return 'male';
  const str = String(val).trim().toLowerCase();
  if (
    str === 'أنثى' ||
    str === 'انثى' ||
    str === 'إناث' ||
    str === 'بنت' ||
    str === 'f' ||
    str === 'female' ||
    str === 'fille' ||
    str === 'femme'
  ) {
    return 'female';
  }
  return 'male';
}

/**
 * Guess best column mapping based on standard Algerian/Arabic headers
 */
export function autoDetectColumnMapping(headers: string[]): ExcelColumnMapping {
  const mapping: ExcelColumnMapping = {
    firstName: '',
    lastName: '',
  };

  for (const h of headers) {
    const clean = normalizeArabicText(h);
    const original = h.trim();

    // 1. Last name (اللقب)
    if (!mapping.lastName && (
      clean === 'اللقب' ||
      clean === 'لقب' ||
      clean.includes('لقب') ||
      clean === 'nom' ||
      clean.includes('nom') ||
      clean === 'last name' ||
      clean === 'family name'
    )) {
      mapping.lastName = original;
      continue;
    }

    // 2. First name (الاسم)
    if (!mapping.firstName && (
      clean === 'الاسم' ||
      clean === 'اسم' ||
      clean === 'اسم التلميذ' ||
      clean === 'اسم الطالب' ||
      clean === 'الاسم الشخصي' ||
      clean === 'prenom' ||
      clean === 'first name' ||
      (clean.includes('اسم') && !clean.includes('لقب') && !clean.includes('ولي') && !clean.includes('مؤسس'))
    )) {
      mapping.firstName = original;
      continue;
    }

    // 3. Student Number (رقم التسجيل)
    if (!mapping.studentNumber && (
      clean.includes('تسجيل') ||
      clean.includes('تعريف') ||
      clean.includes('matricule') ||
      clean.includes('قيد') ||
      clean === 'رقم التلميذ' ||
      clean === 'id' ||
      clean === 'code'
    )) {
      mapping.studentNumber = original;
      continue;
    }

    // 4. Gender (الجنس)
    if (!mapping.gender && (
      clean === 'الجنس' ||
      clean === 'النوع' ||
      clean === 'sexe' ||
      clean === 'gender'
    )) {
      mapping.gender = original;
      continue;
    }

    // 5. Birth Date (تاريخ الميلاد)
    if (!mapping.birthDate && (
      clean.includes('ميلاد') ||
      clean.includes('ازدياد') ||
      clean.includes('ولادة') ||
      clean.includes('naissance') ||
      clean.includes('dob')
    )) {
      mapping.birthDate = original;
      continue;
    }

    // 6. Guardian Phone (هاتف الولي)
    if (!mapping.guardianPhone && (
      clean.includes('هاتف') ||
      clean.includes('تليفون') ||
      clean.includes('ولي') ||
      clean.includes('phone') ||
      clean.includes('tel')
    )) {
      mapping.guardianPhone = original;
      continue;
    }

    // 7. Class Name (القسم)
    if (!mapping.className && (
      clean === 'القسم' ||
      clean === 'الفوج' ||
      clean === 'الصف' ||
      clean.includes('قسم') ||
      clean.includes('classe')
    )) {
      mapping.className = original;
      continue;
    }

    // 8. Notes (ملاحظات)
    if (!mapping.notes && (
      clean.includes('ملاحظ') ||
      clean.includes('remarque') ||
      clean.includes('note') ||
      clean.includes('observation')
    )) {
      mapping.notes = original;
      continue;
    }
  }

  // Fallbacks if not matched:
  if (!mapping.lastName && headers.length > 0) {
    // Check if first column has 'nom' or represents surname
    const found = headers.find(h => /لقب|nom/i.test(h));
    if (found) mapping.lastName = found;
  }
  if (!mapping.firstName && headers.length > 0) {
    const found = headers.find(h => /اسم|prenom|name/i.test(h) && h !== mapping.lastName);
    if (found) mapping.firstName = found;
  }

  return mapping;
}

/**
 * Parses an uploaded Excel file locally using FileReader and SheetJS
 */
export async function parseExcelFile(
  file: File
): Promise<{ headers: string[]; rawRows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
        });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('ملف Excel لا يحتوي على أي صفحات.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });

        if (!rawJson || rawJson.length === 0) {
          resolve({ headers: [], rawRows: [] });
          return;
        }

        // Extract all unique headers across rows
        const headersSet = new Set<string>();
        rawJson.forEach((row) => {
          Object.keys(row).forEach((k) => {
            const trimmed = k.trim();
            if (trimmed && !trimmed.startsWith('__EMPTY')) {
              headersSet.add(trimmed);
            }
          });
        });

        const headers = Array.from(headersSet);
        resolve({ headers, rawRows: rawJson });
      } catch (err: any) {
        reject(new Error(`تعذر قراءة ملف Excel: ${err.message || err}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء قراءة الملف من الجهاز.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate and analyze student rows from Excel with duplicate detection
 */
export function validateAndAnalyzeExcelRows(
  rawRows: Record<string, any>[],
  mapping: ExcelColumnMapping,
  existingStudents: StudentItem[],
  targetClassId: string,
  classes: ClassItem[]
): ExcelImportAnalysis {
  const resultRows: ParsedStudentRow[] = [];
  const seenStudentNumbersInFile = new Set<string>();
  const seenNamesInFile = new Set<string>();

  let validCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  // Build lookup maps for existing students
  const existingByNumber = new Map<string, StudentItem>();
  const existingByNameAndClass = new Map<string, StudentItem>();

  existingStudents.forEach((st) => {
    if (st.studentNumber && st.studentNumber.trim()) {
      existingByNumber.set(st.studentNumber.trim().toLowerCase(), st);
    }
    const key = `${normalizeArabicText(st.lastName)}_${normalizeArabicText(st.firstName)}_${st.classId}`;
    existingByNameAndClass.set(key, st);
  });

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // considering header is row 1
    const rawLastName = mapping.lastName ? String(row[mapping.lastName] || '').trim() : '';
    const rawFirstName = mapping.firstName ? String(row[mapping.firstName] || '').trim() : '';
    const rawNumber = mapping.studentNumber ? String(row[mapping.studentNumber] || '').trim() : '';
    const rawGender = mapping.gender ? row[mapping.gender] : '';
    const rawBirthDate = mapping.birthDate ? row[mapping.birthDate] : '';
    const rawPhone = mapping.guardianPhone ? String(row[mapping.guardianPhone] || '').trim() : '';
    const rawClassName = mapping.className ? String(row[mapping.className] || '').trim() : '';
    const rawNotes = mapping.notes ? String(row[mapping.notes] || '').trim() : '';

    // Check if entire row is empty
    if (!rawLastName && !rawFirstName && !rawNumber) {
      // Empty row, skip
      return;
    }

    const gender = normalizeGender(rawGender);
    const birthDate = formatExcelDateValue(rawBirthDate);

    // Validation: missing first or last name
    if (!rawLastName || !rawFirstName) {
      invalidCount++;
      resultRows.push({
        rowNumber,
        id: `temp-${rowNumber}-${Date.now()}`,
        firstName: rawFirstName,
        lastName: rawLastName,
        studentNumber: rawNumber,
        gender,
        birthDate,
        guardianPhone: rawPhone,
        className: rawClassName,
        notes: rawNotes,
        status: 'invalid',
        validationMessage: !rawLastName && !rawFirstName 
          ? 'الاسم واللقب كلاهما مفقود' 
          : !rawLastName 
            ? 'اللقب مفقود' 
            : 'اسم التلميذ مفقود',
      });
      return;
    }

    // Determine target class for duplicate checking:
    let effectiveClassId = targetClassId;
    if (effectiveClassId === 'from_excel' && rawClassName) {
      const matchedCls = classes.find(
        (c) => normalizeArabicText(c.name) === normalizeArabicText(rawClassName)
      );
      if (matchedCls) {
        effectiveClassId = matchedCls.id;
      }
    }

    // Duplicate Check 1: In Database by Student Number
    let matchedStudent: StudentItem | undefined;
    let dupReason: 'student_number' | 'name_in_class' | 'in_file' | undefined;

    if (rawNumber && existingByNumber.has(rawNumber.toLowerCase())) {
      matchedStudent = existingByNumber.get(rawNumber.toLowerCase());
      dupReason = 'student_number';
    }

    // Duplicate Check 2: In Database by Last Name + First Name in the same class
    if (!matchedStudent && effectiveClassId && effectiveClassId !== 'from_excel') {
      const nameKey = `${normalizeArabicText(rawLastName)}_${normalizeArabicText(rawFirstName)}_${effectiveClassId}`;
      if (existingByNameAndClass.has(nameKey)) {
        matchedStudent = existingByNameAndClass.get(nameKey);
        dupReason = 'name_in_class';
      }
    }

    // Duplicate Check 3: Inside the Excel file itself
    let isFileDuplicate = false;
    if (rawNumber) {
      const numKey = rawNumber.toLowerCase();
      if (seenStudentNumbersInFile.has(numKey)) {
        isFileDuplicate = true;
        dupReason = 'in_file';
      } else {
        seenStudentNumbersInFile.add(numKey);
      }
    }

    const filePersonKey = `${normalizeArabicText(rawLastName)}_${normalizeArabicText(rawFirstName)}`;
    if (seenNamesInFile.has(filePersonKey)) {
      isFileDuplicate = true;
      dupReason = 'in_file';
    } else {
      seenNamesInFile.add(filePersonKey);
    }

    if (matchedStudent || isFileDuplicate) {
      duplicateCount++;
      let msg = '';
      if (dupReason === 'student_number') {
        msg = `موجود مسبقاً بنفس رقم التسجيل (#${rawNumber})`;
      } else if (dupReason === 'name_in_class') {
        msg = `موجود مسبقاً بنفس الاسم واللقب في هذا القسم`;
      } else {
        msg = `مكرر ضمن أسطر ملف Excel نفسه`;
      }

      resultRows.push({
        rowNumber,
        id: matchedStudent?.id || `temp-dup-${rowNumber}-${Date.now()}`,
        firstName: rawFirstName,
        lastName: rawLastName,
        studentNumber: rawNumber,
        gender,
        birthDate,
        guardianPhone: rawPhone,
        className: rawClassName,
        notes: rawNotes,
        status: 'duplicate',
        validationMessage: msg,
        matchedExistingStudent: matchedStudent,
        duplicateReason: dupReason,
      });
      return;
    }

    // Valid row
    validCount++;
    resultRows.push({
      rowNumber,
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      firstName: rawFirstName,
      lastName: rawLastName,
      studentNumber: rawNumber,
      gender,
      birthDate,
      guardianPhone: rawPhone,
      className: rawClassName,
      notes: rawNotes,
      status: 'valid',
      validationMessage: 'جاهز للاستيراد',
    });
  });

  return {
    totalRows: resultRows.length,
    validCount,
    duplicateCount,
    invalidCount,
    rows: resultRows,
  };
}

/**
 * Export students list to an Excel (.xlsx) file
 */
export function exportStudentsToExcel(
  students: StudentItem[],
  classes: ClassItem[],
  selectedClassId?: string
): { success: boolean; filename: string; count: number } {
  const isSpecificClass = selectedClassId && selectedClassId !== 'all';
  const targetClass = isSpecificClass ? classes.find((c) => c.id === selectedClassId) : null;

  // Filter if needed
  const listToExport = isSpecificClass
    ? students.filter((s) => s.classId === selectedClassId)
    : [...students];

  // Sort alphabetically by last name (Algerian school convention)
  listToExport.sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));

  // Prepare file name
  let filename = 'OstadDZ_قائمة_التلاميذ.xlsx';
  if (targetClass) {
    const cleanClassName = targetClass.name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
    filename = `OstadDZ_Classe_${cleanClassName}.xlsx`;
  }

  // Build rows data
  const rows = listToExport.map((st, index) => {
    const assignedClass = classes.find((c) => c.id === st.classId);
    return {
      'الرقم': index + 1,
      'اسم التلميذ': st.firstName,
      'اللقب': st.lastName,
      'رقم التسجيل': st.studentNumber || '',
      'القسم': assignedClass?.name || '',
      'المستوى': assignedClass?.grade || '',
      'الجنس': st.gender === 'female' ? 'أنثى' : 'ذكر',
      'تاريخ الميلاد': st.birthDate || '',
      'هاتف الولي': st.guardianPhone || '',
      'ملاحظات': st.notes || '',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // الرقم
    { wch: 16 }, // اسم التلميذ
    { wch: 16 }, // اللقب
    { wch: 14 }, // رقم التسجيل
    { wch: 14 }, // القسم
    { wch: 22 }, // المستوى
    { wch: 8 },  // الجنس
    { wch: 14 }, // تاريخ الميلاد
    { wch: 16 }, // هاتف الولي
    { wch: 26 }, // ملاحظات
  ];

  // Create workbook and write
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, targetClass ? targetClass.name : 'التلاميذ');
  XLSX.writeFile(workbook, filename);

  return {
    success: true,
    filename,
    count: listToExport.length,
  };
}

/**
 * Downloads a ready-to-fill student list template in .xlsx format
 */
export function generateStudentExcelTemplate(): { success: boolean; filename: string } {
  const filename = 'OstadDZ_نموذج_استيراد_التلاميذ.xlsx';

  // Sample data to guide the teacher
  const templateRows = [
    {
      'رقم التسجيل': '20240101',
      'اللقب': 'بن عمار',
      'اسم التلميذ': 'ياسين',
      'الجنس': 'ذكر',
      'تاريخ الميلاد': '2009-04-15',
      'هاتف الولي': '0661234567',
      'القسم': '4 متوسط 1',
      'ملاحظات': 'تلميذ مجتهد - مسؤول القسم',
    },
    {
      'رقم التسجيل': '20240102',
      'اللقب': 'براهيمي',
      'اسم التلميذ': 'مريم',
      'الجنس': 'أنثى',
      'تاريخ الميلاد': '2009-08-22',
      'هاتف الولي': '0550987654',
      'القسم': '4 متوسط 1',
      'ملاحظات': '',
    },
    {
      'رقم التسجيل': '20240103',
      'اللقب': 'منصوري',
      'اسم التلميذ': 'أحمد',
      'الجنس': 'ذكر',
      'تاريخ الميلاد': '2009-11-03',
      'هاتف الولي': '0772345678',
      'القسم': '4 متوسط 1',
      'ملاحظات': '',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 14 }, // رقم التسجيل
    { wch: 16 }, // اللقب
    { wch: 16 }, // اسم التلميذ
    { wch: 10 }, // الجنس
    { wch: 16 }, // تاريخ الميلاد
    { wch: 16 }, // هاتف الولي
    { wch: 16 }, // القسم
    { wch: 28 }, // ملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج التلاميذ');
  XLSX.writeFile(workbook, filename);

  return { success: true, filename };
}
