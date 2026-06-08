import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { BNCC_INFANTIL } from './ConselhoClasse';

interface AulasMinistradasInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface ClassLogInfantil {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  campoExperiencia: string;
  rotina: string; // ECE daily routine (Roda, Acolhida, etc)
  conteudo: string; // Developed experiences
  atividades: string;
  observacoes: string;
  anoSerie: string;
  periodo: string;
  selectedHabilidadeIds: string[]; // ECE BNCC Objective codes
  criadoEm: string;
}

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações'
];

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const AulasMinistradasInfantil: React.FC<AulasMinistradasInfantilProps> = ({ 
  escolas, 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<ClassLogInfantil[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [campoExperiencia, setCampoExperiencia] = useState('O eu, o outro e o nós');
  const [rotina, setRotina] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [anoSerie, setAnoSerie] = useState('Creche III');
  const [periodo, setPeriodo] = useState('1º Bimestre');
  const [selectedHabilidadeIds, setSelectedHabilidadeIds] = useState<string[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Printing State
  const [printLog, setPrintLog] = useState<ClassLogInfantil | null>(null);

  // Filter schools to only those offering Educação Infantil
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => 
      e.segmentos && e.segmentos.includes(Segmento.INFANTIL)
    );
  }, [escolas]);

  // Get active school context
  const currentSchoolId = selectedEscolaId || (escolasInfantil.length > 0 ? escolasInfantil[0].id : '');

  // Load ECE turmas based on active school
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!currentSchoolId) return;
      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', currentSchoolId)
          .eq('stage', 'Educação Infantil'); // Only ECE classes

        if (error) throw error;
        setTurmas(data || []);
        if (data && data.length > 0) {
          setSelectedTurmaId(data[0].id);
          setAnoSerie(data[0].anoSerie || 'Creche III');
        } else {
          setSelectedTurmaId('');
        }
      } catch (err) {
        console.error('Erro ao buscar turmas:', err);
      }
    };

    fetchTurmas();
  }, [currentSchoolId]);

  // Sync grade (Faixa Etária) when selected class changes
  useEffect(() => {
    const t = turmas.find(x => x.id === selectedTurmaId);
    if (t) {
      setAnoSerie(t.anoSerie || 'Creche III');
    }
  }, [selectedTurmaId, turmas]);

  // Fetch available ECE BNCC objectives for the form
  const availableObjectives = useMemo(() => {
    const ageGroup = ['Creche II', 'Creche III'].includes(anoSerie)
      ? 'Crianças bem pequenas'
      : 'Crianças pequenas';
    
    const normalizedCampo = campoExperiencia.toUpperCase();
    const fieldData = BNCC_INFANTIL[normalizedCampo as keyof typeof BNCC_INFANTIL];
    if (!fieldData) return [];
    
    return (fieldData as any)[ageGroup] || [];
  }, [campoExperiencia, anoSerie]);

  // Load logs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('aulas_ministradas_infantil')
            .select('*')
            .eq('ativo', true)
            .order('data', { ascending: false });

          if (error) throw error;

          const formatted: ClassLogInfantil[] = (data || []).map(d => ({
            id: d.id,
            data: d.data,
            escolaId: d.escola_id,
            escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
            turmaId: d.turma_id,
            turmaNome: d.ano_serie, // Placeholder or fetch
            campoExperiencia: d.campo_experiencia,
            rotina: d.rotina,
            conteudo: d.conteudo,
            atividades: d.atividades,
            observacoes: d.observacoes,
            anoSerie: d.ano_serie,
            periodo: d.periodo,
            selectedHabilidadeIds: d.selected_habilidade_ids || [],
            criadoEm: d.created_at
          }));
          setLogs(formatted);
        } else {
          const saved = localStorage.getItem('sigar_aulas_ministradas_infantil');
          if (saved) {
            setLogs(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar registros de aula:', err);
      }
    };

    loadData();
  }, [isDemoMode, escolas]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEscolaId || !selectedTurmaId || !conteudo.trim() || !rotina.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie} • ${turmaObj.turno || ''}` : 'Turma';

    const payload: ClassLogInfantil = {
      id: editingId || crypto.randomUUID(),
      data: dataAula,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      campoExperiencia,
      rotina,
      conteudo,
      atividades,
      observacoes,
      anoSerie,
      periodo,
      selectedHabilidadeIds,
      criadoEm: new Date().toISOString()
    };

    try {
      if (!isDemoMode) {
        const dbPayload = {
          id: payload.id,
          data: payload.data,
          escola_id: payload.escolaId,
          turma_id: payload.turmaId,
          campo_experiencia: payload.campoExperiencia,
          rotina: payload.rotina,
          conteudo: payload.conteudo,
          atividades: payload.atividades,
          observacoes: payload.observacoes,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
          selected_habilidade_ids: payload.selectedHabilidadeIds,
          updated_at: new Date().toISOString(),
          updated_by: userEmail || currentUser?.contato || 'user'
        };

        const { error } = await supabase
          .from('aulas_ministradas_infantil')
          .upsert(dbPayload);

        if (error) throw error;
      }

      let updatedLogs: ClassLogInfantil[];
      if (editingId) {
        updatedLogs = logs.map(l => l.id === editingId ? payload : l);
        showNotification('success', 'Registro de aula ECE atualizado com sucesso!');
      } else {
        updatedLogs = [payload, ...logs];
        showNotification('success', 'Aula ministrada ECE registrada com sucesso!');
      }

      setLogs(updatedLogs);
      if (isDemoMode) {
        localStorage.setItem('sigar_aulas_ministradas_infantil', JSON.stringify(updatedLogs));
      }

      // Reset Form
      setEditingId(null);
      setRotina('');
      setConteudo('');
      setAtividades('');
      setObservacoes('');
      setSelectedHabilidadeIds([]);
      setIsFormOpen(false);
    } catch (err) {
      console.error('Erro ao salvar registro de aula:', err);
      showNotification('error', 'Falha ao gravar os dados.');
    }
  };

  const handleEdit = (log: ClassLogInfantil) => {
    setEditingId(log.id);
    setDataAula(log.data);
    setSelectedEscolaId(log.escolaId);
    setSelectedTurmaId(log.turmaId);
    setCampoExperiencia(log.campoExperiencia);
    setRotina(log.rotina);
    setConteudo(log.conteudo);
    setAtividades(log.atividades);
    setObservacoes(log.observacoes);
    setAnoSerie(log.anoSerie);
    setPeriodo(log.periodo);
    setSelectedHabilidadeIds(log.selectedHabilidadeIds || []);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro de aula?')) return;

    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('aulas_ministradas_infantil')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = logs.filter(l => l.id !== id);
      setLogs(updated);
      if (isDemoMode) {
        localStorage.setItem('sigar_aulas_ministradas_infantil', JSON.stringify(updated));
      }
      showNotification('success', 'Registro de aula removido com sucesso!');
    } catch (err) {
      console.error('Erro ao remover registro:', err);
      showNotification('error', 'Erro ao excluir do banco.');
    }
  };

  const handlePrint = (log: ClassLogInfantil) => {
    setPrintLog(log);
    setTimeout(() => {
      window.print();
      setPrintLog(null);
    }, 150);
  };

  // Filter lists for dashboard
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.campoExperiencia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool = schoolFilter === 'ALL' || l.escolaId === schoolFilter;
      const matchesClass = classFilter === 'ALL' || l.turmaId === classFilter;
      return matchesSearch && matchesSchool && matchesClass;
    });
  }, [logs, searchTerm, schoolFilter, classFilter]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Aulas Ministradas - Educação Infantil"
        subtitle="Registro de vivências diárias, rotina pedagógica e desenvolvimento infantil"
        icon={FileText}
        badgeText="DIÁRIO DE CLASSE"
        actions={[
          {
            label: 'Registrar Aula',
            icon: Plus,
            onClick: () => {
              setEditingId(null);
              setRotina('');
              setConteudo('');
              setAtividades('');
              setObservacoes('');
              setSelectedHabilidadeIds([]);
              setIsFormOpen(true);
            },
            variant: 'primary'
          }
        ]}
      />

      {subHeader}

      {/* SEARCH AND FILTERS */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Pesquisar vivências ou campos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
            />
          </div>
          <div>
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
            >
              <option value="ALL">Todas as Escolas</option>
              {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <div>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
            >
              <option value="ALL">Todas as Turmas ECE</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.name || t.anoSerie} • {t.turno}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* LOGS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => (
            <Card key={log.id} className="bg-white border-slate-200 hover:border-orange-200 hover:shadow-md transition-all p-6 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-orange-50 text-brand-orange text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    {log.periodo}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(log.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold uppercase">{log.campoExperiencia}</p>
                  <p className="text-xs text-slate-400 font-medium"><strong>Rotina:</strong> {log.rotina}</p>
                </div>
                
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Vivências:</span>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mt-0.5">{log.conteudo}</p>
                </div>

                {log.selectedHabilidadeIds && log.selectedHabilidadeIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {log.selectedHabilidadeIds.map(code => (
                      <span key={code} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                  {log.escolaNome}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePrint(log)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-brand-orange transition-colors"
                    title="Imprimir Registro"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                    title="Editar Registro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                    title="Excluir Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 italic text-xs">
            Nenhuma aula ou vivência registrada para a Educação Infantil.
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in text-left">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {editingId ? 'Editar Registro de Aula ECE' : 'Registrar Aula / Vivência ECE'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Educação Infantil</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
                  <select
                    value={selectedEscolaId}
                    onChange={e => setSelectedEscolaId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
                  >
                    <option value="">Selecione a Unidade Escolar</option>
                    {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma ECE *</label>
                  <select
                    value={selectedTurmaId}
                    onChange={e => setSelectedTurmaId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
                  >
                    <option value="">Selecione a Turma</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.name || t.anoSerie} • {t.turno}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data *</label>
                    <input 
                      type="date"
                      value={dataAula}
                      onChange={e => setDataAula(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período Letivo *</label>
                    <select
                      value={periodo}
                      onChange={e => setPeriodo(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
                    >
                      {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de Experiência *</label>
                  <select
                    value={campoExperiencia}
                    onChange={e => setCampoExperiencia(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
                  >
                    {CAMPOS_EXPERIENCIA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ECE Objectives selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objetivos BNCC Trabalhados</label>
                  <div className="max-h-[160px] overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {availableObjectives.map((obj: any) => {
                      const isSelected = selectedHabilidadeIds.includes(obj.code);
                      return (
                        <div 
                          key={obj.code}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedHabilidadeIds(selectedHabilidadeIds.filter(c => c !== obj.code));
                            } else {
                              setSelectedHabilidadeIds([...selectedHabilidadeIds, obj.code]);
                            }
                          }}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 ${
                            isSelected 
                              ? 'bg-orange-50/50 border-orange-200' 
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[8px] font-black px-1 py-0.5 rounded leading-none mt-0.5 ${
                            isSelected ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {obj.code}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{obj.short}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{obj.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rotina Diária *</label>
                  <input 
                    type="text"
                    value={rotina}
                    onChange={e => setRotina(e.target.value)}
                    required
                    placeholder="Ex: Acolhida, Roda de Conversa, Higiene, Ativ. Direcionada..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vivências Desenvolvidas *</label>
                  <textarea
                    rows={4}
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    required
                    placeholder="Quais brincadeiras, interações e experiências foram desenvolvidas com o grupo..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Atividades / Materiais Utilizados</label>
                  <textarea
                    rows={3}
                    value={atividades}
                    onChange={e => setAtividades(e.target.value)}
                    placeholder="Ex: Brinquedos de montar, tintas guache, blocos lógicos..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações Coletivas</label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Observações sobre o comportamento e envolvimento coletivo..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                  />
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Salvar Registro
              </Button>
            </div>

          </form>
        </div>
      )}

      {/* PRINTABLE COMPONENT AREA */}
      {printLog && createPortal(
        <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-sans text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Diário de Classe - Registro Diário ECE</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printLog.escolaNome}</p>
              <p><strong>Bimestre / Período:</strong> {printLog.periodo}</p>
              <p><strong>Data de Referência:</strong> {new Date(printLog.data).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p><strong>Faixa Etária / Grupo:</strong> {printLog.anoSerie}</p>
              <p><strong>Campo de Experiência:</strong> {printLog.campoExperiencia}</p>
              <p><strong>Rotina Diária:</strong> {printLog.rotina}</p>
            </div>
          </div>

          <div className="space-y-4 text-[10px]">
            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Objetivos BNCC Trabalhados</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {printLog.selectedHabilidadeIds && printLog.selectedHabilidadeIds.length > 0 ? (
                  printLog.selectedHabilidadeIds.map(code => (
                    <span key={code} className="border px-2 py-0.5 rounded bg-gray-50 font-bold">{code}</span>
                  ))
                ) : (
                  <p className="italic text-gray-400">Nenhum objetivo específico trabalhado.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Vivências e Práticas Desenvolvidas</h3>
              <p className="whitespace-pre-wrap">{printLog.conteudo}</p>
            </div>

            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Materiais e Atividades Propostas</h3>
              <p className="whitespace-pre-wrap">{printLog.atividades || 'Nenhuma atividade complementar registrada.'}</p>
            </div>

            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Observações e Registro do Grupo</h3>
              <p className="whitespace-pre-wrap">{printLog.observacoes || 'Nenhuma observação registrada.'}</p>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-2 gap-12 text-center">
            <div className="border-t pt-2">
              <p className="font-bold">Assinatura do Professor(a)</p>
            </div>
            <div className="border-t pt-2">
              <p className="font-bold">Assinatura da Coordenação Pedagógica</p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
