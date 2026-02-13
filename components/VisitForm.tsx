import React, { useState, useEffect } from 'react';
import { Escola, Visita, TopicoPauta, EncaminhamentoVisita, Coordenador } from '../types';
import { ArrowLeft, Save, Plus, Trash2, Edit2, List, CheckSquare, Calendar, Clock, CheckCircle2, ClipboardList, ChevronRight, User, AlertCircle, Printer, X } from 'lucide-react';
import { PrintableVisitReport } from './PrintableVisitReport';

interface VisitFormProps {
  escolas: Escola[];
  coordenadores: Coordenador[];
  onSave: (visita: Omit<Visita, 'id'>) => void;
  onCancel: () => void;
  visitToEdit?: Visita | null;
}

export const VisitForm: React.FC<VisitFormProps> = ({ escolas, coordenadores, onSave, onCancel, visitToEdit }) => {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<Omit<Visita, 'id' | 'escolaNome'>>({
    escolaId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'Rotina',
    foco: [] as string[],
    topicosPauta: [] as TopicoPauta[],
    encaminhamentosRegistrados: [] as EncaminhamentoVisita[],
    observacoes: '',
    encaminhamentos: '',
    status: 'Realizada'
  });

  useEffect(() => {
    if (visitToEdit) {
      setFormData({
        escolaId: visitToEdit.escolaId,
        data: visitToEdit.data,
        tipo: visitToEdit.tipo,
        foco: visitToEdit.foco,
        topicosPauta: visitToEdit.topicosPauta,
        encaminhamentosRegistrados: visitToEdit.encaminhamentosRegistrados,
        observacoes: visitToEdit.observacoes,
        encaminhamentos: visitToEdit.encaminhamentos,
        status: visitToEdit.status
      });
    }
  }, [visitToEdit]);

  const [pautaForm, setPautaForm] = useState<TopicoPauta>({
    id: '', descricao: '', categoria: 'Pedagógico', observacoes: ''
  });
  const [isEditingPauta, setIsEditingPauta] = useState(false);

  const [encaminhamentoForm, setEncaminhamentoForm] = useState<EncaminhamentoVisita>({
    id: '', descricao: '', responsavel: 'Gestor Geral', status: 'Pendente', prazo: ''
  });
  const [isEditingEncaminhamento, setIsEditingEncaminhamento] = useState(false);

  const selectedEscola = escolas.find(e => e.id === formData.escolaId);
  const regionalCoordinator = coordenadores.find(c => c.escolasIds.includes(formData.escolaId));

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      foco: prev.foco.includes(value)
        ? prev.foco.filter(item => item !== value)
        : [...prev.foco, value]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, escolaNome: selectedEscola?.nome || 'Desconhecida' });
  };

  const handleSaveTopico = () => {
    if (!pautaForm.descricao) return;
    if (isEditingPauta) {
      setFormData(prev => ({ ...prev, topicosPauta: prev.topicosPauta.map(t => t.id === pautaForm.id ? pautaForm : t) }));
      setIsEditingPauta(false);
    } else {
      setFormData(prev => ({ ...prev, topicosPauta: [...prev.topicosPauta, { ...pautaForm, id: Date.now().toString() }] }));
    }
    setPautaForm({ id: '', descricao: '', categoria: 'Pedagógico', observacoes: '' });
  };

  const handleEditTopico = (topico: TopicoPauta) => { setPautaForm(topico); setIsEditingPauta(true); };
  const handleDeleteTopico = (id: string) => { setFormData(prev => ({ ...prev, topicosPauta: prev.topicosPauta.filter(t => t.id !== id) })); };

  const handleSaveEncaminhamento = () => {
    if (!encaminhamentoForm.descricao || !encaminhamentoForm.prazo) return;
    if (isEditingEncaminhamento) {
      setFormData(prev => ({ ...prev, encaminhamentosRegistrados: prev.encaminhamentosRegistrados.map(e => e.id === encaminhamentoForm.id ? encaminhamentoForm : e) }));
      setIsEditingEncaminhamento(false);
    } else {
      setFormData(prev => ({ ...prev, encaminhamentosRegistrados: [...prev.encaminhamentosRegistrados, { ...encaminhamentoForm, id: Date.now().toString() }] }));
    }
    setEncaminhamentoForm({ id: '', descricao: '', responsavel: 'Gestor Geral', status: 'Pendente', prazo: '' });
  };

  const handleEditEncaminhamento = (enc: EncaminhamentoVisita) => { setEncaminhamentoForm(enc); setIsEditingEncaminhamento(true); };
  const handleDeleteEncaminhamento = (id: string) => { setFormData(prev => ({ ...prev, encaminhamentosRegistrados: prev.encaminhamentosRegistrados.filter(e => e.id !== id) })); };

  const StepIndicator = ({ num, label, icon: Icon }: { num: number, label: string, icon: any }) => (
    <div className={`flex flex-col items-center gap-2 relative z-10 ${step === num ? 'text-orange-600' : step > num ? 'text-emerald-500' : 'text-slate-300'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-white ${step === num ? 'border-orange-600 text-orange-600 shadow-lg shadow-orange-500/20' : step > num ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
        {step > num ? <CheckCircle2 size={20} /> : <Icon size={18} />}
      </div>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in relative font-sans">

      {/* Modern Header */}
      <div className="bg-slate-900 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button onClick={onCancel} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all backdrop-blur-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg flex items-center justify-center text-white">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{visitToEdit ? 'Editar Visita Técnica' : 'Nova Visita Técnica'}</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {selectedEscola ? `Registro para ${selectedEscola.nome}` : 'Planejamento e Acompanhamento Pedagógico'}
              </p>
            </div>
          </div>

          {/* Stepper (Desktop) */}
          <div className="hidden md:flex items-center gap-4 relative">
            {/* Line connector */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-800 -z-10" />
            <StepIndicator num={1} label="Planejamento" icon={Calendar} />
            <StepIndicator num={2} label="Pauta" icon={List} />
            <StepIndicator num={3} label="Diretrizes" icon={CheckSquare} />
            <StepIndicator num={4} label="Finalizar" icon={Save} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Dados Iniciais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500">Unidade Escolar</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        value={formData.escolaId}
                        onChange={e => setFormData({ ...formData, escolaId: e.target.value })}
                        required
                      >
                        <option value="">Selecione uma escola...</option>
                        {escolas.map(e => (<option key={e.id} value={e.id}>{e.nome}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500">Data da Visita</label>
                      <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        value={formData.data}
                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 mt-4">Protocolo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['Rotina', 'Emergencial', 'Temática'].map(tipo => (
                      <label key={tipo} className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-3 transition-all ${formData.tipo === tipo ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex justify-between items-start">
                          <span className={`font-bold text-sm ${formData.tipo === tipo ? 'text-orange-700' : 'text-slate-600'}`}>{tipo}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.tipo === tipo ? 'border-orange-500' : 'border-slate-300'}`}>
                            {formData.tipo === tipo && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 mt-4">Matriz de Observação</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Planejamento', 'Sala de Aula', 'Infraestrutura', 'Gestão Escolar', 'Frequência', 'Avaliação Externa', 'Alimentação Escolar', 'Conselho de Classe', 'Alfabetização', 'Matrículas', 'Formação de Professores'].map(item => (
                      <label key={item} className={`cursor-pointer px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${formData.foco.includes(item) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${formData.foco.includes(item) ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'}`}>
                          {formData.foco.includes(item) && <CheckSquare className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" className="hidden" checked={formData.foco.includes(item)} onChange={() => handleCheckboxChange(item)} />
                        <span className="text-xs font-bold uppercase">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.escolaId}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="hidden lg:block space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-2">Instruções</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Preencha os dados com atenção. O registro de visita técnica é um documento oficial que compõe o histórico da unidade escolar.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">01</div>
                    <p className="text-xs font-medium text-slate-300">Selecione a unidade e a data da intervenção.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">02</div>
                    <p className="text-xs font-medium text-slate-300">Defina os focos de observação prioritários.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Tópicos da Pauta</h3>
                <p className="text-sm text-slate-500 mt-1">Registre os assuntos abordados durante a visita.</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Assunto / Descrição</label>
                  <input type="text" placeholder="Ex: Análise de diários de classe..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" value={pautaForm.descricao} onChange={(e) => setPautaForm({ ...pautaForm, descricao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" value={pautaForm.categoria} onChange={(e) => setPautaForm({ ...pautaForm, categoria: e.target.value as any })}>
                    <option value="Pedagógico">Pedagógico</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <button type="button" onClick={handleSaveTopico} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all h-[46px]">
                  {isEditingPauta ? <Edit2 size={16} /> : <Plus size={16} />}
                  {isEditingPauta ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>

              <div className="border-t border-slate-100">
                {formData.topicosPauta.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                    <List className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium text-sm">Nenhum tópico registrado ainda.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {formData.topicosPauta.map(topico => (
                      <div key={topico.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <span className="font-bold text-xs">{topico.categoria.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{topico.descricao}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 mt-1">{topico.categoria}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleEditTopico(topico)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button type="button" onClick={() => handleDeleteTopico(topico.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">Voltar</button>
              <button type="button" onClick={() => setStep(3)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all">
                Próxima Etapa <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Encaminhamentos</h3>
                <p className="text-sm text-slate-500 mt-1">Defina responsabilidades e prazos para as ações corretivas.</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ação / Diretriz</label>
                  <input type="text" placeholder="O que deve ser feito..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" value={encaminhamentoForm.descricao} onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, descricao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" value={encaminhamentoForm.responsavel} onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, responsavel: e.target.value as any })}>
                    <option value="Gestor Geral">Gestor Geral</option>
                    <option value="Gestor Pedagógico">Gestor Pedagógico</option>
                    <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prazo</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" value={encaminhamentoForm.prazo} onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, prazo: e.target.value })} />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button type="button" onClick={handleSaveEncaminhamento} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all">
                    {isEditingEncaminhamento ? <Edit2 size={16} /> : <Plus size={16} />}
                    {isEditingEncaminhamento ? 'Atualizar Diretriz' : 'Adicionar Diretriz'}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100">
                {formData.encaminhamentosRegistrados.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                    <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium text-sm">Nenhum encaminhamento registrado.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {formData.encaminhamentosRegistrados.map(enc => (
                      <div key={enc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors group gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-md">{enc.responsavel}</span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> Prazo: {new Date(enc.prazo + 'T12:00:00').toLocaleDateString()}</span>
                          </div>
                          <p className="font-bold text-slate-800 text-sm">{enc.descricao}</p>
                        </div>
                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleEditEncaminhamento(enc)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button type="button" onClick={() => handleDeleteEncaminhamento(enc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">Voltar</button>
              <button type="button" onClick={() => setStep(4)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all">
                Revisar e Finalizar <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feedback Section */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                  Considerações Finais
                </h3>
                <textarea
                  className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                  value={formData.encaminhamentos}
                  onChange={e => setFormData({ ...formData, encaminhamentos: e.target.value })}
                  placeholder="Registre aqui o feedback geral da visita, observações qualitativas e conclusões..."
                  required
                />
              </div>

              {/* Status Choice */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Status do Relatório</h3>
                {[
                  { value: 'Realizada', icon: CheckCircle2, label: 'Concluída', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { value: 'Planejada', icon: Calendar, label: 'Planejamento', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { value: 'Relatório Pendente', icon: Clock, label: 'Pendente', color: 'text-orange-500', bg: 'bg-orange-500/10' }
                ].map(s => (
                  <label key={s.value}
                    onClick={() => setFormData({ ...formData, status: s.value as any })}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-4 transition-all ${formData.status === s.value ? 'bg-slate-900 border-slate-900 text-white shadow-lg transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.status === s.value ? 'bg-white/20' : s.bg}`}>
                      <s.icon className={`w-5 h-5 ${formData.status === s.value ? 'text-white' : s.color}`} />
                    </div>
                    <span className="font-bold text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-700">
                  <Printer className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resumo da Operação</p>
                  <h4 className="text-xl font-bold text-slate-800">{selectedEscola?.nome}</h4>
                  <p className="text-sm text-slate-500 font-medium">Data: {new Date(formData.data + 'T12:00:00').toLocaleDateString()} • {formData.tipo}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all">
                  <Printer className="w-5 h-5" /> Imprimir Relatório
                </button>
                <button type="button" onClick={() => setStep(3)} className="text-slate-500 hover:text-slate-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-200 transition-all">Voltar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:scale-105">
                  <Save className="w-5 h-5" /> Salvar Relatório
                </button>
              </div>
            </div>

            <PrintableVisitReport
              visita={{ ...formData, id: visitToEdit?.id || 'NOVA-VISITA', escolaNome: selectedEscola?.nome || 'N/A' } as Visita}
              escola={selectedEscola}
              coordenador={regionalCoordinator}
            />
          </div>
        )}
      </form>
    </div>
  );
};
