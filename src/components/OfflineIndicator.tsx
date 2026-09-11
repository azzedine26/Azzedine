import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`transition-all duration-300 px-3 py-1.5 text-xs font-medium flex items-center justify-between border-b ${
        !isOnline
          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
      }`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
            <span>
              <strong>الوضع غير المتصل (Offline) نشط:</strong> التطبيق يعمل بكفاءة 100% ويحفظ البيانات محلياً في جهازك.
            </span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>جاهز ومحمي محلياً:</strong> جميع البيانات تخزن مباشرة في ذاكرة هاتفك عبر IndexedDB بدون إنترنت.
            </span>
          </>
        )}
      </div>
    </div>
  );
};
