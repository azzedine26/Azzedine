import { AppSettings, ClassItem, StudentItem, TeacherProfile, ScheduleSession, DayOfWeek, LessonPlan, AssessmentItem, StudentScoreRecord, SubjectSetting, AttendanceRecord, LibraryItem, LibraryFileRecord, ReminderItem, RandomDrawRecord, RandomDrawClassState } from '../types';
import { openDatabase, STORES, withStore } from './indexedDb';
import { INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_TEACHER_PROFILE, INITIAL_SESSIONS, INITIAL_LESSONS, INITIAL_ASSESSMENTS, INITIAL_SUBJECT_SETTINGS, INITIAL_ATTENDANCE, INITIAL_LIBRARY_ITEMS, INITIAL_REMINDERS } from '../data/algerianData';

const SETTINGS_KEY = 'main_config';

export const databaseService = {
  /**
   * Check and seed initial data if empty
   */
  async ensureInitialized(): Promise<void> {
    try {
      const classesCount = await this.getClassesCount();
      if (classesCount === 0) {
        // Seed initial classes
        for (const c of INITIAL_CLASSES) {
          await this.addClass(c);
        }
        // Seed initial students
        for (const s of INITIAL_STUDENTS) {
          await this.addStudent(s);
        }
        // Seed initial settings
        await this.saveSettings({
          key: SETTINGS_KEY,
          theme: 'light',
          profile: INITIAL_TEACHER_PROFILE,
          hasSeenSplash: false,
          updatedAt: Date.now()
        });
      }

      // Check sessions count
      const sessionsCount = await this.getSessionsCount();
      if (sessionsCount === 0) {
        for (const session of INITIAL_SESSIONS) {
          await this.addSession(session);
        }
      }

      // Check lessons count
      const lessonsCount = await this.getLessonsCount();
      if (lessonsCount === 0) {
        for (const lesson of INITIAL_LESSONS) {
          await this.addLesson(lesson);
        }
      }

      // Check assessments count (النقاط والمعدلات)
      const assessmentsCount = await this.getAssessmentsCount();
      if (assessmentsCount === 0) {
        for (const assess of INITIAL_ASSESSMENTS) {
          await this.addAssessment(assess);
        }
      } else {
        await this.cleanupDuplicateAssessments();
      }

      // Check subject settings count (إعدادات المواد وكيفية الحساب)
      const subjectsCount = await this.getSubjectsCount();
      if (subjectsCount === 0) {
        for (const subj of INITIAL_SUBJECT_SETTINGS) {
          await this.saveSubjectSetting(subj);
        }
      }

      // Check attendance count (الحضور والغياب)
      const attendanceCount = await this.getAttendanceCount();
      if (attendanceCount === 0) {
        for (const record of INITIAL_ATTENDANCE) {
          await this.saveAttendance(record);
        }
      }

      // Check library count (مكتبة الدروس والملفات)
      const libraryCount = await this.getLibraryItemsCount();
      if (libraryCount === 0) {
        for (const item of INITIAL_LIBRARY_ITEMS) {
          await this.saveLibraryItem(item);
        }
      }

      // Check reminders count (التذكيرات والمهام المؤرخة)
      const remindersCount = await this.getRemindersCount();
      if (remindersCount === 0) {
        for (const rem of INITIAL_REMINDERS) {
          await this.saveReminder(rem);
        }
      }
    } catch (e) {
      console.warn('Initial seeding failed or already exists:', e);
    }
  },

  // ================= CLASSES =================
  async getAllClasses(): Promise<ClassItem[]> {
    return withStore<ClassItem[]>(STORES.CLASSES, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as ClassItem[]) || [];
          // Sort by createdAt desc
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getClassById(id: string): Promise<ClassItem | null> {
    return withStore<ClassItem | null>(STORES.CLASSES, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getClassesCount(): Promise<number> {
    return withStore<number>(STORES.CLASSES, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async addClass(classItem: ClassItem): Promise<ClassItem> {
    const itemWithTimestamps = {
      ...classItem,
      createdAt: classItem.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    return withStore<ClassItem>(STORES.CLASSES, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async updateClass(classItem: ClassItem): Promise<ClassItem> {
    const updated = {
      ...classItem,
      updatedAt: Date.now()
    };
    return withStore<ClassItem>(STORES.CLASSES, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteClass(id: string): Promise<void> {
    // Delete class and cascade or unassign its students
    await withStore<void>(STORES.CLASSES, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });

    // Also delete students belonging to this class
    const studentsInClass = await this.getStudentsByClass(id);
    for (const st of studentsInClass) {
      await this.deleteStudent(st.id);
    }

    // Also delete sessions belonging to this class
    const allSessions = await this.getAllSessions();
    for (const sess of allSessions) {
      if (sess.classId === id) {
        await this.deleteSession(sess.id);
      }
    }

    // Also delete lessons belonging to this class
    const allLessons = await this.getAllLessons();
    for (const lesson of allLessons) {
      if (lesson.classId === id) {
        await this.deleteLesson(lesson.id);
      }
    }
  },

  // ================= STUDENTS =================
  async getAllStudents(): Promise<StudentItem[]> {
    return withStore<StudentItem[]>(STORES.STUDENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as StudentItem[]) || [];
          list.sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getStudentsByClass(classId: string): Promise<StudentItem[]> {
    return withStore<StudentItem[]>(STORES.STUDENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const index = store.index('classId');
        const req = index.getAll(classId);
        req.onsuccess = () => {
          const list = (req.result as StudentItem[]) || [];
          list.sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getStudentsCount(): Promise<number> {
    return withStore<number>(STORES.STUDENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async addStudent(studentItem: StudentItem): Promise<StudentItem> {
    const itemWithTimestamps = {
      ...studentItem,
      createdAt: studentItem.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    return withStore<StudentItem>(STORES.STUDENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async updateStudent(studentItem: StudentItem): Promise<StudentItem> {
    const updated = {
      ...studentItem,
      updatedAt: Date.now()
    };
    return withStore<StudentItem>(STORES.STUDENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async bulkSaveStudents(studentsToSave: StudentItem[]): Promise<void> {
    if (!studentsToSave.length) return;
    return withStore<void>(STORES.STUDENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        let remaining = studentsToSave.length;
        let hasError = false;
        for (const st of studentsToSave) {
          const itemWithTimestamps: StudentItem = {
            ...st,
            createdAt: st.createdAt || Date.now(),
            updatedAt: Date.now()
          };
          const req = store.put(itemWithTimestamps);
          req.onsuccess = () => {
            remaining--;
            if (remaining === 0 && !hasError) {
              resolve();
            }
          };
          req.onerror = () => {
            hasError = true;
            reject(req.error);
          };
        }
      });
    });
  },

  async deleteStudent(id: string): Promise<void> {
    return withStore<void>(STORES.STUDENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= SCHEDULE SESSIONS =================
  async getAllSessions(): Promise<ScheduleSession[]> {
    return withStore<ScheduleSession[]>(STORES.SCHEDULE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as ScheduleSession[]) || [];
          list.sort((a, b) => a.startTime.localeCompare(b.startTime));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getSessionsByDay(day: DayOfWeek): Promise<ScheduleSession[]> {
    return withStore<ScheduleSession[]>(STORES.SCHEDULE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const index = store.index('dayOfWeek');
        const req = index.getAll(day);
        req.onsuccess = () => {
          const list = (req.result as ScheduleSession[]) || [];
          list.sort((a, b) => a.startTime.localeCompare(b.startTime));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getSessionsCount(): Promise<number> {
    return withStore<number>(STORES.SCHEDULE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async addSession(sessionItem: ScheduleSession): Promise<ScheduleSession> {
    const itemWithTimestamps = {
      ...sessionItem,
      createdAt: sessionItem.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    return withStore<ScheduleSession>(STORES.SCHEDULE, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async updateSession(sessionItem: ScheduleSession): Promise<ScheduleSession> {
    const updated = {
      ...sessionItem,
      updatedAt: Date.now()
    };
    return withStore<ScheduleSession>(STORES.SCHEDULE, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteSession(id: string): Promise<void> {
    return withStore<void>(STORES.SCHEDULE, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= LESSONS (تحضير الدروس) =================
  async getAllLessons(): Promise<LessonPlan[]> {
    return withStore<LessonPlan[]>(STORES.LESSONS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as LessonPlan[]) || [];
          list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLessonsByClass(classId: string): Promise<LessonPlan[]> {
    return withStore<LessonPlan[]>(STORES.LESSONS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const index = store.index('classId');
        const req = index.getAll(classId);
        req.onsuccess = () => {
          const list = (req.result as LessonPlan[]) || [];
          list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLessonById(id: string): Promise<LessonPlan | null> {
    return withStore<LessonPlan | null>(STORES.LESSONS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLessonsCount(): Promise<number> {
    return withStore<number>(STORES.LESSONS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async addLesson(lessonItem: LessonPlan): Promise<LessonPlan> {
    const itemWithTimestamps = {
      ...lessonItem,
      createdAt: lessonItem.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    return withStore<LessonPlan>(STORES.LESSONS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async updateLesson(lessonItem: LessonPlan): Promise<LessonPlan> {
    const updated = {
      ...lessonItem,
      updatedAt: Date.now()
    };
    return withStore<LessonPlan>(STORES.LESSONS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteLesson(id: string): Promise<void> {
    return withStore<void>(STORES.LESSONS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= ASSESSMENTS & GRADES (النقاط والمعدلات) =================
  sanitizeAssessmentMaxScore(item: AssessmentItem): AssessmentItem {
    const isTest1 = item.type === 'test1' || (item.title && (item.title.includes('الفرض الأول') || item.title.includes('فرض 1')));
    const isTest2 = item.type === 'test2' || (item.title && (item.title.includes('الفرض الثاني') || item.title.includes('فرض 2')));
    if (isTest1) {
      return {
        ...item,
        type: 'test1',
        title: item.title && !item.title.includes('الفرض الأول') ? 'الفرض الأول' : item.title,
        maxScore: 20,
      };
    }
    if (isTest2) {
      return {
        ...item,
        type: 'test2',
        title: item.title && !item.title.includes('الفرض الثاني') ? 'الفرض الثاني' : item.title,
        maxScore: 20,
      };
    }
    return item;
  },

  async getAllAssessments(): Promise<AssessmentItem[]> {
    return withStore<AssessmentItem[]>(STORES.ASSESSMENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as AssessmentItem[]) || [];
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(list.map((item) => this.sanitizeAssessmentMaxScore(item)));
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAssessmentsByClass(classId: string): Promise<AssessmentItem[]> {
    return withStore<AssessmentItem[]>(STORES.ASSESSMENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const index = store.index('classId');
        const req = index.getAll(classId);
        req.onsuccess = () => {
          const list = (req.result as AssessmentItem[]) || [];
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(list.map((item) => this.sanitizeAssessmentMaxScore(item)));
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAssessmentById(id: string): Promise<AssessmentItem | null> {
    return withStore<AssessmentItem | null>(STORES.ASSESSMENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? this.sanitizeAssessmentMaxScore(req.result) : null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAssessmentsCount(): Promise<number> {
    return withStore<number>(STORES.ASSESSMENTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async addAssessment(assessment: AssessmentItem): Promise<AssessmentItem> {
    const sanitized = this.sanitizeAssessmentMaxScore(assessment);
    const itemWithTimestamps: AssessmentItem = {
      ...sanitized,
      grades: sanitized.grades || {},
      createdAt: sanitized.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    return withStore<AssessmentItem>(STORES.ASSESSMENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async updateAssessment(assessment: AssessmentItem): Promise<AssessmentItem> {
    const sanitized = this.sanitizeAssessmentMaxScore(assessment);
    const updated: AssessmentItem = {
      ...sanitized,
      grades: sanitized.grades || {},
      updatedAt: Date.now(),
    };

    return withStore<AssessmentItem>(STORES.ASSESSMENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async saveBatchGrades(assessmentId: string, grades: Record<string, StudentScoreRecord>): Promise<AssessmentItem> {
    const existing = await this.getAssessmentById(assessmentId);
    if (!existing) {
      throw new Error('التقييم المطلوب غير موجود.');
    }

    const updated: AssessmentItem = this.sanitizeAssessmentMaxScore({
      ...existing,
      grades: grades || {},
      updatedAt: Date.now(),
    });

    return withStore<AssessmentItem>(STORES.ASSESSMENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteAssessment(id: string): Promise<void> {
    return withStore<void>(STORES.ASSESSMENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async cleanupDuplicateAssessments(): Promise<AssessmentItem[]> {
    return withStore<AssessmentItem[]>(STORES.ASSESSMENTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as AssessmentItem[]) || [];
          const map = new Map<string, AssessmentItem>();
          const toDeleteIds = new Set<string>();

          for (const item of list) {
            let cat: 'continuous' | 'test1' | 'test2' | 'exam' | string = item.type;
            if (item.type === 'test') {
              const lower = (item.title || '').toLowerCase();
              if (lower.includes('2') || lower.includes('ثان') || lower.includes('ثاني')) {
                cat = 'test2';
              } else {
                cat = 'test1';
              }
            } else if (item.type === 'continuous' || (item.title || '').includes('تقويم')) {
              cat = 'continuous';
            }

            if (cat === 'continuous' || cat === 'test1' || cat === 'test2' || cat === 'exam') {
              const itemSubj = (item.subject || '').trim().toLowerCase();
              // Find existing match by class, trimester, category, and matching subject
              let foundKey: string | null = null;
              for (const [existingKey, existingItem] of map.entries()) {
                let exCat = existingItem.type;
                if (existingItem.type === 'test') {
                  const exLower = (existingItem.title || '').toLowerCase();
                  exCat = (exLower.includes('2') || exLower.includes('ثان') || exLower.includes('ثاني')) ? 'test2' : 'test1';
                } else if (existingItem.type === 'continuous' || (existingItem.title || '').includes('تقويم')) {
                  exCat = 'continuous';
                }
                const exSubj = (existingItem.subject || '').trim().toLowerCase();
                const subjMatches = !itemSubj || !exSubj || itemSubj === exSubj;
                if (
                  existingItem.classId === item.classId &&
                  existingItem.trimester === item.trimester &&
                  exCat === cat &&
                  subjMatches
                ) {
                  foundKey = existingKey;
                  break;
                }
              }

              const catTitle =
                cat === 'continuous'
                  ? 'التقويم'
                  : cat === 'test1'
                  ? 'الفرض الأول'
                  : cat === 'test2'
                  ? 'الفرض الثاني'
                  : 'اختبار الفصل';

              if (!foundKey) {
                const normItem: AssessmentItem = this.sanitizeAssessmentMaxScore({
                  ...item,
                  type: cat as any,
                  title: catTitle,
                  coefficient: 1,
                  maxScore: (cat === 'test1' || cat === 'test2') ? 20 : (item.maxScore || 20),
                  grades: { ...(item.grades || {}) },
                });
                const key = `${item.classId}_${itemSubj}_${item.trimester}_${cat}`;
                map.set(key, normItem);
              } else {
                const existing = map.get(foundKey)!;
                const mergedGrades = { ...(existing.grades || {}), ...(item.grades || {}) };
                const existingTime = existing.updatedAt || existing.createdAt || 0;
                const itemTime = item.updatedAt || item.createdAt || 0;

                if (itemTime >= existingTime) {
                  if (existing.id !== item.id) {
                    toDeleteIds.add(existing.id);
                  }
                  const normItem: AssessmentItem = this.sanitizeAssessmentMaxScore({
                    ...item,
                    type: cat as any,
                    title: catTitle,
                    coefficient: 1,
                    maxScore: (cat === 'test1' || cat === 'test2') ? 20 : (item.maxScore || 20),
                    grades: mergedGrades,
                  });
                  map.set(foundKey, normItem);
                } else {
                  if (item.id !== existing.id) {
                    toDeleteIds.add(item.id);
                  }
                  existing.grades = mergedGrades;
                  existing.type = cat as any;
                  existing.title = catTitle;
                  if (cat === 'test1' || cat === 'test2') {
                    existing.maxScore = 20;
                  }
                }
              }
            } else {
              map.set(item.id, item);
            }
          }

          // Delete duplicates from IndexedDB
          for (const id of toDeleteIds) {
            store.delete(id);
          }
          // Put updated canonical items
          for (const item of Array.from(map.values())) {
            store.put(item);
          }

          const cleanList = Array.from(map.values());
          cleanList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(cleanList);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= SETTINGS =================
  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      key: SETTINGS_KEY,
      theme: 'light',
      profile: INITIAL_TEACHER_PROFILE,
      hasSeenSplash: false,
      updatedAt: Date.now()
    };

    return withStore<AppSettings>(STORES.SETTINGS, 'readonly', (store) => {
      return new Promise((resolve) => {
        const req = store.get(SETTINGS_KEY);
        req.onsuccess = () => {
          if (req.result) {
            resolve({ ...defaultSettings, ...req.result });
          } else {
            resolve(defaultSettings);
          }
        };
        req.onerror = () => resolve(defaultSettings);
      });
    });
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...settings,
      key: SETTINGS_KEY,
      updatedAt: Date.now()
    };

    return withStore<AppSettings>(STORES.SETTINGS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(updated);
        req.onsuccess = () => resolve(updated);
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= SUBJECT SETTINGS (إعدادات المواد وكيفية الحساب) =================
  async getAllSubjectSettings(): Promise<SubjectSetting[]> {
    return withStore<SubjectSetting[]>(STORES.SUBJECTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as SubjectSetting[]) || [];
          list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getSubjectSettingById(id: string): Promise<SubjectSetting | null> {
    return withStore<SubjectSetting | null>(STORES.SUBJECTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getSubjectSettingByName(name: string): Promise<SubjectSetting | null> {
    const all = await this.getAllSubjectSettings();
    return all.find((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()) || null;
  },

  async getSubjectsCount(): Promise<number> {
    return withStore<number>(STORES.SUBJECTS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async saveSubjectSetting(subjectSetting: SubjectSetting): Promise<SubjectSetting> {
    const itemWithTimestamps: SubjectSetting = {
      ...subjectSetting,
      id: subjectSetting.id || `subj-${Date.now()}`,
      createdAt: subjectSetting.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    return withStore<SubjectSetting>(STORES.SUBJECTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteSubjectSetting(id: string): Promise<void> {
    return withStore<void>(STORES.SUBJECTS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= ATTENDANCE (الحضور والغياب) =================
  async getAllAttendance(): Promise<AttendanceRecord[]> {
    return withStore<AttendanceRecord[]>(STORES.ATTENDANCE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as AttendanceRecord[]) || [];
          list.sort((a, b) => b.date.localeCompare(a.date));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    return withStore<AttendanceRecord[]>(STORES.ATTENDANCE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const index = store.index('classId');
        const req = index.getAll(classId);
        req.onsuccess = () => {
          const list = (req.result as AttendanceRecord[]) || [];
          list.sort((a, b) => b.date.localeCompare(a.date));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAttendanceByClassAndDate(classId: string, date: string): Promise<AttendanceRecord | null> {
    const records = await this.getAttendanceByClass(classId);
    return records.find((r) => r.date === date) || null;
  },

  async saveAttendance(record: AttendanceRecord): Promise<void> {
    return withStore<void>(STORES.ATTENDANCE, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put({
          ...record,
          updatedAt: Date.now(),
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteAttendance(id: string): Promise<void> {
    return withStore<void>(STORES.ATTENDANCE, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getAttendanceCount(): Promise<number> {
    return withStore<number>(STORES.ATTENDANCE, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= LIBRARY (مكتبة الدروس والملفات) =================
  async getAllLibraryItems(): Promise<LibraryItem[]> {
    return withStore<LibraryItem[]>(STORES.LIBRARY, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as LibraryItem[]) || [];
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLibraryItemById(id: string): Promise<LibraryItem | null> {
    return withStore<LibraryItem | null>(STORES.LIBRARY, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async saveLibraryItem(item: LibraryItem): Promise<void> {
    return withStore<void>(STORES.LIBRARY, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteLibraryItem(id: string): Promise<void> {
    const item = await this.getLibraryItemById(id);
    if (item && item.fileId) {
      try {
        await this.deleteLibraryFile(item.fileId);
      } catch (e) {
        console.warn('Failed to delete associated library file blob:', e);
      }
    }

    return withStore<void>(STORES.LIBRARY, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async renameLibraryItem(id: string, newTitle: string, newFolderName?: string, newFileName?: string): Promise<void> {
    const item = await this.getLibraryItemById(id);
    if (!item) throw new Error('العنصر غير موجود في المكتبة');
    
    item.title = newTitle.trim();
    if (newFolderName) {
      item.folderName = newFolderName.trim();
    }
    if (newFileName && item.fileName) {
      item.fileName = newFileName.trim();
    }
    item.updatedAt = Date.now();
    await this.saveLibraryItem(item);
  },

  async saveLibraryFile(fileRecord: LibraryFileRecord): Promise<void> {
    return withStore<void>(STORES.LIBRARY_FILES, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(fileRecord);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLibraryFile(fileId: string): Promise<LibraryFileRecord | null> {
    return withStore<LibraryFileRecord | null>(STORES.LIBRARY_FILES, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(fileId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteLibraryFile(fileId: string): Promise<void> {
    return withStore<void>(STORES.LIBRARY_FILES, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(fileId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getLibraryItemsCount(): Promise<number> {
    return withStore<number>(STORES.LIBRARY, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= REMINDERS =================
  async getAllReminders(): Promise<ReminderItem[]> {
    return withStore<ReminderItem[]>(STORES.REMINDERS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const results: ReminderItem[] = req.result || [];
          results.sort((a, b) => {
            const dateA = a.dueDate + (a.dueTime ? ' ' + a.dueTime : ' 23:59');
            const dateB = b.dueDate + (b.dueTime ? ' ' + b.dueTime : ' 23:59');
            return dateA.localeCompare(dateB);
          });
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  async getReminderById(id: string): Promise<ReminderItem | null> {
    return withStore<ReminderItem | null>(STORES.REMINDERS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async saveReminder(reminder: ReminderItem | Omit<ReminderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderItem> {
    const itemWithTimestamps: ReminderItem = {
      ...reminder,
      id: ('id' in reminder && reminder.id) ? reminder.id : `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: ('createdAt' in reminder && reminder.createdAt) ? reminder.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    return withStore<ReminderItem>(STORES.REMINDERS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(itemWithTimestamps);
        req.onsuccess = () => resolve(itemWithTimestamps);
        req.onerror = () => reject(req.error);
      });
    });
  },

  async deleteReminder(id: string): Promise<void> {
    return withStore<void>(STORES.REMINDERS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    });
  },

  async toggleReminderCompleted(id: string): Promise<ReminderItem | null> {
    return withStore<ReminderItem | null>(STORES.REMINDERS, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const item: ReminderItem | undefined = getReq.result;
          if (!item) {
            resolve(null);
            return;
          }
          const updated: ReminderItem = {
            ...item,
            isCompleted: !item.isCompleted,
            updatedAt: Date.now()
          };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve(updated);
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
      });
    });
  },

  async getRemindersCount(): Promise<number> {
    return withStore<number>(STORES.REMINDERS, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  // ================= BACKUP & RESTORE =================
  async exportBackupJson(): Promise<string> {
    const [classes, students, sessions, lessons, assessments, subjects, attendance, library, reminders, settings] = await Promise.all([
      this.getAllClasses(),
      this.getAllStudents(),
      this.getAllSessions(),
      this.getAllLessons(),
      this.getAllAssessments(),
      this.getAllSubjectSettings(),
      this.getAllAttendance(),
      this.getAllLibraryItems(),
      this.getAllReminders(),
      this.getSettings()
    ]);

    const backupData = {
      app: 'Ostad DZ',
      version: 8,
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      data: {
        classes,
        students,
        sessions,
        lessons,
        assessments,
        subjects,
        attendance,
        library,
        reminders,
        settings
      }
    };

    return JSON.stringify(backupData, null, 2);
  },

  async importBackupJson(jsonString: string): Promise<{ classesCount: number; studentsCount: number; sessionsCount: number; lessonsCount: number; assessmentsCount: number; subjectsCount: number; attendanceCount: number; libraryCount: number; remindersCount: number }> {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      throw new Error('الملف غير صالح أو لا يحتوي على بنية بيانات Ostad DZ الصحيحة.');
    }

    const { classes = [], students = [], sessions = [], lessons = [], assessments = [], subjects = [], attendance = [], library = [], reminders = [], settings } = parsed.data;

    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([
        STORES.CLASSES, 
        STORES.STUDENTS, 
        STORES.SETTINGS, 
        STORES.SCHEDULE, 
        STORES.LESSONS, 
        STORES.ASSESSMENTS, 
        STORES.SUBJECTS, 
        STORES.ATTENDANCE, 
        STORES.LIBRARY,
        STORES.REMINDERS
      ], 'readwrite');
      
      const classStore = tx.objectStore(STORES.CLASSES);
      const studentStore = tx.objectStore(STORES.STUDENTS);
      const settingsStore = tx.objectStore(STORES.SETTINGS);
      const scheduleStore = tx.objectStore(STORES.SCHEDULE);
      const lessonStore = tx.objectStore(STORES.LESSONS);
      const assessmentStore = tx.objectStore(STORES.ASSESSMENTS);
      const subjectStore = tx.objectStore(STORES.SUBJECTS);
      const attendanceStore = tx.objectStore(STORES.ATTENDANCE);
      const libraryStore = tx.objectStore(STORES.LIBRARY);
      const reminderStore = tx.objectStore(STORES.REMINDERS);

      // Clear existing data
      classStore.clear();
      studentStore.clear();
      scheduleStore.clear();
      lessonStore.clear();
      assessmentStore.clear();
      subjectStore.clear();
      attendanceStore.clear();
      libraryStore.clear();
      reminderStore.clear();

      // Put classes
      for (const c of classes) {
        classStore.put(c);
      }

      // Put students
      for (const s of students) {
        studentStore.put(s);
      }

      // Put sessions
      for (const sess of sessions) {
        scheduleStore.put(sess);
      }

      // Put lessons
      for (const l of lessons) {
        lessonStore.put(l);
      }

      // Put assessments
      for (const a of assessments) {
        assessmentStore.put(a);
      }

      // Put subjects
      for (const sub of subjects) {
        subjectStore.put(sub);
      }

      // Put attendance
      for (const att of attendance) {
        attendanceStore.put(att);
      }

      // Put library items
      for (const item of library) {
        libraryStore.put(item);
      }

      // Put reminders
      for (const rem of reminders) {
        reminderStore.put(rem);
      }

      // Put settings
      if (settings) {
        settingsStore.put({ ...settings, key: SETTINGS_KEY });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return {
      classesCount: classes.length,
      studentsCount: students.length,
      sessionsCount: sessions.length,
      lessonsCount: lessons.length,
      assessmentsCount: assessments.length,
      subjectsCount: subjects.length,
      attendanceCount: attendance.length,
      libraryCount: library.length,
      remindersCount: reminders.length,
    };
  },

  async resetToSampleData(): Promise<void> {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([
        STORES.CLASSES, 
        STORES.STUDENTS, 
        STORES.SETTINGS, 
        STORES.SCHEDULE, 
        STORES.LESSONS, 
        STORES.ASSESSMENTS, 
        STORES.SUBJECTS, 
        STORES.ATTENDANCE,
        STORES.LIBRARY,
        STORES.LIBRARY_FILES,
        STORES.REMINDERS
      ], 'readwrite');

      tx.objectStore(STORES.CLASSES).clear();
      tx.objectStore(STORES.STUDENTS).clear();
      tx.objectStore(STORES.SETTINGS).clear();
      tx.objectStore(STORES.SCHEDULE).clear();
      tx.objectStore(STORES.LESSONS).clear();
      tx.objectStore(STORES.ASSESSMENTS).clear();
      tx.objectStore(STORES.SUBJECTS).clear();
      tx.objectStore(STORES.ATTENDANCE).clear();
      tx.objectStore(STORES.LIBRARY).clear();
      tx.objectStore(STORES.LIBRARY_FILES).clear();
      tx.objectStore(STORES.REMINDERS).clear();

      for (const c of INITIAL_CLASSES) {
        tx.objectStore(STORES.CLASSES).put(c);
      }
      for (const s of INITIAL_STUDENTS) {
        tx.objectStore(STORES.STUDENTS).put(s);
      }
      for (const sess of INITIAL_SESSIONS) {
        tx.objectStore(STORES.SCHEDULE).put(sess);
      }
      for (const lesson of INITIAL_LESSONS) {
        tx.objectStore(STORES.LESSONS).put(lesson);
      }
      for (const assess of INITIAL_ASSESSMENTS) {
        tx.objectStore(STORES.ASSESSMENTS).put(assess);
      }
      for (const subj of INITIAL_SUBJECT_SETTINGS) {
        tx.objectStore(STORES.SUBJECTS).put(subj);
      }
      for (const att of INITIAL_ATTENDANCE) {
        tx.objectStore(STORES.ATTENDANCE).put(att);
      }
      for (const item of INITIAL_LIBRARY_ITEMS) {
        tx.objectStore(STORES.LIBRARY).put(item);
      }
      for (const rem of INITIAL_REMINDERS) {
        tx.objectStore(STORES.REMINDERS).put(rem);
      }

      tx.objectStore(STORES.SETTINGS).put({
        key: SETTINGS_KEY,
        theme: 'light',
        profile: INITIAL_TEACHER_PROFILE,
        hasSeenSplash: true,
        updatedAt: Date.now()
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // ================= RANDOM DRAWS & PICKER =================
  async getRandomDrawState(classId: string): Promise<RandomDrawClassState | null> {
    try {
      return await withStore<RandomDrawClassState | null>(STORES.RANDOM_DRAW_STATES, 'readonly', (store) => {
        return new Promise((resolve) => {
          const req = store.get(classId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      });
    } catch {
      // Safe fallback to localStorage if needed
      try {
        const key = `ostad_dz_draw_state_${classId}`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  },

  async saveRandomDrawState(state: RandomDrawClassState): Promise<void> {
    try {
      await withStore<void>(STORES.RANDOM_DRAW_STATES, 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const req = store.put(state);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      });
    } catch (err) {
      console.warn('Fallback saving draw state to localStorage:', err);
    }
    // Mirror to localStorage for instant redundancy
    try {
      localStorage.setItem(`ostad_dz_draw_state_${state.classId}`, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  },

  async getAllRandomDrawHistory(classId?: string): Promise<RandomDrawRecord[]> {
    try {
      return await withStore<RandomDrawRecord[]>(STORES.RANDOM_DRAWS, 'readonly', (store) => {
        return new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => {
            let list = (req.result as RandomDrawRecord[]) || [];
            if (classId && classId !== 'all') {
              list = list.filter((item) => item.classId === classId);
            }
            // Sort by timestamp desc (newest first)
            list.sort((a, b) => b.timestamp - a.timestamp);
            resolve(list);
          };
          req.onerror = () => resolve([]);
        });
      });
    } catch {
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem('ostad_dz_draw_history');
        let list: RandomDrawRecord[] = raw ? JSON.parse(raw) : [];
        if (classId && classId !== 'all') {
          list = list.filter((item) => item.classId === classId);
        }
        list.sort((a, b) => b.timestamp - a.timestamp);
        return list;
      } catch {
        return [];
      }
    }
  },

  async addRandomDrawRecord(record: RandomDrawRecord): Promise<void> {
    try {
      await withStore<void>(STORES.RANDOM_DRAWS, 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const req = store.put(record);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      });
    } catch (err) {
      console.warn('Fallback saving draw record to localStorage:', err);
    }
    // Mirror to localStorage
    try {
      const raw = localStorage.getItem('ostad_dz_draw_history');
      const list: RandomDrawRecord[] = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      // Keep last 300 records in storage
      if (list.length > 300) list.length = 300;
      localStorage.setItem('ostad_dz_draw_history', JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  },

  async clearRandomDrawHistory(classId?: string): Promise<void> {
    try {
      if (!classId || classId === 'all') {
        await withStore<void>(STORES.RANDOM_DRAWS, 'readwrite', (store) => {
          return new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        });
        localStorage.removeItem('ostad_dz_draw_history');
      } else {
        // Delete only for specific class
        const all = await this.getAllRandomDrawHistory();
        const toKeep = all.filter((r) => r.classId !== classId);
        await withStore<void>(STORES.RANDOM_DRAWS, 'readwrite', (store) => {
          return new Promise((resolve, reject) => {
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
              for (const item of toKeep) {
                store.put(item);
              }
              resolve();
            };
            clearReq.onerror = () => reject(clearReq.error);
          });
        });
        localStorage.setItem('ostad_dz_draw_history', JSON.stringify(toKeep));
      }
    } catch (err) {
      console.warn('Failed clearing draw history:', err);
    }
  }
};
