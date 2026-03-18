import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
    label, 
    icon: Icon, 
    error, 
    children,
    className = ''
}) => {
    return (
        <div className={`flex flex-col w-full ${className}`}>
            {label && (
                <label className="form-label">
                    {Icon && <Icon size={14} className="text-[var(--text-muted)]" />}
                    {label}
                </label>
            )}
            
            <div className="relative group">
                {children}
            </div>

            {error && <p className="form-error">{error}</p>}
        </div>
    );
};

// Reusable custom parts for the FormField
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input ref={ref} className={`input-field ${props.className || ''}`} {...props} />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <select ref={ref} className={`input-field appearance-none cursor-pointer ${props.className || ''}`} {...props}>
        {props.children}
    </select>
));
Select.displayName = 'Select';

export const ActionButton = ({ onClick, children, icon: Icon, className = '', ...props }: any) => (
    <button 
        type="button" 
        onClick={onClick}
        className={`input-field flex items-center justify-between text-left hover:border-[var(--primary)] group ${className}`}
        {...props}
    >
        <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon size={18} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] flex-shrink-0" />}
            <div className="truncate">
                {children}
            </div>
        </div>
        <div className="ml-2 flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
            </svg>
        </div>
    </button>
);
