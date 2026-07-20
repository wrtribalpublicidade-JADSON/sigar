
import { supabase } from './supabase';
import { AccessLog, AuditLog } from '../types';

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

        // Attempt to get IP (optional, might block on some clients/adblockers, so we keep it simple or skip)
        const ipAddress = null;

        let uname = userName;
        if (!uname) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                uname = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            }
        }

        await supabase.from('access_logs').insert({
            user_id: userId,
            user_email: userEmail,
            user_name: uname,
            action,
            status,
            user_agent: userAgent,
            ip_address: ipAddress
        });
    } catch (error) {
        console.error('Error logging access:', error);
    }
};

export const logAudit = async (
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    module: string,
    recordId: string | undefined,
    details: any,
    userId?: string,
    userEmail?: string,
    userName?: string
) => {
    try {
        // If user info not passed, try to get from current session
        let uid = userId;
        let uemail = userEmail;
        let uname = userName;

        if (!uid || !uemail || !uname) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                uid = uid || session.user.id;
                uemail = uemail || session.user.email;
                uname = uname || session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            }
        }

        await supabase.from('audit_logs').insert({
            user_id: uid,
            user_email: uemail,
            user_name: uname,
            action,
            module,
            record_id: recordId,
            details,
        });
    } catch (error) {
        console.error('Error logging audit:', error);
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
        .limit(100);

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
            query = query.eq('module', filters.module);
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
        .limit(100);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
    return data as AuditLog[];
};
