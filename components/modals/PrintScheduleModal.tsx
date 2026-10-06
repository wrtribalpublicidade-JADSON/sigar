import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Escola, Coordenador } from '../../types';
import { Printer, X, School, UserCheck, Palette, Sparkles, Check, Clock, BookOpen } from 'lucide-react';
import { buildTeacherColorMap, isInvalidCoordinatorName, TeacherColorConfig } from '../../utils/teacherColors';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  escola?: Escola;
  activeEtapa: string;
  activeTurnoDef: { id: string; label: string };
  duracaoAulaAtiva: number;
  schoolTurmas: any[];
  selectedTurmaFilter?: string;
  schoolTeachers: Coordenador[];
  activeTeachersInTurno: Coordenador[];
  coordenadores?: Coordenador[];
  canEdit?: boolean;
  onConfirmPrint: (params: {
    coordenadorNome: string;
    diretorNome: string;
    enableTeacherColors: boolean;
    saveToSchool: boolean;
  }) => void;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  escola,
  activeEtapa,
  activeTurnoDef,
  duracaoAulaAtiva,
  schoolTurmas,
  selectedTurmaFilter = 'ALL',
  schoolTeachers,
  activeTeachersInTurno,
  coordenadores = [],
  canEdit = false,
  onConfirmPrint,
}) => {
  // Mapeamento de cores dos professores
  const teacherColorMap = useMemo(() => {
    return buildTeacherColorMap(schoolTeachers);
  }, [schoolTeachers]);

  // Candidatos a coordenador identificados no sistema
  const coordinatorSuggestions = useMemo(() => {
    const list: { id: string; nome: string; role: string; source: string }[] = [];
    const seen = new Set<string>();

    const addSuggestion = (nome?: string, role = 'Coordenador(a) Pedagógico(a)', source = 'Equipe') => {
      if (!nome) return;
      const clean = nome.trim();
      if (isInvalidCoordinatorName(clean)) return;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: `${source}-${key}`, nome: clean, role, source });
      }
    };

    // 1. Coordenadores Pedagógicos vinculados na tabela de Coordenadores / Usuários
    (coordenadores || []).forEach(c => {
      const isLinked = escola?.id && c.escolasIds?.includes(escola.id);
      if (isLinked) {
        if (c.funcao === 'Coordenador Pedagógico' || c.funcao === 'Gestor Pedagógico') {
          addSuggestion(c.nome, c.funcao, 'Equipe Gestora');
        } else if ((c.funcao as string)?.toLowerCase().includes('coordenador')) {
          addSuggestion(c.nome, c.funcao, 'Coordenação');
        }
      }
    });

    // 2. Coordenadores no Recursos Humanos da Escola
    (escola?.recursosHumanos || []).forEach(r => {
      const f = (r.funcao || '').toLowerCase();
      if (f.includes('coordenad') || f.includes('pedagóg')) {
        addSuggestion(r.nome, r.funcao || 'Coordenação', 'RH da Escola');
      }
    });

    // 3. Coordenador registrado na Escola (se não for placeholder inválido como "NÃO TEM")
    if (escola?.coordenador && !isInvalidCoordinatorName(escola.coordenador)) {
      addSuggestion(escola.coordenador, 'Cadastro da Escola', 'Cadastro Atual');
    }

    // 4. Coordenador Regional vinculado à escola
    (coordenadores || []).forEach(c => {
      if (escola?.id && c.escolasIds?.includes(escola.id) && c.funcao === 'Coordenador Regional') {
        addSuggestion(c.nome, 'Coordenador Regional', 'Regional');
      }
    });

    return list;
  }, [coordenadores, escola]);

  // Melhor sugestão inicial
  const detectedCoordenadorInitial = useMemo(() => {
    // 1. Tenta Coordenador Pedagógico da escola
    const ped = coordinatorSuggestions.find(c => 
      c.role.toLowerCase().includes('pedagóg') || c.role.toLowerCase().includes('coordenador')
    );
    if (ped) return ped.nome;
    if (coordinatorSuggestions.length > 0) return coordinatorSuggestions[0].nome;
    if (escola?.coordenador && !isInvalidCoordinatorName(escola.coordenador)) {
      return escola.coordenador.trim();
    }
    return '';
  }, [coordinatorSuggestions, escola]);

  const [coordenadorNome, setCoordenadorNome] = useState('');
  const [diretorNome, setDiretorNome] = useState('');
  const [enableTeacherColors, setEnableTeacherColors] = useState(true);
  const [saveToSchool, setSaveToSchool] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCoordenadorNome(detectedCoordenadorInitial);
      setDiretorNome(escola?.gestor || '');
      setEnableTeacherColors(true);
      // Se a escola atualmente tem "NÃO TEM" ou vazio, pré-marcar salvar se tiver detectado coordenador
      const currentIsPlaceholder = isInvalidCoordinatorName(escola?.coordenador);
      setSaveToSchool(Boolean(currentIsPlaceholder && detectedCoordenadorInitial));
    }
  }, [isOpen, detectedCoordenadorInitial, escola]);

  // Texto da turma selecionada
  const selectedTurmaObj = selectedTurmaFilter !== 'ALL'
    ? schoolTurmas.find(t => String(t.id) === String(selectedTurmaFilter))
    : null;
  const turmaFiltroTexto = selectedTurmaObj
    ? `${selectedTurmaObj.year || selectedTurmaObj.anoSerie || ''} - ${selectedTurmaObj.name || ''}`.trim()
    : 'Todas as Turmas da Etapa';

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPrint({
      coordenadorNome: coordenadorNome.trim(),
      diretorNome: diretorNome.trim(),
      enableTeacherColors,
      saveToSchool
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton={false}>
      <div className="overflow-hidden bg-white rounded-2xl">
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-slate-900 px-6 py-6 leading-tight">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Imprimir Quadro de Horários</h2>
                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                  Distribuição Semanal • Relatório Oficial
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handlePrintSubmit} className="p-6 space-y-6">
          {/* Card Resumo do Escopo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Unidade</span>
              <span className="font-bold text-slate-800 truncate block" title={escola?.nome || ''}>
                {escola?.nome || 'Escola'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Etapa</span>
              <span className="font-bold text-orange-600 truncate block">{activeEtapa}</span>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Turno</span>
              <span className="font-bold text-slate-800">{activeTurnoDef.label}</span>
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Escopo</span>
              <span className="font-bold text-slate-800 truncate block" title={turmaFiltroTexto}>
                {turmaFiltroTexto}
              </span>
            </div>
          </div>

          {/* Campo Coordenador Pedagógico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-orange-500" />
                Nome do(a) Coordenador(a) Pedagógico(a)
                <span className="text-[10px] font-medium text-slate-400 normal-case">(Aparece na assinatura do relatório)</span>
              </label>
              {coordenadorNome && !isInvalidCoordinatorName(coordenadorNome) && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Definido
                </span>
              )}
            </div>

            <input
              type="text"
              required
              placeholder="Digite o nome completo do(a) Coordenador(a) Pedagógico(a)..."
              value={coordenadorNome}
              onChange={(e) => setCoordenadorNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
            />

            {/* Sugestões rápidas de coordenadores cadastrados */}
            {coordinatorSuggestions.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Sugestões da Unidade / Equipe:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {coordinatorSuggestions.map(s => {
                    const isSelected = coordenadorNome.trim().toLowerCase() === s.nome.toLowerCase();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCoordenadorNome(s.nome)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{s.nome}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                          isSelected ? 'bg-orange-600 text-orange-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkbox para atualizar o cadastro da escola */}
            {canEdit && (
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToSchool}
                    onChange={(e) => setSaveToSchool(e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400"
                  />
                  <span className="text-xs font-bold text-slate-600">
                    Salvar este nome como Coordenador(a) oficial no cadastro da unidade escolar
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Campo Diretor Escolar */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <School className="w-4 h-4 text-slate-500" />
              Direção Escolar / Gestor(a)
            </label>
            <input
              type="text"
              required
              placeholder="Nome do(a) Gestor(a) ou Diretor(a)..."
              value={diretorNome}
              onChange={(e) => setDiretorNome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
            />
          </div>

          {/* Seção de Cores dos Professores */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableTeacherColors}
                  onChange={(e) => setEnableTeacherColors(e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400"
                />
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-orange-500" />
                  Diferenciar cada professor por cor na impressão
                </span>
              </label>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full">
                Recomendado
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cada professor terá sua cor própria aplicada nos cards de aula e na legenda dos docentes, facilitando a identificação imediata na folha impressa ou em PDF.
            </p>

            {/* Preview das cores dos professores alocados */}
            {activeTeachersInTurno.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Visualização dos Professores neste Turno ({activeTeachersInTurno.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeTeachersInTurno.map(teacher => {
                    const color = teacherColorMap[teacher.id];
                    return (
                      <div
                        key={teacher.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-2 transition-all ${
                          enableTeacherColors && color
                            ? `${color.bg} ${color.border} ${color.text}`
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: enableTeacherColors && color ? color.printBorderLeft : '#94a3b8'
                          }}
                        />
                        <span>{teacher.nome}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              className="text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 px-6 py-2.5 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              Imprimir Documento
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
