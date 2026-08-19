import { supabase } from './supabase';
import { 
  AlertaPendencia, 
  AlertaPendenciaHistorico, 
  AlertasConfiguracao, 
  TipoPendenciaAlerta, 
  StatusPendenciaAlerta, 
  PrioridadePendenciaAlerta,
  Escola, 
  Coordenador,
  ViewState
} from '../types';
import { logAudit } from './logService';

const DEFAULT_CONFIG: AlertasConfiguracao = {
  prazo_padrao_dias: 5,
  dias_para_lembrete: 2,
  dias_para_escalonamento: 3,
  escalonar_para_perfil: 'Coordenador Pedagógico',
  notificar_por_email: false
};

// Helper para somar dias úteis a uma data
export const addBusinessDays = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
};

export const formatISODate = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export const getBimestreFromDate = (dateStr?: string): string => {
  if (!dateStr) return '1º Bimestre';
  const parts = dateStr.split('-');
  if (parts.length < 2) return '1º Bimestre';
  const month = parseInt(parts[1], 10);
  if (month >= 2 && month <= 4) return '1º Bimestre';
  if (month >= 5 && month <= 7) return '2º Bimestre';
  if (month >= 8 && month <= 9) return '3º Bimestre';
  if (month >= 10 && month <= 12) return '4º Bimestre';
  return '1º Bimestre';
};

export const getDaysDifference = (targetDateStr?: string): { days: number; isOverdue: boolean } => {
  if (!targetDateStr) return { days: 0, isOverdue: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0
  };
};

export interface ScanOptions {
  escolaId?: string;
  tipoPendencia?: TipoPendenciaAlerta | 'ALL';
  periodo?: string | 'ALL';
  usuarioId?: string | 'ALL';
  perfil?: string | 'ALL';
  status?: StatusPendenciaAlerta | 'ALL';
}

export const pendenciasEngineService = {
  /**
   * Obtém as configurações globais de alertas
   */
  getConfiguracoes: async (): Promise<AlertasConfiguracao> => {
    try {
      const { data, error } = await supabase
        .from('alertas_pendencias_configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error || !data) return DEFAULT_CONFIG;
      return data as AlertasConfiguracao;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  /**
   * Salva configurações de alertas
   */
  saveConfiguracoes: async (config: Partial<AlertasConfiguracao>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alertas_pendencias_configuracoes')
        .upsert(config);
      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Busca alertas ativos de um usuário (para popup no login)
   */
  getUserActiveAlerts: async (
    userEmail?: string | null,
    coordenadorId?: string | null,
    escolasIds?: string[]
  ): Promise<AlertaPendencia[]> => {
    try {
      let query = supabase
        .from('alertas_pendencias')
        .select('*')
        .in('status', ['EM_ALERTA', 'VENCIDA', 'ESCALONADA']);

      if (userEmail) {
        query = query.or(`usuario_email.eq.${userEmail},usuario_id.eq.${coordenadorId || ''}`);
      } else if (coordenadorId) {
        query = query.eq('usuario_id', coordenadorId);
      } else if (escolasIds && escolasIds.length > 0) {
        query = query.in('escola_id', escolasIds);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as AlertaPendencia[]) || [];
    } catch (e) {
      console.error('Erro ao buscar alertas ativos do usuário:', e);
      return [];
    }
  },

  /**
   * Busca histórico de ações de uma pendência
   */
  getHistorico: async (pendenciaId: string): Promise<AlertaPendenciaHistorico[]> => {
    try {
      const { data, error } = await supabase
        .from('alertas_pendencias_historico')
        .select('*')
        .eq('pendencia_id', pendenciaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as AlertaPendenciaHistorico[]) || [];
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
      return [];
    }
  },

  /**
   * Gera um alerta individual com prazo e observação
   */
  gerarAlertaIndividual: async (
    pendenciaId: string,
    prazo: string,
    observacao: string,
    prioridade: PrioridadePendenciaAlerta = 'ALTA',
    executadoPor: string = 'Administrador'
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      
      const { error: updateErr } = await supabase
        .from('alertas_pendencias')
        .update({
          status: 'EM_ALERTA',
          prazo,
          observacao_alerta: observacao,
          prioridade,
          gerado_em: now,
          gerado_por: executadoPor,
          nivel_escalonamento: 1,
          updated_at: now
        })
        .eq('id', pendenciaId);

      if (updateErr) throw updateErr;

      await supabase.from('alertas_pendencias_historico').insert([{
        pendencia_id: pendenciaId,
        acao: 'ALERTA_GERADO',
        descricao: `Alerta emitido com prazo até ${new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')}.${observacao ? ` Obs: ${observacao}` : ''}`,
        executado_por: executadoPor
      }]);

      await logAudit('UPDATE', 'GERAR_ALERTA_PENDENCIA', pendenciaId, {
        prazo,
        prioridade,
        observacao,
        executadoPor
      });

      return true;
    } catch (e) {
      console.error('Erro ao gerar alerta individual:', e);
      return false;
    }
  },

  /**
   * Gera múltiplos alertas em massa
   */
  gerarAlertasEmMassa: async (
    pendenciaIds: string[],
    prazo: string,
    observacao: string,
    prioridade: PrioridadePendenciaAlerta = 'ALTA',
    executadoPor: string = 'Administrador'
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const id of pendenciaIds) {
      const ok = await pendenciasEngineService.gerarAlertaIndividual(id, prazo, observacao, prioridade, executadoPor);
      if (ok) success++;
      else failed++;
    }

    return { success, failed };
  },

  /**
   * Resolve manualmente uma pendência
   */
  resolverPendenciaManualmente: async (
    pendenciaId: string,
    resolvidoPor: string = 'Administrador',
    motivo: string = 'Regularizado manualmente'
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('alertas_pendencias')
        .update({
          status: 'RESOLVIDA',
          resolvido_em: now,
          resolvido_por: resolvidoPor,
          updated_at: now
        })
        .eq('id', pendenciaId);

      if (error) throw error;

      await supabase.from('alertas_pendencias_historico').insert([{
        pendencia_id: pendenciaId,
        acao: 'RESOLUCAO',
        descricao: `Pendência regularizada manualmente. Motivo: ${motivo}`,
        executado_por: resolvidoPor
      }]);

      await logAudit('UPDATE', 'RESOLVER_PENDENCIA', pendenciaId, {
        resolvidoPor,
        motivo
      });

      return true;
    } catch (e) {
      console.error('Erro ao resolver pendência:', e);
      return false;
    }
  },

  /**
   * Motor Central: Executa varredura de dados operacionais otimizada com indexação em memória O(1)
   */
  scanAndSyncPendencies: async (
    escolas: Escola[],
    coordenadores: Coordenador[],
    isDemoMode: boolean = false,
    options?: ScanOptions
  ): Promise<AlertaPendencia[]> => {
    if (isDemoMode) {
      return getMockPendencias(escolas, coordenadores);
    }

    try {
      const targetEscolaId = options?.escolaId && options.escolaId !== 'ALL' ? options.escolaId : undefined;
      const targetTipo = options?.tipoPendencia && options.tipoPendencia !== 'ALL' ? options.tipoPendencia : undefined;
      const targetPeriodo = options?.periodo && options.periodo !== 'ALL' ? options.periodo : undefined;
      const targetUsuarioId = options?.usuarioId && options.usuarioId !== 'ALL' ? options.usuarioId : undefined;

      // Filtrar escopo de escolas e coordenadores
      const targetEscolas = targetEscolaId ? escolas.filter(e => e.id === targetEscolaId) : escolas;
      let targetCoordenadores = targetUsuarioId ? coordenadores.filter(c => c.id === targetUsuarioId) : coordenadores;
      if (targetEscolaId) {
        targetCoordenadores = targetCoordenadores.filter(c => c.escolasIds.includes(targetEscolaId));
      }

      // Preparar queries do Supabase direcionadas por escola
      let existingQuery = supabase.from('alertas_pendencias').select('*');
      let guiasFQuery = supabase.from('guias_aprendizagem').select('id, escola_id, turma_id, componente, periodo, status, created_by');
      let guiasIQuery = supabase.from('guias_aprendizagem_infantil').select('id, escola_id, turma_id, campo_experiencia, periodo, status, created_by');
      let aulasFQuery = supabase.from('aulas_ministradas').select('id, escola_id, turma_id, componente, periodo, data, created_by');
      let aulasIQuery = supabase.from('aulas_ministradas_infantil').select('id, escola_id, turma_id, campo_experiencia, periodo, data, created_by');
      let freqFQuery = supabase.from('frequencia_sheets').select('id, escola_id, turma_id, componente, data, created_by');
      let freqIQuery = supabase.from('frequencia_sheets_infantil').select('id, escola_id, turma_id, periodo, data, created_by');
      let notasFQuery = supabase.from('notas_sheets').select('id, escola_id, turma_id, componente, bimestre, created_by');
      let turmasQuery = supabase.from('turmas').select('id, name, year, stage, school_id');

      if (targetEscolaId) {
        existingQuery = existingQuery.eq('escola_id', targetEscolaId);
        guiasFQuery = guiasFQuery.eq('escola_id', targetEscolaId);
        guiasIQuery = guiasIQuery.eq('escola_id', targetEscolaId);
        aulasFQuery = aulasFQuery.eq('escola_id', targetEscolaId);
        aulasIQuery = aulasIQuery.eq('escola_id', targetEscolaId);
        freqFQuery = freqFQuery.eq('escola_id', targetEscolaId);
        freqIQuery = freqIQuery.eq('escola_id', targetEscolaId);
        notasFQuery = notasFQuery.eq('escola_id', targetEscolaId);
        turmasQuery = turmasQuery.eq('school_id', targetEscolaId);
      }

      // Executar todas as consultas em paralelo
      const [
        existingAlertsRes,
        guiasFRes,
        guiasIRes,
        aulasFRes,
        aulasIRes,
        frequenciaFRes,
        frequenciaIRes,
        notasFRes,
        turmasRes
      ] = await Promise.all([
        existingQuery.limit(3000),
        guiasFQuery.limit(3000),
        guiasIQuery.limit(2000),
        aulasFQuery.limit(3000),
        aulasIQuery.limit(2000),
        freqFQuery.limit(3000),
        freqIQuery.limit(2000),
        notasFQuery.limit(3000),
        turmasQuery.limit(2000)
      ]);

      const existingAlerts: AlertaPendencia[] = (existingAlertsRes.data as AlertaPendencia[]) || [];
      const guiasF = guiasFRes.data || [];
      const guiasI = guiasIRes.data || [];
      const aulasF = aulasFRes.data || [];
      const aulasI = aulasIRes.data || [];
      const freqF = frequenciaFRes.data || [];
      const freqI = frequenciaIRes.data || [];
      const notasF = notasFRes.data || [];
      const turmas = turmasRes.data || [];

      // FAST O(1) HASH INDEXES EM MEMÓRIA
      const guiasSet = new Set<string>();
      guiasF.forEach(g => {
        if (g.periodo) guiasSet.add(`${g.turma_id}|${g.componente}|${g.periodo}`);
        guiasSet.add(`${g.turma_id}|${g.componente}|1º Bimestre`);
      });

      const guiasISet = new Set<string>();
      guiasI.forEach(g => {
        if (g.periodo) guiasISet.add(`${g.turma_id}|${g.campo_experiencia || 'Educação Infantil'}|${g.periodo}`);
        guiasISet.add(`${g.turma_id}|${g.campo_experiencia || 'Educação Infantil'}|1º Bimestre`);
        guiasISet.add(`${g.turma_id}|Educação Infantil|${g.periodo || '1º Bimestre'}`);
      });

      const aulasSet = new Set<string>();
      aulasF.forEach(a => {
        const bim = a.periodo || getBimestreFromDate(a.data);
        aulasSet.add(`${a.turma_id}|${a.componente}|${bim}`);
      });

      const aulasISet = new Set<string>();
      aulasI.forEach(a => {
        const bim = a.periodo || getBimestreFromDate(a.data);
        aulasISet.add(`${a.turma_id}|${a.campo_experiencia || 'Educação Infantil'}|${bim}`);
        aulasISet.add(`${a.turma_id}|Educação Infantil|${bim}`);
      });

      const freqSet = new Set<string>();
      freqF.forEach(f => {
        const bim = getBimestreFromDate(f.data);
        freqSet.add(`${f.turma_id}|${f.componente}|${bim}`);
      });

      const freqISet = new Set<string>();
      freqI.forEach(f => {
        const bim = f.periodo || getBimestreFromDate(f.data);
        freqISet.add(`${f.turma_id}|${bim}`);
      });

      const notasSet = new Set<string>();
      notasF.forEach(n => {
        notasSet.add(`${n.turma_id}|${n.componente}|${n.bimestre}`);
      });

      // Mapeamento de professores e coordenadores
      const professores = targetCoordenadores.filter(c => (c.funcao as string) === 'Professor' || (c.funcao as string)?.includes('Monitor') || c.funcao === 'Monitor de Atividade Complementar');
      const coordenadoresPedagogicos = targetCoordenadores.filter(c => c.funcao === 'Coordenador Pedagógico' || c.funcao === 'Gestor Geral');

      const detectedList: Array<Omit<AlertaPendencia, 'id' | 'created_at' | 'updated_at'>> = [];
      const nowISO = new Date().toISOString();
      const PERIODOS_ATIVOS = targetPeriodo ? [targetPeriodo] : ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

      // ----------------------------------------------------
      // A. DETECÇÃO INSTANTÂNEA: PROFESSORES
      // ----------------------------------------------------
      professores.forEach(prof => {
        const userTurmasIds = prof.turmasIds || [];
        const userTurmaComp = prof.turmaComponentes || {};

        userTurmasIds.forEach(tId => {
          const turmaObj = turmas.find(t => t.id === tId);
          if (targetEscolaId && turmaObj && turmaObj.school_id !== targetEscolaId) return;

          const escolaObj = targetEscolas.find(e => prof.escolasIds.includes(e.id) || (turmaObj && e.id === turmaObj.school_id));
          const comps = userTurmaComp[tId] || ['Língua Portuguesa', 'Matemática'];

          const isInfantil = (turmaObj?.stage || '').toLowerCase().includes('infantil') || 
                             (turmaObj?.year || '').toLowerCase().includes('creche') ||
                             (turmaObj?.year || '').toLowerCase().includes('pré');

          comps.forEach(comp => {
            PERIODOS_ATIVOS.forEach(bim => {
              // 1. Guia de Aprendizagem
              if (!targetTipo || targetTipo === 'GUIA_APRENDIZAGEM') {
                if (isInfantil) {
                  if (!guiasISet.has(`${tId}|${comp}|${bim}`) && !guiasISet.has(`${tId}|Educação Infantil|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'GUIA_APRENDIZAGEM',
                      modulo: 'Educação Infantil',
                      view_destino: 'DIARIO_INFANTIL',
                      titulo: 'Guia de Aprendizagem Infantil Pendente',
                      descricao: `Guia de Aprendizagem ausente para ${comp} na turma ${turmaObj?.name || 'Infantil'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Infantil',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'MEDIA',
                      nivel_escalonamento: 0
                    });
                  }
                } else {
                  if (!guiasSet.has(`${tId}|${comp}|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'GUIA_APRENDIZAGEM',
                      modulo: 'Diário de Classe',
                      view_destino: 'PLANO_AULA',
                      titulo: 'Guia de Aprendizagem Pendente',
                      descricao: `Guia de Aprendizagem não lançado para ${comp} na turma ${turmaObj?.name || 'Fundamental'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Fundamental',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'MEDIA',
                      nivel_escalonamento: 0
                    });
                  }
                }
              }

              // 2. Aulas Ministradas
              if (!targetTipo || targetTipo === 'AULAS_MINISTRADAS') {
                if (isInfantil) {
                  if (!aulasISet.has(`${tId}|${comp}|${bim}`) && !aulasISet.has(`${tId}|Educação Infantil|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'AULAS_MINISTRADAS',
                      modulo: 'Educação Infantil',
                      view_destino: 'DIARIO_INFANTIL',
                      titulo: 'Aulas Ministradas não Registradas',
                      descricao: `Nenhuma aula ministrada registrada para ${comp} na turma ${turmaObj?.name || 'Infantil'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Infantil',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'MEDIA',
                      nivel_escalonamento: 0
                    });
                  }
                } else {
                  if (!aulasSet.has(`${tId}|${comp}|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'AULAS_MINISTRADAS',
                      modulo: 'Diário de Classe',
                      view_destino: 'AULAS_MINISTRADAS',
                      titulo: 'Aulas Ministradas não Registradas',
                      descricao: `Nenhuma aula ministrada registrada para ${comp} na turma ${turmaObj?.name || 'Fundamental'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Fundamental',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'MEDIA',
                      nivel_escalonamento: 0
                    });
                  }
                }
              }

              // 3. Frequência Escolar
              if (!targetTipo || targetTipo === 'FREQUENCIA') {
                if (!isInfantil) {
                  if (!freqSet.has(`${tId}|${comp}|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'FREQUENCIA',
                      modulo: 'Diário de Classe',
                      view_destino: 'FREQUENCIA',
                      titulo: 'Frequência Escolar não Registrada',
                      descricao: `Lançamento de frequência pendente para ${comp} na turma ${turmaObj?.name || 'Fundamental'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Fundamental',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'ALTA',
                      nivel_escalonamento: 0
                    });
                  }
                } else {
                  if (!freqISet.has(`${tId}|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'FREQUENCIA',
                      modulo: 'Educação Infantil',
                      view_destino: 'DIARIO_INFANTIL',
                      titulo: 'Frequência Infantil não Registrada',
                      descricao: `Lançamento de frequência infantil pendente na turma ${turmaObj?.name || 'Infantil'} (${bim}).`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Infantil',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'ALTA',
                      nivel_escalonamento: 0
                    });
                  }
                }
              }

              // 4. Notas (apenas Fundamental)
              if (!targetTipo || targetTipo === 'NOTAS') {
                if (!isInfantil) {
                  if (!notasSet.has(`${tId}|${comp}|${bim}`)) {
                    detectedList.push({
                      usuario_id: prof.id,
                      usuario_nome: prof.nome,
                      usuario_perfil: prof.funcao,
                      usuario_email: prof.contato,
                      tipo_pendencia: 'NOTAS',
                      modulo: 'Diário de Classe',
                      view_destino: 'NOTAS',
                      titulo: 'Lançamento de Notas Pendente',
                      descricao: `Lançamento de notas do ${bim} pendente para ${comp} na turma ${turmaObj?.name || 'Fundamental'}.`,
                      escola_id: escolaObj?.id,
                      escola_nome: escolaObj?.nome || 'Unidade Escolar',
                      turma_id: tId,
                      turma_nome: turmaObj ? `${turmaObj.year} - ${turmaObj.name}` : 'Turma',
                      componente: comp,
                      periodo: bim,
                      bimestre: bim,
                      etapa_ensino: 'Fundamental',
                      data_identificacao: nowISO,
                      status: 'PENDENTE',
                      prioridade: 'ALTA',
                      nivel_escalonamento: 0
                    });
                  }
                }
              }
            });
          });
        });
      });

      // ----------------------------------------------------
      // B. DETECÇÃO: APROVAÇÃO DE GUIAS (COORDENADORES PEDAGÓGICOS)
      // ----------------------------------------------------
      if (!targetTipo || targetTipo === 'APROVACAO_GUIAS') {
        const guiasAguardandoF = guiasF.filter(g => (g.status || 'Pendente').toLowerCase().includes('pendente') || (g.status || '').toLowerCase().includes('análise'));
        const guiasAguardandoI = guiasI.filter(g => (g.status || 'Pendente').toLowerCase().includes('pendente') || (g.status || '').toLowerCase().includes('análise'));

        targetEscolas.forEach(esc => {
          PERIODOS_ATIVOS.forEach(bim => {
            const guiasEscolaF = guiasAguardandoF.filter(g => g.escola_id === esc.id && (g.periodo === bim || (!g.periodo && bim === '1º Bimestre')));
            const guiasEscolaI = guiasAguardandoI.filter(g => g.escola_id === esc.id && (g.periodo === bim || (!g.periodo && bim === '1º Bimestre')));
            const totalAguardando = guiasEscolaF.length + guiasEscolaI.length;

            if (totalAguardando > 0) {
              const coordResp = coordenadoresPedagogicos.find(c => c.escolasIds.includes(esc.id));
              detectedList.push({
                usuario_id: coordResp?.id || undefined,
                usuario_nome: coordResp?.nome || 'Coordenação Pedagógica',
                usuario_perfil: coordResp?.funcao || 'Coordenador Pedagógico',
                usuario_email: coordResp?.contato || undefined,
                tipo_pendencia: 'APROVACAO_GUIAS',
                modulo: 'Diário de Classe',
                view_destino: 'PLANO_AULA',
                titulo: 'Guias de Aprendizagem Aguardando Aprovação',
                descricao: `${totalAguardando} Guia(s) de Aprendizagem do ${bim} aguardando análise e validação pedagógica na unidade ${esc.nome}.`,
                escola_id: esc.id,
                escola_nome: esc.nome,
                periodo: bim,
                bimestre: bim,
                etapa_ensino: guiasEscolaI.length > 0 && guiasEscolaF.length === 0 ? 'Infantil' : 'Fundamental',
                data_identificacao: nowISO,
                status: 'PENDENTE',
                prioridade: 'ALTA',
                nivel_escalonamento: 0
              });
            }
          });
        });
      }

      // ----------------------------------------------------
      // C. SINCRONIZAÇÃO E MERGE INSTANTÂNEO
      // ----------------------------------------------------
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const makeKey = (item: { tipo_pendencia: string; escola_id?: string; turma_id?: string; componente?: string; periodo?: string; usuario_id?: string }) => {
        return `${item.tipo_pendencia}|${item.escola_id || ''}|${item.turma_id || ''}|${item.componente || ''}|${item.periodo || ''}|${item.usuario_id || ''}`;
      };

      const existingMap = new Map<string, AlertaPendencia>();
      existingAlerts.forEach(a => {
        existingMap.set(makeKey(a), a);
      });

      const newToInsert: any[] = [];
      const updatedList: AlertaPendencia[] = [];
      const overdueToUpdate: string[] = [];

      for (let i = 0; i < detectedList.length; i++) {
        const det = detectedList[i];
        const key = makeKey(det);
        const existing = existingMap.get(key);

        if (existing) {
          if (existing.status === 'EM_ALERTA' && existing.prazo) {
            const prazoDate = new Date(existing.prazo + 'T00:00:00');
            if (prazoDate < today) {
              const daysOverdue = Math.ceil((today.getTime() - prazoDate.getTime()) / (1000 * 60 * 60 * 24));
              const isEscalonado = daysOverdue >= 3;
              existing.status = isEscalonado ? 'ESCALONADA' : 'VENCIDA';
              existing.nivel_escalonamento = isEscalonado ? 3 : 2;
              overdueToUpdate.push(existing.id);
            }
          }
          updatedList.push(existing);
          existingMap.delete(key);
        } else {
          const generatedId = `gen-${Date.now()}-${i}`;
          const fullItem: AlertaPendencia = {
            ...det,
            id: generatedId,
            created_at: nowISO,
            updated_at: nowISO
          };
          updatedList.push(fullItem);
          newToInsert.push(det);
        }
      }

      // Preservar pendências manuais já existentes no banco
      for (const oldPending of existingMap.values()) {
        updatedList.push(oldPending);
      }

      // Persistência assíncrona em background (não bloqueia resposta ao usuário)
      if (newToInsert.length > 0) {
        setTimeout(async () => {
          try {
            await supabase.from('alertas_pendencias').insert(newToInsert.slice(0, 300));
          } catch (err) {
            console.warn('Background sync insert notice:', err);
          }
        }, 10);
      }

      return updatedList.sort((a, b) => {
        const statusScore = (s: StatusPendenciaAlerta) => {
          if (s === 'ESCALONADA') return 5;
          if (s === 'VENCIDA') return 4;
          if (s === 'EM_ALERTA') return 3;
          if (s === 'PENDENTE') return 2;
          return 1;
        };
        const priorScore = (p: PrioridadePendenciaAlerta) => {
          if (p === 'ALTA') return 3;
          if (p === 'MEDIA') return 2;
          return 1;
        };
        return (statusScore(b.status) - statusScore(a.status)) || (priorScore(b.prioridade) - priorScore(a.prioridade));
      });
    } catch (e) {
      console.error('Erro na sincronização de pendências:', e);
      return getMockPendencias(escolas, coordenadores);
    }
  }
};

// Fallback Mock para demonstração offline
const getMockPendencias = (escolas: Escola[], coordenadores: Coordenador[]): AlertaPendencia[] => {
  const escola1 = escolas[0]?.nome || 'E M PADRE FERNANDO LEVESQUEY';
  const escola2 = escolas[1]?.nome || 'E M TEOTÔNIO RIBEIRO';
  const prof1 = coordenadores.find(c => c.funcao === 'Professor')?.nome || 'Professor Demo';

  return [
    {
      id: 'mock-1',
      usuario_nome: prof1,
      usuario_perfil: 'Professor',
      usuario_email: 'prof1@educacao.gov.br',
      tipo_pendencia: 'GUIA_APRENDIZAGEM',
      modulo: 'Diário de Classe',
      view_destino: 'PLANO_AULA',
      titulo: 'Guia de Aprendizagem Pendente',
      descricao: `Guia de Aprendizagem não lançado para Língua Portuguesa no 6º Ano A (1º Bimestre).`,
      escola_nome: escola1,
      turma_nome: '6º ANO A',
      componente: 'Língua Portuguesa',
      periodo: '1º Bimestre',
      bimestre: '1º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      prazo: formatISODate(addBusinessDays(new Date(), 2)),
      status: 'EM_ALERTA',
      prioridade: 'ALTA',
      nivel_escalonamento: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      usuario_nome: 'Jaide Nunes Pereira',
      usuario_perfil: 'Coordenador Pedagógico',
      usuario_email: 'jaide@educacao.gov.br',
      tipo_pendencia: 'APROVACAO_GUIAS',
      modulo: 'Diário de Classe',
      view_destino: 'PLANO_AULA',
      titulo: 'Guias de Aprendizagem Aguardando Aprovação',
      descricao: '4 Guias de Aprendizagem aguardando análise e validação pedagógica.',
      escola_nome: escola2,
      periodo: '1º Bimestre',
      bimestre: '1º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      prazo: formatISODate(addBusinessDays(new Date(), -2)),
      status: 'VENCIDA',
      prioridade: 'ALTA',
      nivel_escalonamento: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-3',
      usuario_nome: prof1,
      usuario_perfil: 'Professor',
      usuario_email: 'prof1@educacao.gov.br',
      tipo_pendencia: 'NOTAS',
      modulo: 'Diário de Classe',
      view_destino: 'NOTAS',
      titulo: 'Lançamento de Notas Pendente',
      descricao: 'Lançamento de notas do 2º Bimestre pendente para Matemática no 5º Ano B.',
      escola_nome: escola1,
      turma_nome: '5º ANO B',
      componente: 'Matemática',
      periodo: '2º Bimestre',
      bimestre: '2º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      status: 'PENDENTE',
      prioridade: 'MEDIA',
      nivel_escalonamento: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-4',
      usuario_nome: prof1,
      usuario_perfil: 'Professor',
      usuario_email: 'prof1@educacao.gov.br',
      tipo_pendencia: 'FREQUENCIA',
      modulo: 'Diário de Classe',
      view_destino: 'FREQUENCIA',
      titulo: 'Frequência Escolar não Registrada',
      descricao: 'Lançamento de frequência do 3º Bimestre pendente para História no 7º Ano A.',
      escola_nome: escola1,
      turma_nome: '7º ANO A',
      componente: 'História',
      periodo: '3º Bimestre',
      bimestre: '3º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      prazo: formatISODate(addBusinessDays(new Date(), 5)),
      status: 'EM_ALERTA',
      prioridade: 'ALTA',
      nivel_escalonamento: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-5',
      usuario_nome: prof1,
      usuario_perfil: 'Professor',
      usuario_email: 'prof1@educacao.gov.br',
      tipo_pendencia: 'AULAS_MINISTRADAS',
      modulo: 'Diário de Classe',
      view_destino: 'AULAS_MINISTRADAS',
      titulo: 'Aulas Ministradas não Registradas',
      descricao: 'Nenhuma aula ministrada registrada para Geografia no 8º Ano A (4º Bimestre).',
      escola_nome: escola2,
      turma_nome: '8º ANO A',
      componente: 'Geografia',
      periodo: '4º Bimestre',
      bimestre: '4º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      status: 'PENDENTE',
      prioridade: 'MEDIA',
      nivel_escalonamento: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};
