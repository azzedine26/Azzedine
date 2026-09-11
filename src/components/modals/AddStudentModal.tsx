import React, { useState, useEffect } from 'react';
import { X, UserPlus, User } from 'lucide-react';
import { ClassItem, StudentItem } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Omit<StudentItem, 'createdAt' | 'updatedAt'> | StudentItem) => Promise<void>;
  classes: ClassItem[];
  defaultClassId?: string;
  editingStudent?: StudentItem | null;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  defaultClassId,
  editingStudent,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [studentNumber, setStudentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStudent) {
      setFirstName(editingStudent.firstName);
      setLastName(editingStudent.lastName);
      setClassId(editingStudent.classId);
      setGender(editingStudent.gender);
      setStudentNumber(editingStudent.studentNumber || '');
      setBirthDate(editingStudent.birthDate || '');
      setGuardianPhone(editingStudent.guardianPhone || '');
      setNotes(editingStudent.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setClassId(defaultClassId || (classes.length > 0 ? classes[0].id : ''));
      setGender('male');
      // Suggest automatic registration number
      const autoNum = `${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      setStudentNumber(autoNum);
      setBirthDate('');
      setGuardianPhone('');
      setNotes('');
    }
    setError('');
  }, [editingStudent, isOpen, defaultClassId, classes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('يرجى كتابة الاسم واللقب بشكل كامل.');
      return;
    }

    if (!classId) {
      setError('يرجى اختيار القسم الذي ينتمي إليه الطالب.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const studentPayload = {
        id: editingStudent ? editingStudent.id : `student-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        classId,
        gender,
        studentNumber: studentNumber.trim() || undefined,
        birthDate: birthDate || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(editingStudent ? { createdAt: editingStudent.createdAt } : {}),
      };

      await onSave(studentPayload as StudentItem);
      onClose();
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ التلميذ. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {editingStudent ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اللقب (العائلي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: بوجمعة"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الاسم الشخصي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أيمن"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Class Selection & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                القسم الملحق به <span className="text-rose-500">*</span>
              </label>
              {classes.length === 0 ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 p-2 border border-amber-300 rounded-lg">
                  لا توجد أقسام مسجلة! أنشئ قسماً أولاً.
                </div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الجنس
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    gender === 'male'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    gender === 'female'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  أنثى
                </button>
              </div>
            </div>
          </div>

          {/* Student Number & Birth Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                رقم التعريف / التسجيل المدرسي
              </label>
              <input
                type="text"
                placeholder="2024-001"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Guardian Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رقم هاتف الولي (للتواصل السريع)
            </label>
            <input
              type="tel"
              placeholder="0661234567"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ملاحظات بيداغوجية / صحية
            </label>
            <textarea
              rows={2}
              placeholder="ملاحظات حول مستوى الطالب، انضباطه، أو وضعه الصحي..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || classes.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              {isSubmitting ? 'جاري الحفظ...' : editingStudent ? 'تحديث البيانات' : 'حفظ الطالب محلياً'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
