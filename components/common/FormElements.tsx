
import React from 'react';

const baseStyles = `
    w-full p-3
    bg-brand-mint/10 dark:bg-white/10
    border-2 border-transparent
    focus:border-accent
    rounded-xl
    outline-none
    transition-all
    text-brand-petrol dark:text-brand-mint
    placeholder-accent/80 dark:placeholder-brand-mint/40
    disabled:opacity-50 disabled:cursor-not-allowed
`;

const labelClass = 'block text-xs font-bold text-accent dark:text-accent/80 mb-1.5 uppercase tracking-wider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, className = '', rightElement, ...props }) => (
    <div className="w-full">
        {label && <label className={labelClass}>{label}</label>}
        <div className="relative">
            <input
                className={`${baseStyles} ${rightElement ? 'pr-10' : ''} ${className}`}
                {...props}
            />
            {rightElement && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent dark:text-brand-mint">
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
        {label && <label className={labelClass}>{label}</label>}
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
        {label && <label className={labelClass}>{label}</label>}
        <div className="relative">
            <select
                className={`${baseStyles} appearance-none cursor-pointer pr-10 ${className}`}
                {...props}
            >
                {children}
            </select>
            <span className="material-symbols-outlined text-[20px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-accent dark:text-brand-mint">
                expand_more
            </span>
        </div>
    </div>
);

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    const variants: Record<ButtonVariant, string> = {
        primary: 'bg-accent text-white shadow',
        secondary: 'bg-white border-2 border-accent/30 text-brand-petrol dark:bg-transparent dark:border-brand-mint/30 dark:text-brand-mint',
        danger: 'bg-white border-2 border-brand-rust/20 text-brand-rust dark:bg-brand-rust/20 dark:text-orange-200 dark:border-brand-rust/40',
        ghost: 'bg-transparent text-accent dark:text-brand-mint'
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
};
