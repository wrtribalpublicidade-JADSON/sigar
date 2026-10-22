
import { supabase } from './supabase';
import { AccessLog, AuditLog } from '../types';

const isValidUUID = (str?: string | null): boolean => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const logAccess = async (
    action: 'LOGIN' | 'LOGOUT',
    status: 'SUCCESS' | 'FAILURE',
    userId?: string,
    userEmail?: string,
    userName?: string
) => {
    try {
        // Get basic user agent info
        const userAgent = navigator.userAgent;
        const ipAddress = null;

        let uname = userName;
        let uid = userId;
        let uemail = userEmail;
        let authUserId: string | null = null;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                authUserId = session.user.id;
                uemail = uemail || session.user.email;
                uname = uname || session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            }
        } catch {
            // sessao nao disponivel
        }

        // Prioriza o auth.users(id) da sessão; se não houver, tenta o uid se for UUID válido
        const targetUserId = authUserId || (isValidUUID(uid) ? uid : null);

        const { error: insertError } = await supabase.from('access_logs').insert({
            user_id: targetUserId,
            user_email: uemail,
            user_name: uname,
            action,
            status,
            user_agent: userAgent,
            ip_address: ipAddress
        });

        // Se falhar por foreign key (23503), retenta com user_id null para garantir que o log nunca seja descartado
        if (insertError) {
            console.warn('Erro ao inserir access_logs com user_id. Retentando com user_id null:', insertError.message);
            await supabase.from('access_logs').insert({
                user_id: null,
                user_email: uemail,
                user_name: uname,
                action,
                status,
                user_agent: userAgent,
                ip_address: ipAddress
            });
        }
    } catch (error) {
        console.error('Error logging access:', error);
    }
};

export const logAudit = async (
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS' | 'NAVIGATE' | string,
    module: string,
    recordId: string | undefined,
    details: any,
    userId?: string,
    userEmail?: string,
    userName?: string
) => {
    try {
        const uid = userId;
        let uemail = userEmail;
        let uname = userName;
        let authUserId: string | null = null;

        try {
            // Obtém usuário autenticado exclusivamente do Supabase Auth
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                authUserId = session.user.id;
                uemail = uemail || session.user.email;
                uname = uname || session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    authUserId = user.id;
                    uemail = uemail || user.email;
                    uname = uname || user.user_metadata?.full_name || user.email?.split('@')[0];
                }
            }
        } catch {
            // Sessão / Auth não disponível
        }

        // 1 & 3: Para audit_logs.user_id usa SOMENTE o id do Supabase Auth.
        // Nunca usa o uid (id de coordenador). Se não houver autenticado, grava null na primeira tentativa.
        const targetUserId: string | null = authUserId || null;

        // 2: Se o parâmetro uid (id de coordenador) for informado, grava-o em details.coordenador_id
        let auditDetails = details;
        if (uid) {
            if (typeof details === 'object' && details !== null && !Array.isArray(details)) {
                auditDetails = { ...details, coordenador_id: uid };
            } else if (details !== undefined && details !== null) {
                auditDetails = { valor: details, coordenador_id: uid };
            } else {
                auditDetails = { coordenador_id: uid };
            }
        }

        const { error: insertError } = await supabase.from('audit_logs').insert({
            user_id: targetUserId,
            user_email: uemail,
            user_name: uname,
            action,
            module,
            record_id: recordId ? String(recordId) : null,
            details: auditDetails,
        });

        // 4: Fallback apenas como proteção final, registrando em details.tentativa_user_id o id que falhou
        if (insertError) {
            console.warn('Erro ao inserir audit_logs com user_id. Retentando com user_id null:', insertError.message);
            const failedUserId = targetUserId || uid;
            const fallbackDetails = typeof auditDetails === 'object' && auditDetails !== null && !Array.isArray(auditDetails)
                ? { ...auditDetails, tentativa_user_id: failedUserId }
                : { original_details: auditDetails, tentativa_user_id: failedUserId };

            await supabase.from('audit_logs').insert({
                user_id: null,
                user_email: uemail,
                user_name: uname,
                action,
                module,
                record_id: recordId ? String(recordId) : null,
                details: fallbackDetails,
            });
        }
    } catch (error) {
        console.error('Error logging audit:', error);
    }
};

export const logNavigation = async (
    menuGroup: 'MENU' | 'DIÁRIO DE CLASSE' | 'GESTÃO' | 'REGISTRAR VISITA' | string,
    menuLabel: string,
    view: string,
    userId?: string,
    userEmail?: string,
    userName?: string,
    extraDetails?: any
) => {
    try {
        const cleanGroup = (menuGroup || 'MENU').toUpperCase().trim();
        const moduleName = `NAVEGACAO_${cleanGroup.replace(/[\s\-\/]/g, '_')}`;

        await logAudit(
            'ACCESS',
            moduleName,
            view,
            {
                grupo: menuGroup,
                menu: menuLabel,
                view,
                timestamp: new Date().toISOString(),
                ...extraDetails
            },
            userId,
            userEmail,
            userName
        );
    } catch (error) {
        console.error('Error logging navigation:', error);
    }
};

export const fetchAccessLogs = async (filters?: {
    user?: string;
    year?: string;
    month?: string;
    day?: string;
}): Promise<AccessLog[]> => {
    let query = supabase.from('access_logs').select('*');

    if (filters) {
        if (filters.user) {
            const term = `%${filters.user.toLowerCase()}%`;
            query = query.or(`user_email.ilike.${term},user_name.ilike.${term}`);
        }

        if (filters.year || filters.month || filters.day) {
            const now = new Date();
            const y = filters.year ? parseInt(filters.year) : now.getFullYear();
            
            if (filters.month !== '' && filters.month !== undefined) {
                const m = parseInt(filters.month);
                if (filters.day !== '' && filters.day !== undefined) {
                    const d = parseInt(filters.day);
                    const start = new Date(y, m, d, 0, 0, 0, 0).toISOString();
                    const end = new Date(y, m, d, 23, 59, 59, 999).toISOString();
                    query = query.gte('created_at', start).lte('created_at', end);
                } else {
                    const start = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
                    const end = new Date(y, m + 1, 1, 0, 0, 0, 0).toISOString();
                    query = query.gte('created_at', start).lt('created_at', end);
                }
            } else if (filters.year) {
                const start = new Date(y, 0, 1, 0, 0, 0, 0).toISOString();
                const end = new Date(y + 1, 0, 1, 0, 0, 0, 0).toISOString();
                query = query.gte('created_at', start).lt('created_at', end);
            }
        }
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Error fetching access logs:', error);
        return [];
    }
    return data as AccessLog[];
};

export const fetchAuditLogs = async (filters?: {
    user?: string;
    module?: string;
    year?: string;
    month?: string;
    day?: string;
}): Promise<AuditLog[]> => {
    let query = supabase.from('audit_logs').select('*');

    if (filters) {
        if (filters.user) {
            const term = `%${filters.user.toLowerCase()}%`;
            query = query.or(`user_email.ilike.${term},user_name.ilike.${term}`);
        }

        if (filters.module) {
            if (filters.module === 'NAVEGACAO') {
                query = query.ilike('module', 'NAVEGACAO%');
            } else {
                query = query.eq('module', filters.module);
            }
        }

        if (filters.year || filters.month || filters.day) {
            const now = new Date();
            const y = filters.year ? parseInt(filters.year) : now.getFullYear();
            
            if (filters.month !== '' && filters.month !== undefined) {
                const m = parseInt(filters.month);
                if (filters.day !== '' && filters.day !== undefined) {
                    const d = parseInt(filters.day);
                    const start = new Date(y, m, d, 0, 0, 0, 0).toISOString();
                    const end = new Date(y, m, d, 23, 59, 59, 999).toISOString();
                    query = query.gte('created_at', start).lte('created_at', end);
                } else {
                    const start = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
                    const end = new Date(y, m + 1, 1, 0, 0, 0, 0).toISOString();
                    query = query.gte('created_at', start).lt('created_at', end);
                }
            } else if (filters.year) {
                const start = new Date(y, 0, 1, 0, 0, 0, 0).toISOString();
                const end = new Date(y + 1, 0, 1, 0, 0, 0, 0).toISOString();
                query = query.gte('created_at', start).lt('created_at', end);
            }
        }
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
    return data as AuditLog[];
};
