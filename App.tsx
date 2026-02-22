
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SchoolList } from './components/SchoolList';
import { SchoolDetail } from './components/SchoolDetail';
import { VisitForm } from './components/VisitForm';
import { PrintableVisitReport } from './components/PrintableVisitReport';
import {
  LayoutDashboard, School, Users, FileText,
  LogOut, PlusCircle, BarChart3, TrendingUp,
  Edit, Trash2, Printer
} from 'lucide-react';
import { CoordinatorsManager } from './components/CoordinatorsManager';
import { ReportsModule } from './components/ReportsModule';
import { IndicatorsPanel } from './components/IndicatorsPanel';
import { FluenciaParcDashboard } from './components/FluenciaParcDashboard';
import { CncaPnraDashboard } from './components/CncaPnraDashboard';
import { SeamaDashboard } from './components/SeamaDashboard';
import { SaebDashboard } from './components/SaebDashboard';
import { NotificationsPanel } from './components/NotificationsPanel';
import { LoginPage } from './components/LoginPage';
import { AuditLogDashboard } from './components/AuditLogDashboard';
import { UserManagement } from './components/UserManagement';
import { InstrumentaisGestao } from './components/InstrumentaisGestao';
import { ConselhoClasse } from './components/ConselhoClasse';
import { Preloader } from './components/ui/Preloader';
import { ViewState, Escola, Visita, Coordenador } from './types';
import { supabase } from './services/supabase';
import { useNotification } from './context/NotificationContext';
import { generateUUID, checkSchoolPendencies } from './utils';
import { ESCOLAS_MOCK, VISITAS_MOCK, COORDENADORES_MOCK } from './constants';
import { logAccess, logAudit } from './services/logService';
const ADMIN_EMAIL = 'jadsoncsilv@gmail.com';

export default function App() {
  const { showNotification } = useNotification();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedEscolaId, setSelectedEscolaId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visita | null>(null);
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<Visita | null>(null);

  // App Data State
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const escolasRef = useRef(escolas);
  useEffect(() => { escolasRef.current = escolas; }, [escolas]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([]);

  // Function to load all data
  const fetchData = async (isDemo: boolean = false, email: string | null = null) => {
    if (isDemo) {
      setEscolas(ESCOLAS_MOCK);
      setVisitas(VISITAS_MOCK);
      setCoordenadores(COORDENADORES_MOCK);
      setIsAdmin(true);
      return;
    }

    const currentEmail = email || userEmail;
    if (!currentEmail) return;

    const isUserAdmin = currentEmail === ADMIN_EMAIL;
    setIsAdmin(isUserAdmin);

    try {
      const { data: coordData, error: coordError } = await supabase.from('coordenadores').select('*, coordenador_escolas(escola_id)');
      if (coordError) throw coordError;

      const mappedCoords: Coordenador[] = coordData?.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        contato: c.contato,
        regiao: c.regiao,
        funcao: c.funcao, // Map function from DB
        escolasIds: c.coordenador_escolas?.map((ce: any) => ce.escola_id) || []
      })) || [];

      let linkedSchoolIds: string[] = [];
      let currentUserCoord: Coordenador | undefined;

      if (!isUserAdmin) {
        currentUserCoord = mappedCoords.find(c => c.contato.toLowerCase() === currentEmail?.toLowerCase());
        if (currentUserCoord) {
          linkedSchoolIds = currentUserCoord.escolasIds;
        } else {
          setEscolas([]);
          setVisitas([]);
          setCoordenadores(mappedCoords);
          showNotification('error', 'Seu usuário não está vinculado a nenhuma escola. Contate o administrador.');
          return;
        }
      }

      let escQuery = supabase.from('escolas').select('*');
      if (!isUserAdmin) {
        escQuery = escQuery.in('id', linkedSchoolIds);
      }
      const { data: escData, error: escError } = await escQuery;
      if (escError) throw escError;

      const activeSchoolIds = (escData || []).map(e => e.id);

      const { data: metasData } = await supabase.from('metas_acao').select('*').in('escola_id', activeSchoolIds);
      const { data: rhData } = await supabase.from('recursos_humanos').select('*').in('escola_id', activeSchoolIds);
      const { data: acompData } = await supabase.from('acompanhamento_mensal').select('*').in('escola_id', activeSchoolIds);

      const mappedEscolas: Escola[] = (escData || []).map((e: any) => ({
        id: e.id,
        nome: e.nome,
        gestor: e.gestor,
        coordenador: e.coordenador,
        localizacao: e.localizacao,
        segmentos: e.segmentos || [],
        alunosMatriculados: e.alunos_matriculados,
        indicadores: e.indicadores || { ideb: 0, frequenciaMedia: 0, fluenciaLeitora: 0, taxaAprovacao: 0 },
        dadosEducacionais: e.dados_educacionais || {},
        planoAcao: metasData?.filter((m: any) => m.escola_id === e.id).map((m: any) => ({ ...m, status: m.status as any })) || [],
        recursosHumanos: rhData?.filter((r: any) => r.escola_id === e.id).map((r: any) => ({
          id: r.id,
          funcao: r.funcao,
          nome: r.nome,
          telefone: r.telefone,
          email: r.email,
          dataNomeacao: r.data_nomeacao,
          tipoVinculo: r.tipo_vinculo,
          etapaAtuacao: r.etapa_atuacao,
          componenteCurricular: r.componente_curricular
        })) || [],
        acompanhamentoMensal: acompData?.filter((a: any) => a.escola_id === e.id) || [],
        relatoriosVisita: []
      }));

      let visQuery = supabase.from('visitas').select('*');
      if (!isUserAdmin) {
        visQuery = visQuery.in('escola_id', linkedSchoolIds);
      }
      const { data: visData, error: visError } = await visQuery;
      if (visError) throw visError;

      const mappedVisitas: Visita[] = visData?.map((v: any) => ({
        id: v.id,
        escolaId: v.escola_id,
        escolaNome: v.escola_nome || mappedEscolas.find(e => e.id === v.escola_id)?.nome || 'Escola',
        data: v.data,
        tipo: v.tipo,
        foco: v.foco || [],
        topicosPauta: v.topicos_pauta || [],
        encaminhamentosRegistrados: v.encaminhamentos_registrados || [],
        observacoes: v.observacoes,
        encaminhamentos: v.encaminhamentos,
        status: v.status
      })) || [];

      setEscolas(mappedEscolas);
      setVisitas(mappedVisitas);
      setCoordenadores(mappedCoords);

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Erro ao carregar dados do servidor.');
    }
  };

  useEffect(() => {
    // Skip auth check if already in demo mode
    if (isDemoMode) {
      setIsLoadingAuth(false);
      return;
    }

    // Check initial session with error handling for "Invalid Refresh Token"
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Don't override auth state if demo mode was activated during this check
      if (isDemoMode) return;

      if (error) {
        console.error("Auth session error:", error.message);
        // If there's an error like "Invalid Refresh Token", clear local storage and force re-auth
        supabase.auth.signOut().catch(() => { });
        setIsAuthenticated(false);
      } else if (session) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        setUserEmail(email);
        setUserName(name);
        setIsAuthenticated(true);
        fetchData(false, email);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    }).catch(err => {
      console.error("Unexpected error checking session:", err);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore auth changes when in demo mode
      if (isDemoMode) return;

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserEmail(null);
        setIsAdmin(false);
        setEscolas([]);
        setVisitas([]);
      } else if (session) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || email.split('@')[0];
        setUserEmail(email);
        setUserName(name);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        fetchData(false, email);
        if (event === 'SIGNED_IN') {
          logAccess('LOGIN', 'SUCCESS', session.user.id, email);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const handleDemoLogin = () => {
    console.log('Demo login triggered');
    setIsDemoMode(true);
    setIsAuthenticated(true);
    setUserEmail('demo@sigar.gov.br');
    setUserName('Usuário Demonstração');
    setIsAdmin(true);
    fetchData(true);
    showNotification('success', 'Entrou no Modo de Demonstração SIGAR (Acesso Administrador).');
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserName(null);
      setIsAdmin(false);
    } else {
      try {
        await logAccess('LOGOUT', 'SUCCESS', undefined, userEmail || undefined);
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error signing out:", err);
      }
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsAdmin(false);
    }
    setCurrentView('DASHBOARD');
  };

  const handleSelectEscola = (id: string) => {
    setSelectedEscolaId(id);
    setCurrentView('DETALHE_ESCOLA');
  };

  const handleUpdateEscola = async (updatedEscola: Escola) => {
    if (isDemoMode) {
      setEscolas(prev => prev.map(e => e.id === updatedEscola.id ? updatedEscola : e));
      showNotification('success', 'Alteração simulada com sucesso (Modo Demo).');
      return;
    }

    try {
      // Snapshot current state to detect which child data actually changed
      const currentEscola = escolasRef.current.find(e => e.id === updatedEscola.id);
      const planoChanged = !currentEscola || currentEscola.planoAcao !== updatedEscola.planoAcao;
      const rhChanged = !currentEscola || currentEscola.recursosHumanos !== updatedEscola.recursosHumanos;
      const acompChanged = !currentEscola || currentEscola.acompanhamentoMensal !== updatedEscola.acompanhamentoMensal;

      const { error } = await supabase.from('escolas').update({
        nome: updatedEscola.nome,
        gestor: updatedEscola.gestor,
        coordenador: updatedEscola.coordenador,
        localizacao: updatedEscola.localizacao,
        segmentos: updatedEscola.segmentos,
        alunos_matriculados: updatedEscola.alunosMatriculados,
        indicadores: updatedEscola.indicadores,
        dados_educacionais: updatedEscola.dadosEducacionais
      }).eq('id', updatedEscola.id);

      await logAudit('UPDATE', 'ESCOLA', updatedEscola.id, {
        old: currentEscola,
        new: updatedEscola
      });

      if (error) throw error;

      // --- Metas de Ação: only sync if changed ---
      if (planoChanged) {
        const currentMetaIds = updatedEscola.planoAcao.map(m => m.id);
        const { data: existingMetas } = await supabase.from('metas_acao').select('id').eq('escola_id', updatedEscola.id);
        const metaIdsToDelete = (existingMetas || []).map((m: any) => m.id).filter((id: string) => !currentMetaIds.includes(id));
        if (metaIdsToDelete.length > 0) {
          const { error: delErr } = await supabase.from('metas_acao').delete().in('id', metaIdsToDelete);
          if (delErr) throw delErr;
        }
        if (updatedEscola.planoAcao.length > 0) {
          const { error: upsertErr } = await supabase.from('metas_acao').upsert(updatedEscola.planoAcao.map(m => ({
            id: m.id,
            escola_id: updatedEscola.id,
            descricao: m.descricao,
            prazo: m.prazo,
            status: m.status,
            responsavel: m.responsavel
          })));
          if (upsertErr) throw upsertErr;
        }
      }

      // --- Recursos Humanos: only sync if changed ---
      if (rhChanged) {
        const currentRhIds = updatedEscola.recursosHumanos.map(r => r.id);
        const { data: existingRh } = await supabase.from('recursos_humanos').select('id').eq('escola_id', updatedEscola.id);
        const rhIdsToDelete = (existingRh || []).map((r: any) => r.id).filter((id: string) => !currentRhIds.includes(id));
        if (rhIdsToDelete.length > 0) {
          const { error: delErr } = await supabase.from('recursos_humanos').delete().in('id', rhIdsToDelete);
          if (delErr) throw delErr;
        }
        if (updatedEscola.recursosHumanos.length > 0) {
          const { error: upsertErr } = await supabase.from('recursos_humanos').upsert(updatedEscola.recursosHumanos.map(r => ({
            id: r.id,
            escola_id: updatedEscola.id,
            funcao: r.funcao,
            nome: r.nome,
            telefone: r.telefone,
            email: r.email,
            data_nomeacao: r.dataNomeacao,
            tipo_vinculo: r.tipoVinculo,
            etapa_atuacao: r.etapaAtuacao,
            componente_curricular: r.componenteCurricular
          })));
          if (upsertErr) throw upsertErr;
        }
      }

      // --- Acompanhamento Mensal: only sync if changed ---
      if (acompChanged) {
        const currentAcompIds = updatedEscola.acompanhamentoMensal.map(a => a.id);
        const { data: existingAcomp } = await supabase.from('acompanhamento_mensal').select('id').eq('escola_id', updatedEscola.id);
        const acompIdsToDelete = (existingAcomp || []).map((a: any) => a.id).filter((id: string) => !currentAcompIds.includes(id));
        if (acompIdsToDelete.length > 0) {
          const { error: delErr } = await supabase.from('acompanhamento_mensal').delete().in('id', acompIdsToDelete);
          if (delErr) throw delErr;
        }
        if (updatedEscola.acompanhamentoMensal.length > 0) {
          const { error: upsertErr } = await supabase.from('acompanhamento_mensal').upsert(updatedEscola.acompanhamentoMensal.map(a => ({
            id: a.id,
            escola_id: updatedEscola.id,
            pergunta: a.pergunta,
            categoria: a.categoria,
            resposta: a.resposta,
            observacao: a.observacao
          })));
          if (upsertErr) throw upsertErr;
        }
      }

      setEscolas(prev => prev.map(e => e.id === updatedEscola.id ? updatedEscola : e));
      showNotification('success', 'Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showNotification('error', `Erro ao salvar: ${error?.message || 'Falha na operação.'}`);
    }
  };

  const handleSaveSchool = async (newSchool: Escola) => {
    if (isDemoMode) {
      setEscolas(prev => [...prev, newSchool]);
      showNotification('success', 'Escola adicionada (Modo Demo).');
      return;
    }

    try {
      const { error } = await supabase.from('escolas').insert({
        id: newSchool.id,
        nome: newSchool.nome,
        gestor: newSchool.gestor,
        coordenador: newSchool.coordenador,
        localizacao: newSchool.localizacao,
        segmentos: newSchool.segmentos,
        alunos_matriculados: newSchool.alunosMatriculados,
        indicadores: newSchool.indicadores,
        dados_educacionais: newSchool.dadosEducacionais
      });

      await logAudit('CREATE', 'ESCOLA', newSchool.id, newSchool);

      if (error) throw error;

      if (newSchool.acompanhamentoMensal.length > 0) {
        await supabase.from('acompanhamento_mensal').insert(newSchool.acompanhamentoMensal.map(a => ({
          id: a.id,
          escola_id: newSchool.id,
          pergunta: a.pergunta,
          categoria: a.categoria,
          resposta: a.resposta,
          observacao: a.observacao
        })));
      }

      setEscolas(prev => [...prev, newSchool]);
      showNotification('success', 'Escola cadastrada com sucesso!');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao cadastrar escola.');
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (isDemoMode) {
      setEscolas(escolas.filter(e => e.id !== id));
      setVisitas(visitas.filter(v => v.escolaId !== id));
      showNotification('success', 'Escola removida (Modo Demo).');
      return;
    }

    try {
      const { error } = await supabase.from('escolas').delete().eq('id', id);
      if (error) throw error;

      await logAudit('DELETE', 'ESCOLA', id, {});

      setEscolas(escolas.filter(e => e.id !== id));
      setVisitas(visitas.filter(v => v.escolaId !== id));
      showNotification('success', 'Escola e dados associados removidos com sucesso.');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao excluir escola do servidor.');
    }
  };

  const handleSaveVisit = async (newVisitData: Omit<Visita, 'id'>) => {
    const isEditing = !!selectedVisit;
    const visitId = isEditing ? selectedVisit!.id : generateUUID();
    const newVisit: Visita = { ...newVisitData, id: visitId };

    if (isDemoMode) {
      if (isEditing) {
        setVisitas(visitas.map(v => v.id === visitId ? newVisit : v));
      } else {
        setVisitas([newVisit, ...visitas]);
      }
      setCurrentView('DASHBOARD');
      setSelectedVisit(null);
      showNotification('success', isEditing ? 'Visita atualizada!' : 'Visita simulada com sucesso!');
      return;
    }

    try {
      const { error } = await supabase.from('visitas').upsert({
        id: visitId,
        escola_id: newVisit.escolaId,
        escola_nome: newVisit.escolaNome,
        data: newVisit.data,
        tipo: newVisit.tipo,
        foco: newVisit.foco,
        topicos_pauta: newVisit.topicosPauta,
        encaminhamentos_registrados: newVisit.encaminhamentosRegistrados,
        observacoes: newVisit.observacoes,
        encaminhamentos: newVisit.encaminhamentos,
        status: newVisit.status
      });

      await logAudit(isEditing ? 'UPDATE' : 'CREATE', 'VISITA', visitId, newVisit);

      if (error) throw error;

      if (isEditing) {
        setVisitas(visitas.map(v => v.id === visitId ? newVisit : v));
      } else {
        setVisitas([newVisit, ...visitas]);
      }
      setCurrentView('DASHBOARD');
      setSelectedVisit(null);
      showNotification('success', isEditing ? 'Visita atualizada com sucesso!' : 'Visita registrada com sucesso!');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Não foi possível salvar a visita.');
    }
  };

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de visita?')) return;

    if (isDemoMode) {
      setVisitas(visitas.filter(v => v.id !== id));
      showNotification('success', 'Visita removida (Modo Demo).');
      return;
    }

    try {
      const { error } = await supabase.from('visitas').delete().eq('id', id);
      if (error) throw error;
      await logAudit('DELETE', 'VISITA', id, {});
      setVisitas(visitas.filter(v => v.id !== id));
      showNotification('success', 'Registro de visita excluído com sucesso.');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao excluir visita.');
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, newStatus: Visita['status']) => {
    if (isDemoMode) {
      setVisitas(visitas.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
      showNotification('success', 'Status da visita atualizado (Modo Demo).');
      return;
    }

    try {
      const { error } = await supabase
        .from('visitas')
        .update({ status: newStatus })
        .eq('id', visitId);

      if (error) throw error;

      setVisitas(visitas.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
      showNotification('success', 'Status da visita atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating visit status:', error);
      showNotification('error', 'Erro ao atualizar o status da visita.');
    }
  };

  const handleSaveCoordenador = async (coord: Coordenador) => {
    if (isDemoMode) {
      if (coord.id) {
        setCoordenadores(coordenadores.map(c => c.id === coord.id ? coord : c));
      } else {
        const newId = generateUUID();
        setCoordenadores([...coordenadores, { ...coord, id: newId }]);
      }
      showNotification('success', 'Coordenador atualizado (Demo).');
      return;
    }

    try {
      if (coord.id) {
        const funcaoToSave = (coord.funcao as any) === '' ? null : coord.funcao;
        const { error } = await supabase.from('coordenadores').update({
          nome: coord.nome,
          contato: coord.contato,
          regiao: coord.regiao,
          funcao: funcaoToSave,
          status: coord.status || 'Ativo'
        }).eq('id', coord.id);

        await logAudit('UPDATE', 'COORDENADOR', coord.id, coord);

        if (error) throw error;

        await supabase.from('coordenador_escolas').delete().eq('coordenador_id', coord.id);
        if (coord.escolasIds.length > 0) {
          await supabase.from('coordenador_escolas').insert(
            coord.escolasIds.map(eid => ({ coordenador_id: coord.id, escola_id: eid }))
          );
        }

        setCoordenadores(coordenadores.map(c => c.id === coord.id ? coord : c));
        showNotification('success', 'Coordenador atualizado!');
      } else {
        const newId = generateUUID();
        const funcaoToSave = (coord.funcao as any) === '' ? null : coord.funcao;
        const { error } = await supabase.from('coordenadores').insert({
          id: newId,
          nome: coord.nome,
          contato: coord.contato,
          regiao: coord.regiao,
          funcao: funcaoToSave,
          status: coord.status || 'Ativo'
        });

        await logAudit('CREATE', 'COORDENADOR', newId, coord);

        if (error) throw error;

        if (coord.escolasIds.length > 0) {
          await supabase.from('coordenador_escolas').insert(
            coord.escolasIds.map(eid => ({ coordenador_id: newId, escola_id: eid }))
          );
        }

        setCoordenadores([...coordenadores, { ...coord, id: newId }]);
        showNotification('success', 'Coordenador cadastrado!');
      }
    } catch (error: any) {
      console.error("CoordinatorsManager Save Error:", error);
      showNotification('error', `Erro ao salvar coordenador: ${error.message || 'Desconhecido'}`);
    }
  };

  const handleDeleteCoordenador = async (id: string) => {
    if (isDemoMode) {
      setCoordenadores(coordenadores.filter(c => c.id !== id));
      showNotification('success', 'Removido (Demo).');
      return;
    }

    try {
      const { error } = await supabase.from('coordenadores').delete().eq('id', id);
      if (error) throw error;
      await logAudit('DELETE', 'COORDENADOR', id, {});
      setCoordenadores(coordenadores.filter(c => c.id !== id));
      showNotification('success', 'Coordenador removido.');
    } catch (error) {
      showNotification('error', 'Erro ao remover.');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'LISTA_ESCOLAS':
        return (
          <SchoolList
            escolas={escolas}
            onSelectEscola={handleSelectEscola}
            onSave={handleSaveSchool}
            onUpdate={handleUpdateEscola}
            onDelete={handleDeleteSchool}
          />
        );
      case 'DETALHE_ESCOLA':
        const escola = escolas.find(e => e.id === selectedEscolaId);
        if (!escola) return <div>Escola não encontrada</div>;
        return (
          <SchoolDetail
            escola={escola}
            coordenadores={coordenadores}
            historicoVisitas={visitas.filter(v => v.escolaId === escola.id)}
            onBack={() => setCurrentView('LISTA_ESCOLAS')}
            onUpdate={handleUpdateEscola}
            onUpdateVisitStatus={handleUpdateVisitStatus}
          />
        );
      case 'NOVA_VISITA':
        return (
          <div className="space-y-2">
            <VisitForm
              escolas={escolas}
              coordenadores={coordenadores}
              onSave={handleSaveVisit}
              onCancel={() => {
                setCurrentView('DASHBOARD');
                setSelectedVisit(null);
              }}
              visitToEdit={selectedVisit}
            />

            <div className="w-full space-y-6 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">REGISTROS DE VISITAS</h3>
                  <p className="text-sm text-slate-500 mt-1">Histórico completo de acompanhamento</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-5">Escola / Data</th>
                        <th className="px-6 py-5">Tipo</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visitas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhuma visita registrada até o momento.</td>
                        </tr>
                      ) : (
                        visitas.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{v.escolaNome}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{new Date(v.data + 'T12:00:00').toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{v.tipo}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${v.status === 'Realizada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : v.status === 'Relatório Pendente'
                                  ? 'bg-orange-50 text-orange-700 border-orange-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                {v.status === 'Relatório Pendente' ? 'Pendente' : v.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedVisit(v);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVisit(v.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVisitForPrint(v);
                                    setTimeout(() => {
                                      window.print();
                                      setSelectedVisitForPrint(null);
                                    }, 100);
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Imprimir"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {selectedVisitForPrint && (
              <PrintableVisitReport
                visita={selectedVisitForPrint}
                escola={escolas.find(e => e.id === selectedVisitForPrint.escolaId)}
                coordenador={coordenadores.find(c => c.escolasIds.includes(selectedVisitForPrint.escolaId))}
              />
            )}
          </div>
        );
      case 'COORDENADORES':
        if (!isAdmin) return <div>Acesso negado.</div>;
        return (
          <CoordinatorsManager
            coordenadores={coordenadores}
            escolas={escolas}
            visitas={visitas}
            onSave={handleSaveCoordenador}
            onDelete={handleDeleteCoordenador}
          />
        );
      case 'RELATORIOS':
        return (
          <ReportsModule
            visitas={visitas}
            escolas={escolas}
            coordenadores={coordenadores}
          />
        );
      case 'INDICADORES':
        return (
          <IndicatorsPanel
            escolas={escolas}
            onUpdateEscola={handleUpdateEscola}
          />
        );
      case 'ANALISE_PARC':
        return (
          <FluenciaParcDashboard
            escolas={escolas}
            coordenadores={coordenadores}
          />
        );
      case 'ANALISE_CNCA_PNRA':
        return (
          <CncaPnraDashboard
            escolas={escolas}
            coordenadores={coordenadores}
          />
        );
      case 'ANALISE_SEAMA':
        return (
          <SeamaDashboard
            escolas={escolas}
            coordenadores={coordenadores}
          />
        );
      case 'ANALISE_SAEB':
        return (
          <SaebDashboard
            escolas={escolas}
            coordenadores={coordenadores}
          />
        );
      case 'INSTRUMENTAIS_GESTAO':
        return <InstrumentaisGestao escolas={escolas} />;
      case 'CONSELHO_CLASSE':
        return <ConselhoClasse />;
      case 'NOTIFICACOES':
        return (
          <NotificationsPanel
            escolas={escolas}
            coordenadores={coordenadores}
            onNavigateToSchool={(id) => {
              setSelectedEscolaId(id);
              setCurrentView('DETALHE_ESCOLA');
            }}
          />
        );
      case 'AUDIT_LOGS':
        if (!isAdmin) return <div>Acesso restrito.</div>;
        return (
          <AuditLogDashboard onBack={() => setCurrentView('DASHBOARD')} />
        )
      case 'GESTAO_USUARIOS':
        if (!isAdmin && effectiveUser?.funcao !== 'Coordenador Regional') return <div>Acesso restrito.</div>;
        return (
          <UserManagement
            userEmail={userEmail}
            isAdmin={isAdmin}
            currentUserRole={effectiveUser?.funcao}
            coordenadores={coordenadores}
            escolas={escolas}
            isDemoMode={isDemoMode}
          />
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  // Determine the effective user context for the dashboard
  const effectiveUser = useMemo(() => {
    return coordenadores.find(c => c.contato === userEmail);
  }, [coordenadores, userEmail]);

  // Calculate global notifications (pendencies) for the current user
  const notificationCount = useMemo(() => {
    if (isDemoMode) return 5; // Force pendencies for Demo Mode to show alerts

    // If admin, check ALL schools (matching NotificationsPanel behavior)
    // If not admin, check only assigned schools
    const targetSchools = isAdmin
      ? escolas
      : (effectiveUser ? escolas.filter(e => effectiveUser.escolasIds.includes(e.id)) : []);

    if (targetSchools.length === 0) return 0;

    try {
      let total = 0;
      targetSchools.forEach(escola => {
        total += checkSchoolPendencies(escola).length;
      });
      return total;
    } catch (error) {
      console.error("Error calculating notifications:", error);
      return 0;
    }
  }, [effectiveUser, escolas, isAdmin, isDemoMode]);

  if (isLoadingAuth) {
    return <Preloader message="Autenticando sessão..." />;
  }



  if (!isAuthenticated) {
    return <LoginPage onLogin={() => { }} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <Layout
      currentView={currentView}
      onChangeView={setCurrentView}
      onLogout={handleLogout}
      isAdmin={isAdmin}
      userName={userName}
      userEmail={userEmail}
      notificationCount={notificationCount}
      userRole={effectiveUser?.funcao}
    >
      {isDemoMode && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 mb-6 flex justify-between items-center rounded-r-md shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">Modo de Demonstração SIGAR:</span>
            <span>Você está visualizando dados fictícios como Administrador.</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-amber-200 hover:bg-amber-300 px-2 py-1 rounded transition font-bold"
          >
            SAIR DO DEMO
          </button>
        </div>
      )}

      {currentView === 'DASHBOARD' ? (
        <Dashboard
          escolas={escolas}
          visitas={visitas}
          coordenadores={coordenadores}
          currentUser={effectiveUser}
          onNavigateToEscolas={() => setCurrentView('LISTA_ESCOLAS')}
          onNavigateToVisitas={() => {
            setCurrentView('NOVA_VISITA');
            setSelectedVisit(null);
          }}
          onNavigateToDetail={(id) => {
            setSelectedEscolaId(id);
            setCurrentView('DETALHE_ESCOLA');
          }}
          onNavigateToNotifications={() => setCurrentView('NOTIFICACOES')}
          notificationCount={notificationCount}
        />
      ) : (
        renderContent()
      )}
    </Layout >
  );
}
