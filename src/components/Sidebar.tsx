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

  // Active hover tooltip for collapsed mode
  const [hoveredTab, setHoveredTab] = useState<ActiveTab | null>(null);

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
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 25) {
      // In RTL (sidebar pinned on right):
      // diffX < -25: dragged left into the screen -> EXPAND
      // diffX > 25: dragged right towards screen border -> COLLAPSE
      if (diffX < -25 && !isMobileExpanded) {
        setIsMobileExpanded(true);
        isDragging.current = false;
      } else if (diffX > 25 && isMobileExpanded) {
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
          className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 md:hidden animate-in fade-in duration-200"
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
        className={`fixed top-0 right-0 bottom-0 h-screen h-[100dvh] max-h-screen z-[90] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-l border-slate-200/90 dark:border-slate-800/90 shadow-2xl transition-[width,transform] duration-300 ease-out select-none
          ${
            /* Width calculation based on state */
            isFull ? 'w-64 sm:w-68' : (isMobile ? 'w-16' : 'w-20')
          }
        `}
      >
        {/* Top Header / Brand of Sidebar */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          {isFull ? (
            /* Expanded view: Brand Info + Collapse Button */
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
                onClick={() => {
                  if (isMobile) {
                    setIsMobileExpanded(false);
                  } else {
                    setIsDesktopCollapsed(true);
                  }
                }}
                aria-label="طي القائمة الجانبية"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0"
                title="طي القائمة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Collapsed view: Centered Mini Logo / Expand trigger */
            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  setIsMobileExpanded(true);
                } else {
                  setIsDesktopCollapsed(false);
                }
              }}
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
          className="md:hidden absolute top-24 -left-7 w-7 h-20 rounded-l-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 text-white flex flex-col items-center justify-center gap-1 shadow-2xl border border-r-0 border-white/20 cursor-pointer active:scale-95 transition-all select-none z-[95]"
          title={isMobileExpanded ? 'طي القائمة (اسحب لليمين أو اضغط)' : 'توسيع القائمة (اسحب لليسار أو اضغط)'}
          aria-label={isMobileExpanded ? 'طي القائمة' : 'توسيع القائمة'}
        >
          {isMobileExpanded ? (
            <ChevronRight className="w-4 h-4 text-white animate-pulse" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white animate-pulse" />
          )}
          <GripVertical className="w-3.5 h-3.5 text-white/90" />
        </button>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1.5 scrollbar-thin overscroll-contain">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => !isFull && setHoveredTab(item.id)}
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
                      isFull
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
                    {!isFull && typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`absolute -top-2 -left-2 min-w-[18px] h-4.5 px-1 rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm ${
                          item.badgeColor || (isActive ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white')
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
                        item.badgeColor || (isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator bar on the right side in RTL */}
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white dark:bg-white rounded-l-full shadow-xs" />
                  )}
                </button>

                {/* Floating Tooltip for Collapsed Mode (Desktop/Hover) */}
                {!isFull && hoveredTab === item.id && (
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

        {/* Footer info in sidebar */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 bg-slate-50/50 dark:bg-slate-800/30 text-center">
          {isFull ? (
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Ostad DZ • بدون إنترنت 100%
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isMobile) {
                    setIsMobileExpanded(false);
                  } else {
                    setIsDesktopCollapsed(true);
                  }
                }}
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                طي الشريط
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  setIsMobileExpanded(true);
                } else {
                  setIsDesktopCollapsed(false);
                }
              }}
              className="w-full text-[10px] font-black text-emerald-700 dark:text-emerald-400 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
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

