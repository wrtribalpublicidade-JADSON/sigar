import React from 'react';
import { Menu, LogOut, PlusCircle } from 'lucide-react';

interface MobileHeaderProps {
    onMenuOpen: () => void;
    onLogout: () => void;
    onNewVisit: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuOpen, onLogout, onNewVisit }) => {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
            <button onClick={onMenuOpen} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-xl text-blue-600">SIGAR</h1>
            <div className="flex items-center gap-2">
                <button onClick={onNewVisit} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <PlusCircle className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
