import { supabase } from './supabase';

export type AccessLevel = 'none' | 'readonly' | 'full';

export interface PermissaoPerfil {
    id?: string;
    perfil: string;
    modulo_id: string;
    acesso: AccessLevel;
}

/**
 * Load all permissions from Supabase, returns a map: { [role]: { [moduleId]: accessLevel } }
 */
export async function loadPermissions(): Promise<Record<string, Record<string, AccessLevel>>> {
    const { data, error } = await supabase
        .from('permissoes_perfil')
        .select('*');

    if (error) {
        console.error('Erro ao carregar permissões:', error);
        // Fallback to localStorage
        try {
            const saved = localStorage.getItem('sigar_permissions');
            if (saved) return JSON.parse(saved);
        } catch { }
        return {};
    }

    const result: Record<string, Record<string, AccessLevel>> = {};
    (data || []).forEach((row: any) => {
        if (!result[row.perfil]) result[row.perfil] = {};
        result[row.perfil][row.modulo_id] = row.acesso as AccessLevel;
    });

    // Cache in localStorage for offline/fast reads
    localStorage.setItem('sigar_permissions', JSON.stringify(result));

    return result;
}

/**
 * Save all permissions for all roles to Supabase.
 * Uses upsert with the unique(perfil, modulo_id) constraint.
 */
export async function savePermissions(permissions: Record<string, Record<string, AccessLevel>>): Promise<void> {
    const rows: PermissaoPerfil[] = [];

    for (const [perfil, modules] of Object.entries(permissions)) {
        for (const [modulo_id, acesso] of Object.entries(modules)) {
            rows.push({ perfil, modulo_id, acesso });
        }
    }

    // Delete all existing and re-insert (simplest approach for full sync)
    const { error: deleteError } = await supabase
        .from('permissoes_perfil')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (deleteError) {
        console.error('Erro ao limpar permissões:', deleteError);
        throw deleteError;
    }

    if (rows.length > 0) {
        const { error: insertError } = await supabase
            .from('permissoes_perfil')
            .insert(rows);

        if (insertError) {
            console.error('Erro ao salvar permissões:', insertError);
            throw insertError;
        }
    }

    // Update local cache
    localStorage.setItem('sigar_permissions', JSON.stringify(permissions));
}
