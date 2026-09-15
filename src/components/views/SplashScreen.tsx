import React from 'react';
import { BookOpen, Sparkles, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { TeacherProfile } from '../../types';

interface SplashScreenProps {
  onStart: () => void;
  profile: TeacherProfile;
  classesCount: number;
  studentsCount: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStart,
  profile,
  classesCount,
  studentsCount,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl mx-auto text-center">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>تطبيق الأستاذ الجزائري • المنظومة البيداغوجية المتكاملة</span>
        </div>

        {/* Hero Visual */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-xl shadow-emerald-700/25 border-4 border-white dark:border-slate-800 mb-6">
          <BookOpen className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-100" />
          <div className="absolute -bottom-2 -left-2 bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs">
            DZ
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          مرحباً بك في تطبيق <span className="text-emerald-600 dark:text-emerald-400">أستاذ ديزاد</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
          الرفيق الرقمي المتكامل للأساتذة في مختلف الأطوار التعليمية بالجزائر. إدارة شاملة للأقسام، الطلاب، المذكرات، والتقويمات التربوية.
        </p>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 text-right">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">سهولة وسرعة</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              إدارة مرنة للحصص والغيابات ورصد النقاط داخل الحجرة والمخبر بكل سلاسة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">هاتف وحاسوب</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              واجهة متناسقة ومريحة مصممة لتناسب مختلف الشاشات والأجهزة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">أمان وخصوصية</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              سجلاتك التعليمية خاصة بك دائماً مع إمكانية حفظ نسخة احتياطية واسترجاعها بسهولة.
            </p>
          </div>
        </div>

        {/* Current status badge if data exists */}
        {(classesCount > 0 || studentsCount > 0) && (
          <div className="mb-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-4">
            <span>الأستاذ: <strong className="text-slate-900 dark:text-white">{profile.fullName || 'أستاذ'}</strong></span>
            <span>•</span>
            <span>الأقسام: <strong className="text-emerald-600 dark:text-emerald-400">{classesCount}</strong></span>
            <span>•</span>
            <span>الطلاب: <strong className="text-emerald-600 dark:text-emerald-400">{studentsCount}</strong></span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-700/25 transition transform active:scale-98 flex items-center justify-center gap-3 mx-auto"
        >
          <span>دخول لوحة التحكم</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
