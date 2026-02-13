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
            case 'danger': return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-600' };
            case 'warning': return { bg: 'bg-brand-orange', text: 'text-white', border: 'border-brand-orange' };
            case 'success': return { bg: 'bg-green-600', text: 'text-white', border: 'border-green-600' };
            default: return { bg: 'bg-brand-black', text: 'text-white', border: 'border-brand-black' };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-white/80 backdrop-grayscale"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-md border-4 border-brand-black shadow-sharp animate-slide-up">
                {/* Header */}
                <div className={`${styles.bg} p-4 flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${styles.text}`} />
                        <h3 className={`font-black uppercase tracking-wider ${styles.text}`}>{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-black hover:bg-white rounded-none p-1 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-brand-black font-medium mb-4">{message}</p>
                    {children}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-gray-100">
                        <Button variant="ghost" onClick={onClose}>
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === 'info' ? 'primary' : variant as any}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
