
import React from 'react';

// Common style classes
// Updated: Dark mode placeholder now uses brand-mint for better contrast against dark bg
const baseStyles = `
    w-full p-3 
    bg-brand-mint/10 dark:bg-white/10 
    border-2 border-transparent 
    focus:border-brand-teal 
    rounded-xl 
    outline-none 
    transition-all 
    text-brand-petrol dark:text-brand-mint 
    placeholder-brand-teal/80 dark:placeholder-brand-mint/40
    disabled:opacity-50 disabled:cursor-not-allowed
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, className = '', rightElement, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-brand-teal dark:text-brand-teal/80 mb-1.5 uppercase tracking-wider">{label}</label>}
        <div className="relative">
            <input 
                className={`${baseStyles} ${className}`}
                {...props} 
            />
            {rightElement && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-teal dark:text-brand-mint">
                    {rightElement}
                </div>
            )}
        </div>
    </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-brand-teal dark:text-brand-teal/80 mb-1.5 uppercase tracking-wider">{label}</label>}
        <textarea 
            className={`${baseStyles} resize-none ${className}`}
            {...props} 
        />
    </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => (
    <div className="w-full">
         {label && <label className="block text-xs font-bold text-brand-teal dark:text-brand-teal/80 mb-1.5 uppercase tracking-wider">{label}</label>}
         <div className="relative">
            <select 
                className={`${baseStyles} appearance-none cursor-pointer ${className}`}
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-teal dark:text-brand-mint">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
         </div>
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
    children, variant = 'primary', className = '', ...props 
}) => {
    const variants = {
        // Primary: Deep Petrol in Light (contrast against white/mint), Teal in Dark (contrast against Petrol Surface)
        primary: "bg-brand-petrol text-white shadow-lg dark:bg-brand-teal dark:text-white dark:shadow-md",
        
        // Secondary: Outline style. Clearly distinguished from Primary.
        secondary: "bg-white border-2 border-brand-teal/30 text-brand-petrol dark:bg-transparent dark:border-brand-mint/30 dark:text-brand-mint",
        
        // Danger: Rust colors. UPDATED: White background in light mode.
        danger: "bg-white border-2 border-brand-rust/20 text-brand-rust dark:bg-brand-rust/20 dark:text-orange-200 dark:border-brand-rust/40",
        
        // Ghost: Transparent
        ghost: "bg-transparent text-brand-teal dark:text-brand-mint"
    };

    return (
        <button 
            className={`
                px-5 py-2.5 rounded-xl font-bold text-sm 
                transition-all active:scale-95 disabled:active:scale-100 
                flex items-center justify-center gap-2
                ${variants[variant]} 
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}
