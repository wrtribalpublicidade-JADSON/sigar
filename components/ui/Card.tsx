import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
    hoverable?: boolean;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    onClick,
    hoverable = false
}) => {
    return (
        <div
            className={`
        bg-white rounded-xl shadow-sm border border-slate-200
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-md transition cursor-pointer' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    action,
    icon,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between pb-4 border-b border-slate-100 ${className}`}>
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );
};

interface CardSectionProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({
    children,
    title,
    className = ''
}) => {
    return (
        <div className={className}>
            {title && (
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
            )}
            {children}
        </div>
    );
};
