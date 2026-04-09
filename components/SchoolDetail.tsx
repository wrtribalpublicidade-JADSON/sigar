import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, History, FileText, Save, Users, Calculator, Briefcase, Plus, Trash2, Edit, ClipboardCheck, AlertCircle, AlertTriangle, CheckCircle2, School as SchoolIcon, LayoutDashboard, GraduationCap, Clock, Activity, Award, BookOpen, UserPlus, X, MapPin, ChevronRight, CheckSquare, Printer } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { PrintableVisitReport } from './PrintableVisitReport';
import { PrintableRhReport } from './PrintableRhReport';
import { PrintableChecklistReport } from './PrintableChecklistReport';
import { PrintableCartaApresentacao } from './PrintableCartaApresentacao';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { generateUUID } from '../utils';
import { generateAcompanhamentoMensal } from '../constants';
import { Button } from './ui/Button';
import { Escola, Visita, DadosEducacionais, ItemAcompanhamento, RecursoHumano, MetaAcao, StatusMeta, Coordenador, Segmento } from '../types';
import { igPlanoAcaoService } from '../services/gestaoConselhoService';

interface SchoolDetailProps {
  escola: Escola;
  coordenadores: Coordenador[];
  historicoVisitas: Visita[];
  onBack: () => void;
  onUpdate: (escola: Escola) => void;
  onUpdateVisitStatus: (visitId: string, newStatus: Visita['status']) => void;
}

const COLORS = {
  brand: '#FF4D00',
  dark: '#000000',
  grey: '#F4F4F5',
  acid: '#D6FF00',
  signal: '#FF1F00'
};

export const SchoolDetail: React.FC<SchoolDetailProps> = ({ escola, coordenadores = [], historicoVisitas, onBack, onUpdate, onUpdateVisitStatus }) => {
  const [activeTab, setActiveTab] = useState<'plano' | 'visitas' | 'turmas' | 'rh' | 'acompanhamento'>('acompanhamento');
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<Visita | null>(null);
  const [selectedServidorForCarta, setSelectedServidorForCarta] = useState<RecursoHumano | null>(null);
  const [formData, setFormData] = useState<DadosEducacionais>(escola.dadosEducacionais);

  const regionalCoordinator = useMemo(() => {
    return coordenadores.find(c => c.escolasIds.includes(escola.id));
  }, [coordenadores, escola.id]);

  const handlePrint = (visita: Visita) => {
    setSelectedVisitForPrint(visita);
    setTimeout(() => {
      window.print();
      setSelectedVisitForPrint(null);
    }, 100);
  };

  // helper: check if servidor is eligible for a letter
  const servidorElegivelCarta = (funcao: string) => {
    const f = funcao.toLowerCase();
    return (
      f.includes('professor') ||
      f.includes('gestor') ||
      f.includes('coordenador')
    );
  };

  const handlePrintCarta = (rh: RecursoHumano) => {
    setSelectedServidorForCarta(rh);
    setTimeout(() => {
      window.print();
      setSelectedServidorForCarta(null);
    }, 300);
  };

  const [isPrintingRh, setIsPrintingRh] = useState(false);

  const handlePrintRh = () => {
    setIsPrintingRh(true);
    setTimeout(() => {
      window.print();
      setIsPrintingRh(false);
    }, 500);
  };

  const [isPrintingChecklist, setIsPrintingChecklist] = useState(false);

  const handlePrintChecklist = () => {
    setIsPrintingChecklist(true);
    setTimeout(() => {
      window.print();
      setIsPrintingChecklist(false);
    }, 500);
  };

  const initialAcompanhamento = useMemo(() => {
    const template = generateAcompanhamentoMensal();
    if (escola.acompanhamentoMensal && escola.acompanhamentoMensal.length > 0) {
      const savedMap = new Map(escola.acompanhamentoMensal.map(item => [item.pergunta, item]));

      return template.map(templateItem => {
        const savedItem = savedMap.get(templateItem.pergunta);
        if (savedItem) {
          return {
            ...templateItem,
            id: savedItem.id,
            resposta: savedItem.resposta,
            observacao: savedItem.observacao
          };
        }
        return templateItem;
      });
    }
    return template;
  }, [escola.id, escola.acompanhamentoMensal]);

  const [localAcompanhamento, setLocalAcompanhamento] = useState<ItemAcompanhamento[]>(initialAcompanhamento);

  useEffect(() => {
    setLocalAcompanhamento(initialAcompanhamento);
  }, [initialAcompanhamento]);

  const [isAddingRh, setIsAddingRh] = useState(false);
  const [editingRhId, setEditingRhId] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string>('');
  const [rhForm, setRhForm] = useState<RecursoHumano>({
    id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '',
    tipoVinculo: 'Efetivo', cargaHoraria: '', cpf: '', dataNascimento: '',
    etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: []
  });

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState<MetaAcao>({
    id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: ''
  });

  // Local state for plano de ação, fetched directly to ensure freshness
  const [localPlanoAcao, setLocalPlanoAcao] = useState<MetaAcao[]>(escola.planoAcao || []);
  const [isLoadingPlano, setIsLoadingPlano] = useState(false);

  useEffect(() => {
    const fetchPlano = async () => {
      if (!escola.id) return;
      setIsLoadingPlano(true);
      try {
        const data = await igPlanoAcaoService.getAll(escola.id);
        if (data && Array.isArray(data)) {
          setLocalPlanoAcao(data.map((m: any) => ({ ...m, status: m.status as StatusMeta })));
        }
      } catch (e) {
        console.error('Erro ao carregar plano de ação:', e);
        // fallback to prop data
        setLocalPlanoAcao(escola.planoAcao || []);
      } finally {
        setIsLoadingPlano(false);
      }
    };
    fetchPlano();
  }, [escola.id]);

  const handleInputChange = (section: keyof DadosEducacionais, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: Number(value) }
    }));
  };

  const handleTurmaChange = (
    segmento: 'infantil' | 'fundamental',
    nivel: string,
    tipo: 'turmas' | 'alunos',
    turno: 'integral' | 'manha' | 'tarde',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      matriculaDetalhada: {
        ...prev.matriculaDetalhada,
        [segmento]: {
          ...prev.matriculaDetalhada[segmento],
          [nivel]: {
            ...(prev.matriculaDetalhada[segmento] as any)[nivel],
            [tipo]: {
              ...(prev.matriculaDetalhada[segmento] as any)[nivel][tipo],
              [turno]: Number(value)
            }
          }
        }
      }
    }));
  };

  const handleSaveIndicators = () => {
    // 1. Calcular totais do detalhamento
    const det = formData.matriculaDetalhada;
    const sumAlunos = (node: any) => (node.alunos.integral || 0) + (node.alunos.manha || 0) + (node.alunos.tarde || 0);

    const infantilTotal = sumAlunos(det.infantil.creche2) + sumAlunos(det.infantil.creche3) +
      sumAlunos(det.infantil.pre1) + sumAlunos(det.infantil.pre2);

    const iniciaisTotal = sumAlunos(det.fundamental.ano1) + sumAlunos(det.fundamental.ano2) +
      sumAlunos(det.fundamental.ano3) + sumAlunos(det.fundamental.ano4) +
      sumAlunos(det.fundamental.ano5);

    const finaisTotal = sumAlunos(det.fundamental.ano6) + sumAlunos(det.fundamental.ano7) +
      sumAlunos(det.fundamental.ano8) + sumAlunos(det.fundamental.ano9);

    const ejaTotal = sumAlunos(det.fundamental.eja);
    const totalGeral = infantilTotal + iniciaisTotal + finaisTotal + ejaTotal;

    // 2. Sincronizar com o resumo e o total da escola
    const updatedFormData: DadosEducacionais = {
      ...formData,
      matricula: {
        infantil: infantilTotal,
        anosIniciais: iniciaisTotal,
        anosFinais: finaisTotal,
        eja: ejaTotal
      }
    };

    const updatedEscola = {
      ...escola,
      alunosMatriculados: totalGeral,
      dadosEducacionais: updatedFormData,
      indicadores: { ...escola.indicadores, ideb: formData.avaliacoesExternas.ideb }
    };

    onUpdate(updatedEscola);
  };

  const handleAddRh = () => {
    if (editingRhId) {
      // Update existing
      const updatedList = (escola.recursosHumanos || []).map(rh =>
        rh.id === editingRhId ? { ...rhForm, id: editingRhId } : rh
      );
      onUpdate({ ...escola, recursosHumanos: updatedList });
      setEditingRhId(null);
    } else {
      // Add new
      const newRh = { ...rhForm, id: generateUUID() };
      const updatedList = [...(escola.recursosHumanos || []), newRh];
      onUpdate({ ...escola, recursosHumanos: updatedList });
    }
    setIsAddingRh(false);
    setCpfError('');
    setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', cargaHoraria: '', cpf: '', dataNascimento: '', etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] });
  };

  const handleEditRh = (rh: RecursoHumano) => {
    setRhForm({ ...rh });
    setEditingRhId(rh.id);
    setIsAddingRh(true);
  };

  const handleDeleteRh = (id: string) => {
    if (confirm('Deseja remover este servidor?')) {
      const updatedList = (escola.recursosHumanos || []).filter(rh => rh.id !== id);
      onUpdate({ ...escola, recursosHumanos: updatedList });
    }
  };

  const handleAcompanhamentoChange = (id: string, field: 'resposta' | 'observacao', value: any) => {
    setLocalAcompanhamento(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAcompanhamento = () => {
    const pendentesCount = localAcompanhamento.filter(i => !i.resposta).length;
    if (pendentesCount > 0) {
      alert(`Atenção: Existem ${pendentesCount} itens sem resposta. Por favor, preencha todos os itens antes de salvar.`);
      return;
    }
    onUpdate({ ...escola, acompanhamentoMensal: localAcompanhamento });
  };

  const handleClearAcompanhamento = () => {
    if (confirm('Tem certeza que deseja apagar todos os registros do Checklist? Esta ação não pode ser desfeita.')) {
      const emptyChecklist = generateAcompanhamentoMensal();
      setLocalAcompanhamento(emptyChecklist);
      onUpdate({ ...escola, acompanhamentoMensal: emptyChecklist });
    }
  };

  const handleSaveMeta = () => {
    if (!metaForm.descricao || !metaForm.prazo) return;
    let updatedPlano;
    if (metaForm.id) {
      updatedPlano = localPlanoAcao.map(m => m.id === metaForm.id ? metaForm : m);
    } else {
      const newMeta = { ...metaForm, id: generateUUID() };
      updatedPlano = [...localPlanoAcao, newMeta];
    }
    setLocalPlanoAcao(updatedPlano);
    onUpdate({ ...escola, planoAcao: updatedPlano });
    setIsEditingMeta(false);
    setMetaForm({ id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: '' });
  };

  const handleEditMeta = (meta: MetaAcao) => {
    setMetaForm(meta);
    setIsEditingMeta(true);
  };

  const handleDeleteMeta = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      const updatedPlano = localPlanoAcao.filter(m => m.id !== id);
      setLocalPlanoAcao(updatedPlano);
      onUpdate({ ...escola, planoAcao: updatedPlano });
    }
  };

  const indicatorsData = [
    { name: 'Frequência', value: escola.indicadores.frequenciaMedia, fill: COLORS.dark },
    { name: 'Fluência', value: escola.indicadores.fluenciaLeitora, fill: COLORS.brand },
    { name: 'Aprovação', value: escola.indicadores.taxaAprovacao, fill: '#71717A' },
  ];

  const rowsInfantil = [
    { key: 'creche2', label: 'CRECHE II' },
    { key: 'creche3', label: 'CRECHE III' },
    { key: 'pre1', label: 'PRÉ I' },
    { key: 'pre2', label: 'PRÉ II' },
  ];

  const rowsFundamental = [
    { key: 'ano1', label: '1º ANO' }, { key: 'ano2', label: '2º ANO' }, { key: 'ano3', label: '3º ANO' },
    { key: 'ano4', label: '4º ANO' }, { key: 'ano5', label: '5º ANO' }, { key: 'ano6', label: '6º ANO' },
    { key: 'ano7', label: '7º ANO' }, { key: 'ano8', label: '8º ANO' }, { key: 'ano9', label: '9º ANO' },
    { key: 'eja', label: 'EJA' },
  ];

  const renderRow = (segmento: 'infantil' | 'fundamental', rowKey: string, label: string) => {
    const data = (formData.matriculaDetalhada as any)[segmento][rowKey];
    const totalTurmas = (data.turmas.integral || 0) + (data.turmas.manha || 0) + (data.turmas.tarde || 0);
    const totalAlunos = (data.alunos.integral || 0) + (data.alunos.manha || 0) + (data.alunos.tarde || 0);

    const inputClass = "w-full text-center bg-white border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-semibold text-slate-700 py-2.5 appearance-none outline-none hover:border-slate-300";

    return (
      <tr key={rowKey} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors group text-sm">
        <td className="px-5 py-3.5 font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 whitespace-nowrap">{label}</td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.turmas.integral} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'integral', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.turmas.manha} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'manha', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.turmas.tarde} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'tarde', e.target.value)} /></td>
        <td className="px-3 py-3.5 bg-slate-100/80 text-slate-800 text-center font-bold border-x border-slate-200">{totalTurmas}</td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.alunos.integral} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'integral', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.alunos.manha} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'manha', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" className={inputClass} value={data.alunos.tarde} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'tarde', e.target.value)} /></td>
        <td className="px-3 py-3.5 text-orange-600 text-center font-bold">{totalAlunos}</td>
      </tr>
    );
  };

  const renderTotalFooter = (segmento: 'infantil' | 'fundamental', rows: { key: string }[]) => {
    let tInt = 0, tMan = 0, tTar = 0, tTot = 0;
    let aInt = 0, aMan = 0, aTar = 0, aTot = 0;
    rows.forEach(r => {
      const d = (formData.matriculaDetalhada as any)[segmento][r.key];
      tInt += (d.turmas.integral || 0); tMan += (d.turmas.manha || 0); tTar += (d.turmas.tarde || 0);
      tTot += (d.turmas.integral || 0) + (d.turmas.manha || 0) + (d.turmas.tarde || 0);
      aInt += (d.alunos.integral || 0); aMan += (d.alunos.manha || 0); aTar += (d.alunos.tarde || 0);
      aTot += (d.alunos.integral || 0) + (d.alunos.manha || 0) + (d.alunos.tarde || 0);
    });

    return (
      <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-bold uppercase tracking-wide">
        <td className="px-5 py-4 font-bold">TOTAL</td>
        <td className="text-center">{tInt}</td>
        <td className="text-center">{tMan}</td>
        <td className="text-center">{tTar}</td>
        <td className="text-center bg-white/10 font-bold">{tTot}</td>
        <td className="text-center">{aInt}</td>
        <td className="text-center">{aMan}</td>
        <td className="text-center">{aTar}</td>
        <td className="text-center text-orange-400 font-bold">{aTot}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <PageHeader
        title={escola.nome}
        subtitle="Unidade Escolar do Sistema Municipal"
        icon={SchoolIcon}
        badgeText={`ID: ${escola.id.split('-')[0]}`}
        actions={[]}
        onBack={onBack}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Gestor(a)</p>
            <p className="font-bold text-slate-800">{escola.gestor}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Localização</p>
            <p className="font-bold text-slate-800">{escola.localizacao}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">IDEB</p>
            <p className="font-bold text-slate-800 text-2xl">{escola.indicadores.ideb.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        {[
          { id: 'acompanhamento', icon: ClipboardCheck, label: 'Monitoramento' },
          { id: 'turmas', icon: CheckSquare, label: 'Turmas' },
          { id: 'rh', icon: Briefcase, label: 'Recursos Humanos' },
          { id: 'plano', icon: Target, label: 'Plano de Ação' },
          { id: 'visitas', icon: History, label: 'Histórico' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] max-w-full">
        <div className="p-5 md:p-6">


          {
            activeTab === 'acompanhamento' && (() => {
              const pendentesCount = localAcompanhamento.filter(i => !i.resposta).length;

              return (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Checklist de Verificação</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        Status: Monitoramento Mensal
                        {pendentesCount > 0 ? (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                            {pendentesCount} itens pendentes
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 size={12} /> Tudo preenchido
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleClearAcompanhamento} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2">
                        <Trash2 size={18} /> Apagar Registros
                      </button>
                      <button onClick={handlePrintChecklist} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2">
                        <Printer size={18} /> Imprimir Relatório
                      </button>
                      <button onClick={handleSaveAcompanhamento} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                        <Save size={18} /> Salvar Registros
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-5">
                    {['Gestão', 'Financeiro'].map(cat => {
                      const itens = localAcompanhamento.filter(i => i.categoria === cat);
                      return (
                        <div key={cat} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                            <span>{cat}</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{itens.length} itens</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {itens.map(item => (
                              <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-800 leading-relaxed mb-3">{item.pergunta}</p>
                                  <input type="text" placeholder="Adicionar observação..." value={item.observacao} onChange={e => handleAcompanhamentoChange(item.id, 'observacao', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {['Sim', 'Não', 'Parcialmente'].map(res => (
                                    <button key={res} onClick={() => handleAcompanhamentoChange(item.id, 'resposta', res)} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${item.resposta === res ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{res}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          }

          {
            activeTab === 'turmas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Alunos por Turmas</h3>
                    <p className="text-slate-500 text-sm mt-1">Detalhamento de turmas e alunos por nível e turno.</p>
                  </div>
                  <button onClick={handleSaveIndicators} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><Save size={18} /> Salvar Dados</button>
                </div>
                <div className="space-y-8">
                  {['infantil', 'fundamental'].filter(seg => {
                    if (seg === 'fundamental') {
                      // Se a escola for EXCLUSIVAMENTE Infantil, não mostra fundamental
                      const isExclusivelyInfantil = escola.segmentos.every(s => s === Segmento.INFANTIL) && escola.segmentos.length > 0;
                      return !isExclusivelyInfantil;
                    }
                    if (seg === 'infantil') {
                      // Se a escola for EXCLUSIVAMENTE Fundamental (I ou II), não mostra infantil
                      const isExclusivelyFundamental = escola.segmentos.every(s => s === Segmento.FUNDAMENTAL_I || s === Segmento.FUNDAMENTAL_II) && escola.segmentos.length > 0;
                      return !isExclusivelyFundamental;
                    }
                    return true;
                  }).map(seg => (
                    <div key={seg} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-center">
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">{seg === 'infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th rowSpan={2} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-r border-slate-200 w-32">Nível</th>
                              <th colSpan={4} className="px-2 py-2.5 text-center text-xs font-bold text-slate-600 uppercase bg-slate-50 border-b border-r border-slate-200">Turmas</th>
                              <th colSpan={4} className="px-2 py-2.5 text-center text-xs font-bold text-orange-600 uppercase bg-orange-50/50 border-b border-slate-200">Alunos</th>
                            </tr>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="px-2 py-2.5 text-center">Integral</th>
                              <th className="px-2 py-2.5 text-center">Manhã</th>
                              <th className="px-2 py-2.5 text-center">Tarde</th>
                              <th className="px-3 py-2.5 text-center bg-slate-100/80 text-slate-500 border-x border-slate-200">Total</th>
                              <th className="px-2 py-2.5 text-center">Integral</th>
                              <th className="px-2 py-2.5 text-center">Manhã</th>
                              <th className="px-2 py-2.5 text-center">Tarde</th>
                              <th className="px-3 py-2.5 text-center text-orange-500 font-bold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(seg === 'infantil' ? rowsInfantil : rowsFundamental).map(r => renderRow(seg as any, r.key, r.label))}
                          </tbody>
                          <tfoot>
                            {renderTotalFooter(seg as any, seg === 'infantil' ? rowsInfantil : rowsFundamental)}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {

          }

          {
            activeTab === 'rh' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Recursos Humanos</h3>
                    <p className="text-slate-500 text-sm mt-1">Gestão de servidores da unidade escolar.</p>
                  </div>
                  {!isAddingRh && (
                    <div className="flex gap-2">
                      <button onClick={handlePrintRh} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2">
                        <Printer size={18} /> Imprimir Relatório
                      </button>
                      <button onClick={() => setIsAddingRh(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2">
                        <UserPlus size={18} /> Adicionar Servidor
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary badges */}
                {(escola.recursosHumanos?.length || 0) > 0 && (() => {
                  const efetivos = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Efetivo').length || 0;
                  const contratados = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Contratado').length || 0;
                  return (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span className="text-sm font-bold text-emerald-700">{efetivos} Efetivo{efetivos !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                        <span className="text-sm font-bold text-orange-700">{contratados} Contratado{contratados !== 1 ? 's' : ''}</span>
                      </div>
                      {(() => {
                        const permutados = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Permutado').length || 0;
                        if (permutados === 0) return null;
                        return (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                            <span className="text-sm font-bold text-blue-700">{permutados} Permutado{permutados !== 1 ? 's' : ''}</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Users size={14} className="text-slate-500" />
                        <span className="text-sm font-bold text-slate-600">{escola.recursosHumanos?.length || 0} Total</span>
                      </div>
                    </div>
                  );
                })()}

                {isAddingRh && (
                  <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6 mb-8">
                      {['nome', 'email', 'telefone'].map(f => (
                        <div key={f} className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">{f}</label>
                          <input type="text" value={(rhForm as any)[f]} onChange={e => setRhForm({ ...rhForm, [f]: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder={`Digite o ${f}...`} />
                        </div>
                      ))}

                      {/* CPF com máscara e validação */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">CPF</label>
                        <input
                          type="text"
                          maxLength={14}
                          value={rhForm.cpf || ''}
                          onChange={e => {
                            // Aplica máscara CPF: xxx.xxx.xxx-xx
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                            let masked = raw;
                            if (raw.length > 9) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
                            } else if (raw.length > 6) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
                            } else if (raw.length > 3) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
                            }
                            setRhForm({ ...rhForm, cpf: masked });
                            // Valida CPF
                            if (raw.length === 11) {
                              // Algoritmo de validação CPF
                              const digits = raw.split('').map(Number);
                              const calcDigit = (arr: number[], len: number) => {
                                const sum = arr.slice(0, len).reduce((acc, d, i) => acc + d * (len + 1 - i), 0);
                                const r = sum % 11;
                                return r < 2 ? 0 : 11 - r;
                              };
                              const valid = calcDigit(digits, 9) === digits[9] && calcDigit(digits, 10) === digits[10]
                                && !/^(\d)\1{10}$/.test(raw);
                              setCpfError(valid ? '' : 'CPF inválido');
                            } else {
                              setCpfError('');
                            }
                          }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                            cpfError ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          placeholder="000.000.000-00"
                        />
                        {cpfError && <p className="text-xs text-red-500 font-semibold mt-1">{cpfError}</p>}
                      </div>

                      {/* Data de Nascimento */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Data de Nascimento</label>
                        <input
                          type="date"
                          value={rhForm.dataNascimento || ''}
                          onChange={e => setRhForm({ ...rhForm, dataNascimento: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Função</label>
                        <select value={rhForm.funcao} onChange={e => setRhForm({ ...rhForm, funcao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="">Selecione a função...</option>
                          <option value="Gestor(a) Geral">Gestor(a) Geral</option>
                          <option value="Gestor(a) Pedagógico(a)">Gestor(a) Pedagógico(a)</option>
                          <option value="Coordenador(a) Pedagógico(a)">Coordenador(a) Pedagógico(a)</option>
                          <option value="Professor(a)">Professor(a)</option>
                          <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                          <option value="Vigia">Vigia</option>
                          <option value="Merendeira">Merendeira</option>
                          <option value="Zelador">Zelador</option>
                          <option value="Auxiliar de Serviços Gerais">Auxiliar de Serviços Gerais</option>
                          <option value="Porteiro">Porteiro</option>
                          <option value="Auxiliar de Creche">Auxiliar de Creche</option>
                          <option value="Monitor(a) de Atividade Complementar">Monitor(a) de Atividade Complementar</option>
                          <option value="Profissional de Apoio">Profissional de Apoio</option>
                          <option value="Monitor de Transporte Escolar">Monitor de Transporte Escolar</option>
                          <option value="Professor do AEE">Professor do AEE</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Tipo de Vínculo</label>
                        <select value={rhForm.tipoVinculo} onChange={e => setRhForm({ ...rhForm, tipoVinculo: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="Efetivo">Efetivo</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Permutado">Permutado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Carga Horária</label>
                        <select value={rhForm.cargaHoraria || ''} onChange={e => setRhForm({ ...rhForm, cargaHoraria: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="">Selecione a carga horária...</option>
                          <option value="20h">20 horas</option>
                          <option value="25h">25 horas</option>
                          <option value="40h">40 horas</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Data da Nomeação</label>
                        <input type="date" value={rhForm.dataNomeacao} onChange={e => setRhForm({ ...rhForm, dataNomeacao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
                      </div>
                      {rhForm.funcao === 'Professor(a)' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Etapa de Atuação</label>
                          <select value={rhForm.etapaAtuacao || ''} onChange={e => setRhForm({ ...rhForm, etapaAtuacao: e.target.value as any, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                            <option value="">Selecione a etapa...</option>
                            <option value="Educação Infantil">Educação Infantil</option>
                            <option value="Anos Iniciais">Anos Iniciais</option>
                            <option value="Anos Finais">Anos Finais</option>
                            <option value="EJA">EJA</option>
                            <option value="Sala de Recurso">Sala de Recurso</option>
                            <option value="Recomposição - Língua Portuguesa">Recomposição - Língua Portuguesa</option>
                            <option value="Recomposição - Matemática">Recomposição - Matemática</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Educação Infantil' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Modalidade Infantil</label>
                          <div className="flex gap-4">
                            {['Creche', 'Pré-Escola'].map(mod => (
                              <label key={mod} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rhForm.modalidadeInfantil?.includes(mod as any)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setRhForm({ ...rhForm, modalidadeInfantil: [...(rhForm.modalidadeInfantil || []), mod as any] });
                                    } else {
                                      setRhForm({ ...rhForm, modalidadeInfantil: (rhForm.modalidadeInfantil || []).filter(m => m !== mod) });
                                    }
                                  }}
                                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-700">{mod}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Anos Iniciais' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Ano/Série de Atuação</label>
                          <div className="flex flex-wrap gap-4">
                            {['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'].map(ano => (
                              <label key={ano} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rhForm.anosIniciaisAtuacao?.includes(ano as any)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setRhForm({ ...rhForm, anosIniciaisAtuacao: [...(rhForm.anosIniciaisAtuacao || []), ano as any] });
                                    } else {
                                      setRhForm({ ...rhForm, anosIniciaisAtuacao: (rhForm.anosIniciaisAtuacao || []).filter(a => a !== ano) });
                                    }
                                  }}
                                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-700">{ano}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Anos Finais' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Componente Curricular</label>
                          <select value={rhForm.componenteCurricular || ''} onChange={e => setRhForm({ ...rhForm, componenteCurricular: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                            <option value="">Selecione o componente...</option>
                            <option value="Língua Portuguesa">Língua Portuguesa</option>
                            <option value="Matemática">Matemática</option>
                            <option value="Geografia">Geografia</option>
                            <option value="História">História</option>
                            <option value="Ciências">Ciências</option>
                            <option value="Educação Física">Educação Física</option>
                            <option value="Língua Inglesa">Língua Inglesa</option>
                            <option value="Arte">Arte</option>
                            <option value="Ensino Religioso">Ensino Religioso</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddRh} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20">{editingRhId ? 'Atualizar Dados' : 'Salvar Dados'}</button>
                      <button onClick={() => { setIsAddingRh(false); setEditingRhId(null); setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] }); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold">Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Table view */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="text-left px-6 py-4">Nome / Função</th>
                          <th className="text-left px-4 py-4">Contato</th>
                          <th className="text-center px-4 py-4">Vínculo</th>
                          <th className="text-center px-4 py-4">Atuação</th>
                          <th className="text-center px-4 py-4 w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escola.recursosHumanos?.map(rh => (
                          <tr key={rh.id} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 uppercase text-sm">{rh.nome}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {rh.funcao}
                                {rh.dataNomeacao && <> • Desde {new Date(rh.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR')}</>}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {rh.telefone && <div className="text-sm text-slate-700 font-medium">{rh.telefone}</div>}
                              {rh.email && <div className="text-xs text-orange-500 mt-0.5">{rh.email}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${rh.tipoVinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-700' : rh.tipoVinculo === 'Permutado' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {rh.tipoVinculo}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-600">
                              {rh.etapaAtuacao || '-'}
                              {rh.modalidadeInfantil && rh.modalidadeInfantil.length > 0 && <div className="text-xs text-slate-400 mt-0.5">{rh.modalidadeInfantil.join(', ')}</div>}
                              {rh.anosIniciaisAtuacao && rh.anosIniciaisAtuacao.length > 0 && <div className="text-xs text-slate-400 mt-0.5">{rh.anosIniciaisAtuacao.join(', ')}</div>}
                              {rh.componenteCurricular && <div className="text-xs text-slate-400 mt-0.5">{rh.componenteCurricular}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {servidorElegivelCarta(rh.funcao) && (
                                  <button
                                    title="Imprimir Carta de Apresentação"
                                    onClick={() => handlePrintCarta(rh)}
                                    className="text-slate-300 hover:text-indigo-500 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                                  >
                                    <Printer size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleEditRh(rh)} className="text-slate-300 hover:text-orange-500 transition-colors p-1.5 hover:bg-orange-50 rounded-lg"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteRh(rh.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!escola.recursosHumanos || escola.recursosHumanos.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Nenhum servidor cadastrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === 'plano' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Plano de Ação</h3>
                    <p className="text-sm text-slate-500 mt-1">Gestão de metas e prazos para melhoria dos indicadores.</p>
                  </div>
                  {!isEditingMeta && <button onClick={() => { setMetaForm({ id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: '' }); setIsEditingMeta(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><Target size={18} /> Nova Meta</button>}
                </div>

                {isEditingMeta && (
                  <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição da Meta</label>
                        <input type="text" value={metaForm.descricao} onChange={e => setMetaForm({ ...metaForm, descricao: e.target.value })} className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-orange-500 focus:outline-none placeholder-slate-300" placeholder="Descreva a meta..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prazo</label>
                          <input type="date" value={metaForm.prazo} onChange={e => setMetaForm({ ...metaForm, prazo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável</label>
                          <input type="text" value={metaForm.responsavel} onChange={e => setMetaForm({ ...metaForm, responsavel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do responsável" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                          <select value={metaForm.status} onChange={e => setMetaForm({ ...metaForm, status: e.target.value as StatusMeta })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option value={StatusMeta.NAO_INICIADO}>{StatusMeta.NAO_INICIADO}</option>
                            <option value={StatusMeta.EM_ANDAMENTO}>{StatusMeta.EM_ANDAMENTO}</option>
                            <option value={StatusMeta.CONCLUIDO}>{StatusMeta.CONCLUIDO}</option>
                            <option value={StatusMeta.ATRASADO}>{StatusMeta.ATRASADO}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button onClick={handleSaveMeta} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20">Salvar Meta</button>
                        <button onClick={() => setIsEditingMeta(false)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold">Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {isLoadingPlano ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Carregando ações...</div>
                  ) : localPlanoAcao.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Nenhuma meta cadastrada.</div>
                  ) : null}
                  {!isLoadingPlano && localPlanoAcao.map(meta => (
                    <div key={meta.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${meta.status === StatusMeta.CONCLUIDO ? 'bg-emerald-100 text-emerald-700' : meta.status === StatusMeta.EM_ANDAMENTO ? 'bg-blue-100 text-blue-700' : meta.status === StatusMeta.ATRASADO ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{meta.status}</span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock size={12} /> {meta.prazo}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight">{meta.descricao}</h4>
                        <p className="text-xs font-medium text-orange-600 mt-2 uppercase tracking-wide">Responsável: {meta.responsavel}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditMeta(meta)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteMeta(meta.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {
            activeTab === 'visitas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">REGISTROS DE VISITAS</h3>
                  <p className="text-sm text-slate-500 mt-1">Histórico completo de acompanhamento</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-white uppercase tracking-wider items-center">
                      <div className="col-span-5">Escola / Data</div>
                      <div className="col-span-3 text-center">Tipo</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-right">Ações</div>
                    </div>
                  </div>

                  {historicoVisitas.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <p className="font-medium text-sm">Nenhuma visita registrada até o momento.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {historicoVisitas.map(visita => (
                        <div key={visita.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors group text-sm">
                          <div className="col-span-5">
                            <div className="font-bold text-slate-800">{new Date(visita.data + 'T12:00:00').toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{escola.nome}</div>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${visita.tipo === 'Emergencial' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              {visita.tipo}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${visita.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' : visita.status === 'Planejada' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visita.status === 'Realizada' ? 'bg-emerald-500' : visita.status === 'Planejada' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                              {visita.status}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                            <button
                              onClick={() => handlePrint(visita)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Printer size={14} /> Relatório
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedVisitForPrint && (
                    <PrintableVisitReport
                      visita={selectedVisitForPrint}
                      escola={escola}
                      coordenador={regionalCoordinator}
                    />
                  )}
                </div>
              </div>
            )
          }
        </div>
      </div>

      {isPrintingRh && (
        <PrintableRhReport
          escola={escola}
          coordenador={regionalCoordinator}
        />
      )}

      {isPrintingChecklist && (
        <PrintableChecklistReport
          escola={escola}
          acompanhamentoMensal={localAcompanhamento}
        />
      )}

      {selectedServidorForCarta && (
        <PrintableCartaApresentacao
          escola={escola}
          servidor={selectedServidorForCarta}
          coordenadorRegional={regionalCoordinator}
        />
      )}
    </div>
  );
};
