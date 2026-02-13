
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
