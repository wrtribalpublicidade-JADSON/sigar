import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    message: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = AlertCircle,
    title,
    message,
    action
}) => {
    return (
        <div className="py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Icon className="w-12 h-12 mb-2 opacity-20" />
            {title && <h4 className="text-lg font-semibold text-slate-600 mb-1">{title}</h4>}
            <p className="text-sm mb-4">{message}</p>
            {action}
        </div>
    );
};
