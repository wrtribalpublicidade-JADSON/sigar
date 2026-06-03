import { supabase } from './supabase';

export interface TurmaComp {
    id: string;
    nome: string;
    escola_id: string;
    created_at: string;
    alunos_count?: number;
    atividades_count?: number;
}

export interface Student {
    id: number;
    nome: string;
    turma: string;
    escola: string;
    anoSerie: string;
    etapa: string;
    status: 'Ativo' | 'Inativo';
}

export const turmaCompService = {
    async getTurmas(escolaIds?: string[]): Promise<TurmaComp[]> {
        let query = supabase
            .from('turmas_atividades_comp')
            .select(`
                *,
                turma_comp_alunos (count),
                turma_comp_atividades (count)
            `);

        if (escolaIds && schoolIdsFilter(escolaIds)) {
            query = query.in('escola_id', escolaIds);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(t => ({
            ...t,
            alunos_count: t.turma_comp_alunos?.[0]?.count || 0,
            atividades_count: t.turma_comp_atividades?.[0]?.count || 0
        }));
    },

    async createTurma(nome: string, escolaId: string): Promise<TurmaComp> {
        const { data, error } = await supabase
            .from('turmas_atividades_comp')
            .insert({ nome, escola_id: escolaId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTurma(id: string): Promise<void> {
        // First get linked activities and students to delete records from atividade_alunos
        const [alunosRes, atividadesRes] = await Promise.all([
            supabase.from('turma_comp_alunos').select('aluno_id').eq('turma_comp_id', id),
            supabase.from('turma_comp_atividades').select('atividade_id').eq('turma_comp_id', id)
        ]);

        const studentIds = (alunosRes.data || []).map(a => a.aluno_id);
        const activityIds = (atividadesRes.data || []).map(a => a.atividade_id);

        if (studentIds.length > 0 && activityIds.length > 0) {
            await supabase
                .from('atividade_alunos')
                .delete()
                .in('aluno_id', studentIds)
                .in('atividade_id', activityIds);
        }

        const { error } = await supabase
            .from('turmas_atividades_comp')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getTurmaDetails(id: string): Promise<{ students: Student[], activitiesIds: string[] }> {
        // Fetch linked students and activities
        const [alunosLinkRes, atividadesLinkRes] = await Promise.all([
            supabase.from('turma_comp_alunos').select('aluno_id').eq('turma_comp_id', id),
            supabase.from('turma_comp_atividades').select('atividade_id').eq('turma_comp_id', id)
        ]);

        if (alunosLinkRes.error) throw alunosLinkRes.error;
        if (atividadesLinkRes.error) throw atividadesLinkRes.error;

        const studentIds = (alunosLinkRes.data || []).map(a => a.aluno_id);
        const activitiesIds = (atividadesLinkRes.data || []).map(a => a.atividade_id);

        if (studentIds.length === 0) {
            return { students: [], activitiesIds };
        }

        // Fetch student details
        const [alunosRes, turmasRes, escolasRes] = await Promise.all([
            supabase.from('alunos').select('*').in('id', studentIds),
            supabase.from('turmas').select('*'),
            supabase.from('escolas').select('id, nome')
        ]);

        if (alunosRes.error) throw alunosRes.error;

        const turmasMap = new Map((turmasRes.data || []).map(t => [t.id, t]));
        const escolasMap = new Map((escolasRes.data || []).map(e => [e.id, e]));

        const students = (alunosRes.data || []).map(al => {
            const t = turmasMap.get(al.class_id);
            const e = escolasMap.get(al.escola_id);

            return {
                id: al.id,
                nome: al.name || 'Sem nome',
                turma: t?.name || '-',
                escola: e?.nome || '-',
                anoSerie: t ? `${t.year || '-'} - ${t.name || '-'}` : '-',
                etapa: al.stage || '-',
                status: al.status === 'active' ? 'Ativo' : 'Inativo' as any
            };
        });

        return { students, activitiesIds };
    },

    async linkActivitiesToTurma(turmaId: string, activitiesIds: string[]): Promise<void> {
        if (activitiesIds.length > 5) {
            throw new Error('Uma turma pode ser vinculada a no máximo 5 atividades.');
        }

        // Get currently linked activities
        const { data: currentLinks, error: linkErr } = await supabase
            .from('turma_comp_atividades')
            .select('atividade_id')
            .eq('turma_comp_id', turmaId);

        if (linkErr) throw linkErr;

        const currentIds = (currentLinks || []).map(l => l.atividade_id);

        const toAdd = activitiesIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !activitiesIds.includes(id));

        // Get students in this turma
        const { data: students, error: studErr } = await supabase
            .from('turma_comp_alunos')
            .select('aluno_id')
            .eq('turma_comp_id', turmaId);

        if (studErr) throw studErr;

        const studentIds = (students || []).map(s => s.aluno_id);

        // Sync db links for turma_comp_atividades
        if (toRemove.length > 0) {
            await supabase
                .from('turma_comp_atividades')
                .delete()
                .eq('turma_comp_id', turmaId)
                .in('atividade_id', toRemove);

            // Sync unenroll in activity_alunos
            if (studentIds.length > 0) {
                await supabase
                    .from('atividade_alunos')
                    .delete()
                    .in('aluno_id', studentIds)
                    .in('atividade_id', toRemove);
            }
        }

        if (toAdd.length > 0) {
            const addPayload = toAdd.map(aid => ({
                turma_comp_id: turmaId,
                atividade_id: aid
            }));

            const { error: insErr } = await supabase
                .from('turma_comp_atividades')
                .insert(addPayload);

            if (insErr) throw insErr;

            // Sync enroll in activity_alunos
            if (studentIds.length > 0) {
                const enrollPayload: any[] = [];
                studentIds.forEach(sid => {
                    toAdd.forEach(aid => {
                        enrollPayload.push({
                            aluno_id: sid,
                            atividade_id: aid
                        });
                    });
                });

                // Use upsert to avoid duplicate errors
                await supabase
                    .from('atividade_alunos')
                    .upsert(enrollPayload, { onConflict: 'aluno_id, atividade_id' });
            }
        }
    },

    async addStudentToTurma(turmaId: string, alunoId: number): Promise<void> {
        // Insert student link to class
        const { error: insErr } = await supabase
            .from('turma_comp_alunos')
            .insert({ turma_comp_id: turmaId, aluno_id: alunoId });

        if (insErr) throw insErr;

        // Get activities linked to this class
        const { data: activities, error: actErr } = await supabase
            .from('turma_comp_atividades')
            .select('atividade_id')
            .eq('turma_comp_id', turmaId);

        if (actErr) throw actErr;

        const activityIds = (activities || []).map(a => a.atividade_id);

        if (activityIds.length > 0) {
            const enrollPayload = activityIds.map(aid => ({
                aluno_id: alunoId,
                atividade_id: aid
            }));

            // Sync in activity_alunos
            await supabase
                .from('atividade_alunos')
                .upsert(enrollPayload, { onConflict: 'aluno_id, atividade_id' });
        }
    },

    async removeStudentFromTurma(turmaId: string, alunoId: number): Promise<void> {
        // Delete student link to class
        const { error: delErr } = await supabase
            .from('turma_comp_alunos')
            .delete()
            .match({ turma_comp_id: turmaId, aluno_id: alunoId });

        if (delErr) throw delErr;

        // Get activities linked to this class
        const { data: activities, error: actErr } = await supabase
            .from('turma_comp_atividades')
            .select('atividade_id')
            .eq('turma_comp_id', turmaId);

        if (actErr) throw actErr;

        const activityIds = (activities || []).map(a => a.atividade_id);

        if (activityIds.length > 0) {
            // Sync remove in activity_alunos
            await supabase
                .from('atividade_alunos')
                .delete()
                .eq('aluno_id', alunoId)
                .in('atividade_id', activityIds);
        }
    }
};

function schoolIdsFilter(escolaIds?: string[]): boolean {
    return !!(escolaIds && escolaIds.length > 0);
}
