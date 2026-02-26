import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, School, Users, FileText,
    ChevronLeft, ChevronRight, Menu, X, LogOut, PlusCircle, BarChart3, TrendingUp, ClipboardCheck, GraduationCap, ClipboardList, Bell, Shield, FileStack, Library, KeyRound
} from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    onLogout: () => void;
    userName: string | null;
    userEmail: string | null;
    hasNotifications?: boolean;
    notificationCount?: number;
    isAdmin?: boolean;
    userRole?: string;
}

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    view?: ViewState;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
    isHighlighted?: boolean;
    hasNotification?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, isCollapsed, onClick, isHighlighted, hasNotification }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all duration-200 group relative
      ${isActive
                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                : isHighlighted
                    ? 'bg-brand-orange/5 text-brand-orange hover:bg-brand-orange/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-orange'
            } `}
        title={isCollapsed ? label : ''}
    >
        {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full" />
        )}
        <div className="relative">
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : isHighlighted ? 'text-brand-orange' : 'text-slate-400 group-hover:text-brand-orange'} transition-colors`} strokeWidth={isActive ? 2.5 : 2} />
            {hasNotification && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
            )}
        </div>
        {!isCollapsed && (
            <div className="flex-1 flex justify-between items-center min-w-0">
                <span className={`text-[13px] font-semibold tracking-tight ${isActive ? 'text-white' : 'text-inherit'} text-left truncate`}>
                    {label}
                </span>
                {hasNotification && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                        !
                    </span>
                )}
            </div>
        )}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, userName, userEmail, isAdmin, userRole, notificationCount = 0 }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const mainNavItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', view: 'DASHBOARD' as ViewState },
        { icon: School, label: 'Escolas', view: 'LISTA_ESCOLAS' as ViewState },
    ];

    const managementNavItems = [
        { icon: Users, label: 'Equipe', view: 'COORDENADORES' as ViewState },
        { icon: FileText, label: 'Relatórios', view: 'RELATORIOS' as ViewState },
        { icon: TrendingUp, label: 'Análise PARC', view: 'ANALISE_PARC' as ViewState },
        { icon: GraduationCap, label: 'Análise SEAMA', view: 'ANALISE_SEAMA' as ViewState },
        { icon: ClipboardList, label: 'Análise SAEB', view: 'ANALISE_SAEB' as ViewState },
        { icon: ClipboardCheck, label: 'Análise CNCA/PNRA', view: 'ANALISE_CNCA_PNRA' as ViewState },
        { icon: BarChart3, label: 'Indicadores', view: 'INDICADORES' as ViewState },
        { icon: FileStack, label: 'Instrumentais de Gestão', view: 'INSTRUMENTAIS_GESTAO' as ViewState },
        { icon: Library, label: 'Conselho de Classe', view: 'CONSELHO_CLASSE' as ViewState },
        { icon: Bell, label: 'Notificações', view: 'NOTIFICACOES' as ViewState, isHighlighted: true, hasNotification: notificationCount > 0 },
    ];



    if (isAdmin) {
        managementNavItems.push({ icon: Shield, label: 'Auditoria', view: 'AUDIT_LOGS' as ViewState });
        managementNavItems.push({ icon: KeyRound, label: 'Permissões', view: 'PERMISSOES' as ViewState });
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className={`pt-8 px-6 pb-6 ${isCollapsed ? 'text-center' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-orange rounded-xl shadow-lg shadow-brand-orange/20 flex items-center justify-center">
                        <span className="text-white font-black text-xl">S</span>
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">SIGAR</h1>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Technical Suite v2</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
                <div>
                    {!isCollapsed && <p className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Menu</p>}
                    <div className="space-y-1">
                        {mainNavItems.map(item => (
                            <NavItem
                                key={item.view}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentView === item.view}
                                isCollapsed={isCollapsed}
                                onClick={() => { onNavigate(item.view); setIsMobileOpen(false); }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    {!isCollapsed && <p className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gestão</p>}
                    <div className="space-y-1">
                        {managementNavItems.map(item => (
                            <NavItem
                                key={item.view}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentView === item.view}
                                isCollapsed={isCollapsed}
                                onClick={() => { onNavigate(item.view); setIsMobileOpen(false); }}
                                hasNotification={(item as any).hasNotification}
                            />
                        ))}
                    </div>
                </div>

                {/* Quick Action */}
                <div className="pt-4">
                    <NavItem
                        icon={PlusCircle}
                        label="Registrar Visita"
                        isActive={currentView === 'NOVA_VISITA'}
                        isCollapsed={isCollapsed}
                        onClick={() => { onNavigate('NOVA_VISITA'); setIsMobileOpen(false); }}
                        isHighlighted={true}
                    />
                </div>
            </nav>

            {/* User Info & Footer */}
            <div className="p-4 mt-auto space-y-2 border-t border-slate-100">
                {/* User Profile */}
                {!isCollapsed && (
                    <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm">
                                {userName ? userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-900 truncate">{userName || 'Usuário'}</p>
                                <p className="text-[10px] text-slate-500 truncate font-medium">{userEmail || ''}</p>
                            </div>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="flex justify-center p-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold text-sm" title={userName || 'Usuário'}>
                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span>Sair do Sistema</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-72'} shrink-0 relative z-50 shadow-sm shadow-slate-200/50`}>
                <SidebarContent />
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-8 -right-3.5 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all z-[60]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" strokeWidth={3} /> : <ChevronLeft className="w-4 h-4" strokeWidth={3} />}
                </button>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                        <span className="text-white font-black text-sm">S</span>
                    </div>
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">SIGAR</span>
                </div>
                <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Drawer */}
            {isMobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                    <div className="relative w-72 bg-white h-full shadow-2xl animate-fade-in">
                        <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition">
                            <X className="w-6 h-6" />
                        </button>
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
};
