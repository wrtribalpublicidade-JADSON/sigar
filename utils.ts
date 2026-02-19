import { Escola, StatusMeta, PendencyType } from './types';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Extrair cabeçalhos
  const headers = Object.keys(data[0]);

  // Converter linhas para CSV
  const csvRows = data.map(row => {
    return headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""'); // Escapar aspas duplas
      return `"${escaped}"`;
    }).join(';'); // Usar ponto e vírgula para melhor compatibilidade com Excel em PT-BR
  });

  // Adicionar cabeçalho no início
  csvRows.unshift(headers.map(h => `"${h.toUpperCase()}"`).join(';'));

  const csvString = csvRows.join('\r\n');

  // Adicionar BOM para UTF-8 para garantir que acentos funcionem no Excel
  const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Gerador de UUID compatível com Postgres
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to safely sum students from deep structure
const countTotalStudents = (detalhada: any): number => {
  if (!detalhada) return 0;
  let total = 0;

  // Helper to extract numbers from DadosTurno
  const sumTurnos = (dados: any) => {
    if (!dados || typeof dados !== 'object') return 0;
    // Check if it has 'alunos' property (for DadosNivel)
    const target = dados.alunos || dados;
    return (Number(target.integral) || 0) +
      (Number(target.manha) || 0) +
      (Number(target.tarde) || 0) +
      (Number(target.noite) || 0);
  };

  try {
    // Traverse 'infantil'
    if (detalhada.infantil && typeof detalhada.infantil === 'object') {
      Object.values(detalhada.infantil).forEach((nivel: any) => {
        total += sumTurnos(nivel);
      });
    }
    // Traverse 'fundamental'
    if (detalhada.fundamental && typeof detalhada.fundamental === 'object') {
      Object.values(detalhada.fundamental).forEach((nivel: any) => {
        total += sumTurnos(nivel);
      });
    }
  } catch (e) {
    console.warn("Error calculating detailed students:", e);
  }
  return total;
};

// Helper to safely sum classes from deep structure
const countTotalClasses = (detalhada: any): number => {
  if (!detalhada) return 0;
  let total = 0;

  // Helper to extract numbers from DadosTurno
  const sumTurnos = (dados: any) => {
    if (!dados || typeof dados !== 'object') return 0;
    // Check if it has 'turmas' property (for DadosNivel) otherwise assume dados is turmas
    const target = dados.turmas || dados;
    return (Number(target.integral) || 0) +
      (Number(target.manha) || 0) +
      (Number(target.tarde) || 0) +
      (Number(target.noite) || 0);
  };

  try {
    // Traverse 'infantil'
    if (detalhada.infantil && typeof detalhada.infantil === 'object') {
      Object.values(detalhada.infantil).forEach((nivel: any) => {
        total += sumTurnos(nivel);
      });
    }
    // Traverse 'fundamental'
    if (detalhada.fundamental && typeof detalhada.fundamental === 'object') {
      Object.values(detalhada.fundamental).forEach((nivel: any) => {
        total += sumTurnos(nivel);
      });
    }
  } catch (e) {
    console.warn("Error calculating detailed classes:", e);
  }
  return total;
};

export const checkSchoolPendencies = (escola: Escola) => {
  const pendencies: { type: PendencyType; label: string; severity: 'critical' | 'warning' }[] = [];

  if (!escola) return [];

  try {
    // 1. Matrícula (Alunos)
    // Check main field first, then calculate detail if needed (though structure suggests censoEscolar is the source of truth for total)
    const hasCensoMatricula = (escola.dadosEducacionais?.censoEscolar?.matriculaTotal || 0) > 0;
    const hasSummaryMatricula = (escola.dadosEducacionais?.matricula && (
      (escola.dadosEducacionais.matricula.infantil || 0) +
      (escola.dadosEducacionais.matricula.anosIniciais || 0) +
      (escola.dadosEducacionais.matricula.anosFinais || 0) +
      (escola.dadosEducacionais.matricula.eja || 0)
    ) > 0);
    const hasDetailedMatricula = countTotalStudents(escola.dadosEducacionais?.matriculaDetalhada) > 0;

    // If ANY source has students, it's not pending
    const hasMatricula = hasCensoMatricula || hasSummaryMatricula || hasDetailedMatricula;

    if (!hasMatricula) {
      pendencies.push({ type: 'MATRICULA', label: 'Matrícula total não informada', severity: 'critical' });
    }

    // 2. Turmas
    const hasCensoTurmas = (escola.dadosEducacionais?.censoEscolar?.turmas || 0) > 0;
    const hasSummaryTurmas = (escola.dadosEducacionais?.turmas && (
      (escola.dadosEducacionais.turmas.manha || 0) +
      (escola.dadosEducacionais.turmas.tarde || 0) +
      (escola.dadosEducacionais.turmas.noite || 0)
    ) > 0);
    const hasDetailedTurmas = countTotalClasses(escola.dadosEducacionais?.matriculaDetalhada) > 0;

    // If ANY source has classes, it's not pending
    const hasTurmas = hasCensoTurmas || hasSummaryTurmas || hasDetailedTurmas;

    if (!hasTurmas) {
      pendencies.push({ type: 'TURMAS', label: 'Quantitativo de turmas pendente', severity: 'critical' });
    }

    // 3. Recursos Humanos
    if (!escola.recursosHumanos || !Array.isArray(escola.recursosHumanos) || escola.recursosHumanos.length === 0) {
      pendencies.push({ type: 'RH', label: 'Quadro de RH não preenchido', severity: 'warning' });
    }

    // 4. Plano de Ação
    // Check if empty OR all items are 'Não Iniciado'
    const planoAcao = Array.isArray(escola.planoAcao) ? escola.planoAcao : [];
    const hasStartedPlan = planoAcao.some(meta => meta.status !== StatusMeta.NAO_INICIADO);

    if (planoAcao.length === 0 || !hasStartedPlan) {
      pendencies.push({ type: 'PLANO_ACAO', label: 'Plano de Ação não iniciado', severity: 'warning' });
    }

    // 5. Monitoramento (Acompanhamento Mensal)
    if (!escola.acompanhamentoMensal || !Array.isArray(escola.acompanhamentoMensal) || escola.acompanhamentoMensal.length === 0) {
      pendencies.push({ type: 'MONITORAMENTO', label: 'Monitoramento mensal não iniciado', severity: 'warning' });
    }

  } catch (error) {
    console.warn(`Error checking pendencies for school ${escola.id}:`, error);
    return [];
  }

  return pendencies;
};
