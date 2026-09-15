import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  Award,
  UserCheck,
  FileText,
  Settings,
  Bell,
  Folder,
  Dices,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { ActiveTab, TeacherProfile } from '../types';

interface SidebarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  classesCount: number;
  studentsCount: number;
  sessionsCount?: number;
  lessonsCount?: number;
  assessmentsCount?: number;
  attendanceCount?: number;
  remindersCount?: number;
  libraryCount?: number;
  profile?: TeacherProfile;
  isMobileExpanded: boolean;
  setIsMobileExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  classesCount,
  studentsCount,
  sessionsCount = 0,
  lessonsCount = 0,
  assessmentsCount = 0,
  attendanceCount = 0,
  remindersCount = 0,
  libraryCount = 0,
  profile,
  isMobileExpanded,
  setIsMobileExpanded,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
}) => {
  // Active hover tooltip for collapsed desktop mode
  const [hoveredTab, setHoveredTab] = useState<ActiveTab | null>(null);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileExpanded) {
        setIsMobileExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileExpanded, setIsMobileExpanded]);

  // Navigation items configuration
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'classes',
      label: 'الأقسام',
      icon: GraduationCap,
      badge: classesCount,
    },
    {
      id: 'students',
      label: 'الطلاب',
      icon: Users,
      badge: studentsCount,
    },
    {
      id: 'random_picker',
      label: 'القرعة العشوائية',
      icon: Dices,
    },
    {
      id: 'attendance',
      label: 'الغياب والحضور',
      icon: UserCheck,
      badge: attendanceCount,
    },
    {
      id: 'grades',
      label: 'كشف النقاط',
      icon: Award,
      badge: assessmentsCount,
    },
    {
      id: 'reports',
      label: 'الوثائق والتقارير',
      icon: FileText,
    },
    {
      id: 'library',
      label: 'المكتبة والملفات',
      icon: Folder,
      badge: libraryCount,
    },
    {
      id: 'lessons',
      label: 'تحضير الدروس',
      icon: BookOpen,
      badge: lessonsCount,
    },
    {
      id: 'schedule',
      label: 'الجدول الأسبوعي',
      icon: Calendar,
      badge: sessionsCount,
    },
    {
      id: 'reminders',
      label: 'التذكيرات والمهام',
      icon: Bell,
      badge: remindersCount,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
    },
  ];

  // Touch swipe handling to close mobile drawer by swiping right (towards edge in RTL)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Only respond to predominantly horizontal swipes (diffX > 30 = swipe right towards screen edge)
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 30 && isMobileExpanded) {
      setIsMobileExpanded(false);
      isDragging.current = false;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Close mobile expanded sidebar when switching tabs on mobile
  const handleItemClick = (id: ActiveTab) => {
    onTabChange(id);
    if (isMobileExpanded) {
      setIsMobileExpanded(false);
    }
  };

  return (
    <>
      {/* 1. Mobile Drawer (Overlay with backdrop: completely floating, 0px layout footprint) */}
      {isMobileExpanded && (
        <>
          {/* Dimmed backdrop */}
          <div
            id="mobile-sidebar-backdrop"
            onClick={() => setIsMobileExpanded(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 md:hidden animate-in fade-in"
            aria-label="إغلاق القائمة الجانبية"
          />

          {/* Drawer Sidebar */}
          <aside
            id="mobile-sidebar-drawer"
            dir="rtl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed top-0 right-0 bottom-0 h-screen h-[100dvh] w-72 max-w-[85vw] z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 md:hidden select-none"
          >
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div
                onClick={() => handleItemClick('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0 ring-1 ring-emerald-400/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base text-slate-900 dark:text-white truncate tracking-tight">
                      أستاذ ديزاد
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      DZ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {profile?.fullName ? `${profile.fullName}` : 'المنظومة التربوية الجزائرية'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                id="close-mobile-sidebar-btn"
                onClick={() => setIsMobileExpanded(false)}
                aria-label="إغلاق القائمة الجانبية"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0 active:scale-95"
                title="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav list */}
            <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5 scrollbar-thin">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-right px-3 py-2.5 min-h-[44px] ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white shadow-md shadow-emerald-700/25 font-bold ring-1 ring-white/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate text-sm flex-1 text-right font-semibold">
                      {item.label}
                    </span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs ${
                        item.badgeColor || (isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  Ostad DZ • الرفيق البيداغوجي
                </p>
                <button
                  type="button"
                  onClick={() => setIsMobileExpanded(false)}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer px-1 py-0.5"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* 2. Persistent Vertical Sidebar (Desktop only: hidden on mobile, flex on md and above) */}
      <aside
        id="app-vertical-sidebar"
        dir="rtl"
        className={`hidden md:flex shrink-0 sticky top-0 h-screen h-[100dvh] max-h-screen z-30 flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-l border-slate-200/90 dark:border-slate-800/90 shadow-xs transition-[width] duration-300 ease-out select-none ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header / Brand of Desktop Sidebar */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          {!isDesktopCollapsed ? (
            /* Desktop Expanded view: Brand Info + Collapse Button */
            <>
              <div
                onClick={() => handleItemClick('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0 ring-1 ring-emerald-400/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base text-slate-900 dark:text-white truncate tracking-tight">
                      أستاذ ديزاد
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      DZ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {profile?.fullName ? `${profile.fullName}` : 'المنظومة التربوية الجزائرية'}
                  </p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                aria-label="طي القائمة الجانبية"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0"
                title="طي القائمة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Collapsed Desktop: Centered Mini Logo / Expand trigger */
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(false)}
              className="w-full flex items-center justify-center cursor-pointer group py-1"
              title="توسيع القائمة الجانبية"
              aria-label="توسيع القائمة الجانبية"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform ring-1 ring-emerald-400/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1.5 scrollbar-thin overscroll-contain">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="relative flex justify-center"
                onMouseEnter={() => isDesktopCollapsed && setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-right group relative
                    ${
                      !isDesktopCollapsed
                        ? 'px-3 py-2.5 min-h-[44px]'
                        : 'p-2.5 justify-center min-h-[46px]'
                    }
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white shadow-md shadow-emerald-700/25 font-bold ring-1 ring-white/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white font-medium'
                    }
                  `}
                >
                  {/* Item Icon & Badge for Collapsed Mode */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive
                          ? 'scale-110 text-white'
                          : 'text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-105'
                      }`}
                    />
                    {/* Badge in collapsed mode */}
                    {isDesktopCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`absolute -top-1.5 -left-1.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs ${
                          item.badgeColor || (isActive ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white')
                        }`}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>

                  {/* Item Label (Visible in Expanded Mode) */}
                  {!isDesktopCollapsed && (
                    <span className="truncate text-sm flex-1 text-right font-semibold">
                      {item.label}
                    </span>
                  )}

                  {/* Badge in expanded mode */}
                  {!isDesktopCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs ${
                        item.badgeColor || (isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator bar on the right side in RTL */}
                  {isActive && !isDesktopCollapsed && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white dark:bg-white rounded-l-full shadow-xs" />
                  )}
                </button>

                {/* Floating Tooltip for Collapsed Mode (Desktop/Hover) */}
                {isDesktopCollapsed && hoveredTab === item.id && (
                  <div className="hidden md:flex absolute right-full top-1/2 -translate-y-1/2 mr-2.5 z-[100] items-center pointer-events-none animate-in fade-in slide-in-from-right-1 duration-150">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-xl whitespace-nowrap flex items-center gap-2 border border-slate-700/40 dark:border-slate-200">
                      <span>{item.label}</span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[10px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info in desktop sidebar */}
        <div className="p-2 sm:p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30 text-center">
          {!isDesktopCollapsed ? (
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Ostad DZ • الرفيق البيداغوجي
              </p>
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                طي الشريط
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed(false)}
              className="w-full text-[10px] font-black text-emerald-700 dark:text-emerald-400 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition cursor-pointer"
              title="توسيع القائمة"
            >
              DZ
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

