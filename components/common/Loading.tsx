
import React from 'react';

interface LoadingProps {
  size?: string; // e.g. "text-[20px]"
  text?: string;
  className?: string;
  variant?: 'spinner' | 'dots'; // Future proofing
}

export const Loading: React.FC<LoadingProps> = ({ size = "text-[20px]", text, className = "" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`material-symbols-outlined ${size} animate-spin`}>progress_activity</span>
      {text && <span>{text}</span>}
    </div>
  );
};

export const PageLoading: React.FC<{ title?: string; subtitle?: string }> = ({ 
    title = "載入資料中", 
    subtitle 
}) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-mint/30 dark:bg-[rgb(var(--brand-dark))] animate-fade-in transition-colors duration-300" style={{ minHeight: '100dvh' }}>
        <div className="bg-white dark:bg-[rgb(var(--brand-surface))] p-8 rounded-3xl shadow-xl flex flex-col items-center space-y-4 border border-white/20 dark:border-brand-teal/20">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-brand-mint/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-brand-teal text-[24px] animate-spin">sync</span>
                </div>
            </div>
            <div className="text-center">
                <div className="text-xl font-black text-brand-petrol dark:text-brand-mint tracking-tight">{title}</div>
                {subtitle && <div className="text-sm text-brand-teal dark:text-brand-teal/80 mt-1 font-bold">{subtitle}</div>}
            </div>
        </div>
    </div>
);
