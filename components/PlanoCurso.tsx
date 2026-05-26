import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ClipboardList, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, Bookmark, Save, Layers,
  Link2, Check, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Escola, Coordenador } from '../types';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../services/supabase';

interface PlanoCursoProps {
  escolas: Escola[]; // Mantido na assinatura para evitar quebras em outros arquivos
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

export interface ObjetoConhecimento {
  id: string;
  descricao: string;
}

export interface Habilidade {
  id: string;
  codigo: string;
  descricao: string;
}

export interface ObjetoHabilidadeLink {
  objetoId: string;
  habilidadeId: string;
}

export interface ItemPlano {
  id: string;
  eixoTematico: string;
  sugestoesPedagogicas: string;
  objetos: ObjetoConhecimento[];
  habilidades: Habilidade[];
  links: ObjetoHabilidadeLink[];
}

export interface CoursePlan {
  id: string;
  anoReferencia: string;
  componente: string;
  bimestre: string;
  anoSerie: string;
  itens: ItemPlano[];
  criadoEm: string;
}

interface RepositorioHabilidade {
  id: string;
  codigo: string;
  descricao: string;
  componente: string;
  anoSerie: string;
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

// BNCC Seed Skills Catalog
const BNCC_HABILIDADES: RepositorioHabilidade[] = [
  // Matemática - 1º Ano
  { id: 'bncc-m1-01', codigo: 'EF01MA01', componente: 'Matemática', anoSerie: '1º Ano', descricao: 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código de identificação.' },
  { id: 'bncc-m1-02', codigo: 'EF01MA02', componente: 'Matemática', anoSerie: '1º Ano', descricao: 'Contar de maneira lúdica, em jogos e brincadeiras, identificando a contagem de rotina e a contagem de objetos de coleções.' },
  { id: 'bncc-m1-08', codigo: 'EF01MA08', componente: 'Matemática', anoSerie: '1º Ano', descricao: 'Resolver e elaborar problemas de adição e de subtração, envolvendo números naturais de até dois algarismos, com os significados de juntar, acrescentar, separar e retirar, com o suporte de imagens e/ou material manipulável.' },
  
  // Língua Portuguesa - 1º Ano
  { id: 'bncc-lp1-01', codigo: 'EF01LP01', componente: 'Língua Portuguesa', anoSerie: '1º Ano', descricao: 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo.' },
  { id: 'bncc-lp1-02', codigo: 'EF01LP02', componente: 'Língua Portuguesa', anoSerie: '1º Ano', descricao: 'Escrever, alfabeticamente, como e onde convier, de próprio punho ou por meio de outra tecnologia de escrita, palavras e frases, com autonomia.' },
  { id: 'bncc-lp1-08', codigo: 'EF01LP08', componente: 'Língua Portuguesa', anoSerie: '1º Ano', descricao: 'Relacionar elements sonoros (sílabas, fonemas, partes de palavras) com sua representação escrita.' },

  // Matemática - 2º Ano
  { id: 'bncc-m2-01', codigo: 'EF02MA01', componente: 'Matemática', anoSerie: '2º Ano', descricao: 'Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema de numeração decimal (valor posicional e função do zero).' },
  { id: 'bncc-m2-05', codigo: 'EF02MA05', componente: 'Matemática', anoSerie: '2º Ano', descricao: 'Construir fatos básicos da adição e da subtração e utilizá-los no cálculo mental ou escrito.' },

  // Língua Portuguesa - 2º Ano
  { id: 'bncc-lp2-01', codigo: 'EF02LP01', componente: 'Língua Portuguesa', anoSerie: '2º Ano', descricao: 'Utilizar, ao escrever o texto, grafia correta de palavras conhecidas ou com estruturas silábicas regulares.' },
  { id: 'bncc-lp2-04', codigo: 'EF02LP04', componente: 'Língua Portuguesa', anoSerie: '2º Ano', descricao: 'Ler e escrever palavras novas com precisão na decodificação e na ortografia.' },

  // Matemática - 3º Ano
  { id: 'bncc-m3-01', codigo: 'EF03MA01', componente: 'Matemática', anoSerie: '3º Ano', descricao: 'Ler, escrever e comparar números naturais de até quatro ordens, com a compreensão de características do sistema de numeração decimal.' },
  { id: 'bncc-m3-05', codigo: 'EF03MA05', componente: 'Matemática', anoSerie: '3º Ano', descricao: 'Utilizar diferentes procedimentos de cálculo mental e escrito, resolvendo problemas de adição e subtração.' },

  // Língua Portuguesa - 3º Ano
  { id: 'bncc-lp3-01', codigo: 'EF03LP01', componente: 'Língua Portuguesa', anoSerie: '3º Ano', descricao: 'Ler e escrever palavras com sílabas complexas (consoante-vogal-consoante, consoante-consoante-vogal) focando na ortografia correta.' },

  // Outros anos e componentes (exemplos)
  { id: 'bncc-c1-01', codigo: 'EF01CI01', componente: 'Ciências', anoSerie: '1º Ano', descricao: 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano, discutindo sua origem e descarte.' },
  { id: 'bncc-h1-01', codigo: 'EF01HI01', componente: 'História', anoSerie: '1º Ano', descricao: 'Identificar aspectos do crescimento e da história pessoal, por meio do registro de lembranças e documentos.' },
  { id: 'bncc-g1-01', codigo: 'EF01GE01', componente: 'Geografia', anoSerie: '1º Ano', descricao: 'Descrever características observadas de seus lugares de vivência (moradia, escola etc.) e identificar semelhanças e diferenças.' }
];

// Helper to generate IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const createDefaultItem = (): ItemPlano => ({
  id: generateId(),
  eixoTematico: '',
  sugestoesPedagogicas: '',
  objetos: [],
  habilidades: [],
  links: []
});

export const PlanoCurso: React.FC<PlanoCursoProps> = ({ isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState<CoursePlan[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Columns headers
    const headers = [
      'Ano de Referência',
      'Ano/Série',
      'Componente Curricular',
      'Bimestre / Período',
      'Eixo Temático',
      'Objetos de Conhecimento',
      'Habilidades (Códigos separados por ;)',
      'Habilidades (Descrições separadas por ;)',
      'Sugestões Pedagógicas'
    ];

    // Some highly rich example rows
    const data = [
      {
        'Ano de Referência': 2026,
        'Ano/Série': '1º Ano',
        'Componente Curricular': 'Matemática',
        'Bimestre / Período': '1º Bimestre',
        'Eixo Temático': 'Números',
        'Objetos de Conhecimento': 'Leitura, escrita e comparação de números naturais; Contagem lúdica',
        'Habilidades (Códigos separados por ;)': 'EF01MA01; EF01MA02',
        'Habilidades (Descrições separadas por ;)': 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código de identificação.; Contar de maneira lúdica, em jogos e brincadeiras, identificando a contagem de rotina e a contagem de objetos de coleções.',
        'Sugestões Pedagógicas': 'Utilizar jogos de tabuleiro, tampinhas de garrafa e contagens de objetos cotidianos.'
      },
      {
        'Ano de Referência': 2026,
        'Ano/Série': '1º Ano',
        'Componente Curricular': 'Língua Portuguesa',
        'Bimestre / Período': '1º Bimestre',
        'Eixo Temático': 'Oralidade',
        'Objetos de Conhecimento': 'Constituição da oralidade; Escuta atenta',
        'Habilidades (Códigos separados por ;)': 'EF01LP01; EF01LP02',
        'Habilidades (Descrições separadas por ;)': 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo.; Escrever, alfabeticamente, como e onde convier, de próprio punho ou por meio de outra tecnologia de escrita, palavras e frases, com autonomia.',
        'Sugestões Pedagógicas': 'Roda de conversa diária, contação de histórias infantis e canto de parlendas.'
      }
    ];

    const wsData = [headers, ...data.map(row => headers.map(h => row[h as keyof typeof row]))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply column widths to make it super premium
    ws['!cols'] = [
      { wch: 18 }, // Ano de Referencia
      { wch: 15 }, // Ano/Serie
      { wch: 25 }, // Componente Curricular
      { wch: 20 }, // Bimestre / Periodo
      { wch: 20 }, // Eixo Tematico
      { wch: 50 }, // Objetos de Conhecimento
      { wch: 40 }, // Habilidades Codigos
      { wch: 60 }, // Habilidades Descricoes
      { wch: 60 }  // Sugestoes Pedagogicas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plano de Curso Modelo');
    XLSX.writeFile(wb, 'Modelo_Importacao_PlanoCurso.xlsx');
    showNotification('success', 'Planilha modelo baixada com sucesso!');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        // Parse rows as raw objects
        const rawRows = XLSX.utils.sheet_to_json<any>(ws);
        
        if (rawRows.length === 0) {
          showNotification('error', 'A planilha está vazia.');
          return;
        }

        // Map raw rows to Grouped Plans
        const groups: Record<string, {
          anoReferencia: string;
          anoSerie: string;
          componente: string;
          bimestre: string;
          itens: any[];
        }> = {};

        rawRows.forEach((row: any) => {
          // Normalize column names in case they have whitespace/accents issues
          const getValue = (keys: string[]) => {
            const foundKey = Object.keys(row).find(k => 
              keys.some(key => k.toLowerCase().replace(/[\s\-\_\/]/g, '').includes(key.toLowerCase().replace(/[\s\-\_\/]/g, '')))
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const anoRefVal = String(getValue(['referência', 'referencia', 'ano']) || new Date().getFullYear()).trim();
          const anoSerieVal = String(getValue(['série', 'serie', 'ano/série', 'ano/serie']) || '').trim();
          const componenteVal = String(getValue(['componente', 'curricular']) || '').trim();
          const bimestreVal = String(getValue(['bimestre', 'período', 'periodo']) || '').trim();
          const eixoVal = String(getValue(['eixo', 'temático', 'tematico']) || '').trim();
          const objetosVal = String(getValue(['objeto', 'conhecimento', 'objetos']) || '').trim();
          const habsVal = String(getValue(['habilidade', 'código', 'codigo', 'habilidades']) || '').trim();
          const descsVal = String(getValue(['descrição', 'descricao', 'descrições', 'descricoes']) || '').trim();
          const sugestoesVal = String(getValue(['sugestões', 'sugestoes', 'recursos', 'pedagógicas', 'pedagogicas']) || '').trim();

          // Validation
          if (!anoSerieVal || !componenteVal || !bimestreVal || !eixoVal) {
            // Skip invalid row
            return;
          }

          // Match Component, Bimestre and AnoSerie to valid options in our system for normalization
          const matchedComponente = COMPONENTES.find(c => 
            c.toLowerCase().replace(/[\s]/g, '') === componenteVal.toLowerCase().replace(/[\s]/g, '')
          ) || COMPONENTES.find(c => 
            c.toLowerCase().includes(componenteVal.toLowerCase()) || componenteVal.toLowerCase().includes(c.toLowerCase())
          ) || componenteVal;

          const matchedBimestre = BIMESTRES.find(b => 
            b.toLowerCase().replace(/[\s]/g, '') === bimestreVal.toLowerCase().replace(/[\s]/g, '')
          ) || BIMESTRES.find(b => 
            b.toLowerCase().includes(bimestreVal.toLowerCase()) || bimestreVal.toLowerCase().includes(b.toLowerCase())
          ) || bimestreVal;

          const matchedAnoSerie = ANOS_SERIES.find(a => 
            a.toLowerCase().replace(/[\s]/g, '') === anoSerieVal.toLowerCase().replace(/[\s]/g, '')
          ) || ANOS_SERIES.find(a => 
            a.toLowerCase().includes(anoSerieVal.toLowerCase()) || anoSerieVal.toLowerCase().includes(a.toLowerCase())
          ) || anoSerieVal;

          const groupKey = `${anoRefVal}-${matchedAnoSerie}-${matchedComponente}-${matchedBimestre}`;

          if (!groups[groupKey]) {
            groups[groupKey] = {
              anoReferencia: anoRefVal,
              anoSerie: matchedAnoSerie,
              componente: matchedComponente,
              bimestre: matchedBimestre,
              itens: []
            };
          }

          // Parse objects (separated by semicolon)
          const objetos: ObjetoConhecimento[] = objetosVal
            .split(/[;;\n]/)
            .map(desc => desc.trim())
            .filter(Boolean)
            .map(desc => ({
              id: generateId(),
              descricao: desc
            }));

          // Parse skills codes and manual descriptions
          const parsedHabsList = habsVal.split(/[;;\n]/).map(code => code.trim().toUpperCase()).filter(Boolean);
          const parsedDescsList = descsVal.split(/[;;\n]/).map(desc => desc.trim()).filter(Boolean);

          const habilidades: Habilidade[] = parsedHabsList.map((code, idx) => {
            // Check if there is a manual description at the same index
            const manualDesc = parsedDescsList[idx]?.trim();
            // Try to find the full description of this skill in our repository!
            const matchedRepoHab = habRepository.find(h => h.codigo.trim().toUpperCase() === code);
            return {
              id: matchedRepoHab?.id || generateId(),
              codigo: code,
              descricao: manualDesc || matchedRepoHab?.descricao || `Habilidade ${code} importada.`
            };
          });

          // Generate links between all objects and all skills in this Eixo Tematico row!
          const links: ObjetoHabilidadeLink[] = [];
          objetos.forEach(obj => {
            habilidades.forEach(hab => {
              links.push({
                objetoId: obj.id,
                habilidadeId: hab.id
              });
            });
          });

          groups[groupKey].itens.push({
            id: generateId(),
            eixoTematico: eixoVal,
            sugestoesPedagogicas: sugestoesVal,
            objetos,
            habilidades,
            links
          });
        });

        // Add imported plans to plans list
        const importedCount = Object.keys(groups).length;
        if (importedCount === 0) {
          showNotification('error', 'Nenhum plano válido encontrado na planilha. Verifique as colunas obrigatórias.');
          return;
        }

        let updatedPlans = [...plans];
        const importPromises = Object.values(groups).map(async (importedPlan) => {
          // Check if there is an existing plan for this combination
          const existingIdx = updatedPlans.findIndex(p => 
            p.anoReferencia === importedPlan.anoReferencia &&
            p.anoSerie === importedPlan.anoSerie &&
            p.componente === importedPlan.componente &&
            p.bimestre === importedPlan.bimestre
          );

          const payload: CoursePlan = {
            id: existingIdx >= 0 ? updatedPlans[existingIdx].id : generateId(),
            anoReferencia: importedPlan.anoReferencia,
            anoSerie: importedPlan.anoSerie,
            componente: importedPlan.componente,
            bimestre: importedPlan.bimestre,
            itens: importedPlan.itens,
            criadoEm: new Date().toISOString()
          };

          if (existingIdx >= 0) {
            updatedPlans[existingIdx] = payload;
          } else {
            updatedPlans = [payload, ...updatedPlans];
          }

          if (!isDemoMode) {
            const dbPayload = {
              id: payload.id,
              ano_referencia: payload.anoReferencia,
              componente: payload.componente,
              bimestre: payload.bimestre,
              ano_serie: payload.anoSerie,
              itens: payload.itens,
              updated_at: new Date().toISOString(),
              updated_by: userEmail || currentUser?.contato || 'user'
            };
            const { error } = await supabase.from('planos_curso').upsert(dbPayload);
            if (error) throw error;
          }
        });

        Promise.all(importPromises)
          .then(() => {
            setPlans(updatedPlans);
            if (isDemoMode) {
              localStorage.setItem('sigar_planos_curso', JSON.stringify(updatedPlans));
            }
            showNotification('success', `${importedCount} Plano(s) de Curso importado(s) e unificado(s) com sucesso!`);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
          })
          .catch(err => {
            console.error('Erro na importação Supabase:', err);
            showNotification('error', 'Erro ao salvar os planos importados no banco de dados.');
          });
      } catch (err) {
        console.error('Erro na importação:', err);
        showNotification('error', 'Erro ao ler a planilha. Verifique a formatação do arquivo.');
      }
    };
    reader.readAsBinaryString(file);
  };
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear().toString());
  const [anoSerie, setAnoSerie] = useState(ANOS_SERIES[0]);
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [bimestre, setBimestre] = useState(BIMESTRES[0]);
  
  // Structured Planning Items
  const [itens, setItens] = useState<ItemPlano[]>([createDefaultItem()]);

  // Global Skills Repository
  const [habRepository, setHabRepository] = useState<RepositorioHabilidade[]>([]);

  // Habilidades Modal States
  const [isHabModalOpen, setIsHabModalOpen] = useState(false);
  const [activeItemIdForHab, setActiveItemIdForHab] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'select' | 'create'>('select');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalComponenteFilter, setModalComponenteFilter] = useState('ALL');
  const [modalAnoSerieFilter, setModalAnoSerieFilter] = useState('ALL');

  // Custom Habilidade Form States
  const [newHabCode, setNewHabCode] = useState('');
  const [newHabDesc, setNewHabDesc] = useState('');
  const [newHabComponente, setNewHabComponente] = useState(COMPONENTES[0]);
  const [newHabAnoSerie, setNewHabAnoSerie] = useState(ANOS_SERIES[0]);
  const [newHabEixoTematico, setNewHabEixoTematico] = useState('');
  const [newHabObjetoDesc, setNewHabObjetoDesc] = useState('');
  const [newHabSugestoes, setNewHabSugestoes] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Print Mode State
  const [printPlan, setPrintPlan] = useState<CoursePlan | null>(null);

  const fetchRealData = async () => {
    try {
      // 1. Fetch planos_curso
      const { data: plansData, error: plansError } = await supabase
        .from('planos_curso')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const formattedPlans: CoursePlan[] = (plansData || []).map((p: any) => ({
        id: p.id,
        anoReferencia: p.ano_referencia,
        componente: p.componente,
        bimestre: p.bimestre,
        anoSerie: p.ano_serie,
        itens: p.itens || [],
        criadoEm: p.created_at
      }));
      setPlans(formattedPlans);

      // 2. Fetch habilidades_repositorio
      const { data: habsData, error: habsError } = await supabase
        .from('habilidades_repositorio')
        .select('*')
        .order('codigo', { ascending: true });

      if (habsError) throw habsError;

      const formattedHabs: RepositorioHabilidade[] = (habsData || []).map((h: any) => ({
        id: h.id,
        codigo: h.codigo,
        descricao: h.descricao,
        componente: h.componente,
        anoSerie: h.ano_serie
      }));
      
      // Merge with BNCC seed just in case, but prioritize DB records
      const combinedHabs = [...formattedHabs];
      BNCC_HABILIDADES.forEach(seedHab => {
        if (!combinedHabs.some(h => h.codigo === seedHab.codigo)) {
          combinedHabs.push(seedHab);
        }
      });

      setHabRepository(combinedHabs);
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
      showNotification('error', 'Falha ao carregar dados do Supabase. Utilizando dados locais.');
      setPlans([]);
      setHabRepository(BNCC_HABILIDADES);
    }
  };

  // Load from localStorage with migration
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_curso');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const migrated = parsed.map((p: any) => {
              if (p.itens && Array.isArray(p.itens)) return p;
              
              // Migrate old structure
              const migratedItem: ItemPlano = {
                id: generateId(),
                eixoTematico: p.titulo || 'Eixo Temático Geral',
                sugestoesPedagogicas: [
                  p.metodologia ? `Metodologia: ${p.metodologia}` : '',
                  p.recursos ? `Recursos: ${p.recursos}` : '',
                  p.avaliacao ? `Avaliação: ${p.avaliacao}` : ''
                ].filter(Boolean).join('\n'),
                objetos: p.conteudo ? [{ id: 'old-content', descricao: p.conteudo }] : [],
                habilidades: p.objetivos ? [{ id: 'old-objectives', codigo: 'HAB', descricao: p.objetivos }] : [],
                links: p.conteudo && p.objetivos ? [{ objetoId: 'old-content', habilidadeId: 'old-objectives' }] : []
              };
              
              return {
                id: p.id,
                anoReferencia: p.anoReferencia,
                componente: p.componente,
                bimestre: p.bimestre,
                anoSerie: p.anoSerie || '',
                itens: [migratedItem],
                criadoEm: p.criadoEm || new Date().toISOString()
              };
            });
            setPlans(migrated);
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Load global skills repository
      const savedHabs = localStorage.getItem('sigar_repositorio_habilidades');
      if (savedHabs) {
        try {
          setHabRepository(JSON.parse(savedHabs));
        } catch (e) {
          console.error(e);
          setHabRepository(BNCC_HABILIDADES);
        }
      } else {
        setHabRepository(BNCC_HABILIDADES);
        localStorage.setItem('sigar_repositorio_habilidades', JSON.stringify(BNCC_HABILIDADES));
      }
    } else {
      fetchRealData();
    }
  }, [isDemoMode]);

  // --- Dynamic Item Planning Helpers ---
  const updateItemField = (itemId: string, field: keyof ItemPlano, value: any) => {
    setItens(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const addObjeto = (itemId: string, descricao: string) => {
    if (!descricao.trim()) return;
    const newObj: ObjetoConhecimento = {
      id: generateId(),
      descricao: descricao.trim()
    };
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        objetos: [...item.objetos, newObj]
      };
    }));
  };

  const removeObjeto = (itemId: string, objetoId: string) => {
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        objetos: item.objetos.filter(o => o.id !== objetoId),
        links: item.links.filter(l => l.objetoId !== objetoId)
      };
    }));
  };

  const removePlanningItem = (itemId: string) => {
    if (itens.length <= 1) return;
    setItens(prev => prev.filter(item => item.id !== itemId));
  };

  // --- Modal Helpers ---
  const openHabilidadesModal = (itemId: string) => {
    setActiveItemIdForHab(itemId);
    setModalComponenteFilter(componente);
    setModalAnoSerieFilter(anoSerie);
    setNewHabComponente(componente);
    setNewHabAnoSerie(anoSerie);

    // Pre-populate quick-form fields from current active planning item
    const activeItem = itens.find(item => item.id === itemId);
    if (activeItem) {
      setNewHabEixoTematico(activeItem.eixoTematico || '');
      setNewHabSugestoes(activeItem.sugestoesPedagogicas || '');
    } else {
      setNewHabEixoTematico('');
      setNewHabSugestoes('');
    }
    setNewHabObjetoDesc('');

    setModalSearchTerm('');
    setModalTab('select');
    setIsHabModalOpen(true);
  };

  const isHabInActiveItem = (codigo: string) => {
    const activeItem = itens.find(item => item.id === activeItemIdForHab);
    return activeItem ? activeItem.habilidades.some(h => h.codigo === codigo) : false;
  };

  const addHabilidadeToItem = (itemId: string, hab: Omit<Habilidade, 'id'> | Habilidade) => {
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.habilidades.some(h => h.codigo === hab.codigo);
      if (exists) return item;
      
      const newHab: Habilidade = {
        id: (hab as any).id || generateId(),
        codigo: hab.codigo.trim().toUpperCase(),
        descricao: hab.descricao.trim()
      };
      return {
        ...item,
        habilidades: [...item.habilidades, newHab]
      };
    }));
  };

  const removeHabilidadeByCode = (itemId: string, codigo: string) => {
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const habToRemove = item.habilidades.find(h => h.codigo === codigo);
      if (!habToRemove) return item;
      return {
        ...item,
        habilidades: item.habilidades.filter(h => h.codigo !== codigo),
        links: item.links.filter(l => l.habilidadeId !== habToRemove.id)
      };
    }));
  };
  const handleCreateCustomHabilidade = async () => {
    if (!newHabCode.trim() || !newHabDesc.trim()) {
      showNotification('error', 'Preencha todos os campos da nova habilidade.');
      return;
    }

    const codeUpper = newHabCode.trim().toUpperCase();
    const existsInRepo = habRepository.some(h => h.codigo === codeUpper);
    let finalHab: RepositorioHabilidade;

    if (!isDemoMode) {
      // Real database fetch/upsert
      const dbHab = {
        id: existsInRepo ? habRepository.find(h => h.codigo === codeUpper)!.id : generateId(),
        codigo: codeUpper,
        descricao: newHabDesc.trim(),
        componente: newHabComponente,
        ano_serie: newHabAnoSerie
      };

      const { data, error } = await supabase
        .from('habilidades_repositorio')
        .upsert(dbHab, { onConflict: 'codigo' })
        .select();

      if (error) {
        console.error('Erro ao cadastrar habilidade no Supabase:', error);
        showNotification('error', 'Erro ao cadastrar habilidade no banco de dados.');
        return;
      }
      
      if (data && data.length > 0) {
        finalHab = {
          id: data[0].id,
          codigo: data[0].codigo,
          descricao: data[0].descricao,
          componente: data[0].componente,
          anoSerie: data[0].ano_serie
        };
      } else {
        finalHab = {
          id: dbHab.id,
          codigo: dbHab.codigo,
          descricao: dbHab.descricao,
          componente: dbHab.componente,
          anoSerie: dbHab.ano_serie
        };
      }

      if (!existsInRepo) {
        setHabRepository([...habRepository, finalHab]);
      }
    } else {
      // Demo Mode
      if (existsInRepo) {
        finalHab = habRepository.find(h => h.codigo === codeUpper)!;
      } else {
        finalHab = {
          id: generateId(),
          codigo: codeUpper,
          descricao: newHabDesc.trim(),
          componente: newHabComponente,
          anoSerie: newHabAnoSerie
        };
        const updatedRepo = [...habRepository, finalHab];
        setHabRepository(updatedRepo);
        localStorage.setItem('sigar_repositorio_habilidades', JSON.stringify(updatedRepo));
      }
    }

    if (activeItemIdForHab) {
      const newHabId = finalHab.id;

      setItens(prev => prev.map(item => {
        if (item.id !== activeItemIdForHab) return item;

        // 1. Add Habilidade to item if not already exists
        const habExists = item.habilidades.some(h => h.codigo === codeUpper);
        const newHab: Habilidade = {
          id: newHabId,
          codigo: codeUpper,
          descricao: finalHab.descricao
        };
        const updatedHabilidades = habExists ? item.habilidades : [...item.habilidades, newHab];

        // 2. Update Eixo Temático if filled
        const updatedEixo = newHabEixoTematico.trim() || item.eixoTematico;

        // 3. Update Sugestões Pedagógicas if filled
        const updatedSugestoes = newHabSugestoes.trim() || item.sugestoesPedagogicas;

        // 4. Update Objeto de Conhecimento and links
        let updatedObjetos = [...item.objetos];
        let updatedLinks = [...item.links];

        if (newHabObjetoDesc.trim()) {
          const hasObj = item.objetos.some(o => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase());
          let targetObjId = '';

          if (hasObj) {
            targetObjId = item.objetos.find(o => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase())!.id;
          } else {
            const newObjId = generateId();
            const newObj: ObjetoConhecimento = {
              id: newObjId,
              descricao: newHabObjetoDesc.trim()
            };
            updatedObjetos.push(newObj);
            targetObjId = newObjId;
          }

          // Link them bilaterally (i.e., skill linked to object in item's links)
          const linkExists = item.links.some(l => l.objetoId === targetObjId && l.habilidadeId === newHabId);
          if (!linkExists) {
            updatedLinks.push({
              objetoId: targetObjId,
              habilidadeId: newHabId
            });
          }
        }

        return {
          ...item,
          eixoTematico: updatedEixo,
          sugestoesPedagogicas: updatedSugestoes,
          habilidades: updatedHabilidades,
          objetos: updatedObjetos,
          links: updatedLinks
        };
      }));

      showNotification('success', `Habilidade ${codeUpper} cadastrada e vinculada com sucesso!`);
    }

    setNewHabCode('');
    setNewHabDesc('');
    setNewHabEixoTematico('');
    setNewHabObjetoDesc('');
    setNewHabSugestoes('');
    setIsHabModalOpen(false);
    setActiveItemIdForHab(null);
  };
  const toggleLink = (itemId: string, objetoId: string, habId: string) => {
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.links.some(l => l.objetoId === objetoId && l.habilidadeId === habId);
      const updatedLinks = exists
        ? item.links.filter(l => !(l.objetoId === objetoId && l.habilidadeId === habId))
        : [...item.links, { objetoId, habilidadeId: habId }];
      return {
        ...item,
        links: updatedLinks
      };
    }));
  };

  // Filter skills for display in the modal
  const filteredCatalogHabs = useMemo(() => {
    return habRepository.filter(hab => {
      const matchesSearch = modalSearchTerm === '' || 
                            hab.codigo.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
                            hab.descricao.toLowerCase().includes(modalSearchTerm.toLowerCase());
      const matchesComponent = modalComponenteFilter === 'ALL' || hab.componente === modalComponenteFilter;
      const matchesGrade = modalAnoSerieFilter === 'ALL' || hab.anoSerie === modalAnoSerieFilter;
      return matchesSearch && matchesComponent && matchesGrade;
    });
  }, [habRepository, modalSearchTerm, modalComponenteFilter, modalAnoSerieFilter]);

  // --- Form Save, Edit, Delete ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItens = itens.filter(item => item.eixoTematico.trim() !== '');
    if (validItens.length === 0) {
      showNotification('error', 'Preencha o Eixo Temático de pelo menos um bloco do plano.');
      return;
    }

    // Uniqueness validation
    const duplicate = plans.find(p => 
      p.id !== editingId &&
      p.anoReferencia === anoReferencia &&
      p.anoSerie === anoSerie &&
      p.componente === componente &&
      p.bimestre === bimestre
    );

    if (duplicate) {
      showNotification('error', 'Já existe um plano cadastrado para este Ano, Série, Componente Curricular e Período.');
      return;
    }

    const payload: CoursePlan = {
      id: editingId || generateId(),
      anoReferencia,
      componente,
      bimestre,
      anoSerie,
      itens: validItens,
      criadoEm: new Date().toISOString()
    };

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        ano_referencia: payload.anoReferencia,
        componente: payload.componente,
        bimestre: payload.bimestre,
        ano_serie: payload.anoSerie,
        itens: payload.itens,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('planos_curso')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar plano no Supabase:', error);
        showNotification('error', 'Erro ao salvar o plano de curso no banco de dados.');
        return;
      }
      
      if (editingId) {
        setPlans(plans.map(p => p.id === editingId ? payload : p));
        showNotification('success', 'Plano de Curso unificado atualizado com sucesso no Supabase!');
      } else {
        setPlans([payload, ...plans]);
        showNotification('success', 'Plano de Curso unificado cadastrado com sucesso no Supabase!');
      }
    } else {
      let updatedPlans: CoursePlan[];
      if (editingId) {
        updatedPlans = plans.map(p => p.id === editingId ? payload : p);
        showNotification('success', 'Plano de Curso atualizado com sucesso!');
      } else {
        updatedPlans = [payload, ...plans];
        showNotification('success', 'Plano de Curso unificado cadastrado com sucesso!');
      }

      setPlans(updatedPlans);
      localStorage.setItem('sigar_planos_curso', JSON.stringify(updatedPlans));
    }
    
    resetForm();
  };

  const handleEdit = (plan: CoursePlan) => {
    setEditingId(plan.id);
    setAnoReferencia(plan.anoReferencia);
    setAnoSerie(plan.anoSerie || ANOS_SERIES[0]);
    setComponente(plan.componente);
    setBimestre(plan.bimestre);
    setItens(plan.itens && plan.itens.length > 0 ? JSON.parse(JSON.stringify(plan.itens)) : [createDefaultItem()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este Plano de Curso?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('planos_curso')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar plano no Supabase:', error);
        showNotification('error', 'Erro ao excluir o plano de curso no banco de dados.');
        return;
      }
      showNotification('success', 'Plano de Curso unificado excluído com sucesso do Supabase!');
    } else {
      showNotification('success', 'Plano de Curso removido.');
    }

    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_planos_curso', JSON.stringify(updated));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAnoSerie(ANOS_SERIES[0]);
    setItens([createDefaultItem()]);
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch = searchTerm === '' || 
                          p.componente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.itens?.some(item => item.eixoTematico.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGrade = gradeFilter === 'ALL' || p.anoSerie === gradeFilter;
    return matchesSearch && matchesGrade;
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
        subtitle="Elaboração e acompanhamento do planejamento curricular municipal"
        icon={ClipboardList}
        badgeText="DIÁRIO DE CLASSE"
        actions={[
          {
            label: 'Baixar Modelo Excel',
            icon: Download,
            onClick: handleDownloadTemplate,
            variant: 'outline'
          },
          {
            label: 'Importar Excel',
            icon: Upload,
            onClick: () => fileInputRef.current?.click(),
            variant: 'primary'
          }
        ]}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />

      {/* Printable Area - Hidden on Screen */}
      {printPlan && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-sans">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Instrumental - Plano de Curso Curricular Unificado</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Ano/Série:</strong> {printPlan.anoSerie || '---'}</p>
              <p><strong>Ano de Referência:</strong> {printPlan.anoReferencia}</p>
              <p className="mt-2 text-gray-400 text-[10px]"><strong>Unidade Escolar:</strong> ___________________________________</p>
            </div>
            <div>
              <p><strong>Componente Curricular:</strong> {printPlan.componente}</p>
              <p><strong>Período:</strong> {printPlan.bimestre}</p>
              <p className="mt-2 text-gray-400 text-[10px]"><strong>Turma(s):</strong> _________________________________________</p>
            </div>
          </div>

          <div className="space-y-6">
            {printPlan.itens.map((item, index) => (
              <div key={item.id} className="border rounded-lg overflow-hidden page-break-inside-avoid">
                <div className="bg-slate-100 px-4 py-2 border-b">
                  <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                    Item {index + 1}: Eixo Temático - {item.eixoTematico || 'Não Informado'}
                  </h3>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Mapped Objects and Skills */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-1 text-[9px] uppercase tracking-wider">
                      Objetos de Conhecimento & Habilidades Associadas
                    </h4>
                    {item.objetos.length === 0 ? (
                      <p className="text-gray-400 italic">Nenhum objeto de conhecimento cadastrado.</p>
                    ) : (
                      item.objetos.map(obj => {
                        const linkedHabs = item.links
                          .filter(l => l.objetoId === obj.id)
                          .map(l => item.habilidades.find(h => h.id === l.habilidadeId))
                          .filter(Boolean);

                        return (
                          <div key={obj.id} className="pl-3 border-l-2 border-brand-orange py-1">
                            <p className="font-bold text-slate-800 text-xs">{obj.descricao}</p>
                            {linkedHabs.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {linkedHabs.map(h => (
                                  <span key={h!.id} className="bg-slate-100 text-slate-800 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200" title={h!.descricao}>
                                    {h!.codigo}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] text-gray-400 italic mt-0.5">Sem habilidades vinculadas.</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column: Skills Detailing & Suggestions */}
                  <div className="space-y-4 border-l pl-6">
                    <h4 className="font-bold text-slate-700 border-b pb-1 text-[9px] uppercase tracking-wider">
                      Detalhamento das Habilidades
                    </h4>
                    {item.habilidades.length === 0 ? (
                      <p className="text-gray-400 italic">Nenhuma habilidade cadastrada.</p>
                    ) : (
                      <ul className="space-y-2">
                        {item.habilidades.map(h => (
                          <li key={h.id} className="text-slate-700 text-[10px] leading-relaxed">
                            <strong className="text-brand-orange font-mono mr-1.5">{h.codigo}:</strong>
                            {h.descricao}
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.sugestoesPedagogicas && (
                      <div className="mt-4 pt-3 border-t">
                        <h4 className="font-bold text-slate-700 text-[9px] uppercase tracking-wider mb-1">
                          Sugestões Pedagógicas
                        </h4>
                        <p className="whitespace-pre-line text-slate-600 text-[10px] leading-relaxed">{item.sugestoesPedagogicas}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
            {editingId ? 'Editar Plano de Curso Unificado' : 'Novo Plano de Curso Unificado'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ano/Série *</label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {ANOS_SERIES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Componente Curricular *</label>
              <select 
                value={componente}
                onChange={e => setComponente(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {BIMESTRES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Planning Items Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="text-brand-orange w-4 h-4" />
                Estrutura de Planejamento Pedagógico (Eixos Temáticos)
              </h3>
            </div>

            {itens.map((item, idx) => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 relative animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlanningItem(item.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remover este eixo de planejamento"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="bg-brand-orange/10 text-brand-orange text-xs font-black px-2 py-0.5 rounded-full">
                    Item #{idx + 1}
                  </span>
                </div>

                {/* Eixo Tematico Input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Eixo Temático *
                  </label>
                  <input
                    type="text"
                    value={item.eixoTematico}
                    onChange={e => updateItemField(item.id, 'eixoTematico', e.target.value)}
                    placeholder="Ex: Números, Geometria, Oralidade, Leitura, Corpo e Movimento..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Objetos de Conhecimento Panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                      <span>Objetos de Conhecimento ({item.objetos.length})</span>
                    </h4>
                    
                    {/* Add Object inline form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id={`new-objeto-${item.id}`}
                        placeholder="Novo objeto de conhecimento..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            addObjeto(item.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg outline-none text-xs focus:border-brand-orange"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`new-objeto-${item.id}`) as HTMLInputElement;
                          if (input) {
                            addObjeto(item.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-brand-orange text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Objects List */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {item.objetos.length === 0 ? (
                        <p className="text-slate-400 text-xs italic text-center py-4">Nenhum objeto adicionado.</p>
                      ) : (
                        item.objetos.map(obj => (
                          <div key={obj.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 group">
                            <span className="text-xs text-slate-700 font-medium">{obj.descricao}</span>
                            <button
                              type="button"
                              onClick={() => removeObjeto(item.id, obj.id)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Habilidades Panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                      <span>Habilidades ({item.habilidades.length})</span>
                      <button
                        type="button"
                        onClick={() => openHabilidadesModal(item.id)}
                        className="bg-brand-orange hover:bg-orange-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-sm uppercase tracking-wider"
                      >
                        <Plus size={14} />
                        Gerenciar
                      </button>
                    </h4>

                    {/* Habilidades List */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {item.habilidades.length === 0 ? (
                        <div className="text-slate-400 text-xs italic text-center py-6 flex flex-col items-center gap-2">
                          <span>Nenhuma habilidade selecionada.</span>
                          <button
                            type="button"
                            onClick={() => openHabilidadesModal(item.id)}
                            className="text-brand-orange hover:underline text-[10px] font-bold"
                          >
                            Clique para selecionar habilidades
                          </button>
                        </div>
                      ) : (
                        item.habilidades.map(hab => (
                          <div key={hab.id} className="flex justify-between items-start bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 group gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-brand-orange/10 text-brand-orange text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                                  {hab.codigo}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 mt-1 font-medium leading-tight">{hab.descricao}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeHabilidadeByCode(item.id, hab.codigo)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0 self-start"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Relational Mapping Grid N:N */}
                {item.objetos.length > 0 && item.habilidades.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 border-b pb-2 border-slate-100">
                      <Link2 className="w-4 h-4 text-brand-orange" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight">
                        Associação de Objeto com Habilidade (Mapeamento N:N)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Vincule as habilidades correspondentes a cada objeto de conhecimento clicando sobre elas:
                    </p>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {item.objetos.map(obj => (
                        <div key={obj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-800">
                            {obj.descricao}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.habilidades.map(hab => {
                              const isLinked = item.links.some(l => l.objetoId === obj.id && l.habilidadeId === hab.id);
                              return (
                                <button
                                  key={hab.id}
                                  type="button"
                                  onClick={() => toggleLink(item.id, obj.id, hab.id)}
                                  title={hab.descricao}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tight transition-all flex items-center gap-1 border
                                    ${isLinked 
                                      ? 'bg-brand-orange text-white border-brand-orange shadow-sm' 
                                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                  {isLinked && <Check className="w-2.5 h-2.5" />}
                                  <span>{hab.codigo}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pedagogical Suggestions */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Sugestões Pedagógicas / Recursos para este Eixo
                  </label>
                  <textarea
                    value={item.sugestoesPedagogicas}
                    onChange={e => updateItemField(item.id, 'sugestoesPedagogicas', e.target.value)}
                    placeholder="Sugestões de estratégias metodológicas, intervenções pedagógicas e recursos para trabalhar com estes objetos..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none bg-white"
                  />
                </div>
              </div>
            ))}

            {/* Add Axis Button */}
            <div className="flex justify-start pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setItens(prev => [...prev, createDefaultItem()])}
                className="rounded-xl text-xs font-bold py-2.5 flex items-center gap-1.5 border-dashed border-2 hover:border-brand-orange hover:bg-orange-50/20"
              >
                <Plus className="w-4 h-4" />
                Adicionar Outro Eixo Temático
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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

      {/* Habilidades Selection/Creation Modal */}
      {isHabModalOpen && activeItemIdForHab && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="text-brand-orange w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Gerenciar Habilidades
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    Selecione do repositório ou cadastre uma nova
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsHabModalOpen(false);
                  setActiveItemIdForHab(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-200/50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={() => setModalTab('select')}
                className={`flex-1 py-3 text-center transition-all ${modalTab === 'select' ? 'text-brand-orange border-b-2 border-brand-orange bg-orange-50/10' : 'hover:bg-slate-50'}`}
              >
                Selecionar do Repositório
              </button>
              <button
                type="button"
                onClick={() => setModalTab('create')}
                className={`flex-1 py-3 text-center transition-all ${modalTab === 'create' ? 'text-brand-orange border-b-2 border-brand-orange bg-orange-50/10' : 'hover:bg-slate-50'}`}
              >
                Cadastrar Nova Habilidade
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalTab === 'select' ? (
                <>
                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar por código/descrição..."
                        value={modalSearchTerm}
                        onChange={e => setModalSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <select
                        value={modalComponenteFilter}
                        onChange={e => setModalComponenteFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-brand-orange transition-all text-xs font-bold text-slate-600"
                      >
                        <option value="ALL">Todos Componentes</option>
                        {COMPONENTES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <select
                        value={modalAnoSerieFilter}
                        onChange={e => setModalAnoSerieFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-brand-orange transition-all text-xs font-bold text-slate-600"
                      >
                        <option value="ALL">Todas Séries</option>
                        {ANOS_SERIES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* List of Skills */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {filteredCatalogHabs.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-12">Nenhuma habilidade encontrada.</p>
                    ) : (
                      filteredCatalogHabs.map(hab => {
                        const added = isHabInActiveItem(hab.codigo);
                        return (
                          <div key={hab.id} className="flex justify-between items-start bg-slate-50 hover:bg-slate-100/50 px-4 py-3 rounded-2xl border border-slate-200/50 transition-colors gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="bg-brand-orange/10 text-brand-orange text-[9px] font-black px-2 py-0.5 rounded font-mono">
                                  {hab.codigo}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  {hab.componente} • {hab.anoSerie}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                                {hab.descricao}
                              </p>
                            </div>
                            <div className="shrink-0 self-center">
                              {added ? (
                                <button
                                  type="button"
                                  onClick={() => removeHabilidadeByCode(activeItemIdForHab, hab.codigo)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <Check className="w-3 h-3" />
                                  Adicionada
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addHabilidadeToItem(activeItemIdForHab, hab)}
                                  className="bg-brand-orange hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition shadow-sm"
                                >
                                  Selecionar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                /* Create custom skill form */
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleCreateCustomHabilidade();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Código *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: EF01MA01"
                        value={newHabCode}
                        onChange={e => setNewHabCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Componente Curricular
                      </label>
                      <select
                        value={newHabComponente}
                        onChange={e => setNewHabComponente(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 focus:border-brand-orange transition-all bg-white"
                      >
                        {COMPONENTES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Ano/Série
                      </label>
                      <select
                        value={newHabAnoSerie}
                        onChange={e => setNewHabAnoSerie(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 focus:border-brand-orange transition-all bg-white"
                      >
                        {ANOS_SERIES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Descrição da Habilidade *
                    </label>
                    <textarea
                      required
                      placeholder="Descreva detalhadamente a habilidade..."
                      value={newHabDesc}
                      onChange={e => setNewHabDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                    />
                  </div>

                  {/* Vinculação do Eixo, Objeto e Sugestões Pedagógicas */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-brand-orange" />
                      Vincular Eixo, Objeto e Sugestões (Opcional)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Eixo Temático
                        </label>
                        <input
                          type="text"
                          placeholder="Definir ou alterar o Eixo Temático..."
                          value={newHabEixoTematico}
                          onChange={e => setNewHabEixoTematico(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Novo Objeto de Conhecimento
                        </label>
                        <input
                          type="text"
                          placeholder="Cadastrar novo objeto e vincular a esta habilidade..."
                          value={newHabObjetoDesc}
                          onChange={e => setNewHabObjetoDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sugestões Pedagógicas / Recursos para o Eixo
                      </label>
                      <textarea
                        placeholder="Definir ou complementar as sugestões pedagógicas..."
                        value={newHabSugestoes}
                        onChange={e => setNewHabSugestoes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="bg-brand-orange hover:bg-orange-600 font-bold text-xs py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar e Adicionar ao Eixo
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsHabModalOpen(false);
                  setActiveItemIdForHab(null);
                }}
                className="rounded-xl text-xs font-bold py-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Saved plans list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Planos de Curso</h3>
            <p className="text-xs text-slate-500 mt-0.5">Consulte, edite ou exporte os planejamentos de curso municipais unificados</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por componente/eixo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
              />
            </div>

            <select 
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todas as Séries</option>
              {ANOS_SERIES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Período / Ano Letivo</th>
                  <th className="px-6 py-4">Ano/Série / Componente</th>
                  <th className="px-6 py-4">Eixos Planejados</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhum plano de curso unificado encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3 text-slate-800 font-bold">
                        {plan.bimestre} ({plan.anoReferencia})
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{plan.anoSerie || '---'}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {plan.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-1.5 max-w-[420px]">
                          {plan.itens?.map((item, index) => (
                            <div key={item.id || index} className="text-slate-800 flex flex-col gap-0.5">
                              <span className="font-bold text-slate-700">• {item.eixoTematico || 'Eixo Geral'}</span>
                              <span className="text-[10px] text-slate-400 font-semibold pl-2.5">
                                ({item.objetos?.length || 0} objetos, {item.habilidades?.length || 0} habilid., {item.links?.length || 0} vínc.)
                              </span>
                            </div>
                          )) || <div className="text-slate-400 italic">Sem eixos vinculados</div>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrint(plan)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Imprimir Plano Unificado"
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
