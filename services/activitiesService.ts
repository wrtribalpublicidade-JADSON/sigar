import { supabase } from './supabase';
import { logAudit } from './logService';

export interface Atividade {
    id: string;
    nome: string;
    categoria: string;
    subarea?: string;
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
    created_at?: string;
}

export interface AtividadeLog {
    id: string;
    atividade_id: string;
    data: string;
    conteudo: string;
    instrutor: string;
    periodo?: string;
    status?: 'Em Análise' | 'Aprovado' | 'Devolvido para Correção';
    observacao_coordenacao?: string;
    avaliado_por?: string;
    avaliado_em?: string;
    updated_at?: string;
    updated_by?: string;
    created_at?: string;
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

        const atvs = (data || []).map(atv => ({
            ...atv,
            unidadeEscolar: atv.unidade_escolar,
            diasSemana: atv.dias_semana,
            horarioInicio: atv.horario_inicio,
            horarioFim: atv.horario_fim,
            cargaHoraria: atv.carga_horaria,
            publicoAlvo: atv.publico_alvo,
            inscritos: atv.atividade_alunos?.[0]?.count || 0
        }));

        const sorted = [...atvs].sort((a, b) => {
            const dateA = a.created_at || a.id;
            const dateB = b.created_at || b.id;
            return String(dateA).localeCompare(String(dateB));
        });

        const getBaseName = (name: string): string => {
            if (!name) return '';
            return name.replace(/\s*-\s*TURMA\s*\d+/i, '').trim();
        };

        const counters: Record<string, number> = {};

        const mapped = sorted.map(atv => {
            const escolaId = atv.escola_id || 'unknown';
            const baseName = getBaseName(atv.nome).toUpperCase();
            const key = `${escolaId}_${baseName}`;
            
            counters[key] = (counters[key] || 0) + 1;
            const count = counters[key];
            const suffix = `TURMA ${String(count).padStart(2, '0')}`;
            
            return {
                ...atv,
                nome: `${baseName} - ${suffix}`
            };
        });

        const getTurmaNumber = (name: string): number => {
            const match = name.match(/-\s*TURMA\s*(\d+)/i);
            return match ? parseInt(match[1], 10) : 9999;
        };

        return mapped.sort((a, b) => {
            const numA = getTurmaNumber(a.nome);
            const numB = getTurmaNumber(b.nome);
            if (numA !== numB) {
                return numA - numB;
            }
            
            // Secondary sort by name
            const nameComp = a.nome.localeCompare(b.nome);
            if (nameComp !== 0) return nameComp;

            // Tertiary sort by creation date descending
            const dateA = a.created_at || a.id;
            const dateB = b.created_at || b.id;
            return String(dateB).localeCompare(String(dateA));
        });
    },

    async saveAtividade(atv: Partial<Atividade>): Promise<Atividade> {
        const payload = {
            nome: atv.nome,
            categoria: atv.categoria,
            subarea: atv.subarea,
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
            await logAudit('UPDATE', 'ATIVIDADE_COMPLEMENTAR', atv.id, {
                nome: atv.nome,
                categoria: atv.categoria,
                escola: atv.unidadeEscolar,
                instrutor: atv.instrutor
            });
            return data;
        } else {
            const { data, error } = await supabase
                .from('atividades_complementares')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await logAudit('CREATE', 'ATIVIDADE_COMPLEMENTAR', data.id, {
                nome: atv.nome,
                categoria: atv.categoria,
                escola: atv.unidadeEscolar,
                instrutor: atv.instrutor
            });
            return data;
        }
    },

    async deleteAtividade(id: string): Promise<void> {
        const { error } = await supabase
            .from('atividades_complementares')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await logAudit('DELETE', 'ATIVIDADE_COMPLEMENTAR', id, {});
    },

    async enrollStudent(atividadeId: string, alunoId: number): Promise<void> {
        const { error } = await supabase
            .from('atividade_alunos')
            .insert({ atividade_id: atividadeId, aluno_id: alunoId });

        if (error) throw error;
        await logAudit('CREATE', 'ATIVIDADE_COMPLEMENTAR_MATRICULA', atividadeId, { alunoId });
    },

    async unenrollStudent(atividadeId: string, alunoId: number): Promise<void> {
        const { error } = await supabase
            .from('atividade_alunos')
            .delete()
            .match({ atividade_id: atividadeId, aluno_id: alunoId });

        if (error) throw error;
        await logAudit('DELETE', 'ATIVIDADE_COMPLEMENTAR_MATRICULA', atividadeId, { alunoId });
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
            supabase.from('turmas').select('*'),
            supabase.from('escolas').select('id, nome')
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
                dataNascimento: al.birth_date || null,
                turma: t?.name || '-',
                escola: e?.nome || '-',
                anoSerie: t ? `${t.year || '-'} - ${t.name || '-'}` : '-',
                etapa: al.stage || '-',
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

        const presentesCount = attendance.filter(a => a.presente).length;
        await logAudit('CREATE', 'ATIVIDADE_COMPLEMENTAR_FREQUENCIA', atividadeId, {
            data,
            totalAlunos: attendance.length,
            presentes: presentesCount
        });
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

    async updateLog(id: string, log: Partial<Omit<AtividadeLog, 'id'>>): Promise<AtividadeLog> {
        const { data, error } = await supabase
            .from('atividade_logs')
            .update(log)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteLog(id: string): Promise<void> {
        const { error } = await supabase
            .from('atividade_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
