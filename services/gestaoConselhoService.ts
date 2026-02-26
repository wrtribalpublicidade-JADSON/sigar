import { supabase } from './supabase';

// ==========================================
// INSTRUMENTAIS DE GESTÃO
// ==========================================

// 1. Ciclo de Reuniões
export const igCicloReunioesService = {
    async getAll(escolaId?: string) {
        let query = supabase.from('ig_ciclo_reunioes').select('*').order('data_reuniao', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
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
    async getAll(escolaId?: string) {
        let query = supabase.from('ig_plano_formacao').select('*').order('data_formacao', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
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
    async getAll(escolaId?: string) {
        let query = supabase.from('ig_plano_acao').select('*').order('prazo', { ascending: true });
        if (escolaId) query = query.eq('escola_id', escolaId);
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
    async getAll(escolaId?: string) {
        let query = supabase.from('ig_proposta_pedagogica').select('*').order('created_at', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
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
    async getAll(escolaId?: string) {
        let query = supabase.from('ig_acompanhamento_sala').select('*').order('data_observacao', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
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
    }
};

// ==========================================
// CONSELHO DE CLASSE
// ==========================================

// 6. Reuniao Estudantil
export const ccReuniaoEstudantilService = {
    async getAll(escolaId?: string, turmaId?: string) {
        let query = supabase.from('cc_reuniao_estudantil').select('*').order('created_at', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        if (turmaId) query = query.eq('turma_id', turmaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(reuniao: any) {
        if (reuniao.id && reuniao.id.length > 20) {
            const { data, error } = await supabase.from('cc_reuniao_estudantil').update(reuniao).eq('id', reuniao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newReuniao } = reuniao;
            const { data, error } = await supabase.from('cc_reuniao_estudantil').insert(newReuniao).select().single();
            if (error) throw error;
            return data;
        }
    }
};

// 7. Avaliacao Docente
export const ccAvaliacaoDocenteService = {
    async getAll(escolaId?: string, turmaId?: string, periodo?: string) {
        let query = supabase.from('cc_avaliacao_docente').select('*').order('nome_estudante', { ascending: true });
        if (escolaId) query = query.eq('escola_id', escolaId);
        if (turmaId) query = query.eq('turma_id', turmaId);
        if (periodo) query = query.eq('periodo_letivo', periodo);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(avaliacao: any) {
        if (avaliacao.id && avaliacao.id.length > 20) {
            const { data, error } = await supabase.from('cc_avaliacao_docente').update(avaliacao).eq('id', avaliacao.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAvaliacao } = avaliacao;
            const { data, error } = await supabase.from('cc_avaliacao_docente').insert(newAvaliacao).select().single();
            if (error) throw error;
            return data;
        }
    }
};

// 8. Acompanhamento Docente
export const ccAcompanhamentoDocenteService = {
    async getAll(escolaId?: string) {
        let query = supabase.from('cc_acompanhamento_docente').select('*').order('data_registro', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(acompanhamento: any) {
        if (acompanhamento.id && acompanhamento.id.length > 20) {
            const { data, error } = await supabase.from('cc_acompanhamento_docente').update(acompanhamento).eq('id', acompanhamento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newAcompanhamento } = acompanhamento;
            const { data, error } = await supabase.from('cc_acompanhamento_docente').insert(newAcompanhamento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('cc_acompanhamento_docente').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// 9. Encaminhamentos
export const ccEncaminhamentosService = {
    async getAll(escolaId?: string) {
        let query = supabase.from('cc_encaminhamentos_intervencoes').select('*').order('data_registro', { ascending: false });
        if (escolaId) query = query.eq('escola_id', escolaId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async save(encaminhamento: any) {
        if (encaminhamento.id && encaminhamento.id.length > 20) {
            const { data, error } = await supabase.from('cc_encaminhamentos_intervencoes').update(encaminhamento).eq('id', encaminhamento.id).select().single();
            if (error) throw error;
            return data;
        } else {
            const { id, ...newEncaminhamento } = encaminhamento;
            const { data, error } = await supabase.from('cc_encaminhamentos_intervencoes').insert(newEncaminhamento).select().single();
            if (error) throw error;
            return data;
        }
    },

    async delete(id: string) {
        const { error } = await supabase.from('cc_encaminhamentos_intervencoes').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
