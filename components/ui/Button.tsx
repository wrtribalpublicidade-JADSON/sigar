import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.98]';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 focus:ring-orange-500 border border-transparent',
        secondary: 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:ring-slate-200',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-200 border border-transparent',
        danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 focus:ring-rose-500 border border-transparent',
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 focus:ring-emerald-500 border border-transparent',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-[10px] gap-1.5',
        md: 'px-6 py-2.5 text-[11px] gap-2',
        lg: 'px-8 py-3.5 text-xs gap-2.5',
    };

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className={`${iconSize[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
            ) : Icon && iconPosition === 'left' ? (
                <Icon className={iconSize[size]} strokeWidth={3} />
            ) : null}
            <span>{children}</span>
            {!isLoading && Icon && iconPosition === 'right' && <Icon className={iconSize[size]} strokeWidth={3} />}
        </button>
    );
};

interface ActionButtonProps {
    icon: LucideIcon;
    onClick?: () => void;
    variant?: 'default' | 'danger' | 'success';
    title?: string;
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    icon: Icon,
    onClick,
    variant = 'default',
    title,
    className = '',
}) => {
    const variantStyles = {
        default: 'text-slate-400 hover:text-blue-600 hover:bg-blue-50',
        danger: 'text-slate-400 hover:text-red-600 hover:bg-red-50',
        success: 'text-slate-400 hover:text-green-600 hover:bg-green-50',
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-colors ${variantStyles[variant]} ${className}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
};
