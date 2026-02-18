
import { supabase } from './supabase';
import { AccessLog, AuditLog } from '../types';

export const logAccess = async (
    action: 'LOGIN' | 'LOGOUT',
    status: 'SUCCESS' | 'FAILURE',
    userId?: string,
    userEmail?: string
) => {
    try {
        // Get basic user agent info
        const userAgent = navigator.userAgent;

        // Attempt to get IP (optional, might block on some clients/adblockers, so we keep it simple or skip)
        // For client-side only, getting real IP is hard without an external service. 
        // We will leave IP null for now or use a placeholder if needed.
        const ipAddress = null;

        await supabase.from('access_logs').insert({
            user_id: userId,
            user_email: userEmail,
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
    userEmail?: string
) => {
    try {
        // If user info not passed, try to get from current session
        let uid = userId;
        let uemail = userEmail;

        if (!uid || !uemail) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                uid = uid || session.user.id;
                uemail = uemail || session.user.email;
            }
        }

        await supabase.from('audit_logs').insert({
            user_id: uid,
            user_email: uemail,
            action,
            module,
            record_id: recordId,
            details,
        });
    } catch (error) {
        console.error('Error logging audit:', error);
    }
};

export const fetchAccessLogs = async (): Promise<AccessLog[]> => {
    const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching access logs:', error);
        return [];
    }
    return data as AccessLog[];
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
    return data as AuditLog[];
};
