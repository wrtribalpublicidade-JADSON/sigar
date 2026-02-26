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
    'NOTIFICACOES': 'notificacoes',
    'AUDIT_LOGS': 'auditoria',
    'NOVA_VISITA': 'registrar_visita',
    'GESTAO_USUARIOS': 'equipe',
    'PERMISSOES': 'auditoria', // only admins see this
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
    'Notificações': 'notificacoes',
    'Auditoria': 'auditoria',
    'Registrar Visita': 'registrar_visita',
    'Permissões': 'auditoria',
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
 * Returns 'full' if no permissions are configured (default permissive).
 */
export function getAccessForView(viewState: string, userRole?: string): AccessLevel {
    if (!userRole) return 'full'; // no role info = allow all
    const permissions = loadPermissions();
    const rolePerms = permissions[userRole];
    if (!rolePerms) return 'full'; // no config for this role = allow all
    const moduleId = VIEW_TO_MODULE[viewState];
    if (!moduleId) return 'full';
    return rolePerms[moduleId] || 'full';
}

/**
 * Get the access level for a sidebar label and user role.
 */
export function getAccessForSidebarItem(label: string, userRole?: string): AccessLevel {
    if (!userRole) return 'full';
    const permissions = loadPermissions();
    const rolePerms = permissions[userRole];
    if (!rolePerms) return 'full';
    const moduleId = SIDEBAR_LABEL_TO_MODULE[label];
    if (!moduleId) return 'full';
    return rolePerms[moduleId] || 'full';
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
