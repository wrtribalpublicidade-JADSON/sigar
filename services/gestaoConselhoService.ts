import { supabase } from './supabase';
import { TURMAS_MOCK, ALUNOS_MOCK, REUNIOES_IG_MOCK, METAS_ACAO_IG_MOCK, FORMACAO_IG_MOCK, AVALIACOES_DOCENTE_MOCK, AVALIACOES_INFANTIL_MOCK, PPP_MOCK, ACOMP_SALA_MOCK, CALENDARIO_MOCK } from '../constants';

const isMockId = (id: any): boolean => {
    if (!id) return false;
    if (Array.isArray(id)) return id.some(i => isMockId(i));
    return typeof id === 'string' && /^\d+$/.test(id);
};

const isValidUUID = (id: any): boolean => {
    if (!id) return false;
    // Allow both numeric strings/numbers and UUIDs
    return typeof id === 'string' || typeof id === 'number';
};

// ==========================================
// INSTRUMENTAIS DE GESTÃO
// ==========================================

// 1. Ciclo de Reuniões
export const igCicloReunioesService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return REUNIOES_IG_MOCK.filter(r => ids.includes(r.schoolId));
        }
        let query = supabase.from('ig_ciclo_reunioes').select('*').order('data_reuniao', { ascending: false });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(reuniao: any) {
        if (reuniao.id && reuniao.id.length > 20) { // Assuming generated UUID
            const { data, error } = await supabase.from('ig_ciclo_reunioes').update(reuniao).eq('id', reuniao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newReuniao } = reuniao;
            const { data, error } = await supabase.from('ig_ciclo_reunioes').insert(newReuniao).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_ciclo_reunioes').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 2. Plano de Formação
export const igPlanoFormacaoService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return FORMACAO_IG_MOCK.filter(f => ids.includes(f.escola_id));
        }
        let query = supabase.from('ig_plano_formacao').select('*').order('data_formacao', { ascending: false });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(formacao: any) {
        if (formacao.id && formacao.id.length > 20) {
            const { data, error } = await supabase.from('ig_plano_formacao').update(formacao).eq('id', formacao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newFormacao } = formacao;
            const { data, error } = await supabase.from('ig_plano_formacao').insert(newFormacao).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_plano_formacao').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 3. Plano de Ação
export const igPlanoAcaoService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return METAS_ACAO_IG_MOCK.filter(m => ids.includes(m.escola_id));
        }
        let query = supabase.from('ig_plano_acao').select('*').order('prazo', { ascending: true });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(acao: any) {
        if (acao.id && acao.id.length > 20) {
            const { data, error } = await supabase.from('ig_plano_acao').update(acao).eq('id', acao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAcao } = acao;
            const { data, error } = await supabase.from('ig_plano_acao').insert(newAcao).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_plano_acao').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 4. Proposta Pedagógica
export const igPppService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return PPP_MOCK.filter(p => ids.includes(p.escola_id));
        }
        let query = supabase.from('ig_proposta_pedagogica').select('*').order('created_at', { ascending: false });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(ppp: any) {
        if (ppp.id && ppp.id.length > 20) {
            const { data, error } = await supabase.from('ig_proposta_pedagogica').update(ppp).eq('id', ppp.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newPpp } = ppp;
            const { data, error } = await supabase.from('ig_proposta_pedagogica').insert(newPpp).select().single();
            if (error) throw error;
            return data;
        }
    },

    async updateStatus(id: string, status: string) {
        const { data, error } = await supabase.from('ig_proposta_pedagogica').update({ status }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_proposta_pedagogica').delete().eq('id', id);
        if (error) throw error;
    }
};

// 5. Acompanhamento Sala
export const igAcompanhamentoSalaService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return ACOMP_SALA_MOCK.filter(a => ids.includes(a.escola_id));
        }
        let query = supabase.from('ig_acompanhamento_sala').select('*').order('data_observacao', { ascending: false });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(acompanhamento: any) {
        if (acompanhamento.id && acompanhamento.id.length > 20) {
            const { data, error } = await supabase.from('ig_acompanhamento_sala').update(acompanhamento).eq('id', acompanhamento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAcompanhamento } = acompanhamento;
            const { data, error } = await supabase.from('ig_acompanhamento_sala').insert(newAcompanhamento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async remove(id: string) {
        const { error } = await supabase.from('ig_acompanhamento_sala').delete().eq('id', id);
        if (error) throw error;
    }
};

// 6. Calendário Oficial (SEMED)
export const igCalendarioOficialService = {
    async getAll(anoLetivo?: string) {
        let query = supabase.from('ig_calendario_oficial').select('*').order('data', { ascending: true });
        if (anoLetivo) query = query.eq('ano_letivo', anoLetivo);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(evento: any) {
        if (evento.id && evento.id.length > 20) {
            const { data, error } = await supabase.from('ig_calendario_oficial').update(evento).eq('id', evento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newEvento } = evento;
            const { data, error } = await supabase.from('ig_calendario_oficial').insert(newEvento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_calendario_oficial').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 7. Calendário Interno (Escola)
export const igCalendarioInternoService = {
    async getAll(escolaId?: string | string[]) {
        if (escolaId && isMockId(escolaId)) {
            const ids = Array.isArray(escolaId) ? escolaId : [escolaId];
            return CALENDARIO_MOCK.filter(c => ids.includes(c.escola_id));
        }
        let query = supabase.from('ig_calendario_interno').select('*').order('data', { ascending: true });

        if (escolaId) {
            if (Array.isArray(escolaId)) {
                query = query.in('escola_id', escolaId);
            } else {
                query = query.eq('escola_id', escolaId);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(evento: any) {
        if (evento.id && evento.id.length > 20) {
            const { data, error } = await supabase.from('ig_calendario_interno').update(evento).eq('id', evento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newEvento } = evento;
            const { data, error } = await supabase.from('ig_calendario_interno').insert(newEvento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('ig_calendario_interno').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ==========================================
// CONSELHO DE CLASSE
// ==========================================

export type EducationalStage = 'fundamental' | 'infantil';

const getTableName = (base: string, stage: EducationalStage) => {
    const prefix = stage === 'fundamental' ? 'cc_f_' : 'cc_i_';
    // Mappings for the SUPERVISIONAR project (tymdfeldkwszealrnhcz)
    const tableMap: Record<string, string> = {
        'avaliacao': stage === 'fundamental' ? 'cc_f_avaliacao' : 'cc_i_avaliacoes',
        'acompanhamento': prefix + 'acompanhamento',
        'encaminhamento': prefix + 'encaminhamentos_intervencoes',
        'status_etapa': prefix + 'status_etapa',
        'solicitacoes': prefix + 'solicitacoes',
        'reuniao': prefix + 'reuniao_estudantil'
    };
    return tableMap[base] || base;
};

// 6. Reuniao Estudantil
export const ccReuniaoEstudantilService = {
    async getAll(escolaId?: string, turmaId?: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('reuniao', stage);
        let query = supabase.from(table).select('*').order('created_at', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        if (turmaId) query = query.eq('turma_id', turmaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(reuniao: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('reuniao', stage);
        if (reuniao.id && reuniao.id.length > 20) {
            const { data, error } = await supabase.from(table).update(reuniao).eq('id', reuniao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newReuniao } = reuniao;
            const { data, error } = await supabase.from(table).insert(newReuniao).select().single();
            if (error) throw error;
            return data;
        }
    }
};

// 7. Avaliacao Docente
export const ccAvaliacaoDocenteService = {
    async getAll(escolaId?: string, turmaId?: string, periodo?: string, stage: EducationalStage = 'fundamental', componenteCurricular?: string) {
        if (escolaId && isMockId(escolaId)) {
             return AVALIACOES_DOCENTE_MOCK.filter(a => 
                a.escola_id === escolaId && 
                (!turmaId || a.turma_id === turmaId) &&
                (!periodo || a.periodo_letivo === periodo) &&
                (!componenteCurricular || a.componente_curricular === componenteCurricular)
             );
        }
        const table = getTableName('avaliacao', stage);
        let query = supabase.from(table).select('*').order('nome_estudante', { ascending: true });

        if (escolaId) query = query.eq('escola_id', escolaId);
        if (turmaId) query = query.eq('turma_id', turmaId);
        if (periodo) query = query.eq('periodo_letivo', periodo);
        if (componenteCurricular && stage === 'fundamental') query = query.eq('componente_curricular', componenteCurricular);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(avaliacao: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('avaliacao', stage);
        if (avaliacao.id) {
            const { data, error } = await supabase.from(table).update(avaliacao).eq('id', avaliacao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAvaliacao } = avaliacao;
            const { data, error } = await supabase.from(table).insert(newAvaliacao).select().single();
            if (error) throw error;
            return data;
        }
    },

    async deleteByEstudante(escolaId: string, turmaId: string, estudanteId: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('avaliacao', stage);
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('escola_id', escolaId)
            .eq('turma_id', turmaId)
            .eq('estudante_id', estudanteId);

        if (error) throw error;
        return true;
    },

    async saveMany(avaliacoes: any[], stage: EducationalStage = 'fundamental') {
        const table = getTableName('avaliacao', stage);
        const { data, error } = await supabase
            .from(table)
            .upsert(avaliacoes, { 
                onConflict: stage === 'fundamental' ? 'escola_id,turma_id,estudante_id,periodo_letivo,componente_curricular' : 'student_id,period,skill_code'
            })
            .select();

        if (error) throw error;
        return data;
    }
};

// 7.1 Avaliacao Infantil (Campos de Experiência)
// Now using cc_i_avaliacao instead of avaliacoes_infantil
export const ccAvaliacaoInfantilService = {
    async getAllByTurma(classId: string, period?: number) {
        // Load students of this class first
        const { data: students, error: sError } = await supabase
            .from('alunos')
            .select('id')
            .eq('class_id', classId);
        
        if (sError) throw sError;
        if (!students || students.length === 0) return [];

        const studentIds = students.map(s => s.id);
        return this.getByStudents(studentIds, period);
    },

    async getByStudents(studentIds: any[], period?: number, context?: { escola_id?: string; turma_id?: string; campo_experiencia?: string }) {
        if (studentIds.some(id => typeof id === 'string' && id.startsWith('a'))) { // Mock Student IDs start with 'a'
            return AVALIACOES_INFANTIL_MOCK.filter(a => 
                studentIds.includes(a.student_id) && 
                (!period || a.period === period)
            );
        }
        
        const table = getTableName('avaliacao', 'infantil');
        let query = supabase.from(table).select('*').in('estudante_id', studentIds);

        if (period) query = query.eq('bimestre', period);
        if (context?.escola_id) query = query.eq('escola_id', context.escola_id);
        if (context?.turma_id) query = query.eq('turma_id', context.turma_id);
        if (context?.campo_experiencia) query = query.eq('campo_experiencia', context.campo_experiencia.toUpperCase());

        const { data, error } = await query;
        if (error) throw error;
        
        // Map fields back to the format expected by the UI if necessary
        return (data || []).map(item => ({
            ...item,
            student_id: item.estudante_id,
            period: item.bimestre,
            status: item.conceito
        }));
    },

    async save(evaluation: any) {
        const table = getTableName('avaliacao', 'infantil');
        
        const dbEvaluation = {
            escola_id: isValidUUID(evaluation.escola_id) ? evaluation.escola_id : null,
            responsavel_id: isValidUUID(evaluation.responsavel_id) ? evaluation.responsavel_id : null,
            turma_id: isValidUUID(evaluation.turma_id) ? evaluation.turma_id : null,
            campo_experiencia: (evaluation.campo_experiencia || '').toUpperCase(),
            bimestre: evaluation.bimestre || evaluation.period,
            estudante_id: evaluation.estudante_id || evaluation.student_id,
            skill_code: evaluation.skill_code,
            conceito: evaluation.conceito || evaluation.status,
            resultado: evaluation.resultado,
            observacao: evaluation.observacao,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(table)
            .upsert(dbEvaluation, { 
                onConflict: 'estudante_id,bimestre,campo_experiencia,skill_code' 
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            student_id: data.estudante_id,
            period: data.bimestre,
            status: data.conceito
        };
    },

    async saveMany(evaluations: any[]) {
        const table = getTableName('avaliacao', 'infantil');
        
        const dbEvaluations = evaluations.map(e => ({
            escola_id: isValidUUID(e.escola_id) ? e.escola_id : null,
            responsavel_id: isValidUUID(e.responsavel_id) ? e.responsavel_id : null,
            turma_id: isValidUUID(e.turma_id) ? e.turma_id : null,
            campo_experiencia: (e.campo_experiencia || '').toUpperCase(),
            bimestre: e.bimestre || e.period,
            estudante_id: e.estudante_id || e.student_id,
            skill_code: e.skill_code,
            conceito: e.conceito || e.status,
            resultado: e.resultado,
            observacao: e.observacao,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from(table)
            .upsert(dbEvaluations, { 
                onConflict: 'estudante_id,bimestre,campo_experiencia,skill_code' 
            })
            .select();

        if (error) throw error;
        return (data || []).map((item: any) => ({
            ...item,
            student_id: item.estudante_id,
            period: item.bimestre,
            status: item.conceito
        }));
    }
};

// 7.1.1 Turma Service
export const ccTurmaService = {
    async getBySchool(schoolId: string) {
        if (isMockId(schoolId)) {
            return TURMAS_MOCK.filter(t => t.schoolId === schoolId);
        }
        const { data, error } = await supabase
            .from('turmas')
            .select('*')
            .eq('school_id', schoolId)
            .order('stage', { ascending: true });


        if (error) throw error;
        // Map DB columns to TurmaData format
        return (data || []).map((t: any) => ({
            id: t.id,
            etapa: t.stage,
            anoSerie: t.year,
            identificacao: t.name,
            turno: t.shift,
            tipo: t.modality || 'REGULAR',
            escolaId: t.school_id
        }));
    },

    async add(turma: { etapa: string; anoSerie: string; identificacao: string; turno: string; tipo: string; schoolId: string }) {
        const { data, error } = await supabase
            .from('turmas')
            .insert({
                stage: turma.etapa,
                year: turma.anoSerie,
                name: turma.identificacao,
                shift: turma.turno,
                modality: turma.tipo,
                school_id: turma.schoolId
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            etapa: data.stage,
            anoSerie: data.year,
            identificacao: data.name,
            turno: data.shift,
            tipo: data.modality || 'REGULAR'
        };
    },

    async update(id: string, turma: { etapa: string; anoSerie: string; identificacao: string; turno: string; tipo: string; escolaId?: string; schoolId?: string }) {
        const payload: any = {
            stage: turma.etapa,
            year: turma.anoSerie,
            name: turma.identificacao,
            shift: turma.turno,
            modality: turma.tipo
        };
        if (turma.schoolId || turma.escolaId) {
            payload.school_id = turma.schoolId || turma.escolaId;
        }

        const { data, error } = await supabase
            .from('turmas')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            etapa: data.stage,
            anoSerie: data.year,
            identificacao: data.name,
            turno: data.shift,
            tipo: data.modality || 'REGULAR'
        };
    },

    async remove(id: string) {
        const { error } = await supabase.from('turmas').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 7.2 Estudante Service
export const ccEstudanteService = {
    async getByTurma(classId: string) {
        if (classId && typeof classId === 'string' && classId.startsWith('t')) { // Mock Turma IDs start with 't'
            return ALUNOS_MOCK.filter(a => a.class_id === classId);
        }
        if (!classId) {
            console.warn('getByTurma: classId is missing');
            return [];
        }


        const { data, error } = await supabase
            .from('alunos')
            .select('*')
            .eq('class_id', classId)
            .in('status', ['active', 'Ativo'])
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async add(student: any) {
        const { data, error } = await supabase.from('alunos').insert(student).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('alunos').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async remove(id: string) {
        const { error } = await supabase.from('alunos').update({ status: 'inactive' }).eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 8. Acompanhamento Docente
export const ccAcompanhamentoDocenteService = {
    async getAll(escolaId?: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('acompanhamento', stage);
        let query = supabase.from(table).select('*').order('data_registro', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(acompanhamento: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('acompanhamento', stage);
        if (acompanhamento.id && acompanhamento.id.length > 20) {
            const { data, error } = await supabase.from(table).update(acompanhamento).eq('id', acompanhamento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAcompanhamento } = acompanhamento;
            const { data, error } = await supabase.from(table).insert(newAcompanhamento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('acompanhamento', stage);
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 9. Encaminhamentos
export const ccEncaminhamentosService = {
    async getAll(escolaId?: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('encaminhamento', stage);
        let query = supabase.from(table).select('*').order('data_registro', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(encaminhamento: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('encaminhamento', stage);
        if (encaminhamento.id && encaminhamento.id.length > 20) {
            const { data, error } = await supabase.from(table).update(encaminhamento).eq('id', encaminhamento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newEncaminhamento } = encaminhamento;
            const { data, error } = await supabase.from(table).insert(newEncaminhamento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string, stage: EducationalStage = 'fundamental') {
        const table = getTableName('encaminhamento', stage);
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 10. Status de Avaliação por Etapa e Solicitações de Desbloqueio
export const ccAvaliacaoEtapaService = {
    async getStatus(escolaId: string, turmaId: string, periodo: string, stage: EducationalStage = 'fundamental', componenteCurricular?: string) {
        const table = getTableName('status_etapa', stage);
        const requestsTable = getTableName('solicitacoes', stage);
        
        let query = supabase
            .from(table)
            .select(`*, ${requestsTable}(*)`)
            .eq('escola_id', escolaId)
            .eq('turma_id', turmaId)
            .eq('periodo', periodo);

        if (componenteCurricular && stage === 'fundamental') {
            query = query.eq('componente_curricular', componenteCurricular);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        return data;
    },

    async enviar(etapaData: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('status_etapa', stage);
        const { data, error } = await supabase
            .from(table)
            .upsert({
                ...etapaData,
                status: 'enviada',
                bloqueada: true,
                enviada_em: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarStatus(id: string, status: string, bloqueada: boolean, stage: EducationalStage = 'fundamental') {
        const table = getTableName('status_etapa', stage);
        const { data, error } = await supabase
            .from(table)
            .update({ status, bloqueada, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

export const ccSolicitacaoDesbloqueioService = {
    async solicitar(solicitacao: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('solicitacoes', stage);
        const { data, error } = await supabase
            .from(table)
            .insert({
                ...solicitacao,
                status: 'pendente',
                solicitado_em: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getTodasPendentes() {
        const { data: fundamental, error: fError } = await supabase
            .from('cc_f_solicitacoes')
            .select('*, cc_f_status_etapa(*)')
            .eq('status', 'pendente');
        
        const { data: infantil, error: iError } = await supabase
            .from('cc_i_solicitacoes')
            .select('*, cc_i_status_etapa(*)')
            .eq('status', 'pendente');

        if (fError) throw fError;
        if (iError) throw iError;

        const mappedFundamental = (fundamental || []).map(r => ({
            ...r,
            stage: 'fundamental' as EducationalStage,
            avaliacoes_etapas: r.cc_f_status_etapa
        }));
        
        const mappedInfantil = (infantil || []).map(r => ({
            ...r,
            stage: 'infantil' as EducationalStage,
            avaliacoes_etapas: r.cc_i_status_etapa
        }));

        return [...mappedFundamental, ...mappedInfantil].sort((a, b) => 
            new Date(a.solicitado_em).getTime() - new Date(b.solicitado_em).getTime()
        );
    },

    async processar(id: string, analise: any, stage: EducationalStage = 'fundamental') {
        const table = getTableName('solicitacoes', stage);
        const { data, error } = await supabase
            .from(table)
            .update({
                ...analise,
                analisado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

