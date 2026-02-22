import React from 'react';
import { Button } from './Button';
import { LucideIcon, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    icon: LucideIcon;
    iconColor?: string; // Kept for API compatibility but mapping to variants
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info' | 'warning' | 'success';
    children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    icon: Icon,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'info',
    children
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger': return {
                iconBg: 'bg-red-100', iconText: 'text-red-600',
                btnClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20 shadow-red-500/20 text-white'
            };
            case 'warning': return {
                iconBg: 'bg-brand-orange/10', iconText: 'text-brand-orange',
                btnClass: 'bg-brand-orange hover:bg-orange-600 focus:ring-brand-orange/20 shadow-brand-orange/20 text-white'
            };
            case 'success': return {
                iconBg: 'bg-green-100', iconText: 'text-green-600',
                btnClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500/20 shadow-green-500/20 text-white'
            };
            default: return {
                iconBg: 'bg-blue-100', iconText: 'text-blue-600',
                btnClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20 shadow-blue-500/20 text-white'
            };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-slide-up sm:max-w-lg">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-all"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mb-5 rotate-3 scale-110 shadow-inner`}>
                            <Icon className={`w-8 h-8 ${styles.iconText} -rotate-3`} />
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {title}
                        </h3>
                        <p className="text-slate-500 font-medium text-[15px] leading-relaxed max-w-sm">
                            {message}
                        </p>
                        {children && (
                            <div className="mt-4 w-full text-left">
                                {children}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 text-slate-600 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all shadow-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-8 py-2.5 font-bold rounded-xl shadow-lg focus:outline-none focus:ring-4 transition-all flex items-center justify-center gap-2 ${styles.btnClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
