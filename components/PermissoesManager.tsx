import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Edit3, Save, CheckCircle, X, ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { loadPermissions as loadPermissionsFromDB, savePermissions as savePermissionsToDB } from '../services/permissoesService';

type AccessLevel = 'none' | 'readonly' | 'full';

interface ModulePermission {
    moduleId: string;
    moduleName: string;
    access: AccessLevel;
}

interface RolePermissions {
    role: string;
    modules: ModulePermission[];
}

const ALL_MODULES = [
    { id: 'dashboard', name: 'Visão Geral (Dashboard)', group: 'Menu' },
    { id: 'escolas', name: 'Escolas', group: 'Menu' },
    { id: 'equipe', name: 'Equipe / Gestão de Usuários', group: 'Gestão' },
    { id: 'relatorios', name: 'Relatórios', group: 'Gestão' },
    { id: 'analise_parc', name: 'Análise PARC', group: 'Análises' },
    { id: 'analise_seama', name: 'Análise SEAMA', group: 'Análises' },
    { id: 'analise_saeb', name: 'Análise SAEB', group: 'Análises' },
    { id: 'analise_cnca', name: 'Análise CNCA/PNRA', group: 'Análises' },
    { id: 'indicadores', name: 'Indicadores', group: 'Gestão' },
    { id: 'instrumentais', name: 'Instrumentais de Gestão', group: 'Gestão' },
    { id: 'conselho', name: 'Conselho de Classe', group: 'Gestão' },
    { id: 'notificacoes', name: 'Notificações', group: 'Sistema' },
    { id: 'auditoria', name: 'Auditoria', group: 'Sistema' },
    { id: 'registrar_visita', name: 'Registrar Visita', group: 'Sistema' },
];

const ALL_ROLES = [
    'Administrador',
    'Coordenador Regional',
    'Técnico Pedagógico',
    'Professor',
    'Coordenador Pedagógico',
    'Gestor Geral',
    'Gestor Pedagógico',
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, AccessLevel>> = {
    'Administrador': Object.fromEntries(ALL_MODULES.map(m => [m.id, 'full'])),
    'Coordenador Regional': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'none' : 'full'])),
    'Técnico Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['equipe', 'auditoria'].includes(m.id) ? 'none' : 'full'])),
    'Professor': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'conselho', 'notificacoes'].includes(m.id) ? 'readonly' : 'none'])),
    'Coordenador Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'none' : 'full'])),
    'Gestor Geral': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'readonly' : 'full'])),
    'Gestor Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'readonly' : 'full'])),
};

const STORAGE_KEY = 'sigar_permissions';

const getAccessIcon = (access: AccessLevel) => {
    if (access === 'full') return <Edit3 className="w-3.5 h-3.5" />;
    if (access === 'readonly') return <Eye className="w-3.5 h-3.5" />;
    return <Lock className="w-3.5 h-3.5" />;
};

const getAccessLabel = (access: AccessLevel) => {
    if (access === 'full') return 'Livre';
    if (access === 'readonly') return 'Leitura';
    return 'Bloqueado';
};

const getAccessColor = (access: AccessLevel) => {
    if (access === 'full') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (access === 'readonly') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-500 border-red-200';
};

const cycleAccess = (current: AccessLevel): AccessLevel => {
    if (current === 'none') return 'readonly';
    if (current === 'readonly') return 'full';
    return 'none';
};

export const PermissoesManager: React.FC = () => {
    const [permissions, setPermissions] = useState<Record<string, Record<string, AccessLevel>>>({ ...DEFAULT_PERMISSIONS });

    const [selectedRole, setSelectedRole] = useState<string>(ALL_ROLES[0]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Menu', 'Gestão', 'Análises', 'Sistema']));
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load from Supabase on mount
    useEffect(() => {
        (async () => {
            try {
                const dbPerms = await loadPermissionsFromDB();
                // Merge with defaults: fill any missing roles/modules from defaults
                const merged = { ...DEFAULT_PERMISSIONS };
                for (const role of ALL_ROLES) {
                    if (dbPerms[role]) {
                        merged[role] = { ...merged[role], ...dbPerms[role] };
                    }
                }
                setPermissions(merged);
            } catch (err) {
                console.error('Erro ao carregar permissões:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleToggleAccess = (moduleId: string) => {
        const current = permissions[selectedRole]?.[moduleId] || 'none';
        const next = cycleAccess(current);
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: {
                ...(prev[selectedRole] || {}),
                [moduleId]: next,
            },
        }));
        setHasChanges(true);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await savePermissionsToDB(permissions);
            setHasChanges(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            alert('Erro ao salvar permissões: ' + (err?.message || 'Falha desconhecida'));
        } finally {
            setSaving(false);
        }
    };

    const handleSetAll = (access: AccessLevel) => {
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: Object.fromEntries(ALL_MODULES.map(m => [m.id, access])),
        }));
        setHasChanges(true);
        setSaved(false);
    };

    const handleResetDefaults = () => {
        if (!confirm('Restaurar permissões padrão para todos os perfis?')) return;
        setPermissions({ ...DEFAULT_PERMISSIONS });
        setHasChanges(true);
        setSaved(false);
    };

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    };

    const groups = Array.from(new Set(ALL_MODULES.map(m => m.group)));
    const rolePermissions = permissions[selectedRole] || {};

    const countByAccess = (access: AccessLevel) =>
        ALL_MODULES.filter(m => (rolePermissions[m.id] || 'none') === access).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium">Carregando permissões...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Permissões de Acesso"
                subtitle="Defina os módulos e níveis de acesso para cada perfil de usuário"
                icon={Shield}
                badgeText="ADMINISTRAÇÃO"
                actions={[]}
            />

            {/* Role Selector + Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Role Picker */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Perfil de Usuário</label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedRole === role
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-3 shrink-0">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
                            <p className="text-lg font-black text-emerald-600">{countByAccess('full')}</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Livre</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
                            <p className="text-lg font-black text-amber-600">{countByAccess('readonly')}</p>
                            <p className="text-[10px] font-bold text-amber-500 uppercase">Leitura</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-center min-w-[70px]">
                            <p className="text-lg font-black text-red-500">{countByAccess('none')}</p>
                            <p className="text-[10px] font-bold text-red-400 uppercase">Bloqueado</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Ações rápidas:</span>
                    <button onClick={() => handleSetAll('full')} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100">
                        Liberar tudo
                    </button>
                    <button onClick={() => handleSetAll('readonly')} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-100">
                        Tudo leitura
                    </button>
                    <button onClick={() => handleSetAll('none')} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                        Bloquear tudo
                    </button>
                    <div className="flex-1" />
                    <button onClick={handleResetDefaults} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:bg-slate-50">
                        Restaurar padrão
                    </button>
                </div>
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                    <strong>Dica:</strong> Clique sobre o badge de acesso de cada módulo para alternar entre <strong>Bloqueado</strong> → <strong>Somente Leitura</strong> → <strong>Acesso Livre</strong>.
                </p>
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-400" />
                            Módulos — <span className="text-orange-400">{selectedRole}</span>
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">Clique no status para alterar o nível de acesso</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {saved && (
                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-fade-in">
                                <CheckCircle className="w-4 h-4" /> Salvo!
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${hasChanges
                                ? 'bg-brand-orange hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {groups.map(group => {
                        const groupModules = ALL_MODULES.filter(m => m.group === group);
                        const isExpanded = expandedGroups.has(group);

                        return (
                            <div key={group}>
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className="w-full flex items-center gap-3 px-6 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                >
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                                    }
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{groupModules.length} módulos</span>
                                </button>

                                {/* Module Rows */}
                                {isExpanded && (
                                    <div className="divide-y divide-slate-50">
                                        {groupModules.map(mod => {
                                            const access = rolePermissions[mod.id] || 'none';
                                            return (
                                                <div
                                                    key={mod.id}
                                                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${access === 'full' ? 'bg-emerald-500' : access === 'readonly' ? 'bg-amber-500' : 'bg-red-400'}`} />
                                                        <span className="text-sm font-semibold text-slate-700">{mod.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleAccess(mod.id)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 active:scale-95 select-none cursor-pointer ${getAccessColor(access)}`}
                                                    >
                                                        {getAccessIcon(access)}
                                                        {getAccessLabel(access)}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Table - All Roles */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visão Geral — Todos os Perfis</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-3 pl-6 sticky left-0 bg-slate-50 z-10">Módulo</th>
                                {ALL_ROLES.map(role => (
                                    <th key={role} className="p-3 text-center whitespace-nowrap">
                                        {role.length > 15 ? role.substring(0, 14) + '…' : role}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {ALL_MODULES.map(mod => (
                                <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 pl-6 text-xs font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-100">
                                        {mod.name}
                                    </td>
                                    {ALL_ROLES.map(role => {
                                        const access = (permissions[role] || {})[mod.id] || 'none';
                                        return (
                                            <td key={role} className="p-2 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${getAccessColor(access)}`}>
                                                    {getAccessIcon(access)}
                                                    {access === 'full' ? 'L' : access === 'readonly' ? 'R' : 'B'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex gap-6 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> L = Livre</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> R = Somente Leitura</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> B = Bloqueado</span>
                </div>
            </div>
        </div>
    );
};
