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
    const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-2 border-brand-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none';

    const variantStyles = {
        primary: 'bg-brand-orange text-white shadow-sharp-sm hover:shadow-sharp',
        secondary: 'bg-white text-brand-black shadow-sharp-sm hover:bg-slate-50',
        ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50',
        danger: 'bg-brand-signal text-white shadow-sharp-sm hover:shadow-sharp',
        success: 'bg-brand-acid text-brand-black shadow-sharp-sm hover:shadow-sharp',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-[9px] gap-1.5',
        md: 'px-5 py-2.5 text-[10px] gap-2',
        lg: 'px-8 py-3.5 text-xs gap-3',
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
            <span className="font-mono">{children}</span>
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
