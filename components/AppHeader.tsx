import React, { useMemo } from 'react';
import { Loading } from './common/Loading';

interface AppHeaderProps {
  activeYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  isValidating: boolean;
  currentUserName: string;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onCreateYear: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  activeYear,
  availableYears,
  onYearChange,
  isValidating,
  currentUserName,
  isDarkTheme,
  onToggleTheme,
  onOpenSettings,
  onCreateYear,
}) => {
  // Memoize year options to avoid re-sorting on every render
  const yearOptions = useMemo(() => {
    return Array.from(new Set([...availableYears, activeYear]))
      .filter(y => y)
      .sort()
      .reverse();
  }, [availableYears, activeYear]);

  return (
    <header className="px-3 sm:px-4 py-2 bg-white/80 dark:bg-brand-surface/90 backdrop-blur-none md:backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-brand-teal/20 flex items-center justify-between transform-gpu will-change-[transform]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="bg-brand-petrol text-brand-mint p-1.5 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">track_changes</span>
        </div>
        <h1 className="text-xl font-black text-brand-petrol dark:text-brand-mint hidden md:block tracking-tight flex-shrink-0">GOAL BINGO</h1>
        
        <div className="relative group flex-shrink-0">
          <select 
            value={activeYear} 
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-brand-mint/50 dark:bg-brand-dark/50 text-brand-petrol dark:text-brand-mint text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none transition-colors appearance-none"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 flex items-center flex-shrink-0">
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>
        </div>

        <button 
          onClick={onCreateYear} 
          className="flex p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-300 transition-all items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-shrink-0">
        {isValidating ? (
          <div className="flex items-center gap-1.5 text-xs text-brand-rust font-medium bg-brand-rust/10 px-2 py-1 rounded-full whitespace-nowrap">
            <Loading size="text-[14px]" />
            <span className="inline">Syncing</span>
          </div>
        ) : (
          <div className="flex text-brand-teal/50 items-center flex-shrink-0" title="已同步">
            <span className="material-symbols-outlined text-[14px]">cloud_done</span>
          </div>
        )}
        
        {/* Username pill hidden on small screens to save space */}
        <div className={`hidden sm:block text-xs px-3 py-1.5 rounded-full border border-brand-petrol/20 dark:border-brand-mint/20 font-bold bg-white/50 dark:bg-black/20 whitespace-nowrap`}>
          {currentUserName}
        </div>
        {/* Compact account icon removed for mobile; show sync status only */}
        
        <button 
          onClick={onToggleTheme} 
          className="hidden sm:flex p-2 rounded-lg text-gray-500 dark:text-brand-teal transition-colors items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDarkTheme ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <button 
          onClick={onOpenSettings}
          className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg text-brand-petrol dark:text-brand-mint transition-colors flex items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
