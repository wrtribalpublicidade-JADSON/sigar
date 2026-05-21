import React, { useState, useEffect } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, BookOpen, Save, ClipboardList
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface AulasMinistradasProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

interface ClassLog {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  aulas: number; // Quantidade de aulas (1 a 5)
  conteudo: string;
  atividades: string;
  observacoes: string;
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

export const AulasMinistradas: React.FC<AulasMinistradasProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [aulas, setAulas] = useState<number>(2);
  const [conteudo, setConteudo] = useState('');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Print Mode State
  const [printLog, setPrintLog] = useState<ClassLog | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sigar_aulas_ministradas');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
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
          { id: 'demo-t1', name: '1º ANO A', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', shift: 'MANHÃ' },
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
        if (data && data.length > 0) {
          setSelectedTurmaId(data[0].id);
        } else {
          setSelectedTurmaId('');
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };

    fetchTurmas();
  }, [selectedEscolaId, isDemoMode]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEscolaId || !selectedTurmaId || !conteudo.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const payload: ClassLog = {
      id: editingId || crypto.randomUUID(),
      data: dataAula,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      aulas,
      conteudo,
      atividades,
      observacoes,
      criadoEm: new Date().toISOString()
    };

    let updatedLogs: ClassLog[];
    if (editingId) {
      updatedLogs = logs.map(l => l.id === editingId ? payload : l);
      showNotification('success', 'Registro de aula atualizado com sucesso!');
    } else {
      updatedLogs = [payload, ...logs];
      showNotification('success', 'Aula ministrada registrada com sucesso!');
    }

    setLogs(updatedLogs);
    localStorage.setItem('sigar_aulas_ministradas', JSON.stringify(updatedLogs));
    resetForm();
  };

  const handleEdit = (log: ClassLog) => {
    setEditingId(log.id);
    setDataAula(log.data);
    setSelectedEscolaId(log.escolaId);
    // Timeout to let turmas update and then select
    setTimeout(() => {
      setSelectedTurmaId(log.turmaId);
    }, 150);
    setComponente(log.componente);
    setAulas(log.aulas);
    setConteudo(log.conteudo);
    setAtividades(log.atividades);
    setObservacoes(log.observacoes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de aula?')) return;
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem('sigar_aulas_ministradas', JSON.stringify(updated));
    showNotification('success', 'Registro de aula removido.');
  };

  const resetForm = () => {
    setEditingId(null);
    setConteudo('');
    setAtividades('');
    setObservacoes('');
    setAulas(2);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.componente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = schoolFilter === 'ALL' || l.escolaId === schoolFilter;
    const matchesClass = classFilter === 'ALL' || l.turmaId === classFilter;
    return matchesSearch && matchesSchool && matchesClass;
  });

  const handlePrint = (log: ClassLog) => {
    setPrintLog(log);
    setTimeout(() => {
      window.print();
      setPrintLog(null);
    }, 150);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Aulas ministradas"
        subtitle="Registro diário das aulas ministradas e conteúdos letivos desenvolvidos"
        icon={ClipboardList}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {/* Printable Area - Hidden on Screen */}
      {printLog && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-sans">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Registro Diário de Aulas Ministradas</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printLog.escolaNome}</p>
              <p><strong>Turma:</strong> {printLog.turmaNome}</p>
              <p><strong>Data da Aula:</strong> {new Date(printLog.data + 'T12:00:00').toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Componente Curricular:</strong> {printLog.componente}</p>
              <p><strong>Quantidade de Aulas:</strong> {printLog.aulas} {printLog.aulas === 1 ? 'aula' : 'aulas'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Conteúdo Ministrado</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.conteudo}</p>
            </div>

            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Procedimentos e Atividades Realizadas</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.atividades || '---'}</p>
            </div>

            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Observações / Ocorrências</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.observacoes || 'Sem observações registradas.'}</p>
            </div>
          </div>

          <div className="mt-20 flex justify-around">
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Assinatura do Docente</p>
            </div>
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Direção / Coordenação</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <FileText className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Registro de Aula' : 'Novo Registro de Aula'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="date" 
                  value={dataAula}
                  onChange={e => setDataAula(e.target.value)}
                  required
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
              <select 
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {turmas.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  turmas.map(t => (
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd. Aulas *</label>
              <select 
                value={aulas}
                onChange={e => setAulas(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'aula' : 'aulas'}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conteúdo Letivo Ministrado *</label>
            <textarea 
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              placeholder="Descreva o conteúdo desenvolvido nesta aula..."
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Atividades e Procedimentos Realizados</label>
              <textarea 
                value={atividades}
                onChange={e => setAtividades(e.target.value)}
                placeholder="Ex: Leitura dirigida, exercícios no caderno, dinâmicas de grupo..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações / Ocorrências Pedagógicas</label>
              <textarea 
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex: Aluno X apresentou dificuldades com a matéria, aula reduzia devido à chuva..."
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
              {editingId ? 'Salvar Edição' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved logs list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Aulas Ministradas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Veja todas as aulas ministradas registradas no diário de classe</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por conteúdo..."
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
                  <th className="px-6 py-4">Data / Escola</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4">Conteúdo Desenvolvido</th>
                  <th className="px-6 py-4 text-center">Aulas</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma aula ministrada registrada.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {new Date(log.data + 'T12:00:00').toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {log.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{log.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {log.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">{log.conteudo}</div>
                        {log.observacoes && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            Obs: {log.observacoes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-block bg-slate-100 font-bold text-slate-700 px-2 py-0.5 rounded-full">
                          {log.aulas}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrint(log)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Imprimir Relatório"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEdit(log)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(log.id)} 
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
