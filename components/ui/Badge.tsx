import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200'
};

const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'sm',
    className = ''
}) => {
    return (
        <span
            className={`
        inline-flex items-center rounded-full font-semibold border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
};

// Specialized badges for common use cases
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getVariant = (): BadgeVariant => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('realizada') || statusLower.includes('concluí')) return 'success';
        if (statusLower.includes('pendente') || statusLower.includes('atrasad')) return 'warning';
        if (statusLower.includes('planejada') || statusLower.includes('agendad')) return 'info';
        return 'neutral';
    };

    return <Badge variant={getVariant()}>{status}</Badge>;
};

export const IdebBadge: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) return <Badge variant="neutral">IDEB: -</Badge>;
    const variant = value >= 4.5 ? 'success' : 'warning';
    return <Badge variant={variant}>IDEB: {value.toFixed(1)}</Badge>;
};
