import React from 'react';

type KPIColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color?: KPIColor;
    onClick?: () => void;
    sublabel?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    label,
    value,
    icon: Icon,
    color = 'blue',
    onClick,
    sublabel
}) => {
    return (
        <div
            className={`
        bg-white p-6 border-2 border-brand-black shadow-sharp-sm flex flex-col justify-between h-full group
        ${onClick ? 'cursor-pointer hover:shadow-sharp hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200' : ''}
      `}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
                <div className={`
                    p-2 border-2 border-brand-black transition-colors duration-300
                    ${onClick ? 'group-hover:bg-brand-black group-hover:text-white' : ''}
                `}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div>
                <h3 className="text-4xl font-black tracking-tighter text-brand-black">
                    {value}
                </h3>
                {sublabel && (
                    <p className="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-2">{sublabel}</p>
                )}
            </div>
        </div>
    );
};

// Compact version for smaller spaces
export const KPICardCompact: React.FC<Omit<KPICardProps, 'sublabel'>> = ({
    label,
    value,
    icon: Icon,
    onClick
}) => {
    return (
        <div
            className={`
        bg-white p-4 border-2 border-brand-black shadow-sharp-sm flex items-center gap-4 group
        ${onClick ? 'cursor-pointer hover:shadow-sharp hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200' : ''}
      `}
            onClick={onClick}
        >
            <div className={`
                p-2 border-2 border-brand-black transition-colors duration-300
                ${onClick ? 'group-hover:bg-brand-black group-hover:text-white' : ''}
            `}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
                <p className="text-2xl font-black text-brand-black tracking-tight">{value}</p>
            </div>
        </div>
    );
};
