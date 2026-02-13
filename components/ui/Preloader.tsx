import React from 'react';

interface PreloaderProps {
    message?: string;
}

export const Preloader: React.FC<PreloaderProps> = ({ message = 'Carregando...' }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo Animation */}
                <div className="relative">
                    {/* Spinning Ring */}
                    <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-orange-500 animate-spin" />

                    {/* Center Logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
                            <span className="text-3xl font-black text-white">S</span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="text-center">
                    <h1 className="text-2xl font-black text-white tracking-tight mb-2">SIGAR</h1>
                    <p className="text-slate-400 text-sm font-medium">Sistema Integrado de Gestão e Acompanhamento Regional</p>
                </div>

                {/* Loading Bar */}
                <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full animate-loading-bar" />
                </div>

                {/* Message */}
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest animate-pulse">
                    {message}
                </p>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center">
                <p className="text-slate-600 text-xs">
                    © {new Date().getFullYear()} Secretaria Municipal de Educação
                </p>
            </div>
        </div>
    );
};
