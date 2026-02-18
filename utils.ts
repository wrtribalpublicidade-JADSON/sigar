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

export const checkSchoolPendencies = (escola: Escola) => {
  const pendencies: { type: PendencyType; label: string; severity: 'high' | 'medium' | 'low' }[] = [];

  if (!escola) return [];

  try {
    // 1. Matrícula Total
    const totalAlunosDetalhado = escola.dadosEducacionais?.matriculaDetalhada
      ? countTotalStudents(escola.dadosEducacionais.matriculaDetalhada)
      : 0;

    const hasMatricula = (escola.alunosMatriculados || 0) > 0 || totalAlunosDetalhado > 0;

    if (!hasMatricula) {
      pendencies.push({ type: 'MATRICULA', label: 'Matrícula Total não informada', severity: 'high' });
    }

    // 2. Turmas
    const turmas = escola.dadosEducacionais?.turmas || {};
    // Note: Top-level turmas object does NOT have 'integral' in the current type definition
    const totalTurmas = (Number(turmas.manha) || 0) +
      (Number(turmas.tarde) || 0) +
      (Number(turmas.noite) || 0);

    const hasTurmas = totalTurmas > 0;

    if (!hasTurmas) {
      pendencies.push({ type: 'TURMAS', label: 'Quantitativo de Turmas pendente', severity: 'high' });
    }

    // 3. Recursos Humanos
    if (!escola.recursosHumanos || !Array.isArray(escola.recursosHumanos) || escola.recursosHumanos.length === 0) {
      pendencies.push({ type: 'RH', label: 'Quadro de RH não preenchido', severity: 'high' });
    }

    // 4. Plano de Ação
    const planoAcao = Array.isArray(escola.planoAcao) ? escola.planoAcao : [];
    const atrasadas = planoAcao.filter(m => m && m.status === StatusMeta.ATRASADO).length;

    if (atrasadas > 0) {
      pendencies.push({ type: 'PLANO_ACAO', label: `${atrasadas} metas do Plano de Ação em atraso`, severity: 'medium' });
    } else if (planoAcao.length === 0) {
      pendencies.push({ type: 'PLANO_ACAO', label: 'Plano de Ação não iniciado', severity: 'medium' });
    }

    // 5. Monitoramento (Acompanhamento Mensal)
    if (!escola.acompanhamentoMensal || !Array.isArray(escola.acompanhamentoMensal) || escola.acompanhamentoMensal.length === 0) {
      pendencies.push({ type: 'MONITORAMENTO', label: 'Monitoramento não iniciado', severity: 'low' });
    }

  } catch (error) {
    console.warn(`Error checking pendencies for school ${escola.id}:`, error);
    // Return empty pendencies on error to prevent crash
    return [];
  }

  return pendencies;
};
