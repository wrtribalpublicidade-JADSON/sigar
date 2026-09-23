import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Download, 
  Users, 
  Layers, 
  Filter, 
  CheckCircle2, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Escola, Aluno, Coordenador } from '../../types';
import { 
  exportTurmasToExcel, 
  filterStudentsForTurma, 
  getTurmaNomeCompleto 
} from '../../utils/exportTurmasExcel';

interface ExportTurmasExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  escola: Escola;
  turmas: any[];
  students: Aluno[];
  schoolTeachers?: Coordenador[];
  filteredStudents?: Aluno[];
  defaultTurmaId?: string;
}

export const ExportTurmasExcelModal: React.FC<ExportTurmasExcelModalProps> = ({
  isOpen,
  onClose,
  escola,
  turmas,
  students,
  schoolTeachers = [],
  filteredStudents = [],
  defaultTurmaId
}) => {
  const [mode, setMode] = useState<'all_turmas' | 'single_turma' | 'filtered_students'>('all_turmas');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(
    defaultTurmaId || (turmas.length > 0 ? String(turmas[0].id) : '')
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Ativo' | 'Inativo'>('ALL');
  const [detailLevel, setDetailLevel] = useState<'complete' | 'basic'>('complete');
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Turma atualmente selecionada para modo 'single_turma'
  const selectedTurma = useMemo(() => {
    return turmas.find(t => String(t.id) === String(selectedTurmaId)) || turmas[0] || null;
  }, [turmas, selectedTurmaId]);

  // Alunos no escopo selecionado para a prévia
  const previewData = useMemo(() => {
    if (mode === 'single_turma') {
      if (!selectedTurma) return { turmasCount: 0, studentsCount: 0 };
      const st = filterStudentsForTurma(selectedTurma, students, statusFilter);
      return { turmasCount: 1, studentsCount: st.length };
    }

    if (mode === 'filtered_students') {
      const activeList = filteredStudents.length > 0 ? filteredStudents : students;
      const count = statusFilter === 'ALL'
        ? activeList.length
        : activeList.filter(s => s.status === statusFilter).length;
      return { turmasCount: turmas.length, studentsCount: count };
    }

    // mode === 'all_turmas'
    let count = 0;
    if (statusFilter === 'ALL') {
      count = students.length;
    } else {
      count = students.filter(s => s.status === statusFilter).length;
    }
    return { turmasCount: turmas.length, studentsCount: count };
  }, [mode, selectedTurma, turmas, students, filteredStudents, statusFilter]);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Simula breve delay para feedback visual suave
      await new Promise(res => setTimeout(res, 350));

      const fileName = exportTurmasToExcel({
        escola,
        turmas,
        students,
        schoolTeachers,
        mode,
        selectedTurmaId: selectedTurma?.id,
        statusFilter,
        detailLevel,
        filteredStudentsList: filteredStudents
      });

      setSuccessMessage(`Planilha "${fileName}" gerada e baixada com sucesso!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Erro ao exportar planilha:', err);
      setErrorMessage(err.message || 'Erro ao gerar planilha Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-scale-up max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Exportar Turmas em Planilha Excel
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {escola.nome} • Controle de Matrículas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200/60 shadow-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Sucesso / Erro */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-semibold animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Modo de Exportação */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
              1. Selecione o Escopo da Exportação
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Opção A: Todas as Turmas */}
              <button
                type="button"
                onClick={() => setMode('all_turmas')}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  mode === 'all_turmas'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${mode === 'all_turmas' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Recomendado
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Todas as Turmas</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Planilha completa com aba de Resumo Geral, lista consolidada e abas por turma.
                  </p>
                </div>
              </button>

              {/* Opção B: Turma Específica */}
              <button
                type="button"
                onClick={() => setMode('single_turma')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  mode === 'single_turma'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${mode === 'single_turma' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Turma Específica</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Lista nominal detalhada com dados cadastrais e identificação da turma escolhida.
                  </p>
                </div>
              </button>

              {/* Opção C: Alunos Filtrados na Tela */}
              <button
                type="button"
                onClick={() => setMode('filtered_students')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  mode === 'filtered_students'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${mode === 'filtered_students' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Filter className="w-4 h-4" />
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Filtro Atual da Tela</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Exporta exatamente os alunos visíveis na busca e filtros ativos no momento.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Seletor de Turma Específica */}
          {mode === 'single_turma' && (
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selecione a Turma Desejada
              </label>
              {turmas.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhuma turma cadastrada nesta escola.</p>
              ) : (
                <select
                  value={selectedTurma?.id || ''}
                  onChange={e => setSelectedTurmaId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                >
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>
                      {getTurmaNomeCompleto(t)} ({t.shift || 'MANHÃ'}) — {t.stage || 'Regular'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 2. Filtros e Nível de Detalhe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                2. Filtro de Situação dos Alunos
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="ALL">Todos os Alunos (Ativos e Inativos)</option>
                <option value="Ativo">Apenas Alunos com Matrícula Ativa</option>
                <option value="Inativo">Apenas Alunos Inativos / Evadidos</option>
              </select>
            </div>

            {/* Detalhamento */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                3. Formato das Colunas
              </label>
              <select
                value={detailLevel}
                onChange={e => setDetailLevel(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="complete">Completo (Cadastral, Filiação, Contato, PCD)</option>
                <option value="basic">Simplificado (Lista Nominal / Assinatura)</option>
              </select>
            </div>
          </div>

          {/* Resumo da Exportação */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
              <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
                Resumo dos Dados da Planilha
              </span>
              <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                Formato Excel (.xlsx)
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Turmas Incluídas</span>
                <span className="font-black text-slate-800 text-sm">
                  {mode === 'single_turma' ? '1 turma' : `${previewData.turmasCount} turma(s)`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Estudantes no Arquivo</span>
                <span className="font-black text-emerald-700 text-sm">
                  {previewData.studentsCount} estudante(s)
                </span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Organização</span>
                <span className="font-bold text-slate-700">
                  {mode === 'all_turmas' ? 'Resumo + Abas individuais' : 'Aba única formatada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all shadow-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || previewData.studentsCount === 0 && mode === 'single_turma'}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando Planilha...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar Planilha Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
