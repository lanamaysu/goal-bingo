
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hideCloseButton?: boolean;
  className?: string; // For overriding container styles (e.g., padding)
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  maxWidth = 'md',
  hideCloseButton = false,
  className = ''
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    'full': 'max-w-full mx-4',
  }[maxWidth];

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-petrol/70 md:bg-brand-petrol/60 backdrop-blur-none md:backdrop-blur-sm animate-fade-in-opacity will-change-[opacity]" 
        onClick={onClose}
      />

      {/* Content */}
      <div 
        className={`
            relative z-10 w-full ${maxWidthClass} 
        bg-white md:bg-white/95 dark:bg-[rgb(var(--brand-surface))] 
            border border-white/20 dark:border-brand-teal/20
            rounded-3xl shadow-2xl 
        flex flex-col max-h-[90vh] overscroll-none 
            transition-colors duration-300 animate-fade-in
            ${className}
        `}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
            <div className="flex items-center justify-between p-5 border-b border-brand-mint/20 dark:border-white/5 flex-shrink-0 gap-4">
                <div className="flex-1 min-w-0 text-xl font-bold text-brand-petrol dark:text-brand-mint">
                    {title}
                </div>
                {!hideCloseButton && (
                    <button 
                      onClick={onClose} 
                      className="flex-shrink-0 p-1 rounded-full text-brand-teal transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                )}
            </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-6 custom-scrollbar">
            {children}
        </div>

        {/* Footer */}
        {footer && (
            <div className="p-4 border-t border-brand-mint/20 dark:border-white/5 bg-brand-mint/5 dark:bg-black/10 rounded-b-3xl flex-shrink-0">
                {footer}
            </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BaseModal;
