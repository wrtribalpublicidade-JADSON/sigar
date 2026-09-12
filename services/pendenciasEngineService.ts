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
import { generateUUID } from '../utils';

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
   * Busca alertas ativos de um usuário (para popup de regularização no login).
   * Garante que o popup seja exibido EXCLUSIVAMENTE ao usuário notificado:
   * - Responsável Direto (docente titular da pendência)
   * - Gestão Escolar (se o fluxo foi direcionado à gestão da escola)
   * - Ambos (se direcionado a ambos)
   * - Emissores (gerado_por) e administradores gerais NÃO recebem o popup das pendências de terceiros.
   */
  getUserActiveAlerts: async (
    userEmail?: string | null,
    coordenadorId?: string | null,
    escolasIds?: string[],
    currentUser?: Coordenador | null,
    isAdmin?: boolean
  ): Promise<AlertaPendencia[]> => {
    try {
      let query = supabase
        .from('alertas_pendencias')
        .select('*')
        .in('status', ['EM_ALERTA', 'VENCIDA', 'ESCALONADA']);

      // Se o usuário tiver escolas vinculadas, restringir a busca às suas escolas ou usuário
      if (escolasIds && escolasIds.length > 0) {
        if (userEmail || coordenadorId) {
          query = query.or(`usuario_email.eq.${userEmail || 'none'},usuario_id.eq.${coordenadorId || 'none'},escola_id.in.(${escolasIds.join(',')})`);
        } else {
          query = query.in('escola_id', escolasIds);
        }
      } else if (userEmail && coordenadorId) {
        query = query.or(`usuario_email.eq.${userEmail},usuario_id.eq.${coordenadorId}`);
      } else if (userEmail) {
        query = query.eq('usuario_email', userEmail);
      } else if (coordenadorId) {
        query = query.eq('usuario_id', coordenadorId);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      const rawAlerts = (data as AlertaPendencia[]) || [];

      // Filtro rigoroso em memória para garantir que apenas o DESTINATÁRIO NOTIFICADO receba o popup
      const cleanEmail = (userEmail || currentUser?.contato || '').toLowerCase().trim();
      const cleanCoordId = String(coordenadorId || currentUser?.id || '').trim();
      const cleanName = (currentUser?.nome || '').toLowerCase().trim();
      const userRole = (currentUser?.funcao || '').toLowerCase();
      const isTeacher = userRole.includes('professor') || userRole.includes('docente');
      const isGestor = userRole.includes('coordenador pedagógico') || userRole.includes('coordenador pedagogico') || 
                       userRole.includes('gestor') || userRole.includes('diretor');
      const isSystemAdmin = Boolean(isAdmin) || userRole.includes('administrador') || userRole.includes('regional');

      return rawAlerts.filter(a => {
        // 1. O usuário que emitiu o alerta (gerado_por) é o EMISSOR, NUNCA o notificado
        const geradoPor = (a.gerado_por || '').toLowerCase().trim();
        if (cleanName && geradoPor && (geradoPor === cleanName || cleanName.includes(geradoPor) || geradoPor.includes(cleanName))) {
          return false;
        }

        const alertEmail = (a.usuario_email || '').toLowerCase().trim();
        const alertUserId = String(a.usuario_id || '').trim();
        const alertUserName = (a.usuario_nome || '').toLowerCase().trim();
        const dest = a.destinatario_alerta || 'RESPONSAVEL_DIRETO';

        // Verifica se o usuário logado é o responsável direto (docente ou autor do lançamento)
        const isDirectTarget = Boolean(
          (cleanEmail && alertEmail && cleanEmail === alertEmail) ||
          (cleanCoordId && alertUserId && cleanCoordId === alertUserId) ||
          (cleanName && alertUserName && (cleanName === alertUserName || cleanName.includes(alertUserName) || alertUserName.includes(cleanName)))
        );

        // Se o alerta foi direcionado EXCLUSIVAMENTE ao RESPONSAVEL_DIRETO:
        if (dest === 'RESPONSAVEL_DIRETO') {
          // Apenas o docente/responsável direto recebe o popup
          return isDirectTarget;
        }

        // Se o alerta foi direcionado à GESTAO_ESCOLAR:
        if (dest === 'GESTAO_ESCOLAR') {
          // O professor comum não deve receber o popup da gestão
          if (isTeacher && !isGestor) return false;
          // O administrador geral que monitora não deve receber popup operacional
          if (isSystemAdmin) return false;
          // Gestor/coordenador daquela escola recebe
          if (isGestor) {
            const matchesSchool = escolasIds && a.escola_id && escolasIds.includes(a.escola_id);
            const inCoResp = (a.co_responsaveis_nomes || '').toLowerCase().includes(cleanName) ||
                             (Array.isArray(a.co_responsaveis_ids) && a.co_responsaveis_ids.includes(cleanCoordId));
            return Boolean(matchesSchool || inCoResp);
          }
          return false;
        }

        // Se o alerta foi direcionado a AMBOS (Gestão + Professor):
        if (dest === 'AMBOS') {
          if (isDirectTarget) return true;
          if (isGestor) {
            const matchesSchool = escolasIds && a.escola_id && escolasIds.includes(a.escola_id);
            const inCoResp = (a.co_responsaveis_nomes || '').toLowerCase().includes(cleanName) ||
                             (Array.isArray(a.co_responsaveis_ids) && a.co_responsaveis_ids.includes(cleanCoordId));
            return Boolean(matchesSchool || inCoResp);
          }
          return false;
        }

        return isDirectTarget;
      });
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
   * Gera um alerta individual com prazo, observação e fluxo hierárquico,
   * gravando expressamente o histórico de envio do usuário notificado.
   */
  gerarAlertaIndividual: async (
    pendenciaId: string,
    prazo: string,
    observacao: string,
    prioridade: PrioridadePendenciaAlerta = 'ALTA',
    executadoPor: string = 'Administrador',
    destinatario: 'RESPONSAVEL_DIRETO' | 'GESTAO_ESCOLAR' | 'AMBOS' = 'RESPONSAVEL_DIRETO'
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const nivel = destinatario === 'GESTAO_ESCOLAR' ? 2 : (destinatario === 'AMBOS' ? 2 : 1);

      // Obter dados da pendência para detalhar com precisão o destinatário notificado
      const { data: pendenciaData } = await supabase
        .from('alertas_pendencias')
        .select('*')
        .eq('id', pendenciaId)
        .maybeSingle();

      const userTargetName = pendenciaData?.usuario_nome || 'Servidor Responsável';
      const userTargetPerfil = pendenciaData?.usuario_perfil || 'Docente';
      const userTargetId = pendenciaData?.usuario_id || null;
      const coResponsaveis = pendenciaData?.co_responsaveis_nomes || 'Gestão da Unidade Escolar';

      let notificadoPara = '';
      if (destinatario === 'RESPONSAVEL_DIRETO') {
        notificadoPara = `${userTargetName} (${userTargetPerfil})`;
      } else if (destinatario === 'GESTAO_ESCOLAR') {
        notificadoPara = `Gestão Escolar: ${coResponsaveis}`;
      } else {
        notificadoPara = `${userTargetName} (${userTargetPerfil}) e Gestão Escolar (${coResponsaveis})`;
      }
      
      const { error: updateErr } = await supabase
        .from('alertas_pendencias')
        .update({
          status: 'EM_ALERTA',
          prazo,
          observacao_alerta: observacao,
          prioridade,
          destinatario_alerta: destinatario,
          alerta_notificado_para: notificadoPara,
          gerado_em: now,
          gerado_por: executadoPor,
          nivel_escalonamento: nivel,
          updated_at: now
        })
        .eq('id', pendenciaId);

      if (updateErr) throw updateErr;

      const dataFormatada = new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR');

      // Gravar histórico com o usuário notificado identificado
      await supabase.from('alertas_pendencias_historico').insert([{
        pendencia_id: pendenciaId,
        acao: 'ENVIO_ALERTA',
        descricao: `Alerta e Notificação formal emitido para [${notificadoPara}] com prazo de regularização até ${dataFormatada}. Prioridade: ${prioridade}.${observacao ? ` Mensagem: "${observacao}"` : ''}`,
        usuario_id: userTargetId,
        executado_por: executadoPor,
        dados_extras: {
          destinatario_tipo: destinatario,
          notificado_para: notificadoPara,
          usuario_nome: userTargetName,
          usuario_email: pendenciaData?.usuario_email || null,
          usuario_perfil: userTargetPerfil,
          escola_nome: pendenciaData?.escola_nome || null,
          prazo,
          prioridade,
          observacao,
          gerado_em: now,
          gerado_por: executadoPor
        }
      }]);

      await logAudit('UPDATE', 'GERAR_ALERTA_PENDENCIA', pendenciaId, {
        prazo,
        prioridade,
        observacao,
        destinatario,
        notificadoPara,
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
    executadoPor: string = 'Administrador',
    destinatario: 'RESPONSAVEL_DIRETO' | 'GESTAO_ESCOLAR' | 'AMBOS' = 'RESPONSAVEL_DIRETO'
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const id of pendenciaIds) {
      const ok = await pendenciasEngineService.gerarAlertaIndividual(id, prazo, observacao, prioridade, executadoPor, destinatario);
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
      let targetCoordenadores = coordenadores;

      if (targetUsuarioId) {
        const selectedUser = coordenadores.find(c => c.id === targetUsuarioId);
        const f = (selectedUser?.funcao || '').toLowerCase();
        const isGestorOuCoord = f.includes('coordenador') || f.includes('gestor') || f.includes('diretor');

        if (isGestorOuCoord && selectedUser?.escolasIds && selectedUser.escolasIds.length > 0) {
          // Se for Coordenador Pedagógico / Gestor Geral / Gestor Pedagógico,
          // inclui todos os professores das escolas vinculadas a esse gestor/coordenador
          targetCoordenadores = coordenadores.filter(c => 
            c.id === targetUsuarioId || c.escolasIds?.some(eid => selectedUser.escolasIds.includes(eid))
          );
        } else {
          targetCoordenadores = coordenadores.filter(c => c.id === targetUsuarioId);
        }
      }

      if (targetEscolaId) {
        targetCoordenadores = targetCoordenadores.filter(c => c.escolasIds.includes(targetEscolaId));
      }

      // Preparar queries do Supabase direcionadas por filtros
      let existingQuery = supabase.from('alertas_pendencias').select('*');

      const needGuias = !targetTipo || targetTipo === 'GUIA_APRENDIZAGEM' || targetTipo === 'APROVACAO_GUIAS';
      const needAulas = !targetTipo || targetTipo === 'AULAS_MINISTRADAS';
      const needFreq = !targetTipo || targetTipo === 'FREQUENCIA';
      const needNotas = !targetTipo || targetTipo === 'NOTAS';
      const needCCF = !targetTipo || targetTipo === 'CONSELHO_CLASSE_FUNDAMENTAL';
      const needCCI = !targetTipo || targetTipo === 'CONSELHO_CLASSE_INFANTIL';

      let guiasFQuery = needGuias ? supabase.from('guias_aprendizagem').select('id, escola_id, turma_id, componente, periodo, status, created_by') : null;
      let guiasIQuery = needGuias ? supabase.from('guias_aprendizagem_infantil').select('id, escola_id, turma_id, campo_experiencia, periodo, status, created_by') : null;
      let aulasFQuery = needAulas ? supabase.from('aulas_ministradas').select('id, escola_id, turma_id, componente, periodo, data, created_by') : null;
      let aulasIQuery = needAulas ? supabase.from('aulas_ministradas_infantil').select('id, escola_id, turma_id, campo_experiencia, periodo, data, created_by') : null;
      let freqFQuery = needFreq ? supabase.from('frequencia_sheets').select('id, escola_id, turma_id, componente, data, created_by') : null;
      let freqIQuery = needFreq ? supabase.from('frequencia_sheets_infantil').select('id, escola_id, turma_id, periodo, data, created_by') : null;
      let notasFQuery = needNotas ? supabase.from('notas_sheets').select('id, escola_id, turma_id, componente, bimestre, created_by') : null;
      let turmasQuery = supabase.from('turmas').select('id, name, year, stage, school_id');
      let ccFQuery = needCCF ? supabase.from('cc_f_avaliacao').select('escola_id, turma_id, periodo_letivo') : null;
      let ccIQuery = needCCI ? supabase.from('cc_i_avaliacoes').select('escola_id, turma_id, bimestre') : null;

      if (targetEscolaId) {
        existingQuery = existingQuery.eq('escola_id', targetEscolaId);
        if (guiasFQuery) guiasFQuery = guiasFQuery.eq('escola_id', targetEscolaId);
        if (guiasIQuery) guiasIQuery = guiasIQuery.eq('escola_id', targetEscolaId);
        if (aulasFQuery) aulasFQuery = aulasFQuery.eq('escola_id', targetEscolaId);
        if (aulasIQuery) aulasIQuery = aulasIQuery.eq('escola_id', targetEscolaId);
        if (freqFQuery) freqFQuery = freqFQuery.eq('escola_id', targetEscolaId);
        if (freqIQuery) freqIQuery = freqIQuery.eq('escola_id', targetEscolaId);
        if (notasFQuery) notasFQuery = notasFQuery.eq('escola_id', targetEscolaId);
        turmasQuery = turmasQuery.eq('school_id', targetEscolaId);
        if (ccFQuery) ccFQuery = ccFQuery.eq('escola_id', targetEscolaId);
        if (ccIQuery) ccIQuery = ccIQuery.eq('escola_id', targetEscolaId);
      }

      if (targetTipo) {
        existingQuery = existingQuery.eq('tipo_pendencia', targetTipo);
      }
      if (targetPeriodo) {
        existingQuery = existingQuery.eq('periodo', targetPeriodo);
        if (guiasFQuery) guiasFQuery = guiasFQuery.eq('periodo', targetPeriodo);
        if (guiasIQuery) guiasIQuery = guiasIQuery.eq('periodo', targetPeriodo);
        if (notasFQuery) notasFQuery = notasFQuery.eq('bimestre', targetPeriodo);
        if (ccFQuery) ccFQuery = ccFQuery.eq('periodo_letivo', targetPeriodo);
        if (ccIQuery) {
          const bimNum = targetPeriodo.startsWith('1') ? 1 : targetPeriodo.startsWith('2') ? 2 : targetPeriodo.startsWith('3') ? 3 : 4;
          ccIQuery = ccIQuery.eq('bimestre', bimNum);
        }
      }
      if (options?.status && options.status !== 'ALL') {
        existingQuery = existingQuery.eq('status', options.status);
      }
      if (options?.perfil && options.perfil !== 'ALL') {
        existingQuery = existingQuery.eq('usuario_perfil', options.perfil);
      }
      if (targetUsuarioId) {
        existingQuery = existingQuery.eq('usuario_id', targetUsuarioId);
      }

      // Executar consultas necessárias em paralelo
      const emptyRes = { data: [] as any[] };
      const [
        existingAlertsRes,
        guiasFRes,
        guiasIRes,
        aulasFRes,
        aulasIRes,
        frequenciaFRes,
        frequenciaIRes,
        notasFRes,
        turmasRes,
        ccFRes,
        ccIRes
      ] = await Promise.all([
        existingQuery.limit(3000),
        guiasFQuery ? guiasFQuery.limit(3000) : Promise.resolve(emptyRes),
        guiasIQuery ? guiasIQuery.limit(2000) : Promise.resolve(emptyRes),
        aulasFQuery ? aulasFQuery.limit(3000) : Promise.resolve(emptyRes),
        aulasIQuery ? aulasIQuery.limit(2000) : Promise.resolve(emptyRes),
        freqFQuery ? freqFQuery.limit(3000) : Promise.resolve(emptyRes),
        freqIQuery ? freqIQuery.limit(2000) : Promise.resolve(emptyRes),
        notasFQuery ? notasFQuery.limit(3000) : Promise.resolve(emptyRes),
        turmasQuery.limit(2000),
        ccFQuery ? ccFQuery.limit(5000) : Promise.resolve(emptyRes),
        ccIQuery ? ccIQuery.limit(3000) : Promise.resolve(emptyRes)
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

      const ccFSet = new Set<string>();
      (ccFRes.data || []).forEach((c: any) => {
        if (c.turma_id && c.periodo_letivo) {
          ccFSet.add(`${c.turma_id}|${c.periodo_letivo}`);
        }
      });

      const ccISet = new Set<string>();
      (ccIRes.data || []).forEach((c: any) => {
        if (c.turma_id && c.bimestre) {
          ccISet.add(`${c.turma_id}|${c.bimestre}º Bimestre`);
        }
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

          // Co-responsáveis da escola (Coordenador Regional, Coordenador Pedagógico, Gestor Geral, Gestor Pedagógico)
          const gestoresEscola = coordenadores.filter(c => 
            escolaObj?.id && c.escolasIds?.includes(escolaObj.id) && 
            c.id !== prof.id &&
            (c.funcao === 'Coordenador Regional' || c.funcao === 'Coordenador Pedagógico' || c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || 
             (c.funcao as string)?.toLowerCase().includes('coordenador') || 
             (c.funcao as string)?.toLowerCase().includes('gestor'))
          );
          const coResponsaveisNomes = gestoresEscola.map(g => `${g.nome} (${g.funcao})`).join(', ') || undefined;
          const coResponsaveisIds = gestoresEscola.map(g => g.id);

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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
                      co_responsaveis_nomes: coResponsaveisNomes,
                      co_responsaveis_ids: coResponsaveisIds,
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
              // Responsável principal: Coordenador Pedagógico da escola ou Gestor Geral/Pedagógico
              const coordPed = coordenadores.find(c => 
                c.escolasIds?.includes(esc.id) && 
                (c.funcao === 'Coordenador Pedagógico' || (c.funcao as string)?.toLowerCase().includes('coordenador pedagógico'))
              );
              const gestorGeral = coordenadores.find(c => 
                c.escolasIds?.includes(esc.id) && 
                (c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || (c.funcao as string)?.toLowerCase().includes('gestor'))
              );
              const coordResp = coordPed || gestorGeral;

              // Co-responsáveis: APENAS gestores e coordenadores vinculados à unidade responsável (esc.id)
              const gestoresUnidade = coordenadores.filter(c => 
                c.escolasIds?.includes(esc.id) &&
                c.id !== coordResp?.id &&
                (
                  c.funcao === 'Coordenador Regional' ||
                  c.funcao === 'Gestor Geral' ||
                  c.funcao === 'Gestor Pedagógico' ||
                  c.funcao === 'Coordenador Pedagógico' ||
                  (c.funcao as string)?.toLowerCase().includes('gestor') ||
                  (c.funcao as string)?.toLowerCase().includes('coordenador')
                )
              );
              const coResponsaveisNomes = gestoresUnidade.map(g => `${g.nome} (${g.funcao})`).join(', ') || undefined;
              const coResponsaveisIds = gestoresUnidade.map(g => g.id);

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
                co_responsaveis_nomes: coResponsaveisNomes,
                co_responsaveis_ids: coResponsaveisIds,
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
      // C. DETECÇÃO: CONSELHO DE CLASSE FUNDAMENTAL
      // ----------------------------------------------------
      if (!targetTipo || targetTipo === 'CONSELHO_CLASSE_FUNDAMENTAL') {
        targetEscolas.forEach(esc => {
          const turmasFundamental = turmas.filter(t => 
            t.school_id === esc.id && 
            !((t.stage || '').toLowerCase().includes('infantil') || (t.year || '').toLowerCase().includes('creche') || (t.year || '').toLowerCase().includes('pré'))
          );

          if (turmasFundamental.length > 0) {
            const coordPed = coordenadores.find(c => 
              c.escolasIds?.includes(esc.id) && 
              (c.funcao === 'Coordenador Pedagógico' || (c.funcao as string)?.toLowerCase().includes('coordenador pedagógico'))
            );
            const gestorGeral = coordenadores.find(c => 
              c.escolasIds?.includes(esc.id) && 
              (c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || (c.funcao as string)?.toLowerCase().includes('gestor'))
            );
            const coordResp = coordPed || gestorGeral;

            const gestoresEscola = coordenadores.filter(c => 
              c.escolasIds?.includes(esc.id) && c.id !== coordResp?.id &&
              (c.funcao === 'Coordenador Regional' || c.funcao === 'Coordenador Pedagógico' || c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || (c.funcao as string)?.toLowerCase().includes('gestor') || (c.funcao as string)?.toLowerCase().includes('coordenador'))
            );
            const coResponsaveisNomes = gestoresEscola.map(g => `${g.nome} (${g.funcao})`).join(', ') || undefined;
            const coResponsaveisIds = gestoresEscola.map(g => g.id);

            turmasFundamental.forEach(turmaObj => {
              PERIODOS_ATIVOS.forEach(bim => {
                if (!ccFSet.has(`${turmaObj.id}|${bim}`)) {
                  detectedList.push({
                    usuario_id: coordResp?.id || undefined,
                    usuario_nome: coordResp?.nome || 'Coordenação Pedagógica',
                    usuario_perfil: coordResp?.funcao || 'Coordenador Pedagógico',
                    usuario_email: coordResp?.contato || undefined,
                    tipo_pendencia: 'CONSELHO_CLASSE_FUNDAMENTAL',
                    modulo: 'Conselho de Classe',
                    view_destino: 'CONSELHO_CLASSE_FUNDAMENTAL',
                    titulo: 'Conselho de Classe Fundamental Pendente',
                    descricao: `Fechamento e deliberações do Conselho de Classe pendentes para a turma ${turmaObj.year} - ${turmaObj.name} (${bim}).`,
                    escola_id: esc.id,
                    escola_nome: esc.nome,
                    co_responsaveis_nomes: coResponsaveisNomes,
                    co_responsaveis_ids: coResponsaveisIds,
                    turma_id: turmaObj.id,
                    turma_nome: `${turmaObj.year} - ${turmaObj.name}`,
                    periodo: bim,
                    bimestre: bim,
                    etapa_ensino: 'Fundamental',
                    data_identificacao: nowISO,
                    status: 'PENDENTE',
                    prioridade: 'ALTA',
                    nivel_escalonamento: 0
                  });
                }
              });
            });
          }
        });
      }

      // ----------------------------------------------------
      // D. DETECÇÃO: CONSELHO DE CLASSE INFANTIL
      // ----------------------------------------------------
      if (!targetTipo || targetTipo === 'CONSELHO_CLASSE_INFANTIL') {
        targetEscolas.forEach(esc => {
          const turmasInfantil = turmas.filter(t => 
            t.school_id === esc.id && 
            ((t.stage || '').toLowerCase().includes('infantil') || (t.year || '').toLowerCase().includes('creche') || (t.year || '').toLowerCase().includes('pré'))
          );

          if (turmasInfantil.length > 0) {
            const coordPed = coordenadores.find(c => 
              c.escolasIds?.includes(esc.id) && 
              (c.funcao === 'Coordenador Pedagógico' || (c.funcao as string)?.toLowerCase().includes('coordenador pedagógico'))
            );
            const gestorGeral = coordenadores.find(c => 
              c.escolasIds?.includes(esc.id) && 
              (c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || (c.funcao as string)?.toLowerCase().includes('gestor'))
            );
            const coordResp = coordPed || gestorGeral;

            const gestoresEscola = coordenadores.filter(c => 
              c.escolasIds?.includes(esc.id) && c.id !== coordResp?.id &&
              (c.funcao === 'Coordenador Regional' || c.funcao === 'Coordenador Pedagógico' || c.funcao === 'Gestor Geral' || c.funcao === 'Gestor Pedagógico' || (c.funcao as string)?.toLowerCase().includes('gestor') || (c.funcao as string)?.toLowerCase().includes('coordenador'))
            );
            const coResponsaveisNomes = gestoresEscola.map(g => `${g.nome} (${g.funcao})`).join(', ') || undefined;
            const coResponsaveisIds = gestoresEscola.map(g => g.id);

            turmasInfantil.forEach(turmaObj => {
              PERIODOS_ATIVOS.forEach(bim => {
                if (!ccISet.has(`${turmaObj.id}|${bim}`)) {
                  detectedList.push({
                    usuario_id: coordResp?.id || undefined,
                    usuario_nome: coordResp?.nome || 'Coordenação Pedagógica',
                    usuario_perfil: coordResp?.funcao || 'Coordenador Pedagógico',
                    usuario_email: coordResp?.contato || undefined,
                    tipo_pendencia: 'CONSELHO_CLASSE_INFANTIL',
                    modulo: 'Conselho de Classe',
                    view_destino: 'CONSELHO_CLASSE_INFANTIL',
                    titulo: 'Conselho de Classe Infantil Pendente',
                    descricao: `Avaliações de desenvolvimento e fechamento do Conselho de Classe pendentes para a turma ${turmaObj.year} - ${turmaObj.name} (${bim}).`,
                    escola_id: esc.id,
                    escola_nome: esc.nome,
                    co_responsaveis_nomes: coResponsaveisNomes,
                    co_responsaveis_ids: coResponsaveisIds,
                    turma_id: turmaObj.id,
                    turma_nome: `${turmaObj.year} - ${turmaObj.name}`,
                    periodo: bim,
                    bimestre: bim,
                    etapa_ensino: 'Infantil',
                    data_identificacao: nowISO,
                    status: 'PENDENTE',
                    prioridade: 'ALTA',
                    nivel_escalonamento: 0
                  });
                }
              });
            });
          }
        });
      }

      // ----------------------------------------------------
      // E. SINCRONIZAÇÃO E MERGE INSTANTÂNEO
      // ----------------------------------------------------
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const makeKey = (item: { tipo_pendencia: string; escola_id?: string; turma_id?: string; componente?: string; periodo?: string; usuario_id?: string }) => {
        if (item.tipo_pendencia === 'APROVACAO_GUIAS') {
          return `${item.tipo_pendencia}|${item.escola_id || ''}|${item.periodo || ''}`;
        }
        if (item.tipo_pendencia === 'CONSELHO_CLASSE_FUNDAMENTAL' || item.tipo_pendencia === 'CONSELHO_CLASSE_INFANTIL') {
          return `${item.tipo_pendencia}|${item.escola_id || ''}|${item.turma_id || ''}|${item.periodo || ''}`;
        }
        return `${item.tipo_pendencia}|${item.escola_id || ''}|${item.turma_id || ''}|${item.componente || ''}|${item.periodo || ''}|${item.usuario_id || ''}`;
      };

      const existingMap = new Map<string, AlertaPendencia>();
      existingAlerts.forEach(a => {
        existingMap.set(makeKey(a), a);
      });

      const newToInsert: any[] = [];
      const updatedList: AlertaPendencia[] = [];
      const overdueToUpdate: string[] = [];
      const toUpdateCoResp: Array<{ id: string; co_responsaveis_nomes?: string; co_responsaveis_ids?: string[] }> = [];

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

          const coRespChanged = existing.co_responsaveis_nomes !== det.co_responsaveis_nomes;
          // Garante campos de co-responsabilidade e responsável da escola atualizados
          existing.co_responsaveis_nomes = det.co_responsaveis_nomes;
          existing.co_responsaveis_ids = det.co_responsaveis_ids;
          if (det.usuario_id && (!existing.usuario_id || existing.usuario_nome === 'Coordenação Pedagógica')) {
            existing.usuario_id = det.usuario_id;
            existing.usuario_nome = det.usuario_nome;
            existing.usuario_perfil = det.usuario_perfil;
            existing.usuario_email = det.usuario_email;
          }

          if (coRespChanged) {
            toUpdateCoResp.push({
              id: existing.id,
              co_responsaveis_nomes: det.co_responsaveis_nomes,
              co_responsaveis_ids: det.co_responsaveis_ids
            });
          }

          updatedList.push(existing);
          existingMap.delete(key);
        } else {
          const generatedId = generateUUID();
          const fullItem: AlertaPendencia = {
            ...det,
            id: generatedId,
            created_at: nowISO,
            updated_at: nowISO
          };
          updatedList.push(fullItem);
          newToInsert.push({ ...det, id: generatedId });
        }
      }

      // Preservar pendências manuais já existentes no banco que correspondam aos filtros pesquisados
      for (const oldPending of existingMap.values()) {
        if (targetTipo && oldPending.tipo_pendencia !== targetTipo) continue;
        if (targetEscolaId && oldPending.escola_id !== targetEscolaId) continue;
        if (targetPeriodo && oldPending.periodo !== targetPeriodo) continue;
        if (options?.status && options.status !== 'ALL' && oldPending.status !== options.status) continue;
        if (options?.perfil && options.perfil !== 'ALL' && oldPending.usuario_perfil !== options.perfil) continue;
        if (targetUsuarioId && oldPending.usuario_id !== targetUsuarioId) continue;
        updatedList.push(oldPending);
      }

      // Persistência assíncrona em background (não bloqueia resposta ao usuário)
      setTimeout(async () => {
        try {
          if (newToInsert.length > 0) {
            await supabase.from('alertas_pendencias').insert(newToInsert.slice(0, 300));
          }
          if (toUpdateCoResp.length > 0) {
            for (const item of toUpdateCoResp.slice(0, 100)) {
              await supabase
                .from('alertas_pendencias')
                .update({
                  co_responsaveis_nomes: item.co_responsaveis_nomes || null,
                  co_responsaveis_ids: item.co_responsaveis_ids || null
                })
                .eq('id', item.id);
            }
          }
        } catch (err) {
          console.warn('Background sync notice:', err);
        }
      }, 20);

      // Garantir que a lista retornada respeita estritamente os filtros requisitados
      let finalList = updatedList;
      if (targetTipo) {
        finalList = finalList.filter(p => p.tipo_pendencia === targetTipo);
      }
      if (targetEscolaId) {
        finalList = finalList.filter(p => p.escola_id === targetEscolaId);
      }
      if (targetPeriodo) {
        finalList = finalList.filter(p => p.periodo === targetPeriodo);
      }
      if (options?.status && options.status !== 'ALL') {
        finalList = finalList.filter(p => p.status === options.status);
      }
      if (options?.perfil && options.perfil !== 'ALL') {
        finalList = finalList.filter(p => p.usuario_perfil === options.perfil);
      }
      if (targetUsuarioId) {
        finalList = finalList.filter(p => p.usuario_id === targetUsuarioId);
      }

      return finalList.sort((a, b) => {
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
      co_responsaveis_nomes: 'Jaide Nunes Pereira (Coordenador Pedagógico)',
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
      co_responsaveis_nomes: 'Coordenador Regional (Regional)',
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
      co_responsaveis_nomes: 'Jaide Nunes Pereira (Coordenador Pedagógico)',
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
      co_responsaveis_nomes: 'Jaide Nunes Pereira (Coordenador Pedagógico)',
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
      co_responsaveis_nomes: 'Jaide Nunes Pereira (Coordenador Pedagógico)',
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
    },
    {
      id: 'mock-6',
      usuario_nome: 'Jaide Nunes Pereira',
      usuario_perfil: 'Coordenador Pedagógico',
      usuario_email: 'jaide@educacao.gov.br',
      tipo_pendencia: 'CONSELHO_CLASSE_FUNDAMENTAL',
      modulo: 'Conselho de Classe',
      view_destino: 'CONSELHO_CLASSE_FUNDAMENTAL',
      titulo: 'Conselho de Classe Fundamental Pendente',
      descricao: 'Fechamento e deliberações do Conselho de Classe pendentes para o 6º Ano A (1º Bimestre).',
      escola_nome: escola1,
      co_responsaveis_nomes: 'Diretoria Escolar',
      turma_nome: '6º ANO A',
      periodo: '1º Bimestre',
      bimestre: '1º Bimestre',
      etapa_ensino: 'Fundamental',
      data_identificacao: new Date().toISOString(),
      status: 'PENDENTE',
      prioridade: 'ALTA',
      nivel_escalonamento: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-7',
      usuario_nome: 'Jaide Nunes Pereira',
      usuario_perfil: 'Coordenador Pedagógico',
      usuario_email: 'jaide@educacao.gov.br',
      tipo_pendencia: 'CONSELHO_CLASSE_INFANTIL',
      modulo: 'Conselho de Classe',
      view_destino: 'CONSELHO_CLASSE_INFANTIL',
      titulo: 'Conselho de Classe Infantil Pendente',
      descricao: 'Avaliações de desenvolvimento e deliberações do Conselho de Classe pendentes para a Pré-Escola II (1º Bimestre).',
      escola_nome: escola2,
      co_responsaveis_nomes: 'Diretoria Escolar',
      turma_nome: 'Pré II A',
      periodo: '1º Bimestre',
      bimestre: '1º Bimestre',
      etapa_ensino: 'Infantil',
      data_identificacao: new Date().toISOString(),
      status: 'PENDENTE',
      prioridade: 'ALTA',
      nivel_escalonamento: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};
