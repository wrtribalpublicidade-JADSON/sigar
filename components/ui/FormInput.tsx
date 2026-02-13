import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-black">
                    {label}
                </label>
            )}
            <input
                className={`
                    w-full px-4 py-3 border-2 border-brand-black bg-white 
                    text-brand-black font-bold text-sm outline-none transition-all
                    focus:border-brand-orange focus:shadow-sharp-sm
                    ${error ? 'border-brand-signal bg-brand-signal/5' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="font-mono text-[9px] font-bold uppercase text-brand-signal px-1 italic">{error}</p>
            )}
            {helperText && !error && (
                <p className="font-mono text-[9px] font-bold uppercase text-brand-grey px-1">{helperText}</p>
            )}
        </div>
    );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    error,
    options,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-black">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`
                        w-full px-4 py-3 border-2 border-brand-black bg-white 
                        text-brand-black font-bold text-sm outline-none transition-all
                        appearance-none focus:border-brand-orange focus:shadow-sharp-sm
                        ${error ? 'border-brand-signal bg-brand-signal/5' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-3 h-3 border-r-2 border-b-2 border-brand-black rotate-45 -translate-y-1" />
                </div>
            </div>
            {error && (
                <p className="font-mono text-[9px] font-bold uppercase text-brand-signal px-1 italic">{error}</p>
            )}
        </div>
    );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-black">
                    {label}
                </label>
            )}
            <textarea
                className={`
                    w-full px-4 py-3 border-2 border-brand-black bg-white 
                    text-brand-black font-bold text-sm outline-none transition-all
                    focus:border-brand-orange focus:shadow-sharp-sm min-h-[120px]
                    ${error ? 'border-brand-signal bg-brand-signal/5' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="font-mono text-[9px] font-bold uppercase text-brand-signal px-1 italic">{error}</p>
            )}
        </div>
    );
};

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
    label,
    className = '',
    ...props
}) => {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input
                    type="checkbox"
                    className={`
                        w-5 h-5 border-2 border-brand-black appearance-none 
                        checked:bg-brand-orange transition-all cursor-pointer shadow-sharp-sm
                        group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]
                        group-hover:shadow-sharp ${className}
                    `}
                    {...props}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 checked-sibling:opacity-100">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-brand-black">{label}</span>
        </label>
    );
};
