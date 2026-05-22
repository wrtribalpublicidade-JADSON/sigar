import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ClipboardList, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save, Layers
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface PlanoCursoProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

interface CoursePlan {
  id: string;
  anoReferencia: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  bimestre: string;
  titulo: string;
  objetivos: string;
  conteudo: string;
  metodologia: string;
  recursos: string;
  avaliacao: string;
  anoSerie: string;
  criadoEm: string;
}

const COMPONENTES = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Arte',
  'Educação Física',
  'Língua Inglesa',
  'Ensino Religioso',
  'Campos de Experiência (EI)'
];

const BIMESTRES = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre',
  'Anual'
];

const ANOS_SERIES = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  'Creche II',
  'Creche III',
  'Pré I',
  'Pré II',
  'EJA',
  'Outros'
];

export const PlanoCurso: React.FC<PlanoCursoProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear().toString());
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [anoSerie, setAnoSerie] = useState(ANOS_SERIES[0]);
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [bimestre, setBimestre] = useState(BIMESTRES[0]);
  const [titulo, setTitulo] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [recursos, setRecursos] = useState('');
  const [avaliacao, setAvaliacao] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Print Mode State
  const [printPlan, setPrintPlan] = useState<CoursePlan | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sigar_planos_curso');
    if (saved) {
      try {
        setPlans(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    if (escolas.length > 0) {
      setSelectedEscolaId(escolas[0].id);
    }
  }, [escolas]);

  // Load turmas when selected school changes
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        setTurmas([
          { id: 'demo-t1', name: '1º ANO A', year: '1º Ano', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', year: '2º Ano', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', year: '5º Ano', shift: 'MANHÃ' },
        ]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', selectedEscolaId)
          .order('name');

        if (error) throw error;
        setTurmas(data || []);
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };

    fetchTurmas();
  }, [selectedEscolaId, isDemoMode]);

  // Helpers for filtering and matching
  const isTurmaInAnoSerie = (t: any, anoSerieVal: string): boolean => {
    if (!t) return false;
    const target = anoSerieVal.toLowerCase().trim();
    const tYear = (t.year || '').toLowerCase().trim();
    const tName = (t.name || '').toLowerCase().trim();
    
    if (tYear) {
      if (tYear === target) return true;
      if (target.includes(tYear) || tYear.includes(target)) return true;
    }
    
    if (tName) {
      if (tName === target) return true;
      if (tName.includes(target)) return true;
      
      const normalizedTarget = target.replace(/[-\s]/g, '');
      const normalizedName = tName.replace(/[-\s]/g, '');
      if (normalizedName.includes(normalizedTarget)) return true;
    }
    
    return false;
  };

  // Compute available Anos/Séries for the selected school
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return ANOS_SERIES;
    const filtered = ANOS_SERIES.filter(ano => 
      turmas.some(t => isTurmaInAnoSerie(t, ano))
    );
    return filtered.length > 0 ? filtered : ANOS_SERIES;
  }, [turmas]);

  // Compute available Turmas for the selected school and Ano/Série
  const availableTurmas = useMemo(() => {
    return turmas.filter(t => isTurmaInAnoSerie(t, anoSerie));
  }, [turmas, anoSerie]);

  // Sync anoSerie selection when availableAnosSeries changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableAnosSeries.length > 0 && !availableAnosSeries.includes(anoSerie)) {
        setAnoSerie(availableAnosSeries[0]);
      }
    }
  }, [availableAnosSeries, anoSerie, selectedEscolaId, turmas, isDemoMode]);

  // Sync selectedTurmaId selection when availableTurmas changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableTurmas.length > 0) {
        const exists = availableTurmas.some(t => t.id === selectedTurmaId);
        if (!exists) {
          setSelectedTurmaId(availableTurmas[0].id);
        }
      } else {
        setSelectedTurmaId('');
      }
    }
  }, [availableTurmas, selectedTurmaId, selectedEscolaId, turmas, isDemoMode]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEscolaId || !selectedTurmaId || !titulo.trim() || !objetivos.trim() || !conteudo.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const payload: CoursePlan = {
      id: editingId || crypto.randomUUID(),
      anoReferencia,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      bimestre,
      titulo,
      objetivos,
      conteudo,
      metodologia,
      recursos,
      avaliacao,
      anoSerie,
      criadoEm: new Date().toISOString()
    };

    let updatedPlans: CoursePlan[];
    if (editingId) {
      updatedPlans = plans.map(p => p.id === editingId ? payload : p);
      showNotification('success', 'Plano de Curso atualizado com sucesso!');
    } else {
      updatedPlans = [payload, ...plans];
      showNotification('success', 'Plano de Curso cadastrado com sucesso!');
    }

    setPlans(updatedPlans);
    localStorage.setItem('sigar_planos_curso', JSON.stringify(updatedPlans));
    resetForm();
  };

  const handleEdit = (plan: CoursePlan) => {
    setEditingId(plan.id);
    setAnoReferencia(plan.anoReferencia);
    setSelectedEscolaId(plan.escolaId);
    setAnoSerie(plan.anoSerie || ANOS_SERIES[0]);
    // Timeout to let turmas update and then select
    setTimeout(() => {
      setSelectedTurmaId(plan.turmaId);
    }, 150);
    setComponente(plan.componente);
    setBimestre(plan.bimestre);
    setTitulo(plan.titulo);
    setObjetivos(plan.objetivos);
    setConteudo(plan.conteudo);
    setMetodologia(plan.metodologia);
    setRecursos(plan.recursos);
    setAvaliacao(plan.avaliacao);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir este Plano de Curso?')) return;
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    localStorage.setItem('sigar_planos_curso', JSON.stringify(updated));
    showNotification('success', 'Plano de Curso removido.');
  };

  const resetForm = () => {
    setEditingId(null);
    setAnoSerie(ANOS_SERIES[0]);
    setTitulo('');
    setObjetivos('');
    setConteudo('');
    setMetodologia('');
    setRecursos('');
    setAvaliacao('');
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.componente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = schoolFilter === 'ALL' || p.escolaId === schoolFilter;
    const matchesClass = classFilter === 'ALL' || p.turmaId === classFilter;
    return matchesSearch && matchesSchool && matchesClass;
  });

  const handlePrint = (plan: CoursePlan) => {
    setPrintPlan(plan);
    setTimeout(() => {
      window.print();
      setPrintPlan(null);
    }, 150);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Plano de Curso"
        subtitle="Elaboração e acompanhamento do planejamento curricular anual e bimestral"
        icon={ClipboardList}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {/* Printable Area - Hidden on Screen */}
      {printPlan && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-sans">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Instrumental - Plano de Curso Curricular</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printPlan.escolaNome}</p>
              <p><strong>Turma:</strong> {printPlan.turmaNome}</p>
              <p><strong>Ano/Série:</strong> {printPlan.anoSerie || '---'}</p>
              <p><strong>Ano de Referência:</strong> {printPlan.anoReferencia}</p>
            </div>
            <div>
              <p><strong>Componente Curricular:</strong> {printPlan.componente}</p>
              <p><strong>Período:</strong> {printPlan.bimestre}</p>
              <p><strong>Tema/Título do Plano:</strong> {printPlan.titulo}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Objetivos de Aprendizagem / Competências</h3>
              <p className="whitespace-pre-line text-gray-700">{printPlan.objetivos}</p>
            </div>
            
            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Conteúdo Programático</h3>
              <p className="whitespace-pre-line text-gray-700">{printPlan.conteudo}</p>
            </div>

            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Procedimentos Metodológicos / Estratégias</h3>
              <p className="whitespace-pre-line text-gray-700">{printPlan.metodologia}</p>
            </div>

            {printPlan.recursos && (
              <div className="border p-3 rounded-lg">
                <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Recursos Didáticos</h3>
                <p className="whitespace-pre-line text-gray-700">{printPlan.recursos}</p>
              </div>
            )}

            {printPlan.avaliacao && (
              <div className="border p-3 rounded-lg">
                <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Critérios e Instrumentos de Avaliação</h3>
                <p className="whitespace-pre-line text-gray-700">{printPlan.avaliacao}</p>
              </div>
            )}
          </div>

          <div className="mt-16 flex justify-around">
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Assinatura do Docente</p>
            </div>
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Coordenação Pedagógica</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Form */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Bookmark className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Plano de Curso' : 'Novo Plano de Curso'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ano *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="number" 
                  value={anoReferencia}
                  onChange={e => setAnoReferencia(e.target.value)}
                  required
                  placeholder="Ex: 2026"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Escola *</label>
              <div className="relative">
                <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  value={selectedEscolaId}
                  onChange={e => setSelectedEscolaId(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all appearance-none"
                >
                  {escolas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ano/Série *</label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {availableAnosSeries.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
              <select 
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {availableTurmas.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  availableTurmas.map(t => (
                    <option key={t.id} value={t.id}>{`${t.name || t.year} • ${t.shift || ''}`}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Componente Curricular *</label>
              <select 
                value={componente}
                onChange={e => setComponente(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {COMPONENTES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período *</label>
              <select 
                value={bimestre}
                onChange={e => setBimestre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {BIMESTRES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tema / Título do Plano de Curso *</label>
            <input 
              type="text" 
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Conteúdo de Álgebra Básica e Equações de 1º Grau"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objetivos de Aprendizagem / Competências *</label>
              <textarea 
                value={objetivos}
                onChange={e => setObjetivos(e.target.value)}
                placeholder="Indique as competências a serem desenvolvidas neste período..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conteúdo Programático *</label>
              <textarea 
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                placeholder="Liste os principais conteúdos que serão abordados..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Procedimentos Metodológicos</label>
              <textarea 
                value={metodologia}
                onChange={e => setMetodologia(e.target.value)}
                placeholder="Aulas expositivas, trabalhos em grupo, seminários..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recursos Didáticos</label>
              <textarea 
                value={recursos}
                onChange={e => setRecursos(e.target.value)}
                placeholder="Quadro, projetor, material manipulável, livros..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Critérios de Avaliação</label>
              <textarea 
                value={avaliacao}
                onChange={e => setAvaliacao(e.target.value)}
                placeholder="Provas bimestrais, autoavaliação, participação..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="rounded-xl text-xs font-bold py-2">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="primary" className="rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              {editingId ? 'Salvar Edição' : 'Salvar Plano de Curso'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved plans list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Planos de Curso</h3>
            <p className="text-xs text-slate-500 mt-0.5">Consulte, edite ou exporte os planejamentos de curso já elaborados</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por tema..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
              />
            </div>

            <select 
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todas Unidades</option>
              {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Período / Escola</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4">Título do Plano</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhum plano de curso encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {plan.bimestre} ({plan.anoReferencia})
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {plan.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{plan.turmaNome}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          Série: {plan.anoSerie || '---'}
                        </div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {plan.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">{plan.titulo}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          Conteúdo: {plan.conteudo}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrint(plan)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Imprimir Plano"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEdit(plan)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(plan.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
