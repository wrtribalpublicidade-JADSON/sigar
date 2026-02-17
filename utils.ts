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

export const checkSchoolPendencies = (escola: Escola) => {
  const pendencies: { type: PendencyType; label: string; severity: 'high' | 'medium' | 'low' }[] = [];

  if (!escola) return [];

  // 1. Matrícula Total
  const hasMatricula = (escola.alunosMatriculados || 0) > 0 ||
    (escola.dadosEducacionais?.matriculaDetalhada && Object.keys(escola.dadosEducacionais.matriculaDetalhada).length > 0);

  if (!hasMatricula) {
    pendencies.push({ type: 'MATRICULA', label: 'Matrícula Total não informada', severity: 'high' });
  }

  // 2. Turmas
  const hasTurmas = (escola.dadosEducacionais?.turmas?.manha || 0) +
    (escola.dadosEducacionais?.turmas?.tarde || 0) +
    (escola.dadosEducacionais?.turmas?.noite || 0) > 0 ||
    (escola.dadosEducacionais?.matriculaDetalhada && Object.keys(escola.dadosEducacionais.matriculaDetalhada).length > 0);

  if (!hasTurmas) {
    pendencies.push({ type: 'TURMAS', label: 'Quantitativo de Turmas pendente', severity: 'high' });
  }

  // 3. Recursos Humanos
  if (!escola.recursosHumanos || escola.recursosHumanos.length === 0) {
    pendencies.push({ type: 'RH', label: 'Quadro de RH não preenchido', severity: 'high' });
  }

  // 4. Plano de Ação
  // Ensure planoAcao exists before filtering
  const planoAcao = escola.planoAcao || [];
  const atrasadas = planoAcao.filter(m => m.status === StatusMeta.ATRASADO).length;

  if (atrasadas > 0) {
    pendencies.push({ type: 'PLANO_ACAO', label: `${atrasadas} metas do Plano de Ação em atraso`, severity: 'medium' });
  } else if (planoAcao.length === 0) {
    pendencies.push({ type: 'PLANO_ACAO', label: 'Plano de Ação não iniciado', severity: 'medium' });
  }

  // 5. Monitoramento (Acompanhamento Mensal)
  if (!escola.acompanhamentoMensal || escola.acompanhamentoMensal.length === 0) {
    pendencies.push({ type: 'MONITORAMENTO', label: 'Monitoramento não iniciado', severity: 'low' });
  }

  return pendencies;
};
