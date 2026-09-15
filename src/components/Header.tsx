import React from 'react';
import { Moon, Sun, Download, Sparkles, BookOpen, Menu } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ActiveTab, TeacherProfile } from '../types';

interface HeaderProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  profile: TeacherProfile;
  remindersCount?: number;
  libraryCount?: number;
  onToggleSidebar?: () => void;
}

const TAB_TITLES: Record<ActiveTab, string> = {
  splash: 'البداية',
  dashboard: 'لوحة التحكم',
  classes: 'الأقسام والصفوف',
  students: 'إدارة الطلاب',
  random_picker: 'القرعة العشوائية للتلاميذ',
  schedule: 'الجدول الأسبوعي',
  lessons: 'تحضير المذكرات والدروس',
  grades: 'كشف النقاط والمعدلات',
  attendance: 'سجل الحضور والغياب',
  reports: 'الوثائق والتقارير المدرسية',
  library: 'مكتبة الدروس والملفات',
  reminders: 'المفكرة والتذكيرات',
  settings: 'إعدادات النظام',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isDark,
  onToggleTheme,
  profile,
  remindersCount = 0,
  libraryCount = 0,
  onToggleSidebar,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full">
        {/* Right side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {onToggleSidebar && (
            <button
              id="header-hamburger-menu-btn"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title="القائمة الرئيسية"
              aria-label="القائمة الرئيسية"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo & Brand */}
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                  أستاذ ديزاد
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                  DZ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {profile.fullName ? `${profile.fullName} • ` : ''}
                {profile.stage === 'primary' ? 'ابتدائي • ' : profile.stage === 'middle' ? 'متوسط • ' : profile.stage === 'secondary' ? 'ثانوي • ' : ''}
                {profile.schoolName || 'المنظومة التربوية الجزائرية'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Current Tab Badge / Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{TAB_TITLES[currentTab] || 'الرئيسية'}</span>
          {profile.academicYear && (
            <>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">{profile.academicYear}</span>
            </>
          )}
        </div>

        {/* Left side: Action buttons (Install, Theme Toggle, Splash re-open) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition active:scale-95"
              title="تثبيت التطبيق على جهازك"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">تثبيت التطبيق</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => onTabChange('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="تثبيت التطبيق"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">تثبيت</span>
            </button>
          )}

          {/* Quick Splash preview button */}
          <button
            onClick={() => onTabChange('splash')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="شاشة البداية"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Dark/Light Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تبديل الوضع الليلي والنهاري"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
