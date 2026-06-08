import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  Camera, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info, Users, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Escola, Coordenador, Segmento, Aluno } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface PortfolioVisualInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface PortfolioEntry {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  anoSerie: string;
  turmaId: string;
  turmaNome: string;
  alunoId: number | null; // null for Toda a Turma
  alunoNome: string; // "Toda a Turma" if null
  campoExperiencia: string;
  titulo: string;
  descricao: string;
  imagens: string[]; // Base64 jpeg strings
  criadoEm: string;
}

const CAMPOS_EXPERIENCIA = [
  "O eu, o outro e o nós",
  "Corpo, gestos e movimentos",
  "Traços, sons, cores e formas",
  "Escuta, fala, pensamento e imaginação",
  "Espaços, tempos, quantidades, relações e transformações"
];

const FAiXAS_ETARIAS = [
  "Creche I (0 a 1 ano e 6 meses)",
  "Creche II (1 ano e 7 meses a 3 anos e 11 meses)",
  "Creche III (3 anos a 3 anos e 11 meses)",
  "Pré I (4 anos a 4 anos e 11 meses)",
  "Pré II (5 anos a 5 anos e 11 meses)"
];

export const PortfolioVisualInfantil: React.FC<PortfolioVisualInfantilProps> = ({
  escolas,
  isDemoMode,
  isAdmin,
  userEmail,
  currentUser,
  subHeader
}) => {
  const { showNotification } = useNotification();

  // State Variables
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataEntry, setDataEntry] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [anoSerie, setAnoSerie] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('coletivo'); // 'coletivo' or string number
  const [selectedCampo, setSelectedCampo] = useState(CAMPOS_EXPERIENCIA[0]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [studentFilter, setStudentFilter] = useState('ALL');

  // Print Portal
  const [printEntry, setPrintEntry] = useState<PortfolioEntry | null>(null);

  // Lists from DB
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);

  // Filter schools for ECE
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => e.segmentos.includes(Segmento.INFANTIL));
  }, [escolas]);

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
          .eq('stage', 'Educação Infantil');

        if (error) throw error;
        setTurmas(data || []);
        if (data && data.length > 0) {
          setSelectedTurmaId(data[0].id);
          setAnoSerie(data[0].anoSerie || 'Creche III');
        } else {
          setSelectedTurmaId('');
        }
      } catch (err) {
        console.error('Erro ao buscar turmas ECE:', err);
      }
    };

    fetchTurmas();
  }, [currentSchoolId]);

  // Sync grade when selected class changes
  useEffect(() => {
    const t = turmas.find(x => x.id === selectedTurmaId);
    if (t) {
      setAnoSerie(t.anoSerie || 'Creche III');
    }
  }, [selectedTurmaId, turmas]);

  // Fetch students for selected class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setSelectedAlunoId('coletivo');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .eq('class_id', selectedTurmaId)
          .order('name');

        if (error) throw error;
        setStudents(data || []);
        setSelectedAlunoId('coletivo'); // Default to whole group
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      }
    };

    fetchStudents();
  }, [selectedTurmaId]);

  // Load entries on mount/school change
  const loadEntries = async () => {
    setLoading(true);
    try {
      if (!isDemoMode) {
        const { data, error } = await supabase
          .from('portfolio_visual_infantil')
          .select('*')
          .eq('ativo', true)
          .order('data', { ascending: false });

        if (error) throw error;

        const formatted: PortfolioEntry[] = (data || []).map(d => {
          const classObj = turmas.find(t => t.id === d.turma_id);
          const studentObj = students.find(s => s.id === d.aluno_id);
          return {
            id: d.id,
            data: d.data,
            escolaId: d.escola_id,
            escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
            turmaId: d.turma_id,
            turmaNome: classObj ? `${classObj.name || classObj.anoSerie} • ${classObj.turno || ''}` : 'Turma',
            alunoId: d.aluno_id,
            alunoNome: d.aluno_id ? (studentObj ? studentObj.name : `Estudante #${d.aluno_id}`) : 'Toda a Turma',
            campoExperiencia: d.campo_experiencia,
            titulo: d.titulo,
            descricao: d.descricao,
            imagens: d.imagens || [],
            anoSerie: d.ano_serie,
            criadoEm: d.created_at
          };
        });
        setEntries(formatted);
      } else {
        const saved = localStorage.getItem('sigar_portfolio_visual_infantil');
        if (saved) {
          setEntries(JSON.parse(saved));
        } else {
          const demo: PortfolioEntry[] = [
            {
              id: 'demo-pv-1',
              data: new Date().toISOString().split('T')[0],
              escolaId: escolasInfantil.length > 0 ? escolasInfantil[0].id : 'demo-esc-1',
              escolaNome: escolasInfantil.length > 0 ? escolasInfantil[0].nome : 'Escola Demo ECE',
              anoSerie: 'Creche III',
              turmaId: 'demo-t3',
              turmaNome: 'Pré I A',
              alunoId: null, // Coletivo
              alunoNome: 'Toda a Turma',
              campoExperiencia: 'Traços, sons, cores e formas',
              titulo: 'Explorando Cores e Texturas Naturais',
              descricao: 'Realizamos uma atividade ao ar livre onde as crianças coletaram elementos da natureza (folhas secas, flores, terra e gravetos) para confeccionar tintas naturais e colagens. As crianças demonstraram grande interesse em explorar a mistura da terra com a água, observando a mudança de cor e a consistência da lama gerada. A experiência estimulou a percepção tátil e a criatividade expressiva do grupo.',
              imagens: [
                `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23eff6ff"/><circle cx="300" cy="180" r="80" fill="%233b82f6" opacity="0.8"/><rect x="220" y="240" width="160" height="40" rx="10" fill="%2360a5fa" opacity="0.9"/><text x="300" y="340" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e3a8a" text-anchor="middle">Atividade Prática: Texturas da Natureza</text></svg>`
              ],
              criadoEm: new Date().toISOString()
            },
            {
              id: 'demo-pv-2',
              data: new Date().toISOString().split('T')[0],
              escolaId: escolasInfantil.length > 0 ? escolasInfantil[0].id : 'demo-esc-1',
              escolaNome: escolasInfantil.length > 0 ? escolasInfantil[0].nome : 'Escola Demo ECE',
              anoSerie: 'Pré I',
              turmaId: 'demo-t4',
              turmaNome: 'Pré II B',
              alunoId: 1,
              alunoNome: 'Arthur Silva Souza',
              campoExperiencia: 'Espaços, tempos, quantidades, relações e transformações',
              titulo: 'Construção Geométrica e Organização Espacial',
              descricao: 'O estudante Arthur organizou as peças geométricas de madeira formando uma estrutura complexa de castelo. Durante a montagem, ele nomeou as formas (triângulos e retângulos) e fez comparações sobre tamanhos e equilíbrios. A atividade evidenciou sua capacidade de raciocínio espacial e foco individual.',
              imagens: [
                `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ecfdf5"/><polygon points="300,80 380,240 220,240" fill="%2310b981" opacity="0.8"/><circle cx="300" cy="270" r="40" fill="%2334d399" opacity="0.9"/><text x="300" y="340" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23064e3b" text-anchor="middle">Experiência com Formas e Cores</text></svg>`
              ],
              criadoEm: new Date().toISOString()
            }
          ];
          localStorage.setItem('sigar_portfolio_visual_infantil', JSON.stringify(demo));
          setEntries(demo);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar portfólios:', err);
      showNotification('error', 'Erro ao carregar registros do portfólio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [isDemoMode, selectedTurmaId, students]);

  // Image Compressor Helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75); // Compress 75% quality
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem no canvas.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  };

  // Image Upload handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 4) {
      showNotification('warning', 'Você pode adicionar no máximo 4 imagens por registro.');
      return;
    }

    setCompressing(true);
    try {
      const base64Images = await Promise.all(
        files.map(file => compressImage(file))
      );
      setUploadedImages(prev => [...prev, ...base64Images]);
      showNotification('success', 'Imagens importadas e otimizadas com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao processar uma ou mais imagens.');
    } finally {
      setCompressing(false);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingId(null);
    setDataEntry(new Date().toISOString().split('T')[0]);
    setSelectedCampo(CAMPOS_EXPERIENCIA[0]);
    setTitulo('');
    setDescricao('');
    setUploadedImages([]);
    setSelectedAlunoId('coletivo');
  };

  // Save Portfolio Entry
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscolaId || !selectedTurmaId || !titulo.trim() || !descricao.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const schoolObj = escolas.find(es => es.id === selectedEscolaId);
      const classObj = turmas.find(t => t.id === selectedTurmaId);
      const studentObj = selectedAlunoId !== 'coletivo' ? students.find(s => s.id === Number(selectedAlunoId)) : null;

      const escolaNome = schoolObj?.nome || 'Unidade';
      const turmaNome = classObj ? `${classObj.name || classObj.anoSerie} • ${classObj.turno || ''}` : 'Turma';
      const alunoNome = studentObj ? studentObj.name : 'Toda a Turma';
      const parsedAlunoId = studentObj ? studentObj.id : null;

      const payload = {
        data: dataEntry,
        escola_id: selectedEscolaId,
        ano_serie: anoSerie,
        turma_id: selectedTurmaId,
        aluno_id: parsedAlunoId,
        campo_experiencia: selectedCampo,
        titulo: titulo,
        descricao: descricao,
        imagens: uploadedImages,
        ativo: true
      };

      if (!isDemoMode) {
        if (editingId) {
          const { error } = await supabase
            .from('portfolio_visual_infantil')
            .update(payload)
            .eq('id', editingId);
          if (error) throw error;
          showNotification('success', 'Portfólio atualizado com sucesso!');
        } else {
          const { error } = await supabase
            .from('portfolio_visual_infantil')
            .insert([payload]);
          if (error) throw error;
          showNotification('success', 'Portfólio cadastrado com sucesso!');
        }
      } else {
        const localEntries = [...entries];
        if (editingId) {
          const idx = localEntries.findIndex(le => le.id === editingId);
          if (idx !== -1) {
            localEntries[idx] = {
              ...localEntries[idx],
              data: dataEntry,
              escolaId: selectedEscolaId,
              escolaNome,
              turmaId: selectedTurmaId,
              turmaNome,
              alunoId: parsedAlunoId,
              alunoNome,
              campoExperiencia: selectedCampo,
              titulo,
              descricao,
              imagens: uploadedImages,
              anoSerie
            };
          }
        } else {
          const newEntry: PortfolioEntry = {
            id: crypto.randomUUID(),
            data: dataEntry,
            escolaId: selectedEscolaId,
            escolaNome,
            turmaId: selectedTurmaId,
            turmaNome,
            alunoId: parsedAlunoId,
            alunoNome,
            campoExperiencia: selectedCampo,
            titulo,
            descricao,
            imagens: uploadedImages,
            anoSerie,
            criadoEm: new Date().toISOString()
          };
          localEntries.unshift(newEntry);
        }
        localStorage.setItem('sigar_portfolio_visual_infantil', JSON.stringify(localEntries));
        setEntries(localEntries);
        showNotification('success', editingId ? 'Portfólio atualizado no modo demo!' : 'Portfólio salvo no modo demo!');
      }

      resetForm();
      loadEntries();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao salvar portfólio.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: PortfolioEntry) => {
    setEditingId(entry.id);
    setDataEntry(entry.data);
    setSelectedEscolaId(entry.escolaId);
    setSelectedTurmaId(entry.turmaId);
    setAnoSerie(entry.anoSerie);
    setSelectedAlunoId(entry.alunoId ? String(entry.alunoId) : 'coletivo');
    setSelectedCampo(entry.campoExperiencia);
    setTitulo(entry.titulo);
    setDescricao(entry.descricao);
    setUploadedImages(entry.imagens);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja deletar este registro de Portfólio?')) return;
    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('portfolio_visual_infantil')
          .update({ ativo: false })
          .eq('id', id);
        if (error) throw error;
      } else {
        const localEntries = entries.filter(le => le.id !== id);
        localStorage.setItem('sigar_portfolio_visual_infantil', JSON.stringify(localEntries));
        setEntries(localEntries);
      }
      showNotification('success', 'Registro removido com sucesso!');
      loadEntries();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao deletar registro.');
    }
  };

  // Filter entries based on search and filters
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.alunoNome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSchool = schoolFilter === 'ALL' || e.escolaId === schoolFilter;
      const matchStudent = studentFilter === 'ALL' || 
                           (studentFilter === 'COLETIVO' && e.alunoId === null) || 
                           (studentFilter === 'INDIVIDUAL' && e.alunoId !== null);
      return matchSearch && matchSchool && matchStudent;
    });
  }, [entries, searchTerm, schoolFilter, studentFilter]);

  return (
    <div className="space-y-6 text-left">
      <PageHeader 
        title="Portfólio Visual - Educação Infantil"
        subtitle="Registro fotográfico e relatos pedagógicos de atividades, jogos e vivências da Educação Infantil"
        icon={Camera}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Printable Area - Hidden on Screen */}
      {printEntry && createPortal(
        <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-sans text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Portfólio Visual Pedagógico - Educação Infantil</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printEntry.escolaNome}</p>
              <p><strong>Grupo/Faixa Etária:</strong> {printEntry.anoSerie}</p>
              <p><strong>Turma:</strong> {printEntry.turmaNome}</p>
            </div>
            <div>
              <p><strong>Estudante:</strong> {printEntry.alunoNome}</p>
              <p><strong>Data da Vivência:</strong> {new Date(printEntry.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <p><strong>Campo de Experiência:</strong> {printEntry.campoExperiencia}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-black border-b pb-2 mb-2 uppercase text-slate-800">{printEntry.titulo}</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-[11px]">{printEntry.descricao}</p>
            </div>

            {printEntry.imagens && printEntry.imagens.length > 0 && (
              <div>
                <h3 className="font-bold text-xs mb-3 text-slate-800 uppercase">Registro Fotográfico</h3>
                <div className="grid grid-cols-2 gap-4">
                  {printEntry.imagens.map((img, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                      <img src={img} alt={`Registro ${i + 1}`} className="max-h-[250px] max-w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8 border-t text-[10px]">
            <div>
              <div className="border-t border-black w-48 mx-auto mt-6"></div>
              <p className="font-bold mt-1">Professor(a) Responsável</p>
            </div>
            <div>
              <div className="border-t border-black w-48 mx-auto mt-6"></div>
              <p className="font-bold mt-1">Coordenação Pedagógica</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Form Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Bookmark className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Registro de Portfólio' : 'Novo Registro de Portfólio Visual'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data *</label>
              <input 
                type="date" 
                value={dataEntry}
                onChange={e => setDataEntry(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
              <select 
                value={selectedEscolaId}
                onChange={e => setSelectedEscolaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                <option value="">Selecione a Unidade</option>
                {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma ECE *</label>
              <select 
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                <option value="">Selecione a Turma</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.name || t.anoSerie} • {t.turno}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estudante *</label>
              <select 
                value={selectedAlunoId}
                onChange={e => setSelectedAlunoId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                <option value="coletivo">Toda a Turma (Coletivo)</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de Experiência *</label>
                <select 
                  value={selectedCampo}
                  onChange={e => setSelectedCampo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                >
                  {CAMPOS_EXPERIENCIA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título da Vivência / Atividade *</label>
                <input 
                  type="text" 
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Confecção de tinta natural com terra e urucum"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Relato Pedagógico / Evidências de Aprendizado *</label>
                <textarea 
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descreva a vivência, as hipóteses elaboradas pelas crianças, as interações ocorridas e as evidências de aprendizagem observadas..."
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fotos da Vivência (Máx. 4)</label>
              
              <div className="relative border-2 border-dashed border-slate-200 hover:border-brand-orange rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white group">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange}
                  disabled={compressing || uploadedImages.length >= 4}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                
                {compressing ? (
                  <div className="space-y-2 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">Comprimindo imagens...</span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center justify-center">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-brand-orange" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Selecione fotos</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">JPEG ou PNG. Limite de 4 fotos.</span>
                  </div>
                )}
              </div>

              {/* Thumbnails preview */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group border rounded-xl overflow-hidden aspect-video bg-slate-100 shadow-sm flex items-center justify-center">
                      <img src={img} alt={`Preview ${i + 1}`} className="max-h-full max-w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="rounded-xl text-xs font-bold py-2">
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              variant="primary" 
              disabled={saving}
              className="rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Salvar Edição' : 'Salvar Portfólio'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico do Portfólio ECE</h3>
            <p className="text-xs text-slate-500 mt-0.5">Explore e imprima os relatos e registros visuais da Educação Infantil</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por tema ou aluno..."
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
              {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>

            <select 
              value={studentFilter}
              onChange={e => setStudentFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todos Registros</option>
              <option value="COLETIVO">Apenas Coletivos</option>
              <option value="INDIVIDUAL">Apenas Individuais</option>
            </select>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Carregando portfólio visual...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-200 italic text-xs">
            Nenhum registro de Portfólio Visual encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <PortfolioCard 
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPrint={(ent) => {
                  setPrintEntry(ent);
                  setTimeout(() => {
                    window.print();
                    setPrintEntry(null);
                  }, 150);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Mini Child Component for Portfolio Card
interface PortfolioCardProps {
  entry: PortfolioEntry;
  onEdit: (entry: PortfolioEntry) => void;
  onDelete: (id: string) => void;
  onPrint: (entry: PortfolioEntry) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ entry, onEdit, onDelete, onPrint }) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev === 0 ? entry.imagens.length - 1 : prev - 1));
  };

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev === entry.imagens.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 rounded-2xl text-left h-[460px]">
      {/* Slider / Image Showcase */}
      <div className="relative aspect-video bg-slate-100 flex items-center justify-center border-b overflow-hidden group">
        {entry.imagens && entry.imagens.length > 0 ? (
          <>
            <img 
              src={entry.imagens[activeImgIdx]} 
              alt={entry.titulo} 
              className="h-full w-full object-cover transition-all"
            />
            {entry.imagens.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-y-1/2 flex gap-1 transform -translate-x-1/2">
                  {entry.imagens.map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full ${idx === activeImgIdx ? 'bg-brand-orange' : 'bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300">
            <ImageIcon className="w-10 h-10" />
            <span className="text-[10px] font-bold uppercase">Sem registros visuais</span>
          </div>
        )}

        <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase text-slate-800 tracking-wider shadow-sm">
          {new Date(entry.data + 'T12:00:00').toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Content details */}
      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
        <div className="space-y-2.5 overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[60%]">
              {entry.escolaNome}
            </span>
            <span className="text-[9px] font-black text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md uppercase">
              {entry.turmaNome}
            </span>
          </div>

          <h4 className="font-black text-slate-800 text-xs line-clamp-1 uppercase tracking-tight">
            {entry.titulo}
          </h4>

          {/* Student tag */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Estudante: <strong className="text-slate-800">{entry.alunoNome}</strong></span>
          </div>

          {/* Campo de Experiencia */}
          <div className="text-[9px] font-bold text-white bg-slate-700 p-1.5 rounded-lg line-clamp-1 text-center select-none uppercase tracking-wide">
            {entry.campoExperiencia}
          </div>

          <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {entry.descricao}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-1.5 border-t pt-3 mt-4">
          <Button 
            onClick={() => onPrint(entry)} 
            variant="secondary" 
            size="sm" 
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border"
            title="Imprimir Portfólio"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
          <Button 
            onClick={() => onEdit(entry)} 
            variant="secondary" 
            size="sm" 
            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button 
            onClick={() => onDelete(entry.id)} 
            variant="secondary" 
            size="sm" 
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border"
            title="Deletar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
