import React, { useState, useMemo } from 'react';
import { ArrowLeft, Target, TrendingUp, History, FileText, Save, Users, Calculator, Briefcase, Plus, Trash2, Edit, ClipboardCheck, AlertCircle, AlertTriangle, CheckCircle2, School as SchoolIcon, LayoutDashboard, GraduationCap, Clock, Activity, Award, BookOpen, UserPlus, X, MapPin, ChevronRight, CheckSquare, Printer } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { PrintableVisitReport } from './PrintableVisitReport';
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
import { Escola, Visita, DadosEducacionais, ItemAcompanhamento, RecursoHumano, MetaAcao, StatusMeta, Coordenador } from '../types';

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
  const [activeTab, setActiveTab] = useState<'indicadores' | 'plano' | 'visitas' | 'cadastro' | 'turmas' | 'rh' | 'acompanhamento'>('indicadores');
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<Visita | null>(null);
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

  const initialAcompanhamento = useMemo(() => {
    if (escola.acompanhamentoMensal && escola.acompanhamentoMensal.length > 0) {
      return escola.acompanhamentoMensal;
    }
    return generateAcompanhamentoMensal();
  }, [escola.id]);

  const [localAcompanhamento, setLocalAcompanhamento] = useState<ItemAcompanhamento[]>(initialAcompanhamento);
  const [isAddingRh, setIsAddingRh] = useState(false);
  const [editingRhId, setEditingRhId] = useState<string | null>(null);
  const [rhForm, setRhForm] = useState<RecursoHumano>({
    id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', etapaAtuacao: undefined, componenteCurricular: ''
  });

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState<MetaAcao>({
    id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: ''
  });

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
    const updatedEscola = {
      ...escola,
      dadosEducacionais: formData,
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
    setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', etapaAtuacao: undefined, componenteCurricular: '' });
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
    onUpdate({ ...escola, acompanhamentoMensal: localAcompanhamento });
  };

  const handleSaveMeta = () => {
    if (!metaForm.descricao || !metaForm.prazo) return;
    let updatedPlano;
    if (metaForm.id) {
      updatedPlano = escola.planoAcao.map(m => m.id === metaForm.id ? metaForm : m);
    } else {
      const newMeta = { ...metaForm, id: generateUUID() };
      updatedPlano = [...escola.planoAcao, newMeta];
    }
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
      const updatedPlano = escola.planoAcao.filter(m => m.id !== id);
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
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <PageHeader
        title={escola.nome}
        subtitle="Unidade Escolar do Sistema Municipal"
        icon={SchoolIcon}
        badgeText={`ID: ${escola.id.split('-')[0]}`}
        actions={[]}
        onBack={onBack}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Gestor(a)</p>
            <p className="font-bold text-slate-800">{escola.gestor}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Localização</p>
            <p className="font-bold text-slate-800">{escola.localizacao}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
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
          { id: 'indicadores', icon: TrendingUp, label: 'Analytics' },
          { id: 'acompanhamento', icon: ClipboardCheck, label: 'Monitoramento' },
          { id: 'cadastro', icon: FileText, label: 'Dados' },
          { id: 'turmas', icon: CheckSquare, label: 'Turmas' },
          { id: 'rh', icon: Briefcase, label: 'Recursos Humanos' },
          { id: 'plano', icon: Target, label: 'Plano de Ação' },
          { id: 'visitas', icon: History, label: 'Histórico' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8 md:p-12">
          {activeTab === 'indicadores' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity size={20} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Desempenho Institucional (%)</h3>
                </div>
                <div className="h-80 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={indicatorsData} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                        {indicatorsData.map((e, i) => <Cell key={i} fill={e.fill === COLORS.dark ? '#1e293b' : e.fill === COLORS.brand ? '#f97316' : '#94a3b8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo Métrico</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-900 rounded-2xl shadow-lg relative overflow-hidden group">
                    {/* Decorative circle */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fluência SAMAHC</p>
                    <p className="text-4xl font-black text-white mt-1">{escola.indicadores.fluenciaLeitora}%</p>
                  </div>
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frequência Média</p>
                    <p className="text-4xl font-black text-slate-800 mt-1">{escola.indicadores.frequenciaMedia}%</p>
                  </div>
                </div>
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl relative overflow-hidden">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Segmentos Ativos</p>
                  <div className="flex flex-wrap gap-2">
                    {escola.segmentos.map(s => <span key={s} className="px-3 py-1 bg-white text-orange-700 rounded-lg text-xs font-bold shadow-sm">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {
            activeTab === 'acompanhamento' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Checklist de Verificação</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: Monitoramento Mensal</p>
                  </div>
                  <button onClick={handleSaveAcompanhamento} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                    <Save size={18} /> Salvar Registros
                  </button>
                </div>
                <div className="grid gap-6">
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
            )
          }

          {
            activeTab === 'turmas' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Alunos por Turmas</h3>
                    <p className="text-slate-500 text-sm mt-1">Detalhamento de turmas e alunos por nível e turno.</p>
                  </div>
                  <button onClick={handleSaveIndicators} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><Save size={18} /> Salvar Dados</button>
                </div>
                <div className="space-y-10">
                  {['infantil', 'fundamental'].map(seg => (
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
            activeTab === 'cadastro' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-bold text-slate-800">Núcleo de Indicadores Sistêmicos</h3>
                  <button onClick={handleSaveIndicators} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all">Sincronizar Dados</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Matrícula Infantil', val: formData.matricula.infantil, sec: 'matricula', field: 'infantil' },
                    { label: 'Matrícula Anos Iniciais', val: formData.matricula.anosIniciais, sec: 'matricula', field: 'anosIniciais' },
                    { label: 'Matrícula Anos Finais', val: formData.matricula.anosFinais, sec: 'matricula', field: 'anosFinais' },
                    { label: 'Matrícula EJA', val: formData.matricula.eja, sec: 'matricula', field: 'eja' },
                    { label: 'Resultado IDEB', val: formData.avaliacoesExternas.ideb, sec: 'avaliacoesExternas', field: 'ideb' },
                    { label: 'Resultado SAEB', val: formData.avaliacoesExternas.saeb, sec: 'avaliacoesExternas', field: 'saeb' }
                  ].map(f => (
                    <div key={f.label} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all group relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{f.label}</label>
                      <div className="flex items-center gap-3">
                        <input type="number" step="0.1" value={f.val} onChange={e => handleInputChange(f.sec as any, f.field, e.target.value)} className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-slate-800 group-hover:text-orange-600 transition-colors p-0 placeholder-slate-300" />
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-orange-500 transition-colors">
                          <Edit size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {
            activeTab === 'rh' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Recursos Humanos</h3>
                    <p className="text-slate-500 text-sm mt-1">Gestão de servidores da unidade escolar.</p>
                  </div>
                  {!isAddingRh && <button onClick={() => setIsAddingRh(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><UserPlus size={18} /> Adicionar Servidor</button>}
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
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Users size={14} className="text-slate-500" />
                        <span className="text-sm font-bold text-slate-600">{escola.recursosHumanos?.length || 0} Total</span>
                      </div>
                    </div>
                  );
                })()}

                {isAddingRh && (
                  <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {['nome', 'email', 'telefone'].map(f => (
                        <div key={f} className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">{f}</label>
                          <input type="text" value={(rhForm as any)[f]} onChange={e => setRhForm({ ...rhForm, [f]: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder={`Digite o ${f}...`} />
                        </div>
                      ))}
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
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Tipo de Vínculo</label>
                        <select value={rhForm.tipoVinculo} onChange={e => setRhForm({ ...rhForm, tipoVinculo: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="Efetivo">Efetivo</option>
                          <option value="Contratado">Contratado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Data da Nomeação</label>
                        <input type="date" value={rhForm.dataNomeacao} onChange={e => setRhForm({ ...rhForm, dataNomeacao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
                      </div>
                      {rhForm.funcao === 'Professor(a)' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Etapa de Atuação</label>
                          <select value={rhForm.etapaAtuacao || ''} onChange={e => setRhForm({ ...rhForm, etapaAtuacao: e.target.value as any, componenteCurricular: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                            <option value="">Selecione a etapa...</option>
                            <option value="Anos Iniciais">Anos Iniciais</option>
                            <option value="Anos Finais">Anos Finais</option>
                            <option value="Sala de Recurso">Sala de Recurso</option>
                            <option value="Outros">Outros</option>
                          </select>
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
                      <button onClick={() => { setIsAddingRh(false); setEditingRhId(null); setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', etapaAtuacao: undefined, componenteCurricular: '' }); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold">Cancelar</button>
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
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${rh.tipoVinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                {rh.tipoVinculo === 'Efetivo' ? 'Efetivo' : 'Contrato'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-600">
                              {rh.etapaAtuacao || '-'}
                              {rh.componenteCurricular && <div className="text-xs text-slate-400 mt-0.5">{rh.componenteCurricular}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
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
                    <h3 className="text-2xl font-bold text-slate-800">Plano Tático de Ação</h3>
                    <p className="text-sm text-slate-500 mt-1">Metas e ações estratégicas para 2024</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prazo</label>
                          <input type="date" value={metaForm.prazo} onChange={e => setMetaForm({ ...metaForm, prazo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável</label>
                          <input type="text" value={metaForm.responsavel} onChange={e => setMetaForm({ ...metaForm, responsavel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do responsável" />
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
                  {escola.planoAcao.map(meta => (
                    <div key={meta.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${meta.status === StatusMeta.CONCLUIDO ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{meta.status}</span>
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
              <div className="space-y-8 animate-fade-in">
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-500"><History size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Histórico de Visitas</h3>
                    <p className="text-sm text-slate-500 mt-1">Registro cronológico de auditorias e acompanhamentos</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {historicoVisitas.length === 0 ? (
                    <div className="p-20 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhum registro de visita encontrado.</p>
                    </div>
                  ) : (
                    historicoVisitas.map(visita => (
                      <div key={visita.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-6 group">
                        <div className="flex flex-col items-center gap-1 pt-2 shrink-0">
                          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg leading-none shadow-lg">
                            <div className="text-center">
                              <span className="block text-xl">{visita.data.split('/')[0]}</span>
                              <span className="block text-[10px] font-normal uppercase opacity-70">{visita.data.split('/')[1]}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${visita.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{visita.status}</span>
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1"><Target size={12} /> {visita.tipo}</span>
                            </div>
                            <button
                              onClick={() => handlePrint(visita)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Printer size={14} /> Relatório
                            </button>
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 mb-3">Foco: {visita.foco.join(', ')}</h4>
                          {visita.encaminhamentos && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-sm text-slate-600 leading-relaxed italic">"{visita.encaminhamentos}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
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
    </div>
  );
};
