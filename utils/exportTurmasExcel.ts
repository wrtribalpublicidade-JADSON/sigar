import * as XLSX from 'xlsx';
import { Escola, Aluno, Coordenador } from '../types';

export interface ExportTurmasExcelOptions {
  escola: Escola;
  turmas: any[];
  students: Aluno[];
  schoolTeachers?: Coordenador[];
  mode: 'all_turmas' | 'single_turma' | 'filtered_students';
  selectedTurmaId?: string;
  statusFilter?: 'ALL' | 'Ativo' | 'Inativo';
  detailLevel?: 'complete' | 'basic';
  filteredStudentsList?: Aluno[];
}

// Sanitizar string para uso seguro em nomes de abas do Excel (máx 31 caracteres, sem caracteres especiais)
const sanitizeSheetName = (name: string, fallback: string = 'Turma'): string => {
  const clean = name.replace(/[\\/*?:[\]]/g, '').trim();
  const truncated = clean.substring(0, 31).trim();
  return truncated || fallback;
};

// Sanitizar string para nomes de arquivo
const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
};

// Formatar data para PT-BR
const formatDateBR = (val?: string): string => {
  if (!val) return '---';
  if (val.includes('/')) return val;
  const parts = val.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) return `${day}/${month}/${year}`;
  }
  return val;
};

// Localizar os professores vinculados à turma
const getTeacherNames = (turmaId: string | undefined, teachers: Coordenador[], fallbackCoordenador?: string): string => {
  if (!turmaId) return fallbackCoordenador || 'Não atribuído';
  const assigned = teachers.filter(t => (t.turmasIds || []).includes(turmaId));
  if (assigned.length > 0) {
    return assigned.map(t => t.nome).join(', ');
  }
  return fallbackCoordenador || 'Não atribuído';
};

// Obter nome completo da turma (ex: "6º ANO - TURMA B")
export const getTurmaNomeCompleto = (turma: any): string => {
  if (!turma) return 'Turma Sem Nome';
  const anoSerie = turma.year || turma.anoSerie || '';
  const nome = turma.name || turma.identificacao || '';
  if (anoSerie && nome) {
    if (nome.toLowerCase().includes(anoSerie.toLowerCase())) return nome;
    return `${anoSerie} - ${nome}`;
  }
  return anoSerie || nome || 'Turma Não Identificada';
};

// Filtrar alunos de uma turma específica
export const filterStudentsForTurma = (
  turma: any,
  allStudents: Aluno[],
  statusFilter: 'ALL' | 'Ativo' | 'Inativo' = 'ALL'
): Aluno[] => {
  if (!turma) return [];
  const tYear = (turma.year || turma.anoSerie || '').toLowerCase().trim();
  const tName = (turma.name || turma.identificacao || '').toLowerCase().trim();
  const tFull = `${tYear} - ${tName}`.trim();

  return allStudents.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (s.class_id && String(s.class_id) === String(turma.id)) return true;

    const sStage = (s.stage || (s as any).ano_serie || '').toLowerCase().trim();
    if (!sStage) return false;
    if (sStage === tFull || sStage === tName || (tYear && sStage.includes(tYear))) return true;
    return false;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const exportTurmasToExcel = ({
  escola,
  turmas,
  students,
  schoolTeachers = [],
  mode,
  selectedTurmaId,
  statusFilter = 'ALL',
  detailLevel = 'complete',
  filteredStudentsList = []
}: ExportTurmasExcelOptions): string => {
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const wb = XLSX.utils.book_new();

  // Helper para mapa de informações de turma pelo class_id
  const getTurmaInfo = (classId?: string) => {
    if (!classId) return { nome: 'Não Vinculada', turno: '---', etapa: '---' };
    const found = turmas.find(t => String(t.id) === String(classId));
    if (!found) return { nome: '---', turno: '---', etapa: '---' };
    return {
      nome: getTurmaNomeCompleto(found),
      turno: found.shift || 'MANHÃ',
      etapa: found.stage || 'Regular'
    };
  };

  // Helper para montar cabeçalhos e linhas de alunos
  const buildStudentRows = (alunoList: Aluno[], includeTurmaColumn: boolean = false) => {
    const headers = [
      'Nº',
      ...(includeTurmaColumn ? ['Turma / Ano-Série', 'Turno'] : []),
      'Matrícula',
      'Nome do Estudante',
      'CPF',
      'Data de Nascimento',
      'Sexo',
      'Situação / Status',
      'Nome da Mãe / Responsável',
      'Telefone de Contato',
      'Endereço / Localidade',
      'PCD / AEE',
      'Observações'
    ];

    if (detailLevel === 'basic') {
      const basicHeaders = [
        'Nº',
        ...(includeTurmaColumn ? ['Turma / Ano-Série', 'Turno'] : []),
        'Matrícula',
        'Nome do Estudante',
        'CPF',
        'Situação / Status',
        'Assinatura do Estudante / Responsável',
        'Observações'
      ];

      const dataRows = alunoList.map((s, idx) => {
        const turmaInfo = getTurmaInfo(s.class_id);
        const row = [
          idx + 1,
          ...(includeTurmaColumn ? [turmaInfo.nome, turmaInfo.turno] : []),
          s.registration_number || '---',
          s.name,
          s.cpf || '---',
          s.status || 'Ativo',
          '', // Espaço para assinatura
          s.observations || ''
        ];
        return row;
      });

      return { headers: basicHeaders, rows: dataRows };
    }

    const dataRows = alunoList.map((s, idx) => {
      const turmaInfo = getTurmaInfo(s.class_id);
      const maeOuResp = s.nome_mae || s.contato_responsavel_nome || (s as any).responsible_name || '---';
      const contato = s.contato_telefone || s.contato_whatsapp || s.contato_telefone2 || '---';
      const endereco = [
        s.endereco_logradouro,
        s.endereco_numero ? `nº ${s.endereco_numero}` : '',
        s.endereco_bairro,
        s.endereco_municipio
      ].filter(Boolean).join(', ') || '---';

      const isPcd = s.possui_deficiencia === 'Sim' || Boolean(s.deficiencia_tipos && s.deficiencia_tipos.length > 0);
      const pcdDesc = isPcd 
        ? `Sim (${(s.deficiencia_tipos || []).join(', ') || 'Não especificada'})` 
        : 'Não';

      return [
        idx + 1,
        ...(includeTurmaColumn ? [turmaInfo.nome, turmaInfo.turno] : []),
        s.registration_number || '---',
        s.name,
        s.cpf || '---',
        formatDateBR(s.birth_date),
        s.gender || '---',
        s.status || 'Ativo',
        maeOuResp,
        contato,
        endereco,
        pcdDesc,
        s.observations || ''
      ];
    });

    return { headers, rows: dataRows };
  };

  // Helper para larguras de colunas
  const getColWidths = (hasTurmaCol: boolean = false) => {
    if (detailLevel === 'basic') {
      return [
        { wch: 6 },  // Nº
        ...(hasTurmaCol ? [{ wch: 22 }, { wch: 12 }] : []),
        { wch: 14 }, // Matrícula
        { wch: 38 }, // Nome
        { wch: 16 }, // CPF
        { wch: 14 }, // Status
        { wch: 35 }, // Assinatura
        { wch: 30 }, // Observações
      ];
    }
    return [
      { wch: 6 },  // Nº
      ...(hasTurmaCol ? [{ wch: 22 }, { wch: 12 }] : []),
      { wch: 14 }, // Matrícula
      { wch: 38 }, // Nome
      { wch: 16 }, // CPF
      { wch: 14 }, // Data Nasc
      { wch: 8 },  // Sexo
      { wch: 14 }, // Status
      { wch: 32 }, // Mãe/Resp
      { wch: 18 }, // Telefone
      { wch: 35 }, // Endereço
      { wch: 20 }, // PCD
      { wch: 30 }  // Observações
    ];
  };

  let generatedFileName = '';

  // CASO 1: TURMA ESPECÍFICA
  if (mode === 'single_turma') {
    const targetTurma = turmas.find(t => String(t.id) === String(selectedTurmaId)) || turmas[0];
    if (!targetTurma) {
      throw new Error('Nenhuma turma selecionada para exportação.');
    }

    const turmaNome = getTurmaNomeCompleto(targetTurma);
    const turmaStudents = filterStudentsForTurma(targetTurma, students, statusFilter);
    const teacherNames = getTeacherNames(targetTurma.id, schoolTeachers, escola.coordenador);

    const { headers, rows } = buildStudentRows(turmaStudents, false);

    const sheetContent: any[][] = [
      ['ESTADO DO MARANHÃO — PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS'],
      ['SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED'],
      ['SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL'],
      [`CONTROLE DE MATRÍCULAS — RELATÓRIO DA TURMA (${currentYear})`],
      [],
      ['Unidade Escolar:', escola.nome, '', 'Código INEP:', (escola as any).codigoInep || '---'],
      ['Turma / Ano-Série:', turmaNome, '', 'Turno:', targetTurma.shift || 'MANHÃ'],
      ['Etapa / Modalidade:', `${targetTurma.stage || 'Regular'} • ${targetTurma.modality || 'REGULAR'}`, '', 'Status Turma:', 'ATIVA'],
      ['Professor(a) Resp.:', teacherNames, '', 'Total de Alunos:', `${turmaStudents.length} estudante(s)`],
      ['Filtro de Status:', statusFilter === 'ALL' ? 'Todos os Alunos' : `Apenas ${statusFilter}`, '', 'Emissão:', `${emissionDate} às ${emissionTime}`],
      [],
      headers,
      ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetContent);
    ws['!cols'] = getColWidths(false);

    const sheetName = sanitizeSheetName(turmaNome, 'Turma');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    generatedFileName = `Turma_${sanitizeFileName(turmaNome)}_${sanitizeFileName(escola.nome)}_${currentYear}.xlsx`;
  }

  // CASO 2: ALUNOS FILTRADOS NA TELA
  else if (mode === 'filtered_students') {
    const targetStudents = filteredStudentsList.length > 0 ? filteredStudentsList : students;
    const { headers, rows } = buildStudentRows(targetStudents, true);

    const sheetContent: any[][] = [
      ['ESTADO DO MARANHÃO — PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS'],
      ['SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED'],
      ['SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL'],
      [`CONTROLE DE MATRÍCULAS — ALUNOS FILTRADOS (${currentYear})`],
      [],
      ['Unidade Escolar:', escola.nome, '', 'Total Registros:', `${targetStudents.length} estudante(s)`],
      ['Gestor(a):', escola.gestor || '---', '', 'Emissão:', `${emissionDate} às ${emissionTime}`],
      [],
      headers,
      ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetContent);
    ws['!cols'] = getColWidths(true);
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos Filtrados');

    generatedFileName = `Matriculas_Filtradas_${sanitizeFileName(escola.nome)}_${currentYear}.xlsx`;
  }

  // CASO 3: TODAS AS TURMAS DA ESCOLA (COMPLETO)
  else {
    // ABA 1: RESUMO GERAL DAS TURMAS
    const summaryHeaders = [
      'Nº',
      'Ano / Série',
      'Identificação da Turma',
      'Turno',
      'Etapa',
      'Modalidade',
      'Professor(a) Responsável',
      'Alunos Ativos',
      'Alunos Inativos',
      'Total de Estudantes'
    ];

    let totalGeralAtivos = 0;
    let totalGeralInativos = 0;
    let totalGeralAlunos = 0;

    const summaryRows = turmas.map((t, idx) => {
      const tStudentsAll = filterStudentsForTurma(t, students, 'ALL');
      const ativos = tStudentsAll.filter(s => s.status === 'Ativo' || s.status === 'active').length;
      const inativos = tStudentsAll.length - ativos;
      const teacher = getTeacherNames(t.id, schoolTeachers, escola.coordenador);

      totalGeralAtivos += ativos;
      totalGeralInativos += inativos;
      totalGeralAlunos += tStudentsAll.length;

      return [
        idx + 1,
        t.year || t.anoSerie || '---',
        t.name || t.identificacao || 'Turma Sem Nome',
        t.shift || 'MANHÃ',
        t.stage || 'Regular',
        t.modality || 'REGULAR',
        teacher,
        ativos,
        inativos,
        tStudentsAll.length
      ];
    });

    // Linha de total geral
    const summaryTotalRow = [
      '',
      'TOTAL GERAL',
      '',
      '',
      '',
      '',
      `${turmas.length} Turma(s)`,
      totalGeralAtivos,
      totalGeralInativos,
      totalGeralAlunos
    ];

    const summarySheetContent: any[][] = [
      ['ESTADO DO MARANHÃO — PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS'],
      ['SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED'],
      ['SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL'],
      [`CONTROLE DE MATRÍCULAS — QUADRO GERAL DE TURMAS (${currentYear})`],
      [],
      ['Unidade Escolar:', escola.nome, '', 'Código INEP:', (escola as any).codigoInep || '---'],
      ['Gestor(a):', escola.gestor || '---', '', 'Total de Turmas:', `${turmas.length}`],
      ['Coordenador(a):', escola.coordenador || '---', '', 'Total Geral Alunos:', `${totalGeralAlunos}`],
      ['Emissão do Relatório:', `${emissionDate} às ${emissionTime}`],
      [],
      summaryHeaders,
      ...summaryRows,
      summaryTotalRow
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetContent);
    wsSummary['!cols'] = [
      { wch: 6 },  // Nº
      { wch: 16 }, // Ano/Série
      { wch: 22 }, // Turma
      { wch: 12 }, // Turno
      { wch: 20 }, // Etapa
      { wch: 14 }, // Modalidade
      { wch: 30 }, // Professor
      { wch: 14 }, // Ativos
      { wch: 14 }, // Inativos
      { wch: 18 }  // Total
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Quadro Geral Turmas');

    // ABA 2: LISTA GERAL DE TODOS OS ESTUDANTES
    const activeFilteredStudents = statusFilter === 'ALL'
      ? students
      : students.filter(s => s.status === statusFilter);

    const { headers: generalHeaders, rows: generalRows } = buildStudentRows(activeFilteredStudents, true);

    const generalSheetContent: any[][] = [
      ['ESTADO DO MARANHÃO — PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS'],
      ['SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED'],
      ['SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL'],
      [`CONTROLE DE MATRÍCULAS — TODOS OS ALUNOS DA UNIDADE (${currentYear})`],
      [],
      ['Unidade Escolar:', escola.nome, '', 'Total de Registros:', `${activeFilteredStudents.length}`],
      ['Filtro de Status:', statusFilter === 'ALL' ? 'Todos os Alunos' : `Apenas ${statusFilter}`, '', 'Emissão:', `${emissionDate} às ${emissionTime}`],
      [],
      generalHeaders,
      ...generalRows
    ];

    const wsGeneral = XLSX.utils.aoa_to_sheet(generalSheetContent);
    wsGeneral['!cols'] = getColWidths(true);
    XLSX.utils.book_append_sheet(wb, wsGeneral, 'Todos os Alunos');

    // ABAS INDIVIDUAIS POR TURMA
    const usedSheetNames = new Set<string>(['Quadro Geral Turmas', 'Todos os Alunos']);

    turmas.forEach((t, tIdx) => {
      const turmaNome = getTurmaNomeCompleto(t);
      const tStudents = filterStudentsForTurma(t, students, statusFilter);
      const teacherNames = getTeacherNames(t.id, schoolTeachers, escola.coordenador);

      let rawSheetName = sanitizeSheetName(turmaNome, `Turma ${tIdx + 1}`);
      // Garantir nome único de aba
      let uniqueName = rawSheetName;
      let counter = 2;
      while (usedSheetNames.has(uniqueName.toLowerCase())) {
        const suffix = `_${counter}`;
        uniqueName = sanitizeSheetName(rawSheetName.slice(0, 31 - suffix.length) + suffix);
        counter++;
      }
      usedSheetNames.add(uniqueName.toLowerCase());

      const { headers: turmaHeaders, rows: turmaRows } = buildStudentRows(tStudents, false);

      const turmaSheetContent: any[][] = [
        ['PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS — SEMED'],
        [`RELATÓRIO DA TURMA: ${turmaNome} (${currentYear})`],
        [],
        ['Unidade Escolar:', escola.nome, '', 'Turno:', t.shift || 'MANHÃ'],
        ['Etapa / Modalidade:', `${t.stage || 'Regular'} • ${t.modality || 'REGULAR'}`, '', 'Total Alunos:', `${tStudents.length}`],
        ['Professor(a) Resp.:', teacherNames, '', 'Emissão:', `${emissionDate} às ${emissionTime}`],
        [],
        turmaHeaders,
        ...turmaRows
      ];

      const wsTurma = XLSX.utils.aoa_to_sheet(turmaSheetContent);
      wsTurma['!cols'] = getColWidths(false);
      XLSX.utils.book_append_sheet(wb, wsTurma, uniqueName);
    });

    generatedFileName = `Turmas_Geral_${sanitizeFileName(escola.nome)}_${currentYear}.xlsx`;
  }

  // Gravar e disparar download do arquivo Excel
  XLSX.writeFile(wb, generatedFileName);
  return generatedFileName;
};
