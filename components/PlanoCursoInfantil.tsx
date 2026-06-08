import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { BNCC_INFANTIL } from './ConselhoClasse';

interface PlanoCursoInfantilProps {
  escolas: Escola[]; // Mantido na assinatura para evitar quebras em outros arquivos
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

export interface ObjetoConhecimento {
  id: string;
  descricao: string;
}

export interface Habilidade {
  id: string;
  codigo: string;
  descricao: string;
  sugestoesPedagogicas?: string;
}

export interface ObjetoHabilidadeLink {
  objetoId: string;
  habilidadeId: string;
}

export interface ItemPlano {
  id: string;
  eixoTematico: string; // Direito de Aprendizagem
  sugestoesPedagogicas: string;
  objetos: ObjetoConhecimento[]; // Campo de Experiência
  habilidades: Habilidade[]; // Objetivo de Aprendizagem e Desenvolvimento
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
  sugestoesPedagogicas?: string;
}

const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações'
];

const COMPONENTES = CAMPOS_EXPERIENCIA;

const BIMESTRES = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre',
  'Anual'
];

const DIREITOS_APRENDIZAGEM = [
  { id: 'conviver', label: 'Conviver' },
  { id: 'brincar', label: 'Brincar' },
  { id: 'participar', label: 'Participar' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'expressar', label: 'Expressar' },
  { id: 'conhecerse', label: 'Conhecer-se' }
];

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

export const PlanoCursoInfantil: React.FC<PlanoCursoInfantilProps> = ({ 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic ECE Objectives repository generated from BNCC_INFANTIL
  const baseECEObjectives = useMemo(() => {
    const list: RepositorioHabilidade[] = [];
    Object.entries(BNCC_INFANTIL).forEach(([campo, ageGroups]) => {
      Object.entries(ageGroups).forEach(([ageGroup, objectives]) => {
        objectives.forEach((obj: any) => {
          // Map ECE BNCC groups to specific grade selections
          const seriesList = ageGroup === 'Crianças bem pequenas' 
            ? ['Creche II', 'Creche III'] 
            : ['Pré I', 'Pré II'];
          
          seriesList.forEach(serie => {
            list.push({
              id: `ece-${obj.code}-${serie.replace(/\s/g, '')}`,
              codigo: obj.code,
              componente: campo,
              anoSerie: serie,
              descricao: obj.desc,
              sugestoesPedagogicas: ''
            });
          });
        });
      });
    });
    return list;
  }, []);

  const handleDownloadTemplate = () => {
    const headers = [
      'Ano de Referência',
      'Ano/Série',
      'Campo de experiência',
      'Bimestre / Período',
      'Direito de Aprendizagem',
      'Saberes e Conhecimentos',
      'Objetivos de Aprendizagem (Códigos separados por ;)',
      'Objetivos de Aprendizagem (Descrições separadas por ;)',
      'Sugestões Pedagógicas (Separadas por ;)'
    ];

    const data = [
      {
        'Ano de Referência': 2026,
        'Ano/Série': 'Creche III',
        'Campo de experiência': 'O eu, o outro e o nós',
        'Bimestre / Período': '1º Bimestre',
        'Direito de Aprendizagem': 'Brincar',
        'Saberes e Conhecimentos': 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.',
        'Objetivos de Aprendizagem (Códigos separados por ;)': 'EI02EO01; EI02EO02',
        'Objetivos de Aprendizagem (Descrições separadas por ;)': 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.; Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.',
        'Sugestões Pedagógicas (Separadas por ;)': 'Promover momentos de interação e acolhida.; Estimular a autonomia das crianças em pequenas ações diárias.'
      }
    ];

    const wsData = [headers, ...data.map(row => headers.map(h => row[h as keyof typeof row]))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 18 }, // Ano de Referencia
      { wch: 15 }, // Ano/Serie
      { wch: 25 }, // Campo de experiência
      { wch: 20 }, // Bimestre / Periodo
      { wch: 25 }, // Direito de Aprendizagem
      { wch: 30 }, // Saberes e Conhecimentos
      { wch: 45 }, // Objetivos Codigos
      { wch: 60 }, // Objetivos Descricoes
      { wch: 60 }  // Sugestoes Pedagogicas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plano de Curso ECE Modelo');
    XLSX.writeFile(wb, 'Modelo_Importacao_PlanoCurso_Infantil.xlsx');
    showNotification('success', 'Planilha modelo de Educação Infantil baixada com sucesso!');
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
        
        const rawRows = XLSX.utils.sheet_to_json<any>(ws);
        
        if (rawRows.length === 0) {
          showNotification('error', 'A planilha está vazia.');
          return;
        }

        const groups: Record<string, {
          anoReferencia: string;
          anoSerie: string;
          componente: string;
          bimestre: string;
          itens: any[];
        }> = {};

        rawRows.forEach((row: any) => {
          const getValue = (keys: string[]) => {
            const foundKey = Object.keys(row).find(k => 
              keys.some(key => k.toLowerCase().replace(/[\s\-\_\/]/g, '').includes(key.toLowerCase().replace(/[\s\-\_\/]/g, '')))
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const anoRefVal = String(getValue(['referência', 'referencia', 'ano']) || new Date().getFullYear()).trim();
          const anoSerieVal = String(getValue(['série', 'serie', 'ano/série', 'ano/serie']) || '').trim();
          const bimestreVal = String(getValue(['bimestre', 'período', 'periodo']) || '').trim();
          const direitoVal = String(getValue(['direito', 'eixo', 'temático', 'tematico']) || '').trim();
          const campoVal = String(getValue(['saber', 'saberes', 'conhecimento', 'conhecimentos', 'campo', 'experiência', 'experiencia', 'objeto', 'conhecimento', 'objetos']) || '').trim();
          const componenteVal = String(getValue(['componente', 'campoexperiência', 'campo_experiencia', 'campoexperiencia', 'experiência']) || 'O eu, o outro e o nós').trim();
          const habsVal = String(
            getValue(['código', 'codigo', 'códigos', 'codigos', 'objetivo', 'objetivos']) || 
            ''
          ).trim();
          const descsVal = String(getValue(['descrição', 'descricao', 'descrições', 'descricoes']) || '').trim();
          const sugestoesVal = String(getValue(['sugestões', 'sugestoes', 'recursos', 'pedagógicas', 'pedagogicas']) || '').trim();

          if (!anoSerieVal || !bimestreVal || !direitoVal) {
            return; // Skip invalid row
          }

          const matchedBimestre = BIMESTRES.find(b => 
            b.toLowerCase().replace(/[\s]/g, '') === bimestreVal.toLowerCase().replace(/[\s]/g, '')
          ) || BIMESTRES.find(b => 
            b.toLowerCase().includes(bimestreVal.toLowerCase()) || bimestreVal.toLowerCase().includes(b.toLowerCase())
          ) || bimestreVal;

          const matchedAnoSerie = FAiXAS_ETARIAS.find(a => 
            a.toLowerCase().replace(/[\s]/g, '') === anoSerieVal.toLowerCase().replace(/[\s]/g, '')
          ) || FAiXAS_ETARIAS.find(a => 
            a.toLowerCase().includes(anoSerieVal.toLowerCase()) || anoSerieVal.toLowerCase().includes(a.toLowerCase())
          ) || anoSerieVal;

          const groupKey = `${anoRefVal}-${matchedAnoSerie}-${matchedBimestre}`;

          if (!groups[groupKey]) {
            groups[groupKey] = {
              anoReferencia: anoRefVal,
              anoSerie: matchedAnoSerie,
              componente: CAMPOS_EXPERIENCIA.includes(componenteVal) ? componenteVal : (CAMPOS_EXPERIENCIA.find(c => c.toLowerCase().includes(componenteVal.toLowerCase())) || 'O eu, o outro e o nós'),
              bimestre: matchedBimestre,
              itens: []
            };
          }

          const objetos: ObjetoConhecimento[] = campoVal
            .split(/[;;\n]/)
            .map(desc => desc.trim())
            .filter(Boolean)
            .map(desc => ({
              id: generateId(),
              descricao: desc
            }));

          const parsedHabsList = habsVal.split(';').map(code => code.trim().toUpperCase()).filter(Boolean);
          const parsedDescsList = descsVal.split(';').map(desc => desc.trim()).filter(Boolean);
          const parsedSugestoesList = sugestoesVal.split(';').map(s => s.trim()).filter(Boolean);

          const habilidades: Habilidade[] = parsedHabsList.map((code, idx) => {
            const manualDesc = parsedDescsList[idx]?.trim();
            const manualSugestao = parsedSugestoesList[idx]?.trim();
            const matchedRepoHab = habRepository.find(h => h.codigo.trim().toUpperCase() === code);
            return {
              id: matchedRepoHab?.id || generateId(),
              codigo: code,
              descricao: manualDesc || matchedRepoHab?.descricao || `Objetivo ${code} importado.`,
              sugestoesPedagogicas: manualSugestao || matchedRepoHab?.sugestoesPedagogicas || ''
            };
          });

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
            eixoTematico: direitoVal,
            sugestoesPedagogicas: sugestoesVal,
            objetos,
            habilidades,
            links
          });
        });

        const importedCount = Object.keys(groups).length;
        if (importedCount === 0) {
          showNotification('error', 'Nenhum plano válido encontrado na planilha.');
          return;
        }

        let updatedPlans = [...plans];
        const importPromises = Object.values(groups).map(async (importedPlan) => {
          const existingIdx = updatedPlans.findIndex(p => 
            p.anoReferencia === importedPlan.anoReferencia &&
            p.anoSerie === importedPlan.anoSerie &&
            p.bimestre === importedPlan.bimestre
          );

          const payload: CoursePlan = {
            id: existingIdx >= 0 ? updatedPlans[existingIdx].id : generateId(),
            anoReferencia: importedPlan.anoReferencia,
            componente: importedPlan.componente,
            bimestre: importedPlan.bimestre,
            anoSerie: importedPlan.anoSerie,
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
              campo_experiencia: payload.componente,
              bimestre: payload.bimestre,
              ano_serie: payload.anoSerie,
              itens: payload.itens,
              updated_at: new Date().toISOString(),
              updated_by: userEmail || currentUser?.contato || 'user'
            };
            const { error } = await supabase.from('planos_curso_infantil').upsert(dbPayload);
            if (error) throw error;
          }
        });

        Promise.all(importPromises)
          .then(() => {
            setPlans(updatedPlans);
            if (isDemoMode) {
              localStorage.setItem('sigar_planos_curso_infantil', JSON.stringify(updatedPlans));
            }
            showNotification('success', `${importedCount} Plano(s) de Curso ECE importado(s) com sucesso!`);
            if (fileInputRef.current) fileInputRef.current.value = '';
          })
          .catch(err => {
            console.error('Erro na importação Supabase:', err);
            showNotification('error', 'Erro ao salvar os planos importados no banco.');
          });
      } catch (err) {
        console.error('Erro na importação:', err);
        showNotification('error', 'Erro ao ler a planilha. Verifique a formatação.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear().toString());
  const [anoSerie, setAnoSerie] = useState(FAiXAS_ETARIAS[0]);
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [bimestre, setBimestre] = useState(BIMESTRES[0]);

  // Structured Planning Items
  const [itens, setItens] = useState<ItemPlano[] | any[]>([createDefaultItem()]);

  // Global Skills/Objectives Repository
  const [habRepository, setHabRepository] = useState<RepositorioHabilidade[]>([]);

  // Objectives Modal States
  const [isHabModalOpen, setIsHabModalOpen] = useState(false);
  const [activeItemIdForHab, setActiveItemIdForHab] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'select' | 'create'>('select');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalComponenteFilter, setModalComponenteFilter] = useState('ALL');
  const [modalAnoSerieFilter, setModalAnoSerieFilter] = useState('ALL');
  const [editingHabId, setEditingHabId] = useState<string | null>(null);

  // Custom Objective Form States
  const [newHabCode, setNewHabCode] = useState('');
  const [newHabDesc, setNewHabDesc] = useState('');
  const [newHabComponente, setNewHabComponente] = useState(CAMPOS_EXPERIENCIA[0]);
  const [newHabAnoSerie, setNewHabAnoSerie] = useState(FAiXAS_ETARIAS[0]);
  const [newHabEixoTematico, setNewHabEixoTematico] = useState('');
  const [newHabObjetoDesc, setNewHabObjetoDesc] = useState('');
  const [newHabSugestoes, setNewHabSugestoes] = useState('');

  // Filters for History Table
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Print Mode State
  const [printPlan, setPrintPlan] = useState<CoursePlan | null>(null);

  const fetchRealData = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('planos_curso_infantil')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // On-the-fly migration of ECE legacy course plans
      const formattedPlans: CoursePlan[] = (plansData || []).map((p: any) => {
        // If the legacy course plan has old ECE items format, migrate them on the fly
        const migratedItens = (p.itens || []).map((it: any) => {
          if (it.eixoTematico !== undefined) return it;
          
          const rightsLabel = (it.direitos || []).map((d: string) => {
            const match = DIREITOS_APRENDIZAGEM.find(x => x.id === d);
            return match ? match.label : d;
          }).join(', ') || 'Direitos Gerais';

          const objetosList = p.campo_experiencia && p.campo_experiencia !== 'Educação Infantil'
            ? [{ id: 'migrated-obj', descricao: p.campo_experiencia }]
            : [];
          
          const habilidadesList = (it.objetivos || []).map((o: any) => ({
            id: o.id || `migrated-obj-${o.code}`,
            codigo: o.code,
            descricao: o.desc || o.short || '',
            sugestoesPedagogicas: it.sugestoesPedagogicas || ''
          }));

          const linksList: ObjetoHabilidadeLink[] = [];
          objetosList.forEach(obj => {
            habilidadesList.forEach((hab: Habilidade) => {
              linksList.push({
                objetoId: obj.id,
                habilidadeId: hab.id
              });
            });
          });

          return {
            id: it.id || generateId(),
            eixoTematico: rightsLabel,
            sugestoesPedagogicas: it.sugestoesPedagogicas || '',
            objetos: objetosList,
            habilidades: habilidadesList,
            links: linksList
          };
        });

        return {
          id: p.id,
          anoReferencia: p.ano_referencia,
          componente: p.campo_experiencia || '',
          bimestre: p.bimestre,
          anoSerie: p.ano_serie,
          itens: migratedItens,
          criadoEm: p.created_at
        };
      });
      setPlans(formattedPlans);

      // Fetch additional custom objectives
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
        anoSerie: h.ano_serie,
        sugestoesPedagogicas: h.sugestoes_pedagogicas
      }));
      
      const combinedHabs = [...formattedHabs];
      baseECEObjectives.forEach(seedHab => {
        if (!combinedHabs.some(h => h.codigo === seedHab.codigo && h.anoSerie === seedHab.anoSerie)) {
          combinedHabs.push(seedHab);
        }
      });

      setHabRepository(combinedHabs);
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
      showNotification('error', 'Falha ao carregar dados do Supabase. Utilizando dados locais.');
      setPlans([]);
      setHabRepository(baseECEObjectives);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_curso_infantil');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Apply similar on-the-fly migration to demo data if needed
            const migrated = parsed.map((p: any) => {
              const migratedItens = (p.itens || []).map((it: any) => {
                if (it.eixoTematico !== undefined) return it;

                const rightsLabel = (it.direitos || []).map((d: string) => {
                  const match = DIREITOS_APRENDIZAGEM.find(x => x.id === d);
                  return match ? match.label : d;
                }).join(', ') || 'Direitos Gerais';

                const objetosList = p.campoExperiencia && p.campoExperiencia !== 'Educação Infantil'
                  ? [{ id: 'migrated-obj', descricao: p.campoExperiencia }]
                  : [];

                const habilidadesList = (it.objetivos || []).map((o: any) => ({
                  id: o.id || `migrated-obj-${o.code}`,
                  codigo: o.code,
                  descricao: o.desc || o.short || '',
                  sugestoesPedagogicas: it.sugestoesPedagogicas || ''
                }));

                const linksList: ObjetoHabilidadeLink[] = [];
                objetosList.forEach((obj: any) => {
                  habilidadesList.forEach((hab: Habilidade) => {
                    linksList.push({
                      objetoId: obj.id,
                      habilidadeId: hab.id
                    });
                  });
                });

                return {
                  id: it.id || generateId(),
                  eixoTematico: rightsLabel,
                  sugestoesPedagogicas: it.sugestoesPedagogicas || '',
                  objetos: objetosList,
                  habilidades: habilidadesList,
                  links: linksList
                };
              });

              return {
                id: p.id,
                anoReferencia: p.anoReferencia,
                componente: p.campoExperiencia || p.componente || '',
                bimestre: p.bimestre,
                anoSerie: p.anoSerie || '',
                itens: migratedItens,
                criadoEm: p.criadoEm || new Date().toISOString()
              };
            });
            setPlans(migrated);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const savedHabs = localStorage.getItem('sigar_repositorio_objetivos_infantil');
      if (savedHabs) {
        try {
          setHabRepository(JSON.parse(savedHabs));
        } catch (e) {
          console.error(e);
          setHabRepository(baseECEObjectives);
        }
      } else {
        setHabRepository(baseECEObjectives);
        localStorage.setItem('sigar_repositorio_objetivos_infantil', JSON.stringify(baseECEObjectives));
      }
    } else {
      fetchRealData();
    }
  }, [isDemoMode, baseECEObjectives]);

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
        objetos: item.objetos.filter((o: ObjetoConhecimento) => o.id !== objetoId),
        links: item.links.filter((l: ObjetoHabilidadeLink) => l.objetoId !== objetoId)
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
    setModalComponenteFilter('ALL');
    setModalAnoSerieFilter(anoSerie);
    setNewHabComponente(CAMPOS_EXPERIENCIA[0]);
    setNewHabAnoSerie(anoSerie);

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
    return activeItem ? activeItem.habilidades.some((h: Habilidade) => h.codigo === codigo) : false;
  };

  const addHabilidadeToItem = (itemId: string, hab: Omit<Habilidade, 'id'> | Habilidade) => {
    setItens(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.habilidades.some((h: Habilidade) => h.codigo === hab.codigo);
      if (exists) return item;
      
      const newHab: Habilidade = {
        id: (hab as any).id || generateId(),
        codigo: hab.codigo.trim().toUpperCase(),
        descricao: hab.descricao.trim(),
        sugestoesPedagogicas: hab.sugestoesPedagogicas || ''
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
      const habToRemove = item.habilidades.find((h: Habilidade) => h.codigo === codigo);
      if (!habToRemove) return item;
      return {
        ...item,
        habilidades: item.habilidades.filter((h: Habilidade) => h.codigo !== codigo),
        links: item.links.filter((l: ObjetoHabilidadeLink) => l.habilidadeId !== habToRemove.id)
      };
    }));
  };

  const handleEditHabilidade = (hab: RepositorioHabilidade) => {
    setEditingHabId(hab.id);
    setNewHabCode(hab.codigo);
    setNewHabDesc(hab.descricao);
    setNewHabComponente(hab.componente);
    setNewHabAnoSerie(hab.anoSerie);
    
    let resolvedEixo = '';
    let resolvedObjeto = '';
    let resolvedSugestoes = hab.sugestoesPedagogicas || '';

    if (activeItemIdForHab) {
      const activeItem = itens.find((it: ItemPlano) => it.id === activeItemIdForHab);
      if (activeItem) {
        resolvedEixo = activeItem.eixoTematico || '';

        const skillInItem = activeItem.habilidades.find((h: Habilidade) => h.codigo === hab.codigo || h.id === hab.id);
        if (skillInItem) {
          if (skillInItem.sugestoesPedagogicas !== undefined) {
            resolvedSugestoes = skillInItem.sugestoesPedagogicas;
          }
          const link = activeItem.links.find((l: ObjetoHabilidadeLink) => l.habilidadeId === skillInItem.id);
          if (link) {
            const obj = activeItem.objetos.find((o: ObjetoConhecimento) => o.id === link.objetoId);
            if (obj) {
              resolvedObjeto = obj.descricao || '';
            }
          }
        }
      }
    }

    setNewHabEixoTematico(resolvedEixo);
    setNewHabObjetoDesc(resolvedObjeto);
    setNewHabSugestoes(resolvedSugestoes);
    setModalTab('create');
  };

  const handleDeleteHabilidade = async (hab: RepositorioHabilidade) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o objetivo "${hab.codigo}" do repositório?`)) {
      try {
        if (!isDemoMode) {
          const { error } = await supabase
            .from('habilidades_repositorio')
            .delete()
            .eq('id', hab.id);

          if (error) throw error;
        }

        const updatedRepo = habRepository.filter((h: RepositorioHabilidade) => h.id !== hab.id);
        setHabRepository(updatedRepo);

        if (isDemoMode) {
          localStorage.setItem('sigar_repositorio_objetivos_infantil', JSON.stringify(updatedRepo));
        }

        setItens(prev => prev.map((item: ItemPlano) => {
          return {
            ...item,
            habilidades: item.habilidades.filter((h: Habilidade) => h.codigo !== hab.codigo),
            links: item.links.filter((l: ObjetoHabilidadeLink) => l.habilidadeId !== hab.id)
          };
        }));

        showNotification('success', `Objetivo ${hab.codigo} excluído com sucesso do repositório.`);
      } catch (err) {
        console.error('Erro ao excluir objetivo:', err);
        showNotification('error', 'Erro ao excluir objetivo do repositório.');
      }
    }
  };

  const handleCreateCustomHabilidade = async () => {
    if (!newHabCode.trim() || !newHabDesc.trim()) {
      showNotification('error', 'Preencha todos os campos do novo objetivo.');
      return;
    }

    const codeUpper = newHabCode.trim().toUpperCase();

    if (editingHabId) {
      let updatedHab: RepositorioHabilidade = {
        id: editingHabId,
        codigo: codeUpper,
        descricao: newHabDesc.trim(),
        componente: newHabComponente,
        anoSerie: newHabAnoSerie,
        sugestoesPedagogicas: newHabSugestoes.trim()
      };

      if (!isDemoMode) {
        const dbHab = {
          id: editingHabId,
          codigo: codeUpper,
          descricao: newHabDesc.trim(),
          componente: newHabComponente,
          ano_serie: newHabAnoSerie,
          sugestoes_pedagogicas: newHabSugestoes.trim()
        };

        const { error } = await supabase
          .from('habilidades_repositorio')
          .upsert(dbHab, { onConflict: 'id' });

        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
          showNotification('error', 'Erro ao salvar alterações no banco.');
          return;
        }
      }

      const updatedRepo = habRepository.map((h: RepositorioHabilidade) => h.id === editingHabId ? updatedHab : h);
      setHabRepository(updatedRepo);

      if (isDemoMode) {
        localStorage.setItem('sigar_repositorio_objetivos_infantil', JSON.stringify(updatedRepo));
      }

      setItens(prev => prev.map((item: ItemPlano) => {
        const hasHab = item.habilidades.some((h: Habilidade) => h.id === editingHabId);
        const isCurrentlyActive = item.id === activeItemIdForHab;

        if (!hasHab && !isCurrentlyActive) return item;

        let updatedHabilidades = [...item.habilidades];
        if (hasHab) {
          updatedHabilidades = item.habilidades.map((h: Habilidade) => h.id === editingHabId ? { ...h, codigo: codeUpper, descricao: updatedHab.descricao, sugestoesPedagogicas: newHabSugestoes.trim() } : h);
        }

        let updatedEixo = item.eixoTematico;
        let updatedObjetos = [...item.objetos];
        let updatedLinks = [...item.links];

        if (isCurrentlyActive) {
          updatedEixo = newHabEixoTematico.trim() || item.eixoTematico;

          if (newHabObjetoDesc.trim()) {
            const hasObj = item.objetos.some((o: ObjetoConhecimento) => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase());
            let targetObjId = '';

            if (hasObj) {
              targetObjId = item.objetos.find((o: ObjetoConhecimento) => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase())!.id;
            } else {
              const newObjId = generateId();
              const newObj: ObjetoConhecimento = {
                id: newObjId,
                descricao: newHabObjetoDesc.trim()
              };
              updatedObjetos.push(newObj);
              targetObjId = newObjId;
            }

            updatedLinks = item.links.filter((l: ObjetoHabilidadeLink) => l.habilidadeId !== editingHabId);
            updatedLinks.push({
              objetoId: targetObjId,
              habilidadeId: editingHabId
            });
          }
        }

        return {
          ...item,
          eixoTematico: updatedEixo,
          habilidades: updatedHabilidades,
          objetos: updatedObjetos,
          links: updatedLinks
        };
      }));

      showNotification('success', `Objetivo ${codeUpper} atualizado com sucesso!`);
      
      setEditingHabId(null);
      setNewHabCode('');
      setNewHabDesc('');
      setNewHabEixoTematico('');
      setNewHabObjetoDesc('');
      setNewHabSugestoes('');
      setModalTab('select');
      return;
    }

    const existsInRepo = habRepository.some(h => h.codigo === codeUpper);
    let finalHab: RepositorioHabilidade;

    if (!isDemoMode) {
      const dbHab = {
        id: existsInRepo ? habRepository.find(h => h.codigo === codeUpper)!.id : generateId(),
        codigo: codeUpper,
        descricao: newHabDesc.trim(),
        componente: newHabComponente,
        ano_serie: newHabAnoSerie,
        sugestoes_pedagogicas: newHabSugestoes.trim()
      };

      const { data, error } = await supabase
        .from('habilidades_repositorio')
        .upsert(dbHab, { onConflict: 'codigo' })
        .select();

      if (error) {
        console.error('Erro ao cadastrar objetivo:', error);
        showNotification('error', 'Erro ao cadastrar objetivo no banco de dados.');
        return;
      }
      
      if (data && data.length > 0) {
        finalHab = {
          id: data[0].id,
          codigo: data[0].codigo,
          descricao: data[0].descricao,
          componente: data[0].componente,
          anoSerie: data[0].ano_serie,
          sugestoesPedagogicas: data[0].sugestoes_pedagogicas
        };
      } else {
        finalHab = {
          id: dbHab.id,
          codigo: dbHab.codigo,
          descricao: dbHab.descricao,
          componente: dbHab.componente,
          anoSerie: dbHab.ano_serie,
          sugestoesPedagogicas: dbHab.sugestoes_pedagogicas
        };
      }

      if (!existsInRepo) {
        setHabRepository([...habRepository, finalHab]);
      }
    } else {
      if (existsInRepo) {
        finalHab = habRepository.find((h: RepositorioHabilidade) => h.codigo === codeUpper)!;
      } else {
        finalHab = {
          id: generateId(),
          codigo: codeUpper,
          descricao: newHabDesc.trim(),
          componente: newHabComponente,
          anoSerie: newHabAnoSerie,
          sugestoesPedagogicas: newHabSugestoes.trim()
        };
        const updatedRepo = [...habRepository, finalHab];
        setHabRepository(updatedRepo);
        localStorage.setItem('sigar_repositorio_objetivos_infantil', JSON.stringify(updatedRepo));
      }
    }

    if (activeItemIdForHab) {
      const newHabId = finalHab.id;

      setItens(prev => prev.map((item: ItemPlano) => {
        if (item.id !== activeItemIdForHab) return item;

        const habExists = item.habilidades.some((h: Habilidade) => h.codigo === codeUpper);
        const newHab: Habilidade = {
          id: newHabId,
          codigo: codeUpper,
          descricao: finalHab.descricao,
          sugestoesPedagogicas: newHabSugestoes.trim() || finalHab.sugestoesPedagogicas || ''
        };
        const updatedHabilidades = habExists 
          ? item.habilidades.map((h: Habilidade) => h.codigo === codeUpper ? { ...h, sugestoesPedagogicas: newHabSugestoes.trim() || h.sugestoesPedagogicas || '' } : h)
          : [...item.habilidades, newHab];

        const updatedEixo = newHabEixoTematico.trim() || item.eixoTematico;

        let updatedObjetos = [...item.objetos];
        let updatedLinks = [...item.links];

        if (newHabObjetoDesc.trim()) {
          const hasObj = item.objetos.some((o: ObjetoConhecimento) => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase());
          let targetObjId = '';

          if (hasObj) {
            targetObjId = item.objetos.find((o: ObjetoConhecimento) => o.descricao.toLowerCase() === newHabObjetoDesc.trim().toLowerCase())!.id;
          } else {
            const newObjId = generateId();
            const newObj: ObjetoConhecimento = {
              id: newObjId,
              descricao: newHabObjetoDesc.trim()
            };
            updatedObjetos.push(newObj);
            targetObjId = newObjId;
          }

          const linkExists = item.links.some((l: ObjetoHabilidadeLink) => l.objetoId === targetObjId && l.habilidadeId === newHabId);
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
          habilidades: updatedHabilidades,
          objetos: updatedObjetos,
          links: updatedLinks
        };
      }));

      showNotification('success', `Objetivo ${codeUpper} cadastrado e vinculado com sucesso!`);
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
    setItens(prev => prev.map((item: ItemPlano) => {
      if (item.id !== itemId) return item;
      const exists = item.links.some((l: ObjetoHabilidadeLink) => l.objetoId === objetoId && l.habilidadeId === habId);
      const updatedLinks = exists
        ? item.links.filter((l: ObjetoHabilidadeLink) => !(l.objetoId === objetoId && l.habilidadeId === habId))
        : [...item.links, { objetoId, habilidadeId: habId }];
      return {
        ...item,
        links: updatedLinks
      };
    }));
  };

  const filteredCatalogHabs = useMemo(() => {
    return habRepository.filter((hab: RepositorioHabilidade) => {
      const matchesSearch = modalSearchTerm === '' || 
                            hab.codigo.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
                            hab.descricao.toLowerCase().includes(modalSearchTerm.toLowerCase());
      const matchesComponent = modalComponenteFilter === 'ALL' || hab.componente === modalComponenteFilter;
      const matchesGrade = modalAnoSerieFilter === 'ALL' || hab.anoSerie === modalAnoSerieFilter;
      return matchesSearch && matchesComponent && matchesGrade;
    });
  }, [habRepository, modalSearchTerm, modalComponenteFilter, modalAnoSerieFilter]);

  // --- Form Actions ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItens = itens.filter(item => item.eixoTematico.trim() !== '');
    if (validItens.length === 0) {
      showNotification('error', 'Preencha o Direito de Aprendizagem de pelo menos um bloco do plano.');
      return;
    }

    const duplicate = plans.find(p => 
      p.id !== editingId &&
      p.anoReferencia === anoReferencia &&
      p.anoSerie === anoSerie &&
      p.bimestre === bimestre
    );

    if (duplicate) {
      showNotification('error', 'Já existe um plano cadastrado para este Ano, Série e Período.');
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
        campo_experiencia: payload.componente,
        bimestre: payload.bimestre,
        ano_serie: payload.anoSerie,
        itens: payload.itens,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('planos_curso_infantil')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar plano no Supabase:', error);
        showNotification('error', 'Erro ao salvar o plano de curso no banco de dados.');
        return;
      }
      
      if (editingId) {
        setPlans(plans.map(p => p.id === editingId ? payload : p));
        showNotification('success', 'Plano de Curso ECE atualizado com sucesso!');
      } else {
        setPlans([payload, ...plans]);
        showNotification('success', 'Plano de Curso ECE cadastrado com sucesso!');
      }
    } else {
      let updatedPlans: CoursePlan[];
      if (editingId) {
        updatedPlans = plans.map(p => p.id === editingId ? payload : p);
        showNotification('success', 'Plano de Curso ECE atualizado com sucesso!');
      } else {
        updatedPlans = [payload, ...plans];
        showNotification('success', 'Plano de Curso ECE cadastrado com sucesso!');
      }

      setPlans(updatedPlans);
      localStorage.setItem('sigar_planos_curso_infantil', JSON.stringify(updatedPlans));
    }
    
    resetForm();
  };

  const handleEdit = (plan: CoursePlan) => {
    setEditingId(plan.id);
    setAnoReferencia(plan.anoReferencia);
    setAnoSerie(plan.anoSerie || FAiXAS_ETARIAS[0]);
    setComponente(plan.componente || COMPONENTES[0]);
    setBimestre(plan.bimestre);
    setItens(plan.itens && plan.itens.length > 0 ? JSON.parse(JSON.stringify(plan.itens)) : [createDefaultItem()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este Plano de Curso ECE?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('planos_curso_infantil')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar plano no Supabase:', error);
        showNotification('error', 'Erro ao excluir o plano de curso no banco de dados.');
        return;
      }
      showNotification('success', 'Plano de Curso ECE excluído com sucesso do Supabase!');
    } else {
      showNotification('success', 'Plano de Curso removido.');
    }

    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_planos_curso_infantil', JSON.stringify(updated));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAnoSerie(FAiXAS_ETARIAS[0]);
    setItens([createDefaultItem()]);
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch = searchTerm === '' || 
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
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Plano de Curso - Educação Infantil"
        subtitle="Elaboração e acompanhamento do planejamento curricular infantil municipal"
        icon={ClipboardList}
        badgeText="DIÁRIO DE CLASSE"
        actions={[
          {
            label: 'Baixar Modelo Excel',
            icon: Download,
            onClick: handleDownloadTemplate,
            variant: 'secondary'
          },
          {
            label: 'Importar Excel',
            icon: Upload,
            onClick: () => fileInputRef.current?.click(),
            variant: 'primary'
          }
        ]}
      />

      {subHeader}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />

      {/* Printable Area - Hidden on Screen */}
      {printPlan && createPortal(
        (() => {
          const totalObjectives = printPlan.itens.reduce((acc, item) => {
            item.habilidades.forEach(h => acc.add(h.codigo));
            return acc;
          }, new Set<string>()).size;

          return (
            <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-sans">
              <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1pt', marginTop: '0px' }}>
                  ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '9pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt', marginTop: '0px' }}>
                  PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8pt', marginTop: '0px' }}>
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '50pt', height: '1.5pt', background: '#f97316', margin: '0 auto 5pt' }} />
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                  Plano de Curso da Educação Infantil
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0px' }}>
                  Acompanhamento de Unidades Escolares — {printPlan.anoReferencia}
                </p>
              </div>

              {/* ====== METADATA PANEL ====== */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 font-sans text-xs text-left">
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Campo de Experiência</span>
                    <span className="font-extrabold text-slate-900 text-[11px] leading-tight">{printPlan.componente}</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200 pl-4">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Faixa Etária / Grupo</span>
                    <span className="font-extrabold text-slate-900 text-[11px] leading-tight">{printPlan.anoSerie || '---'}</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200 pl-4">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Período Letivo</span>
                    <span className="font-extrabold text-slate-900 text-[11px] leading-tight">{printPlan.bimestre}</span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200 pl-4">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total de Objetivos</span>
                    <span className="font-extrabold text-slate-900 text-[11px] leading-tight">{totalObjectives}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {printPlan.itens.map((item, index) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden page-break-inside-avoid text-left">
                    <div className="bg-slate-100 px-4 py-2 border-b">
                      <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                        Item {index + 1}: Direito de Aprendizagem - {item.eixoTematico || 'Não Informado'}
                      </h3>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 border-b pb-1 text-[9px] uppercase tracking-wider">
                          Campos de Experiência & Objetivos Associados
                        </h4>
                        {item.objetos.length === 0 ? (
                          <p className="text-gray-400 italic">Nenhum campo de experiência cadastrado.</p>
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
                                  <p className="text-[9px] text-gray-400 italic mt-0.5">Sem objetivos vinculados.</p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="space-y-4 border-l pl-6">
                        <h4 className="font-bold text-slate-700 border-b pb-1 text-[9px] uppercase tracking-wider">
                          Detalhamento dos Objetivos de Aprendizagem
                        </h4>
                        {item.habilidades.length === 0 ? (
                          <p className="text-gray-400 italic">Nenhum objetivo cadastrado.</p>
                        ) : (
                          <ul className="space-y-3">
                            {item.habilidades.map(h => (
                              <li key={h.id} className="text-slate-700 text-[10px] leading-relaxed border-b pb-2 last:border-b-0 last:pb-0 last:mb-0">
                                <strong className="text-brand-orange font-mono mr-1.5">{h.codigo}:</strong>
                                {h.descricao}
                                {h.sugestoesPedagogicas && (
                                  <div className="mt-1.5 bg-slate-50 p-2 rounded border border-slate-200 pl-3 border-l-2 border-l-brand-orange">
                                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Sugestão Pedagógica para {h.codigo}</p>
                                    <p className="text-slate-600 text-[9px] whitespace-pre-line leading-relaxed">{h.sugestoesPedagogicas}</p>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
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
          );
        })(),
        document.body
      )}

      {/* Main Content Form */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Bookmark className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Plano de Curso ECE' : 'Novo Plano de Curso ECE'}
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {FAiXAS_ETARIAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de experiência *</label>
              <select 
                value={componente}
                onChange={e => setComponente(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {!COMPONENTES.includes(componente) && componente && (
                  <option value={componente}>{componente}</option>
                )}
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
                Estrutura de Planejamento Pedagógico (Educação Infantil)
              </h3>
            </div>

            {itens.map((item, idx) => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 relative animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlanningItem(item.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remover este bloco"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="bg-brand-orange/10 text-brand-orange text-xs font-black px-2 py-0.5 rounded-full">
                    Bloco #{idx + 1}
                  </span>
                </div>

                {/* Direito de Aprendizagem Input */}
                <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/60 shadow-sm border-l-4 border-l-brand-orange space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-brand-orange uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    Direito de Aprendizagem *
                  </label>
                  <input
                    type="text"
                    value={item.eixoTematico}
                    onChange={e => updateItemField(item.id, 'eixoTematico', e.target.value)}
                    placeholder="Ex: Conviver, Brincar, Participar, Explorar, Expressar, Conhecer-se..."
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-xl outline-none text-xs font-bold text-slate-800 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-white shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campos de Experiência Panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                      <span>Saberes e Conhecimentos ({item.objetos.length})</span>
                    </h4>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id={`new-objeto-${item.id}`}
                        placeholder="Novo saber ou conhecimento..."
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

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {item.objetos.length === 0 ? (
                        <p className="text-slate-400 text-xs italic text-center py-4">Nenhum saber adicionado.</p>
                      ) : (
                        item.objetos.map((obj: ObjetoConhecimento) => (
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

                  {/* Objetivos de Aprendizagem Panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                      <span>Objetivo de Aprendizagem e Des. ({item.habilidades.length})</span>
                      <button
                        type="button"
                        onClick={() => openHabilidadesModal(item.id)}
                        className="bg-brand-orange hover:bg-orange-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-sm uppercase tracking-wider"
                      >
                        <Plus size={14} />
                        Gerenciar
                      </button>
                    </h4>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {item.habilidades.length === 0 ? (
                        <div className="text-slate-400 text-xs italic text-center py-6 flex flex-col items-center gap-2">
                          <span>Nenhum objetivo selecionado.</span>
                          <button
                            type="button"
                            onClick={() => openHabilidadesModal(item.id)}
                            className="text-brand-orange hover:underline text-[10px] font-bold"
                          >
                            Clique para selecionar objetivos
                          </button>
                        </div>
                      ) : (
                        item.habilidades.map((hab: Habilidade) => (
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
                        Associação de Saberes e Conhecimentos com Objetivos (Mapeamento N:N)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Vincule os objetivos correspondentes a cada saber ou conhecimento clicando sobre eles:
                    </p>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {item.objetos.map((obj: ObjetoConhecimento) => (
                        <div key={obj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-800">
                            {obj.descricao}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.habilidades.map((hab: Habilidade) => {
                              const isLinked = item.links.some((l: ObjetoHabilidadeLink) => l.objetoId === obj.id && l.habilidadeId === hab.id);
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

                {/* Detalhamento dos Objetivos */}
                {item.habilidades.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                      <Layers className="text-brand-orange w-4 h-4" />
                      <span>Detalhamento dos Objetivos de Aprendizagem</span>
                    </h4>
                    <div className="space-y-6">
                      {item.habilidades.map((hab: Habilidade) => (
                        <div key={hab.id} className="space-y-2">
                          <div className="text-xs text-slate-700 font-medium leading-relaxed">
                            <strong className="text-brand-orange font-mono mr-1.5">{hab.codigo}:</strong>
                            {hab.descricao}
                          </div>
                          
                          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 pl-4 border-l-4 border-l-brand-orange shadow-sm space-y-1">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                              Sugestão Pedagógica para {hab.codigo}
                            </label>
                            <textarea
                              value={hab.sugestoesPedagogicas || ''}
                              onChange={e => {
                                const newVal = e.target.value;
                                setItens(prev => prev.map((it: ItemPlano) => {
                                  if (it.id !== item.id) return it;
                                  return {
                                    ...it,
                                    habilidades: it.habilidades.map((h: Habilidade) => h.id === hab.id ? { ...h, sugestoesPedagogicas: newVal } : h)
                                  };
                                }));
                              }}
                              placeholder="Digite as sugestões de estratégias metodológicas, recursos didáticos e intervenções para este objetivo..."
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-medium focus:border-brand-orange transition-all resize-y bg-white leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Block Button */}
            <div className="flex justify-start pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setItens(prev => [...prev, createDefaultItem()])}
                className="rounded-xl text-xs font-bold py-2.5 flex items-center gap-1.5 border-dashed border-2 hover:border-brand-orange hover:bg-orange-50/20"
              >
                <Plus className="w-4 h-4" />
                Adicionar Outro Direito de Aprendizagem
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[85vh] flex flex-col animate-scale-in border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="text-brand-orange w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Gerenciar Objetivos de Aprendizagem
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    Selecione do repositório ou cadastre um novo
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
                onClick={() => {
                  setModalTab('select');
                  setEditingHabId(null);
                }}
                className={`flex-1 py-3 text-center transition-all ${modalTab === 'select' ? 'text-brand-orange border-b-2 border-brand-orange bg-orange-50/10' : 'hover:bg-slate-50'}`}
              >
                Selecionar do Repositório
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTab('create');
                  if (!editingHabId) {
                    setNewHabCode('');
                    setNewHabDesc('');
                    setNewHabEixoTematico('');
                    setNewHabObjetoDesc('');
                    setNewHabSugestoes('');
                  }
                }}
                className={`flex-1 py-3 text-center transition-all ${modalTab === 'create' ? 'text-brand-orange border-b-2 border-brand-orange bg-orange-50/10' : 'hover:bg-slate-50'}`}
              >
                {editingHabId ? 'Editar Objetivo' : 'Cadastrar Novo Objetivo'}
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
                        <option value="ALL">Todos Campos de Experiência</option>
                        {CAMPOS_EXPERIENCIA.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <select
                        value={modalAnoSerieFilter}
                        onChange={e => setModalAnoSerieFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none focus:border-brand-orange transition-all text-xs font-bold text-slate-600"
                      >
                        <option value="ALL">Todas Faixas Etárias</option>
                        {FAiXAS_ETARIAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* List of ECE Objectives */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {filteredCatalogHabs.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-12">Nenhum objetivo encontrado.</p>
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
                              <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed text-left">
                                {hab.descricao}
                              </p>
                            </div>
                            <div className="shrink-0 self-center flex items-center gap-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleEditHabilidade(hab)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteHabilidade(hab)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>

                              {added ? (
                                <button
                                  type="button"
                                  onClick={() => removeHabilidadeByCode(activeItemIdForHab, hab.codigo)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                >
                                  <Check className="w-3 h-3" />
                                  Adicionado
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
                /* Create custom ECE Objective Form */
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
                        placeholder="Ex: EI02EO01"
                        value={newHabCode}
                        onChange={e => setNewHabCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Campo de Experiência
                      </label>
                      <select
                        value={newHabComponente}
                        onChange={e => setNewHabComponente(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 focus:border-brand-orange transition-all bg-white"
                      >
                        {CAMPOS_EXPERIENCIA.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Faixa Etária / Série
                      </label>
                      <select
                        value={newHabAnoSerie}
                        onChange={e => setNewHabAnoSerie(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 focus:border-brand-orange transition-all bg-white"
                      >
                        {FAiXAS_ETARIAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Descrição do Objetivo *
                    </label>
                    <textarea
                      required
                      placeholder="Descreva detalhadamente o objetivo de aprendizagem..."
                      value={newHabDesc}
                      onChange={e => setNewHabDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                    />
                  </div>

                  {/* Optional linking section */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-brand-orange" />
                      Vincular Direito, Campo e Sugestões (Opcional)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Direito de Aprendizagem
                        </label>
                        <input
                          type="text"
                          placeholder="Definir ou alterar o Direito..."
                          value={newHabEixoTematico}
                          onChange={e => setNewHabEixoTematico(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Novo Saber ou Conhecimento
                        </label>
                        <input
                          type="text"
                          placeholder="Cadastrar novo saber/conhecimento e vincular a este objetivo..."
                          value={newHabObjetoDesc}
                          onChange={e => setNewHabObjetoDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sugestões Pedagógicas / Recursos para o Direito
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
                      {editingHabId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingHabId ? 'Salvar Alterações' : 'Cadastrar e Adicionar'}
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
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Planos de Curso ECE</h3>
            <p className="text-xs text-slate-500 mt-0.5">Consulte, edite ou exporte os planejamentos de curso municipais da Educação Infantil</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por direito/eixo..."
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
              <option value="ALL">Todas Faixas Etárias</option>
              {FAiXAS_ETARIAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Período / Ano Letivo</th>
                  <th className="px-6 py-4">Faixa Etária / Campo de Experiência</th>
                  <th className="px-6 py-4">Direitos Planejados</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhum plano de curso unificado de Educação Infantil encontrado.
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
                              <span className="font-bold text-slate-700">• {item.eixoTematico || 'Direito Geral'}</span>
                              <span className="text-[10px] text-slate-400 font-semibold pl-2.5">
                                ({item.objetos?.length || 0} saberes, {item.habilidades?.length || 0} objetivos, {item.links?.length || 0} vínc.)
                              </span>
                            </div>
                          ))}
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
