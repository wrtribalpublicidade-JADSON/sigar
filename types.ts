
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
  controleEdicoes?: Record<string, number>; // Novo campo de controle de edições meta
  registrosFluenciaParc?: RegistroFluenciaPARC[]; // Persistência via JSON
  registrosFluenciaSamahc?: RegistroFluenciaSAMAHC[]; // Persistência via Relacional
  registrosFluenciaSamahcAgregados?: RegistroFluenciaSamahcAgregado[]; // Novo JSON Agregado
  registrosCNCA?: RegistroCNCA[]; // Persistência via JSON
  registrosSEAMA?: RegistroSEAMA[]; // Persistência via JSON
  registrosSAEB?: RegistroSAEB[]; // Persistência via JSON
  registrosIDEB?: RegistroIDEB[]; // Persistência via JSON
}

// Interface para Registro de Fluência SAMAHC (Estudantil)
export interface RegistroFluenciaSAMAHC {
  id: string;
  escolaId: string;
  polo: string;
  ano: number;
  estudanteNome: string;
  anoSerie: string;
  nivelDesempenho: string;
  turno: string;
  tipoAvaliacao: 'DIAGNÓSTICA' | 'FORMATIVA' | 'SOMATIVA';
  turma: string;
  etapa: string;
  createdAt?: string;
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
  tipoVinculo: 'Efetivo' | 'Contratado' | 'Permutado';
  cargaHoraria?: '20h' | '25h' | '40h' | '';
  cpf?: string;
  dataNascimento?: string;
  // Campos condicionais para Professores
  etapaAtuacao?: 'Educação Infantil' | 'Anos Iniciais' | 'Anos Finais' | 'EJA' | 'Sala de Recurso' | 'Recomposição - Língua Portuguesa' | 'Recomposição - Matemática' | 'Outros';
  componenteCurricular?: 'Língua Portuguesa' | 'Matemática' | 'Geografia' | 'História' | 'Ciências' | 'Educação Física' | 'Língua Inglesa' | 'Arte' | 'Ensino Religioso' | '';
  modalidadeInfantil?: ('Creche' | 'Pré-Escola')[];
  anosIniciaisAtuacao?: ('1º ano' | '2º ano' | '3º ano' | '4º ano' | '5º ano')[];
}
 
 // Interface para Alunos
 export interface Aluno {
   id: number;
   name: string;
   birth_date?: string;
   cpf?: string;
   gender?: string;
   registration_number?: string;
   escola_id: string;
   class_id?: string;
   stage: string;
   status: 'Ativo' | 'Inativo' | 'Transferido' | 'Desistente';
   observations?: string;
   professor_responsavel?: string;
   ano_matricula?: number;
   created_at?: string;
 }
 
 // Interface para Transferência de Estudante
 export interface TransferenciaEstudante {
   id: string;
   aluno_id: number;
   aluno_nome: string;
   tipo: 'INTERNA' | 'EXTERNA';
   escola_origem_id: string;
   escola_origem_nome: string;
   turma_origem_id?: string;
   escola_destino_id?: string;
   escola_destino_nome?: string;
   turma_destino_id?: string;
   turma_destino_nome?: string;
   turno_destino?: string;
   escola_externa_nome?: string;
   status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'NEGADO';
   motivo?: string;
   motivo_resposta?: string;
   solicitado_por?: string;
   respondido_por?: string;
   created_at?: string;
   updated_at?: string;
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
  status: 'Pendente' | 'Em Execução' | 'Concluído' | 'Dentro do Prazo' | 'Atrasado' | 'Realizado';
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

// Interface para Registro Agregado de Fluência SAMAHC (Turma)
export interface RegistroFluenciaSamahcAgregado {
  id: string;
  escolaId: string;
  polo: string;
  ano: number;
  edicao: 'Entrada' | 'Saída' | 'Diagnóstica' | 'Formativa' | 'Somativa';
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
    leitorFluente: number;
    leitorIniciante: number;
    preLeitor: number;
    naoLeitor: number;
    naoAvaliado: number;
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
  turma?: string;
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
  polo?: string; // Polo da escola
  ofertaAtividadeComplementar: boolean;
  status: 'Ativo' | 'Inativo';
}

export interface Coordenador {
  id: string;
  nome: string;
  cpf?: string;
  contato: string; // Utilizado como E-mail principal/Autenticação
  regiao: string; // Ex: "Regional Sede", "Regional Litoral"
  funcao?: 'Administrador' | 'Coordenador Regional' | 'Gestor' | 'Coordenador Pedagógico' | 'Técnico' | 'Técnico Pedagógico' | 'Gestor Geral' | 'Gestor Pedagógico' | 'Professor' | 'Auxiliar Administrativo' | 'Monitor de Atividade Complementar'; // Papel no sistema
  status?: 'Ativo' | 'Inativo'; // Controle de acesso
  escolasIds: string[]; // Vínculo com escolas
  turmasIds?: string[]; // Vínculo com turmas
  turmaComponentes?: Record<string, string[]>; // Mapeamento turma_id -> componentes/campos de experiência
  created_at?: string;
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

export type ViewState = 'DASHBOARD' | 'LISTA_ESCOLAS' | 'DETALHE_ESCOLA' | 'NOVA_VISITA' | 'COORDENADORES' | 'RELATORIOS' | 'INDICADORES' | 'NOTIFICACOES' | 'AUDIT_LOGS' | 'GESTAO_USUARIOS' | 'INSTRUMENTAIS_GESTAO' | 'CONSELHO_CLASSE' | 'CONSELHO_CLASSE_FUNDAMENTAL' | 'CONSELHO_CLASSE_INFANTIL' | 'PERMISSOES' | 'ATIVIDADES_COMPLEMENTARES' | 'GESTAO_ESTUDANTES' | 'MERENDA_ESCOLAR' | 'PLANO_AULA' | 'AULAS_MINISTRADAS' | 'FREQUENCIA' | 'NOTAS' | 'PLANO_CURSO' | 'DIARIO_FUNDAMENTAL' | 'DIARIO_INFANTIL' | 'GESTAO_REDE' | 'SUPORTE_TECNICO';

export type PendencyType = 'MATRICULA' | 'TURMAS' | 'RH' | 'MONITORAMENTO' | 'PLANO_ACAO' | 'VISITA';

// Interfaces for Logs
export interface AccessLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: 'LOGIN' | 'LOGOUT';
  status: 'SUCCESS' | 'FAILURE';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: string;
  record_id?: string;
  details?: any;
  created_at: string;
}

// Interfaces para o Módulo de Suporte Técnico
export type StatusSuporte = 'Aberto' | 'Em Atendimento' | 'Resolvido' | 'Cancelado';
export type PrioridadeSuporte = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type CategoriaSuporte = 
  | 'Erro / Falha no Sistema'
  | 'Dúvidas de Uso'
  | 'Cadastro e Permissões'
  | 'Diário de Classe'
  | 'Matrículas e Alunos'
  | 'Sugestão / Melhoria'
  | 'Outros';

export interface MensagemSuporte {
  id: string;
  autor_nome: string;
  autor_email: string;
  autor_tipo: 'USUARIO' | 'ADMIN';
  mensagem: string;
  anexo_url?: string;
  created_at: string;
}

export interface ChamadoSuporte {
  id: string;
  protocolo: string;
  usuario_id?: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_funcao?: string;
  usuario_contato?: string;
  escola_id?: string;
  escola_nome?: string;
  categoria: CategoriaSuporte;
  prioridade: PrioridadeSuporte;
  assunto: string;
  descricao: string;
  status: StatusSuporte;
  atendente_nome?: string;
  resposta_admin?: string;
  mensagens: MensagemSuporte[];
  created_at: string;
  updated_at: string;
  resolvido_em?: string;
}

