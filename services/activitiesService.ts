import { supabase } from './supabase';

export interface Atividade {
    id: string;
    nome: string;
    categoria: string;
    unidadeEscolar: string;
    escola_id?: string;
    instrutor: string;
    vagas: number;
    inscritos: number;
    diasSemana: string[];
    horarioInicio: string;
    horarioFim: string;
    sala: string;
    cargaHoraria: string;
    publicoAlvo: string;
    objetivos: string;
    materiais: string;
    status: 'Ativa' | 'Encerrada' | 'Planejada';
}

export interface AtividadeLog {
    id: string;
    atividade_id: string;
    data: string;
    conteudo: string;
    instrutor: string;
}

export interface AtividadePresenca {
    aluno_id: number;
    data: string;
    presente: boolean;
}

export const activitiesService = {
    async getAtividades(escolaIds?: string[]): Promise<Atividade[]> {
        let query = supabase
            .from('atividades_complementares')
            .select(`
                *,
                atividade_alunos (count)
            `);

        if (escolaIds && escolaIds.length > 0) {
            query = query.in('escola_id', escolaIds);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(atv => ({
            ...atv,
            unidadeEscolar: atv.unidade_escolar,
            diasSemana: atv.dias_semana,
            horarioInicio: atv.horario_inicio,
            horarioFim: atv.horario_fim,
            cargaHoraria: atv.carga_horaria,
            publicoAlvo: atv.publico_alvo,
            inscritos: atv.atividade_alunos?.[0]?.count || 0
        }));
    },

    async saveAtividade(atv: Partial<Atividade>): Promise<Atividade> {
        const payload = {
            nome: atv.nome,
            categoria: atv.categoria,
            unidade_escolar: atv.unidadeEscolar,
            escola_id: atv.escola_id,
            instrutor: atv.instrutor,
            vagas: atv.vagas,
            dias_semana: atv.diasSemana,
            horario_inicio: atv.horarioInicio,
            horario_fim: atv.horarioFim,
            sala: atv.sala,
            carga_horaria: atv.cargaHoraria,
            publico_alvo: atv.publicoAlvo,
            objetivos: atv.objetivos,
            materiais: atv.materiais,
            status: atv.status
        };

        if (atv.id) {
            const { data, error } = await supabase
                .from('atividades_complementares')
                .update(payload)
                .eq('id', atv.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('atividades_complementares')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    async deleteAtividade(id: string): Promise<void> {
        const { error } = await supabase
            .from('atividades_complementares')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async enrollStudent(atividadeId: string, alunoId: number): Promise<void> {
        const { error } = await supabase
            .from('atividade_alunos')
            .insert({ atividade_id: atividadeId, aluno_id: alunoId });

        if (error) throw error;
    },

    async unenrollStudent(atividadeId: string, alunoId: number): Promise<void> {
        const { error } = await supabase
            .from('atividade_alunos')
            .delete()
            .match({ atividade_id: atividadeId, aluno_id: alunoId });

        if (error) throw error;
    },

    async getEnrolledStudents(atividadeId: string): Promise<any[]> {
        // Fetch activity links
        const { data: links, error: lError } = await supabase
            .from('atividade_alunos')
            .select('aluno_id')
            .eq('atividade_id', atividadeId);

        if (lError) throw lError;
        if (!links || links.length === 0) return [];

        const studentIds = links.map(l => l.aluno_id);

        // Fetch students, classes and schools separately for robustness
        const [alunosRes, turmasRes, escolasRes] = await Promise.all([
            supabase.from('alunos').select('*').in('id', studentIds),
            supabase.from('turmas').select('id, name, year'),
            supabase.from('escolas').select('id, name')
        ]);

        if (alunosRes.error) throw alunosRes.error;

        const turmasMap = new Map((turmasRes.data || []).map(t => [t.id, t]));
        const escolasMap = new Map((escolasRes.data || []).map(e => [e.id, e]));

        return (alunosRes.data || []).map(al => {
            const t = turmasMap.get(al.class_id);
            const e = escolasMap.get(al.escola_id);

            return {
                id: al.id,
                nome: al.name || 'Sem nome',
                turma: t?.name || '-',
                escola: e?.name || '-',
                anoSerie: t?.year || al.stage || '-',
                status: al.status === 'active' ? 'Ativo' : 'Inativo'
            };
        });
    },

    async getAttendanceStats(atividadeId: string): Promise<Record<number, number>> {
        const { data, error } = await supabase
            .from('atividade_presencas')
            .select('aluno_id, presente')
            .eq('atividade_id', atividadeId);
        
        if (error) throw error;
        if (!data || data.length === 0) return {};

        const stats: Record<number, { total: number, present: number }> = {};
        
        data.forEach(reg => {
            if (!stats[reg.aluno_id]) stats[reg.aluno_id] = { total: 0, present: 0 };
            stats[reg.aluno_id].total++;
            if (reg.presente) stats[reg.aluno_id].present++;
        });

        const result: Record<number, number> = {};
        Object.keys(stats).forEach(id => {
            const s = stats[Number(id)];
            result[Number(id)] = Math.round((s.present / s.total) * 100);
        });

        return result;
    },

    async saveAttendance(atividadeId: string, data: string, attendance: { aluno_id: number, presente: boolean }[]): Promise<void> {
        const records = attendance.map(a => ({
            atividade_id: atividadeId,
            aluno_id: a.aluno_id,
            data,
            presente: a.presente
        }));

        const { error } = await supabase
            .from('atividade_presencas')
            .upsert(records, { onConflict: 'atividade_id, aluno_id, data' });

        if (error) throw error;
    },

    async getAttendance(atividadeId: string, data: string): Promise<AtividadePresenca[]> {
        const { data: res, error } = await supabase
            .from('atividade_presencas')
            .select('aluno_id, data, presente')
            .match({ atividade_id: atividadeId, data });

        if (error) throw error;
        return res || [];
    },

    async saveLog(log: Omit<AtividadeLog, 'id'>): Promise<AtividadeLog> {
        const { data, error } = await supabase
            .from('atividade_logs')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getLogs(atividadeId: string): Promise<AtividadeLog[]> {
        const { data, error } = await supabase
            .from('atividade_logs')
            .select('*')
            .eq('atividade_id', atividadeId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
