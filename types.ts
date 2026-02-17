
export enum Segmento {
  INFANTIL = 'Educação Infantil',
  FUNDAMENTAL_I = 'Ensino Fundamental I',
  FUNDAMENTAL_II = 'Ensino Fundamental II',
}

export enum StatusMeta {
  ATRASADO = 'Atrasado',
  EM_ANDAMENTO = 'Em Andamento',
  CONCLUIDO = 'Concluído',
  NAO_INICIADO = 'Não Iniciado',
}

export interface Indicadores {
  ideb: number;
  frequenciaMedia: number; // %
  fluenciaLeitora: number; // % de alunos leitores
  taxaAprovacao: number; // %
}

// Interfaces para a aba "Alunos por Turmas"
export interface DadosTurno {
  integral: number;
  manha: number;
  tarde: number;
}

export interface DadosNivel {
  turmas: DadosTurno;
  alunos: DadosTurno;
}

export interface MatriculaDetalhada {
  infantil: {
    creche2: DadosNivel;
    creche3: DadosNivel;
    pre1: DadosNivel;
    pre2: DadosNivel;
  };
  fundamental: {
    ano1: DadosNivel;
    ano2: DadosNivel;
    ano3: DadosNivel;
    ano4: DadosNivel;
    ano5: DadosNivel;
    ano6: DadosNivel;
    ano7: DadosNivel;
    ano8: DadosNivel;
    ano9: DadosNivel;
    eja: DadosNivel;
  };
}

// Novos tipos para os dados detalhados
export interface DadosEducacionais {
  matricula: {
    infantil: number;
    anosIniciais: number;
    anosFinais: number;
    eja: number;
  };
  matriculaDetalhada: MatriculaDetalhada; // Novo campo para a tabela detalhada
  turmas: {
    manha: number;
    tarde: number;
    noite: number;
  };
  fluxo: {
    reprovacao: number; // %
    abandono: number; // %
    distorcaoIdadeSerie: number; // %
  };
  avaliacoesExternas: {
    saeb: number;
    seama: number;
    ideb: number;
  };
  resultadosCNCA: {
    diagnostica: number; // % ou nota média
    formativa: number;
    somativa: number;
  };
  fluenciaLeitoraDetalhada: {
    samahc: number; // % Leitor Fluente
    caed: number; // % Leitor Fluente
    parc: number; // % Fluência PARC
  };
  dadosSamahc: {
    simuladoSeama: number;
    simuladoSaeb: number;
    fluencia: number;
    linguaPortuguesa: number;
    matematica: number;
  };
  censoEscolar: {
    matriculaTotal: number;
    docentes: number;
    turmas: number;
  };
  relatorioEI: {
    desenvolvimento: number; // %
  };
  registrosFluenciaParc?: RegistroFluenciaPARC[]; // Persistência via JSON
  registrosCNCA?: RegistroCNCA[]; // Persistência via JSON
  registrosSEAMA?: RegistroSEAMA[]; // Persistência via JSON
  registrosSAEB?: RegistroSAEB[]; // Persistência via JSON
  registrosIDEB?: RegistroIDEB[]; // Persistência via JSON
}

export interface MetaAcao {
  id: string;
  descricao: string; // Ex: "Alfabetizar todas as crianças até o 2º ano"
  prazo: string;
  status: StatusMeta;
  responsavel: string;
}

// Interface para Recursos Humanos
export interface RecursoHumano {
  id: string;
  funcao: string; // Professor, Gestor, Coordenador, etc.
  nome: string;
  telefone: string;
  email: string;
  dataNomeacao: string;
  tipoVinculo: 'Efetivo' | 'Contratado';
  // Campos condicionais para Professores
  etapaAtuacao?: 'Educação Infantil' | 'Anos Iniciais' | 'Anos Finais' | 'EJA' | 'Sala de Recurso' | 'Outros';
  componenteCurricular?: 'Língua Portuguesa' | 'Matemática' | 'Geografia' | 'História' | 'Ciências' | 'Educação Física' | 'Língua Inglesa' | 'Arte' | 'Ensino Religioso' | '';
}

// Interface para Acompanhamento Mensal
export type StatusAcompanhamento = 'Sim' | 'Não' | 'Parcialmente' | null;

export interface ItemAcompanhamento {
  id: string;
  pergunta: string;
  categoria: 'Gestão' | 'Financeiro';
  resposta: StatusAcompanhamento;
  observacao: string;
}

// Nova Interface para Relatório de Visita
export interface RelatorioVisita {
  id: string;
  data: string;
  topicosPauta: string[];
  encaminhamentos: string;
  prazo: string;
  observacoes: string;
}

// Interface para Tópicos da Pauta (Nova Visita)
export interface TopicoPauta {
  id: string;
  descricao: string;
  categoria: 'Pedagógico' | 'Administrativo' | 'Financeiro' | 'Infraestrutura' | 'Relacionamento' | 'Outros';
  observacoes: string;
}

// Interface para Encaminhamentos da Visita (Nova Visita)
export interface EncaminhamentoVisita {
  id: string;
  descricao: string;
  responsavel: string;
  status: 'Pendente' | 'Em Execução' | 'Concluído';
  prazo: string;
}

// Interface para Registro de Fluência PARC
export interface RegistroFluenciaPARC {
  id: string;
  escolaId: string;
  polo: string;
  ano: number;
  edicao: 'Entrada' | 'Saída';
  etapaAplicacao: string;
  tipoTurma: 'Regular' | 'Multisseriada';
  turma: {
    nome: string;
    anoSerie: string;
  };
  participacao: {
    matriculados: number;
    presentes: number;
  };
  classificacao: {
    preLeitorNivel1: number;
    preLeitorNivel2: number;
    preLeitorNivel3: number;
    preLeitorNivel4: number;
    leitorIniciante: number;
    leitorFluente: number;
  };
  dataRegistro: string;
  responsavel: string;
}

// Interface para Registro de CNCA/PNRA
export interface RegistroCNCA {
  id: string;
  escolaId: string;
  ano: number;
  tipoAvaliacao: 'Diagnóstica' | 'Formativa' | 'Somativa';
  componenteCurricular: 'Língua Portuguesa' | 'Matemática';
  anoSerie: '1º ANO' | '2º ANO' | '3º ANO' | '4º ANO' | '5º ANO' | '6º ANO' | '7º ANO' | '8º ANO' | '9º ANO';
  tipoTurma: 'Regular' | 'Multiseriada';
  estudantesAvaliados: number;
  estudantesPrevistos: number;
  defasagem: number;
  aprendizadoIntermediario: number;
  aprendizadoAdequado: number;
  dataRegistro: string;
  responsavel: string;
}

// Interface para Registro de SEAMA
export interface RegistroSEAMA {
  id: string;
  escolaId: string;
  ano: number;
  tipoAvaliacao: 'SEAMA'; // Mantendo padrão apesar de ser avaliação única anual ou periódica
  componenteCurricular: 'Língua Portuguesa' | 'Matemática';
  anoSerie: '2º ANO' | '5º ANO' | '9º ANO'; // Séries comuns do SEAMA
  estudantesAvaliados: number;
  estudantesPrevistos: number;
  abaixoBasico: number; // %
  basico: number; // %
  adequado: number; // %
  avançado: number; // %
  proficienciaMedia?: number; // Valor numérico da proficiência média
  dataRegistro: string;
  responsavel: string;
}

// Interface para Registro de SAEB
export interface RegistroSAEB {
  id: string;
  escolaId: string;
  ano: number;
  tipoAvaliacao: 'SAEB';
  componenteCurricular: 'Língua Portuguesa' | 'Matemática';
  anoSerie: '2º ANO' | '5º ANO' | '9º ANO';
  estudantesAvaliados: number;
  estudantesPrevistos: number;
  insuficiente: number; // % (Equivalente ao Abaixo do Básico no SEAMA)
  basico: number; // %
  proficiente: number; // % (Equivalente ao Adequado no SEAMA)
  avançado: number; // %
  proficienciaMedia?: number;
  proficienciaLp?: number;
  proficienciaMat?: number;
  notaPadronizadaLp?: number;
  notaPadronizadaMat?: number;
  notaSaeb?: number;
  dataRegistro: string;
  responsavel: string;
}

// Interface para Registro de IDEB
export interface RegistroIDEB {
  id: string;
  escolaId: string;
  ano: number;
  anosIniciais: number; // Nota 5º Ano
  anosFinais: number; // Nota 9º Ano
  dataRegistro: string;
  responsavel: string;
}

export interface Escola {
  id: string;
  nome: string;
  gestor: string;
  coordenador: string; // Nome do coordenador local
  segmentos: Segmento[];
  alunosMatriculados: number;
  indicadores: Indicadores;
  dadosEducacionais: DadosEducacionais; // Novo campo
  planoAcao: MetaAcao[];
  recursosHumanos: RecursoHumano[]; // Novo campo RH
  acompanhamentoMensal: ItemAcompanhamento[]; // Novo campo Acompanhamento
  relatoriosVisita?: RelatorioVisita[]; // Novo campo Relatórios Específicos
  localizacao: string; // Sede ou Zona Rural
}

export interface Coordenador {
  id: string;
  nome: string;
  contato: string; // Utilizado como E-mail principal/Autenticação
  regiao: string; // Ex: "Regional Sede", "Regional Litoral"
  funcao?: 'Coordenador Regional' | 'Administrador' | 'Técnico'; // Papel no sistema
  escolasIds: string[]; // Vínculo com escolas
}

export interface Visita {
  id: string;
  escolaId: string;
  escolaNome: string;
  data: string;
  tipo: 'Rotina' | 'Emergencial' | 'Temática';
  foco: string[]; // Ex: "Planejamento", "Infraestrutura", "Sala de Aula"
  topicosPauta: TopicoPauta[]; // Adicionado anteriormente
  encaminhamentosRegistrados: EncaminhamentoVisita[]; // Novo campo para lista estruturada
  observacoes: string;
  encaminhamentos: string; // Texto geral de feedback/conclusão
  status: 'Planejada' | 'Realizada' | 'Relatório Pendente';
}

export type ViewState = 'DASHBOARD' | 'LISTA_ESCOLAS' | 'DETALHE_ESCOLA' | 'NOVA_VISITA' | 'COORDENADORES' | 'RELATORIOS' | 'INDICADORES' | 'ANALISE_PARC' | 'ANALISE_CNCA_PNRA' | 'ANALISE_SEAMA' | 'ANALISE_SAEB' | 'NOTIFICACOES';

export type PendencyType = 'MATRICULA' | 'TURMAS' | 'RH' | 'MONITORAMENTO' | 'PLANO_ACAO';
