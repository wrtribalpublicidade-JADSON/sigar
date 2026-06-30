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
    'INDICADORES': 'indicadores',
    'INSTRUMENTAIS_GESTAO': 'instrumentais',
    'CONSELHO_CLASSE': 'conselho_fundamental',
    'CONSELHO_CLASSE_FUNDAMENTAL': 'conselho_fundamental',
    'CONSELHO_CLASSE_INFANTIL': 'conselho_infantil',
    'NOTIFICACOES': 'notificacoes',
    'AUDIT_LOGS': 'auditoria',
    'NOVA_VISITA': 'registrar_visita',
    'GESTAO_USUARIOS': 'equipe',
    'PERMISSOES': 'auditoria',
    'ATIVIDADES_COMPLEMENTARES': 'atividades_comp',
    'GESTAO_ESTUDANTES': 'estudantes',
    'MERENDA_ESCOLAR': 'merenda',
    'PLANO_CURSO': 'diario_fundamental',
    'PLANO_AULA': 'diario_fundamental',
    'AULAS_MINISTRADAS': 'diario_fundamental',
    'FREQUENCIA': 'diario_fundamental',
    'NOTAS': 'diario_fundamental',
    'DIARIO_FUNDAMENTAL': 'diario_fundamental',
    'DIARIO_INFANTIL': 'diario_infantil',
};

// Sidebar label → moduleId mapping
const SIDEBAR_LABEL_TO_MODULE: Record<string, string> = {
    'Visão Geral': 'dashboard',
    'Escolas': 'escolas',
    'Equipe': 'equipe',
    'Relatórios': 'relatorios',
    'Indicadores': 'indicadores',
    'Instrumentais de Gestão': 'instrumentais',
    'Conselho de Classe': 'conselho_fundamental',
    'Conselho - Fundamental': 'conselho_fundamental',
    'Conselho - Infantil': 'conselho_infantil',
    'Notificações': 'notificacoes',
    'Auditoria': 'auditoria',
    'Registrar Visita': 'registrar_visita',
    'Permissões': 'auditoria',
    'Atividades Complementares': 'atividades_comp',
    'Estudantes': 'estudantes',
    'Merenda Escolar': 'merenda',
    'Plano de Curso': 'diario_fundamental',
    'Guia de Aprendizagem': 'diario_fundamental',
    'Aulas ministradas': 'diario_fundamental',
    'Frequencia': 'diario_fundamental',
    'Notas': 'diario_fundamental',
    'Ensino Fundamental': 'diario_fundamental',
    'Educação Infantil': 'diario_infantil',
};

export const ALL_MODULES = [
    { id: 'dashboard', name: 'Visão Geral (Dashboard)', group: 'Menu' },
    {
        id: 'escolas',
        name: 'Escolas',
        group: 'Menu',
        tabs: [
            { id: 'acompanhamento', name: 'Monitoramento' },
            { id: 'turmas', name: 'Turmas' },
            { id: 'detalhamento_turmas', name: 'Detalhamento de Turmas' },
            { id: 'rh', name: 'Recursos Humanos' },
            { id: 'plano', name: 'Plano de Ação' },
            { id: 'visitas', name: 'Histórico' },
            { id: 'documentos', name: 'Documentos' }
        ]
    },
    { id: 'equipe', name: 'Equipe / Gestão de Usuários', group: 'Gestão' },
    {
        id: 'relatorios',
        name: 'Relatórios',
        group: 'Gestão',
        tabs: [
            { id: 'coordenador', name: 'Atividades do Coordenador' },
            { id: 'visita', name: 'Relatório de Visita' },
            { id: 'gerenciais', name: 'Relatórios Gerenciais' },
            { id: 'matriculas', name: 'Controle de Matrículas' },
            { id: 'servidores', name: 'Controle de Servidores' },
            { id: 'atividades', name: 'Atividades Complementares' }
        ]
    },
    { id: 'indicadores', name: 'Indicadores', group: 'Gestão' },
    { id: 'instrumentais', name: 'Instrumentais de Gestão', group: 'Gestão' },
    {
        id: 'conselho_fundamental',
        name: 'Conselho de Classe - Ensino Fundamental',
        group: 'Gestão',
        tabs: [
            { id: 'estudantil', name: 'Reunião Estudantil' },
            { id: 'avaliacao', name: 'Avaliação Docente' },
            { id: 'acompanhamento', name: 'Acompanhamento Docente' },
            { id: 'encaminhamentos', name: 'Encaminhamentos e Intervenções' }
        ]
    },
    {
        id: 'conselho_infantil',
        name: 'Conselho de Classe - Educação Infantil',
        group: 'Gestão',
        tabs: [
            { id: 'estudantil', name: 'Reunião Estudantil' },
            { id: 'avaliacao', name: 'Avaliação Docente' },
            { id: 'acompanhamento', name: 'Acompanhamento Docente' },
            { id: 'encaminhamentos', name: 'Encaminhamentos e Intervenções' }
        ]
    },
    { id: 'notificacoes', name: 'Notificações', group: 'Sistema' },
    { id: 'auditoria', name: 'Auditoria', group: 'Sistema' },
    { id: 'registrar_visita', name: 'Registrar Visita', group: 'Sistema' },
    { id: 'atividades_comp', name: 'Atividades Complementares', group: 'Gestão' },
    { id: 'estudantes', name: 'Gestão de Estudantes', group: 'Menu' },
    { id: 'merenda', name: 'Merenda Escolar', group: 'Gestão' },
    {
        id: 'diario_fundamental',
        name: 'Diário de Classe - Ensino Fundamental',
        group: 'Gestão',
        tabs: [
            { id: 'plano_curso', name: 'Plano de Curso' },
            { id: 'plano_aula', name: 'Guia de Aprendizagem' },
            { id: 'aulas_ministradas', name: 'Aulas Ministradas' },
            { id: 'frequencia', name: 'Frequência' },
            { id: 'notas', name: 'Notas' }
        ]
    },
    {
        id: 'diario_infantil',
        name: 'Diário de Classe - Educação Infantil',
        group: 'Gestão',
        tabs: [
            { id: 'plano_curso', name: 'Plano de Curso' },
            { id: 'plano_aula', name: 'Guia de Aprendizagem' },
            { id: 'aulas_ministradas', name: 'Aulas Ministradas' },
            { id: 'portfolio_visual', name: 'Portfólio Visual' },
            { id: 'parecer_descritivo', name: 'Parecer Descritivo' },
            { id: 'frequencia', name: 'Frequência' },
            { id: 'avaliacao_docente', name: 'Avaliação Docente' },
            { id: 'painel_resultados', name: 'Painel de Resultados' }
        ]
    },
];

export const ALL_ROLES = [
    'Administrador',
    'Coordenador Regional',
    'Técnico Pedagógico',
    'Professor',
    'Coordenador Pedagógico',
    'Gestor Geral',
    'Gestor Pedagógico',
    'Auxiliar Administrativo',
    'Monitor de Atividade Complementar',
];

export const DEFAULT_PERMISSIONS: Record<string, Record<string, AccessLevel>> = {
    'Administrador': Object.fromEntries(ALL_MODULES.map(m => [m.id, 'full'])),
    'Coordenador Regional': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'none' : 'full'])),
    'Técnico Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['equipe', 'auditoria'].includes(m.id) ? 'none' : 'full'])),
    'Professor': Object.fromEntries(ALL_MODULES.map(m => [
        m.id,
        ['diario_fundamental', 'diario_infantil'].includes(m.id) ? 'full' : ['dashboard', 'conselho_fundamental', 'conselho_infantil', 'notificacoes', 'atividades_comp', 'estudantes'].includes(m.id) ? 'readonly' : 'none'
    ])),
    'Coordenador Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'none' : 'full'])),
    'Gestor Geral': Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id === 'auditoria' ? 'readonly' : 'full'])),
    'Gestor Pedagógico': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe'].includes(m.id) ? 'readonly' : 'full'])),
    'Auxiliar Administrativo': Object.fromEntries(ALL_MODULES.map(m => [m.id, ['auditoria', 'equipe', 'indicadores'].includes(m.id) ? 'none' : 'full'])),
    'Monitor de Atividade Complementar': Object.fromEntries(ALL_MODULES.map(m => [
        m.id,
        m.id === 'atividades_comp' ? 'full' : ['dashboard', 'estudantes'].includes(m.id) ? 'readonly' : 'none'
    ])),
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

/**
 * Get the access level for a specific tab under a parent module.
 * If parent module is none, tab is none.
 * If tab has specific permission, use it. Otherwise, inherit parent permission.
 */
export function getAccessForTab(parentModuleId: string, tabId: string, userRole?: string): AccessLevel {
    if (!userRole) return 'none';
    if (userRole === 'Administrador') return 'full';

    const permissions = loadPermissions();
    const rolePerms = permissions[userRole] || DEFAULT_PERMISSIONS[userRole] || {};

    const parentAccess = rolePerms[parentModuleId] || 'none';
    if (parentAccess === 'none') return 'none';

    const tabKey = `${parentModuleId}:${tabId}`;
    const tabAccess = rolePerms[tabKey];

    if (tabAccess === undefined) {
        return parentAccess;
    }
    return tabAccess;
}

/**
 * Check if a user has access to a tab.
 */
export function hasTabAccess(parentModuleId: string, tabId: string, userRole?: string): boolean {
    return getAccessForTab(parentModuleId, tabId, userRole) !== 'none';
}

/**
 * Check if a user has full (write) access to a tab.
 */
export function hasFullTabAccess(parentModuleId: string, tabId: string, userRole?: string): boolean {
    return getAccessForTab(parentModuleId, tabId, userRole) === 'full';
}

/**
 * Normalize role string to match the casing in ALL_ROLES.
 */
export function normalizeRole(role?: string): any {
    if (!role) return role;
    const match = ALL_ROLES.find(r => r.toLowerCase() === role.toLowerCase());
    return match || role;
}
