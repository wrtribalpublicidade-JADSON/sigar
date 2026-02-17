import React from 'react';

interface TableProps {
    children: React.ReactNode;
    className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white border-2 border-brand-black shadow-sharp transition-all duration-200 ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-black border-collapse">
                    {children}
                </table>
            </div>
        </div>
    );
};

interface TableHeadProps {
    children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children }) => {
    return (
        <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em] border-b-2 border-brand-black sticky top-0 z-20">
            {children}
        </thead>
    );
};

interface TableBodyProps {
    children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children }) => {
    return (
        <tbody className="divide-y-2 divide-brand-black/10">
            {children}
        </tbody>
    );
};

interface TableRowProps {
    children: React.ReactNode;
    onClick?: () => void;
    hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
    children,
    onClick,
    hoverable = true
}) => {
    return (
        <tr
            className={`
                group transition-all
                ${hoverable ? 'hover:bg-slate-50' : ''} 
                ${onClick ? 'cursor-pointer active:bg-slate-100' : ''} 
            `}
            onClick={onClick}
        >
            {children}
        </tr>
    );
};

interface TableCellProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
    children,
    className = '',
    align = 'left'
}) => {
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <td className={`px-6 py-4 font-bold ${alignClasses[align]} group-hover:text-brand-orange transition-colors ${className}`}>
            {children}
        </td>
    );
};

interface TableHeaderCellProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    onClick?: () => void;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
    children,
    className = '',
    align = 'left',
    sortable = false,
    onClick
}) => {
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <th
            className={`
        px-6 py-4 ${alignClasses[align]} 
        ${sortable ? 'cursor-pointer hover:bg-slate-100 transition' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </th>
    );
};

// Empty state for tables
interface TableEmptyProps {
    icon?: React.ReactNode;
    message: string;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({ icon, message }) => {
    return (
        <tr>
            <td colSpan={100} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center text-brand-grey">
                    {icon && <div className="mb-4 text-slate-300 animate-float">{icon}</div>}
                    <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
                </div>
            </td>
        </tr>
    );
};
