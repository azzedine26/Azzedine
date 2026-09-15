/**
 * IndexedDB Local Storage Layer for Ostad DZ
 * Offline-first, fast, and structured.
 */

const DB_NAME = 'ostad_dz_db';
const DB_VERSION = 9;

export const STORES = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  SETTINGS: 'app_settings',
  SCHEDULE: 'schedule',
  LESSONS: 'lessons',
  ASSESSMENTS: 'assessments',
  SUBJECTS: 'subject_settings',
  ATTENDANCE: 'attendance',
  LIBRARY: 'library_items',
  LIBRARY_FILES: 'library_files',
  REMINDERS: 'reminders',
  RANDOM_DRAWS: 'random_draws',
  RANDOM_DRAW_STATES: 'random_draw_states',
} as const;

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Classes Store
      if (!db.objectStoreNames.contains(STORES.CLASSES)) {
        const classStore = db.createObjectStore(STORES.CLASSES, { keyPath: 'id' });
        classStore.createIndex('stage', 'stage', { unique: false });
        classStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Students Store
      if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
        const studentStore = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
        studentStore.createIndex('classId', 'classId', { unique: false });
        studentStore.createIndex('lastName', 'lastName', { unique: false });
        studentStore.createIndex('firstName', 'firstName', { unique: false });
        studentStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. Settings Store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // 4. Schedule Store
      if (!db.objectStoreNames.contains(STORES.SCHEDULE)) {
        const scheduleStore = db.createObjectStore(STORES.SCHEDULE, { keyPath: 'id' });
        scheduleStore.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
        scheduleStore.createIndex('classId', 'classId', { unique: false });
        scheduleStore.createIndex('startTime', 'startTime', { unique: false });
      }

      // 5. Lessons Store (تحضير الدروس)
      if (!db.objectStoreNames.contains(STORES.LESSONS)) {
        const lessonStore = db.createObjectStore(STORES.LESSONS, { keyPath: 'id' });
        lessonStore.createIndex('classId', 'classId', { unique: false });
        lessonStore.createIndex('subject', 'subject', { unique: false });
        lessonStore.createIndex('date', 'date', { unique: false });
        lessonStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 6. Assessments & Grades Store (النقاط والمعدلات)
      if (!db.objectStoreNames.contains(STORES.ASSESSMENTS)) {
        const assessmentStore = db.createObjectStore(STORES.ASSESSMENTS, { keyPath: 'id' });
        assessmentStore.createIndex('classId', 'classId', { unique: false });
        assessmentStore.createIndex('subject', 'subject', { unique: false });
        assessmentStore.createIndex('type', 'type', { unique: false });
        assessmentStore.createIndex('trimester', 'trimester', { unique: false });
        assessmentStore.createIndex('date', 'date', { unique: false });
        assessmentStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 7. Subjects Settings Store (إعدادات كل مادة ومعاملها وكيفية الحساب)
      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        const subjectStore = db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' });
        subjectStore.createIndex('name', 'name', { unique: false });
        subjectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 8. Attendance Store (الحضور والغياب)
      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
        const attendanceStore = db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id' });
        attendanceStore.createIndex('classId', 'classId', { unique: false });
        attendanceStore.createIndex('date', 'date', { unique: false });
        attendanceStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 9. Library Items Store (مكتبة الدروس والملفات - بيانات وصفية)
      if (!db.objectStoreNames.contains(STORES.LIBRARY)) {
        const libraryStore = db.createObjectStore(STORES.LIBRARY, { keyPath: 'id' });
        libraryStore.createIndex('subject', 'subject', { unique: false });
        libraryStore.createIndex('classId', 'classId', { unique: false });
        libraryStore.createIndex('folderName', 'folderName', { unique: false });
        libraryStore.createIndex('itemType', 'itemType', { unique: false });
        libraryStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 10. Library Binary Files Store (تخزين الملفات الكبيرة كـ Blobs محلياً في IndexedDB)
      if (!db.objectStoreNames.contains(STORES.LIBRARY_FILES)) {
        db.createObjectStore(STORES.LIBRARY_FILES, { keyPath: 'id' });
      }

      // 11. Reminders Store (التذكيرات والمهام المؤرخة)
      if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
        const reminderStore = db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
        reminderStore.createIndex('dueDate', 'dueDate', { unique: false });
        reminderStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        reminderStore.createIndex('classId', 'classId', { unique: false });
        reminderStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 12. Random Draws History Store (سجل القرعات العشوائية)
      if (!db.objectStoreNames.contains(STORES.RANDOM_DRAWS)) {
        const drawStore = db.createObjectStore(STORES.RANDOM_DRAWS, { keyPath: 'id' });
        drawStore.createIndex('classId', 'classId', { unique: false });
        drawStore.createIndex('studentId', 'studentId', { unique: false });
        drawStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 13. Random Draw Class States (حالة القرعة لكل قسم ومنع التكرار والاستثناءات)
      if (!db.objectStoreNames.contains(STORES.RANDOM_DRAW_STATES)) {
        db.createObjectStore(STORES.RANDOM_DRAW_STATES, { keyPath: 'classId' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        initPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB open error:', error);
      reject(error || new Error('Failed to open IndexedDB'));
    };
  });

  return initPromise;
}

/**
 * Generic helper to execute a transaction
 */
export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);

      let result: T;

      Promise.resolve(callback(store))
        .then((res) => {
          result = res;
        })
        .catch(reject);

      tx.oncomplete = () => {
        resolve(result);
      };

      tx.onerror = () => {
        reject(tx.error || new Error(`Transaction error on ${storeName}`));
      };

      tx.onabort = () => {
        reject(tx.error || new Error(`Transaction aborted on ${storeName}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}
