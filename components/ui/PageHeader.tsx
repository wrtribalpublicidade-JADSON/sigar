import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButton {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    badgeText?: string;
    badgeColor?: string; // e.g., 'orange', 'emerald'
    actions?: ActionButton[];
    onBack?: () => void;
    backgroundImage?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    badgeText,
    badgeColor = 'orange',
    actions = [],
    onBack,
}) => {
    return (
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-in mb-8 max-w-full">
            {/* Orbital Effects */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-start gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-1 p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {Icon && (
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            {badgeText && (
                                <span className={`px-3 py-1 bg-${badgeColor}-500/20 text-${badgeColor}-400 text-xs font-bold uppercase tracking-wider rounded-full border border-${badgeColor}-500/30`}>
                                    {badgeText}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl 3xl:text-4xl font-black text-white leading-tight">{title}</h2>
                        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
                    </div>
                </div>

                {actions.length > 0 && (
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={action.onClick}
                                className={`
                  flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition font-semibold shadow-lg
                  ${action.variant === 'primary' || !action.variant
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20'
                                        : action.variant === 'secondary'
                                            ? 'bg-white text-slate-700 hover:bg-slate-50'
                                            : 'bg-white/10 border border-white/20 text-white hover:bg-white/20' // outline
                                    }
                `}
                            >
                                {action.icon && <action.icon className="w-4 h-4" />}
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
