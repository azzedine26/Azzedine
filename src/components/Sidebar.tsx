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
  ChevronLeft,
  ChevronRight,
  GripVertical
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
  // Reliable detection of viewport width for responsive sidebar behavior
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Whether the sidebar is in its full expanded state (with labels)
  const isFull = isMobile ? isMobileExpanded : !isDesktopCollapsed;

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

  // Touch swipe handling for mobile
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

    // Only respond to predominantly horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      // In RTL (sidebar pinned on right):
      // diffX < -30: dragged left into the screen -> EXPAND
      // diffX > 30: dragged right towards screen border -> COLLAPSE
      if (diffX < -30 && !isMobileExpanded) {
        setIsMobileExpanded(true);
        isDragging.current = false;
      } else if (diffX > 30 && isMobileExpanded) {
        setIsMobileExpanded(false);
        isDragging.current = false;
      }
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
    if (isMobile && isMobileExpanded) {
      setIsMobileExpanded(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop when expanded */}
      {isMobileExpanded && (
        <div
          onClick={() => setIsMobileExpanded(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          aria-label="إغلاق القائمة الجانبية"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        id="app-vertical-sidebar"
        dir="rtl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 right-0 bottom-0 h-screen h-[100dvh] max-h-screen z-[90] flex flex-col bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-in-out select-none
          ${
            /* Width calculation based on state */
            isFull ? 'w-64' : (isMobile ? 'w-16' : 'w-20')
          }
        `}
      >
        {/* Top Header / Brand of Sidebar */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {isFull ? (
            /* Expanded view: Brand Info + Collapse Button */
            <>
              <div
                onClick={() => handleItemClick('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base text-slate-900 dark:text-white truncate">
                      أستاذ ديزاد
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      DZ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {profile?.fullName ? `${profile.fullName}` : 'المنظومة التربوية الجزائرية'}
                  </p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => {
                  if (isMobile) {
                    setIsMobileExpanded(false);
                  } else {
                    setIsDesktopCollapsed(true);
                  }
                }}
                aria-label="طي القائمة الجانبية"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                title="طي القائمة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Collapsed view: Centered Mini Logo / Expand trigger */
            <div
              onClick={() => {
                if (isMobile) {
                  setIsMobileExpanded(true);
                } else {
                  setIsDesktopCollapsed(false);
                }
              }}
              className="w-full flex items-center justify-center cursor-pointer group"
              title="توسيع القائمة الجانبية"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-emerald-100" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Swipe Handle / Pull Tab Indicator */}
        <button
          type="button"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
            isDragging.current = true;
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="md:hidden absolute top-20 -left-6 w-6 h-16 rounded-l-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex flex-col items-center justify-center gap-0.5 shadow-xl border border-r-0 border-emerald-400/40 cursor-pointer active:scale-95 transition-all select-none z-[95]"
          title={isMobileExpanded ? 'طي القائمة (اسحب لليمين أو اضغط)' : 'توسيع القائمة (اسحب لليسار أو اضغط)'}
          aria-label={isMobileExpanded ? 'طي القائمة' : 'توسيع القائمة'}
        >
          {isMobileExpanded ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
          <GripVertical className="w-3.5 h-3.5 text-white/80" />
        </button>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-thin overscroll-contain">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 text-right group relative
                  ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                  }
                  ${!isFull ? 'justify-center px-0' : ''}
                `}
              >
                {/* Item Icon & Badge for Collapsed Mode */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  />
                  {/* Badge in collapsed mode */}
                  {!isFull && typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -left-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                        item.badgeColor || (isActive ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white')
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Item Label (Visible in Expanded Mode) */}
                {isFull && (
                  <span className="truncate text-sm flex-1 text-right font-semibold">
                    {item.label}
                  </span>
                )}

                {/* Badge in expanded mode */}
                {isFull && typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white dark:bg-emerald-400 rounded-l-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 text-center">
          {isFull ? (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Ostad DZ • بدون إنترنت 100%
            </p>
          ) : (
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              DZ
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
