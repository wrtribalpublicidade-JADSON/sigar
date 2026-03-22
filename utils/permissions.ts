// Permissions utility — reads from localStorage and maps module IDs to ViewStates

export type AccessLevel = 'none' | 'readonly' | 'full';

const STORAGE_KEY = 'sigar_permissions';

// Mapping: ViewState → moduleId in the permissions config
const VIEW_TO_MODULE: Record<string, string> = {
    'DASHBOARD': 'dashboard',
    'LISTA_ESCOLAS': 'escolas',
    'DETALHE_ESCOLA': 'escolas',
    'COORDENADORES': 'equipe',
    'RELATORIOS': 'relatorios',
    'ANALISE_PARC': 'analise_parc',
    'ANALISE_SEAMA': 'analise_seama',
    'ANALISE_SAEB': 'analise_saeb',
    'ANALISE_CNCA_PNRA': 'analise_cnca',
    'INDICADORES': 'indicadores',
    'INSTRUMENTAIS_GESTAO': 'instrumentais',
    'CONSELHO_CLASSE': 'conselho',
    'CONSELHO_CLASSE_FUNDAMENTAL': 'conselho',
    'CONSELHO_CLASSE_INFANTIL': 'conselho',
    'NOTIFICACOES': 'notificacoes',
    'AUDIT_LOGS': 'auditoria',
    'NOVA_VISITA': 'registrar_visita',
    'GESTAO_USUARIOS': 'equipe',
    'PERMISSOES': 'auditoria',
    'ATIVIDADES_COMPLEMENTARES': 'atividades_comp',
    'GESTAO_ESTUDANTES': 'estudantes',
};

// Sidebar label → moduleId mapping
const SIDEBAR_LABEL_TO_MODULE: Record<string, string> = {
    'Visão Geral': 'dashboard',
    'Escolas': 'escolas',
    'Equipe': 'equipe',
    'Relatórios': 'relatorios',
    'Análise PARC': 'analise_parc',
    'Análise SEAMA': 'analise_seama',
    'Análise SAEB': 'analise_saeb',
    'Análise CNCA/PNRA': 'analise_cnca',
    'Indicadores': 'indicadores',
    'Instrumentais de Gestão': 'instrumentais',
    'Conselho de Classe': 'conselho',
    'Conselho - Fundamental': 'conselho',
    'Conselho - Infantil': 'conselho',
    'Notificações': 'notificacoes',
    'Auditoria': 'auditoria',
    'Registrar Visita': 'registrar_visita',
    'Permissões': 'auditoria',
    'Atividades Complementares': 'atividades_comp',
    'Estudantes': 'estudantes',
};

export const ALL_MODULES = [
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
    { id: 'atividades_comp', name: 'Atividades Complementares', group: 'Gestão' },
    { id: 'estudantes', name: 'Gestão de Estudantes', group: 'Menu' },
];

export const ALL_ROLES = [
    'Administrador',
    'Coordenador Regional',
    'Técnico Pedagógico',
    'Professor',
    'Coordenador Pedagógico',
    'Gestor Geral',
    'Gestor Pedagógico',
];

export const DEFAULT_PERMISSIONS: Record<string, Record<string, AccessLevel>> = {
    'Administrador': Object.fromEntries(ALL_MODULES.map(m => [m.id, 'full'])),
    'Coordenador Regional': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'none' : 'full'])),
    'Técnico Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['equipe', 'auditoria'].includes(m.id) ? 'none' : 'full'])),
    'Professor': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'conselho', 'notificacoes', 'atividades_comp', 'estudantes'].includes(m.id) ? 'readonly' : 'none'])),
    'Coordenador Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'none' : 'full'])),
    'Gestor Geral': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'readonly' : 'full'])),
    'Gestor Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'readonly' : 'full'])),
};

function loadPermissions(): Record<string, Record<string, AccessLevel>> {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return {};
}

/**
 * Get the access level for a given view and user role.
 * Fallbacks to DEFAULT_PERMISSIONS if no custom permissions are set.
 * If neither has a rule, defaults to 'none' instead of 'full' for security.
 */
export function getAccessForView(viewState: string, userRole?: string): AccessLevel {
    if (!userRole) return 'none'; // Require role
    const moduleId = VIEW_TO_MODULE[viewState];
    if (!moduleId) return 'none';

    // Always grant full access to Admins to prevent locking out
    if (userRole === 'Administrador') return 'full';

    const permissions = loadPermissions();
    const rolePerms = permissions[userRole] || DEFAULT_PERMISSIONS[userRole] || {};

    return rolePerms[moduleId] || 'none';
}

/**
 * Get the access level for a sidebar label and user role.
 */
export function getAccessForSidebarItem(label: string, userRole?: string): AccessLevel {
    if (!userRole) return 'none';
    const moduleId = SIDEBAR_LABEL_TO_MODULE[label];
    if (!moduleId) return 'none';

    // Always grant full access to Admins to prevent locking out
    if (userRole === 'Administrador') return 'full';

    const permissions = loadPermissions();
    const rolePerms = permissions[userRole] || DEFAULT_PERMISSIONS[userRole] || {};

    return rolePerms[moduleId] || 'none';
}

/**
 * Check if a user role has access to a view (not 'none').
 */
export function hasAccess(viewState: string, userRole?: string): boolean {
    return getAccessForView(viewState, userRole) !== 'none';
}

/**
 * Check if a user role has full (write) access to a view.
 */
export function hasFullAccess(viewState: string, userRole?: string): boolean {
    return getAccessForView(viewState, userRole) === 'full';
}
