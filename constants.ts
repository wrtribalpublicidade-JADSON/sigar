import { Escola, Visita, Segmento, StatusMeta, Coordenador, DadosNivel, MatriculaDetalhada, ItemAcompanhamento } from './types';

// Helper para criar dados vazios
const createEmptyNivel = (): DadosNivel => ({
  turmas: { integral: 0, manha: 0, tarde: 0 },
  alunos: { integral: 0, manha: 0, tarde: 0 }
});

const createEmptyMatriculaDetalhada = (): MatriculaDetalhada => ({
  infantil: {
    creche2: createEmptyNivel(),
    creche3: createEmptyNivel(),
    pre1: createEmptyNivel(),
    pre2: createEmptyNivel(),
  },
  fundamental: {
    ano1: createEmptyNivel(),
    ano2: createEmptyNivel(),
    ano3: createEmptyNivel(),
    ano4: createEmptyNivel(),
    ano5: createEmptyNivel(),
    ano6: createEmptyNivel(),
    ano7: createEmptyNivel(),
    ano8: createEmptyNivel(),
    ano9: createEmptyNivel(),
    eja: createEmptyNivel(),
  }
});

// Perguntas de Gestão Escolar
const PERGUNTAS_GESTAO = [
  "O(a) gestor(a)/coordenador(a) está presente na escola no acolhimento dos alunos/comunidade?",
  "O ambiente escolar é favorável à aprendizagem (acolhida dos alunos, engajamento dos professores, clima harmonioso)?",
  "A escola realizou a eleição para líderes de turmas, conforme orientado pela Secretaria Municipal de Educação?",
  "Os instrumentais de conselho de classe são utilizados conforme orientações da Secretaria Municipal de Educação?",
  "Os líderes de turma participam das reuniões do conselho de classe?",
  "O conselho de classe acontece de forma bimestral conforme orientações da Secretaria Municipal de Educação?",
  "O Regimento Interno das Escolas Municipais foi apresentado à comunidade escolar?",
  "As atribuições de cada servidor estão claramente definidas?",
  "A gestão acompanha diariamente a frequência dos alunos?",
  "Houve o cumprimento dos dias letivos e carga horária previstas para o mês em curso? (verificar através do calendário letivo)",
  "O dia letivo começa no horário previsto?",
  "As crianças/adolescentes lancham na hora do recreio?",
  "O tempo usado para recreio está conforme o estipulado pela secretaria?",
  "A aula termina exatamente no horário previsto?",
  "A escola construiu o seu plano de ação?",
  "O plano de ação da escola está sendo cumprido?",
  "O(a) gestor(a) tem uma pasta com todos os indicadores de aprendizagem da escola e a atualiza frequentemente?",
  "A gestão acompanha/compreende os resultados por turma e por aluno?",
  "A gestão acompanha o trabalho do coordenador pedagógico em relação ao planejamento dos professores?",
  "O núcleo gestor visita sistematicamente a sala de aula?",
  "A Unidade Escolar efetuou o compartilhamento dos planos anuais e guias de aprendizagem no drive?",
  "O ciclo de reuniões acontece conforme orientações do caderno de orientações pedagógicas?",
  "O Coordenador Pedagógico dar devolutiva do Plano Anual e Guia de Aprendizagem aos professores?",
  "O(a) gestor(a) elabora junto com o coordenador estratégias de intervenção com base nos resultados da escola?",
  "O núcleo gestor conhece o material estruturado e/ou de apoio utilizado em sala de aula?",
  "O núcleo gestor conhece a rotina utilizada pelos professores em sala de aula?",
  "Os professores participam regular e ativamente das formações?",
  "O professor faz uso do material didático estruturado?",
  "A sala de aula apresenta um ambiente favorável à aprendizagem?",
  "O professor promove situações de leitura?",
  "Os alunos demonstram envolvimento durante a aula?",
  "A escola promove recuperação paralela de acordo com o caderno de orientações pedagógicas?",
  "A escola desenvolve estratégias de reforço escolar?",
  "As avaliações do SAMAHC estão sendo realizadas pela escola?",
  "A escola reflete/analisa sistematicamente as avaliações (externas e internas), bem como os resultados dos indicadores, propondo intervenções quando necessário?",
  "A escola divulga os resultados das avaliações (internas e externas) à comunidade escolar e local?",
  "A escola dá uma atenção especial à política de alfabetização dos alunos?",
  "A escola coordena a definição metas de aprendizagem para a gestão/coordenação/professores?",
  "A escola tenta lotar os professores de acordo com seu perfil e habilidades para adequá-los às necessidades das turmas?",
  "O núcleo gestor tem atenção para implementar os encaminhamentos/combinados sugeridos e acordados com o coordenador regional?"
];

// Perguntas Financeiras
const PERGUNTAS_FINANCEIRO = [
  "A escola prioriza a aquisição de insumos e bens para apoiar na aprendizagem dos alunos?",
  "A escola identifica suas prioridades de forma participativa?",
  "Apresenta pleno conhecimento das especificidades dos programas financeiros que assistem à escola?",
  "A escola cumpre com os prazos estabelecidos no que concerne à utilização/prestação de contas dos recursos?",
  "Controla de forma eficiente o consumo dos materiais adquiridos pela escola?",
  "Publiciza a prestação de contas para toda a comunidade?"
];

export const generateAcompanhamentoMensal = (): ItemAcompanhamento[] => {
  const itensGestao: ItemAcompanhamento[] = PERGUNTAS_GESTAO.map((pergunta, index) => ({
    id: `g-${index}-${Date.now()}`,
    pergunta,
    categoria: 'Gestão',
    resposta: null,
    observacao: ''
  }));

  const itensFinanceiro: ItemAcompanhamento[] = PERGUNTAS_FINANCEIRO.map((pergunta, index) => ({
    id: `f-${index}-${Date.now()}`,
    pergunta,
    categoria: 'Financeiro',
    resposta: null,
    observacao: ''
  }));

  return [...itensGestao, ...itensFinanceiro];
};

const createMockMatricula = (baseAlunos: number): MatriculaDetalhada => {
  const data = createEmptyMatriculaDetalhada();
  data.fundamental.ano1.turmas = { integral: 0, manha: 2, tarde: 1 };
  data.fundamental.ano1.alunos = { integral: 0, manha: 50, tarde: 25 };
  data.fundamental.ano5.turmas = { integral: 0, manha: 1, tarde: 1 };
  data.fundamental.ano5.alunos = { integral: 0, manha: 30, tarde: 25 };
  return data;
};

export const ESCOLAS_MOCK: Escola[] = [
  {
    id: '1',
    nome: 'U.E. Humberto de Campos - Sede',
    gestor: 'Maria da Silva',
    coordenador: 'João Souza',
    segmentos: [Segmento.FUNDAMENTAL_I, Segmento.FUNDAMENTAL_II],
    alunosMatriculados: 450,
    localizacao: 'Sede',
    indicadores: { ideb: 4.8, frequenciaMedia: 85, fluenciaLeitora: 62, taxaAprovacao: 92 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 250, anosFinais: 200, eja: 0 },
      matriculaDetalhada: createMockMatricula(450),
      turmas: { manha: 8, tarde: 8, noite: 0 },
      fluxo: { reprovacao: 5.2, abandono: 2.1, distorcaoIdadeSerie: 12.5 },
      avaliacoesExternas: { saeb: 5.1, seama: 4.9, ideb: 4.8 },
      resultadosCNCA: { diagnostica: 65, formativa: 70, somativa: 72 },
      fluenciaLeitoraDetalhada: { samahc: 60, caed: 62, parc: 72.5 },
      dadosSamahc: { simuladoSeama: 55, simuladoSaeb: 52, fluencia: 60, linguaPortuguesa: 58, matematica: 50 },
      censoEscolar: { matriculaTotal: 450, docentes: 22, turmas: 16 },
      relatorioEI: { desenvolvimento: 0 },
      registrosFluenciaParc: [],
      registrosCNCA: [
        {
          id: 'cnca-1-1', escolaId: '1', ano: 2026, tipoAvaliacao: 'Diagnóstica',
          componenteCurricular: 'Língua Portuguesa', anoSerie: '2º ANO', tipoTurma: 'Regular',
          estudantesAvaliados: 38, estudantesPrevistos: 40, defasagem: 20, aprendizadoIntermediario: 30, aprendizadoAdequado: 50,
          dataRegistro: '2026-02-10', responsavel: 'Fernanda Oliveira'
        },
        {
          id: 'cnca-1-2', escolaId: '1', ano: 2026, tipoAvaliacao: 'Diagnóstica',
          componenteCurricular: 'Matemática', anoSerie: '2º ANO', tipoTurma: 'Regular',
          estudantesAvaliados: 38, estudantesPrevistos: 40, defasagem: 25, aprendizadoIntermediario: 35, aprendizadoAdequado: 40,
          dataRegistro: '2026-02-10', responsavel: 'Fernanda Oliveira'
        }
      ],
      registrosSEAMA: [
        {
          id: 'seama-1-1', escolaId: '1', ano: 2025, tipoAvaliacao: 'SEAMA',
          componenteCurricular: 'Língua Portuguesa', anoSerie: '2º ANO',
          estudantesAvaliados: 42, estudantesPrevistos: 45,
          abaixoBasico: 15, basico: 25, adequado: 40, avançado: 20,
          dataRegistro: '2025-11-15', responsavel: 'SME'
        }
      ],
      registrosSAEB: [
        {
          id: 'saeb-1-1', escolaId: '1', ano: 2023, tipoAvaliacao: 'SAEB',
          componenteCurricular: 'Língua Portuguesa', anoSerie: '5º ANO',
          estudantesAvaliados: 35, estudantesPrevistos: 38,
          insuficiente: 10, basico: 30, proficiente: 40, avançado: 20,
          proficienciaMedia: 215.5, dataRegistro: '2023-10-20', responsavel: 'INEP'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '2',
    nome: 'Escola Municipal Rural São José',
    gestor: 'Carlos Alberto',
    coordenador: 'Ana Pereira',
    segmentos: [Segmento.INFANTIL, Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 120,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 3.9, frequenciaMedia: 78, fluenciaLeitora: 45, taxaAprovacao: 88 },
    dadosEducacionais: {
      matricula: { infantil: 40, anosIniciais: 80, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 4, tarde: 2, noite: 0 },
      fluxo: { reprovacao: 8.5, abandono: 0.5, distorcaoIdadeSerie: 18.0 },
      avaliacoesExternas: { saeb: 4.2, seama: 4.0, ideb: 3.9 },
      resultadosCNCA: { diagnostica: 50, formativa: 55, somativa: 58 },
      fluenciaLeitoraDetalhada: { samahc: 42, caed: 45, parc: 55.0 },
      dadosSamahc: { simuladoSeama: 38, simuladoSaeb: 35, fluencia: 42, linguaPortuguesa: 40, matematica: 32 },
      censoEscolar: { matriculaTotal: 120, docentes: 8, turmas: 6 },
      relatorioEI: { desenvolvimento: 82 },
      registrosFluenciaParc: [],
      registrosCNCA: [
        {
          id: 'cnca-2-1', escolaId: '2', ano: 2026, tipoAvaliacao: 'Diagnóstica',
          componenteCurricular: 'Língua Portuguesa', anoSerie: '1º ANO', tipoTurma: 'Multiseriada',
          estudantesAvaliados: 18, estudantesPrevistos: 20, defasagem: 40, aprendizadoIntermediario: 40, aprendizadoAdequado: 20,
          dataRegistro: '2026-02-12', responsavel: 'Roberto Mendes'
        }
      ],
      registrosSEAMA: [
        {
          id: 'seama-2-1', escolaId: '2', ano: 2025, tipoAvaliacao: 'SEAMA',
          componenteCurricular: 'Matemática', anoSerie: '5º ANO',
          estudantesAvaliados: 15, estudantesPrevistos: 18,
          abaixoBasico: 30, basico: 40, adequado: 25, avançado: 5,
          dataRegistro: '2025-11-16', responsavel: 'SME'
        }
      ],
      registrosSAEB: [
        {
          id: 'saeb-2-1', escolaId: '2', ano: 2023, tipoAvaliacao: 'SAEB',
          componenteCurricular: 'Matemática', anoSerie: '5º ANO',
          estudantesAvaliados: 12, estudantesPrevistos: 15,
          insuficiente: 25, basico: 45, proficiente: 25, avançado: 5,
          proficienciaMedia: 195.2, dataRegistro: '2023-10-21', responsavel: 'INEP'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '4',
    nome: 'U.E. Joaquim Prata',
    gestor: 'Luciano Neves',
    coordenador: 'Fernanda Oliveira',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 180,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 4.2, frequenciaMedia: 88, fluenciaLeitora: 55, taxaAprovacao: 90 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 180, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 4, tarde: 3, noite: 0 },
      fluxo: { reprovacao: 4, abandono: 1, distorcaoIdadeSerie: 10 },
      avaliacoesExternas: { saeb: 4.5, seama: 4.3, ideb: 4.2 },
      resultadosCNCA: { diagnostica: 58, formativa: 62, somativa: 65 },
      fluenciaLeitoraDetalhada: { samahc: 50, caed: 52, parc: 68.0 },
      dadosSamahc: { simuladoSeama: 48, simuladoSaeb: 45, fluencia: 52, linguaPortuguesa: 50, matematica: 45 },
      censoEscolar: { matriculaTotal: 180, docentes: 10, turmas: 7 },
      relatorioEI: { desenvolvimento: 0 },
      registrosFluenciaParc: [
        {
          id: 'parc-4-e', escolaId: '4', polo: '03 - PRATA', ano: 2024, edicao: 'Entrada', etapaAplicacao: 'Entrada / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano A', anoSerie: '2º Ano' }, participacao: { matriculados: 25, presentes: 25 },
          classificacao: { preLeitorNivel1: 5, preLeitorNivel2: 5, preLeitorNivel3: 5, preLeitorNivel4: 5, leitorIniciante: 5, leitorFluente: 0 },
          dataRegistro: '2024-02-20', responsavel: 'Fernanda Oliveira'
        },
        {
          id: 'parc-4-s', escolaId: '4', polo: '03 - PRATA', ano: 2024, edicao: 'Saída', etapaAplicacao: 'Saída / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano A', anoSerie: '2º Ano' }, participacao: { matriculados: 25, presentes: 25 },
          classificacao: { preLeitorNivel1: 0, preLeitorNivel2: 1, preLeitorNivel3: 2, preLeitorNivel4: 5, leitorIniciante: 12, leitorFluente: 5 },
          dataRegistro: '2024-11-25', responsavel: 'Fernanda Oliveira'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '5',
    nome: 'Escola Municipal Rampa Viva',
    gestor: 'Sonia Guimarães',
    coordenador: 'Roberto Mendes',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 150,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 4.0, frequenciaMedia: 82, fluenciaLeitora: 48, taxaAprovacao: 85 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 150, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 3, tarde: 3, noite: 0 },
      fluxo: { reprovacao: 6, abandono: 2, distorcaoIdadeSerie: 15 },
      avaliacoesExternas: { saeb: 4.1, seama: 3.8, ideb: 4.0 },
      resultadosCNCA: { diagnostica: 45, formativa: 50, somativa: 55 },
      fluenciaLeitoraDetalhada: { samahc: 40, caed: 42, parc: 60.0 },
      dadosSamahc: { simuladoSeama: 40, simuladoSaeb: 38, fluencia: 45, linguaPortuguesa: 42, matematica: 38 },
      censoEscolar: { matriculaTotal: 150, docentes: 9, turmas: 6 },
      relatorioEI: { desenvolvimento: 0 },
      registrosFluenciaParc: [
        {
          id: 'parc-5-e', escolaId: '5', polo: '05 - RAMPA', ano: 2024, edicao: 'Entrada', etapaAplicacao: 'Entrada / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 20, presentes: 20 },
          classificacao: { preLeitorNivel1: 12, preLeitorNivel2: 4, preLeitorNivel3: 2, preLeitorNivel4: 1, leitorIniciante: 1, leitorFluente: 0 },
          dataRegistro: '2024-02-22', responsavel: 'Roberto Mendes'
        },
        {
          id: 'parc-5-s', escolaId: '5', polo: '05 - RAMPA', ano: 2024, edicao: 'Saída', etapaAplicacao: 'Saída / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 20, presentes: 20 },
          classificacao: { preLeitorNivel1: 2, preLeitorNivel2: 3, preLeitorNivel3: 5, preLeitorNivel4: 4, leitorIniciante: 4, leitorFluente: 2 },
          dataRegistro: '2024-11-28', responsavel: 'Roberto Mendes'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '6',
    nome: 'Escola Municipal Santa Lúcia',
    gestor: 'Marta Ribeiro',
    coordenador: 'Fernanda Oliveira',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 140,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 4.1, frequenciaMedia: 84, fluenciaLeitora: 50, taxaAprovacao: 88 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 140, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 3, tarde: 3, noite: 0 },
      fluxo: { reprovacao: 5, abandono: 1.5, distorcaoIdadeSerie: 12 },
      avaliacoesExternas: { saeb: 4.3, seama: 4.1, ideb: 4.1 },
      resultadosCNCA: { diagnostica: 52, formativa: 58, somativa: 61 },
      fluenciaLeitoraDetalhada: { samahc: 45, caed: 48, parc: 65.0 },
      dadosSamahc: { simuladoSeama: 42, simuladoSaeb: 40, fluencia: 48, linguaPortuguesa: 45, matematica: 40 },
      censoEscolar: { matriculaTotal: 140, docentes: 8, turmas: 6 },
      relatorioEI: { desenvolvimento: 0 },
      registrosFluenciaParc: [
        {
          id: 'parc-6-e', escolaId: '6', polo: '04 - SERRARIA', ano: 2024, edicao: 'Entrada', etapaAplicacao: 'Entrada / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano A', anoSerie: '2º Ano' }, participacao: { matriculados: 18, presentes: 18 },
          classificacao: { preLeitorNivel1: 8, preLeitorNivel2: 4, preLeitorNivel3: 3, preLeitorNivel4: 2, leitorIniciante: 1, leitorFluente: 0 },
          dataRegistro: '2024-02-24', responsavel: 'Fernanda Oliveira'
        },
        {
          id: 'parc-6-s', escolaId: '6', polo: '04 - SERRARIA', ano: 2024, edicao: 'Saída', etapaAplicacao: 'Saída / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano A', anoSerie: '2º Ano' }, participacao: { matriculados: 18, presentes: 18 },
          classificacao: { preLeitorNivel1: 1, preLeitorNivel2: 2, preLeitorNivel3: 4, preLeitorNivel4: 4, leitorIniciante: 4, leitorFluente: 3 },
          dataRegistro: '2024-11-30', responsavel: 'Fernanda Oliveira'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '7',
    nome: 'U.E. Bom Jesus Grande',
    gestor: 'Antônio Ferreira',
    coordenador: 'Roberto Mendes',
    segmentos: [Segmento.INFANTIL, Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 110,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 3.8, frequenciaMedia: 75, fluenciaLeitora: 42, taxaAprovacao: 82 },
    dadosEducacionais: {
      matricula: { infantil: 30, anosIniciais: 80, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 3, tarde: 2, noite: 0 },
      fluxo: { reprovacao: 9, abandono: 3, distorcaoIdadeSerie: 20 },
      avaliacoesExternas: { saeb: 3.9, seama: 3.6, ideb: 3.8 },
      resultadosCNCA: { diagnostica: 40, formativa: 45, somativa: 48 },
      fluenciaLeitoraDetalhada: { samahc: 35, caed: 38, parc: 50.0 },
      dadosSamahc: { simuladoSeama: 32, simuladoSaeb: 30, fluencia: 35, linguaPortuguesa: 38, matematica: 30 },
      censoEscolar: { matriculaTotal: 110, docentes: 7, turmas: 5 },
      relatorioEI: { desenvolvimento: 75 },
      registrosFluenciaParc: [
        {
          id: 'parc-7-e', escolaId: '7', polo: '02 - BOM JESUS', ano: 2024, edicao: 'Entrada', etapaAplicacao: 'Entrada / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 15, presentes: 15 },
          classificacao: { preLeitorNivel1: 2, preLeitorNivel2: 1, preLeitorNivel3: 5, preLeitorNivel4: 5, leitorIniciante: 2, leitorFluente: 0 },
          dataRegistro: '2024-02-26', responsavel: 'Roberto Mendes'
        },
        {
          id: 'parc-7-s', escolaId: '7', polo: '02 - BOM JESUS', ano: 2024, edicao: 'Saída', etapaAplicacao: 'Saída / 2024', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 15, presentes: 15 },
          classificacao: { preLeitorNivel1: 1, preLeitorNivel2: 1, preLeitorNivel3: 2, preLeitorNivel4: 4, leitorIniciante: 4, leitorFluente: 3 },
          dataRegistro: '2024-12-05', responsavel: 'Roberto Mendes'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '8',
    nome: 'U.E. Zilda Maria',
    gestor: 'Alice Martins',
    coordenador: 'João Souza',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 200,
    localizacao: 'Sede',
    indicadores: { ideb: 5.5, frequenciaMedia: 95, fluenciaLeitora: 85, taxaAprovacao: 98 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 200, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createMockMatricula(200),
      turmas: { manha: 5, tarde: 5, noite: 0 },
      fluxo: { reprovacao: 1, abandono: 0, distorcaoIdadeSerie: 5 },
      avaliacoesExternas: { saeb: 6.0, seama: 5.8, ideb: 5.5 },
      resultadosCNCA: { diagnostica: 80, formativa: 85, somativa: 90 },
      fluenciaLeitoraDetalhada: { samahc: 82, caed: 85, parc: 88.0 },
      dadosSamahc: { simuladoSeama: 75, simuladoSaeb: 72, fluencia: 80, linguaPortuguesa: 78, matematica: 70 },
      censoEscolar: { matriculaTotal: 200, docentes: 12, turmas: 10 },
      relatorioEI: { desenvolvimento: 0 },
      registrosSAEB: [
        {
          id: 'saeb-8-2023', escolaId: '8', ano: 2023, tipoAvaliacao: 'SAEB', componenteCurricular: 'Língua Portuguesa',
          anoSerie: '5º ANO', estudantesAvaliados: 30, estudantesPrevistos: 30,
          proficienciaLp: 280, proficienciaMat: 295, notaPadronizadaLp: 8.4, notaPadronizadaMat: 8.8,
          notaSaeb: 8.6, insuficiente: 5, basico: 15, proficiente: 40, avançado: 40,
          proficienciaMedia: 287.5,
          dataRegistro: '2023-11-20', responsavel: 'Alice Martins'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '9',
    nome: 'U.E. Antônio Garcia',
    gestor: 'Marcos Silva',
    coordenador: 'Fernanda Oliveira',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 160,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 4.5, frequenciaMedia: 88, fluenciaLeitora: 60, taxaAprovacao: 92 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 160, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 4, tarde: 4, noite: 0 },
      fluxo: { reprovacao: 4, abandono: 1, distorcaoIdadeSerie: 10 },
      avaliacoesExternas: { saeb: 4.8, seama: 4.6, ideb: 4.5 },
      resultadosCNCA: { diagnostica: 60, formativa: 65, somativa: 68 },
      fluenciaLeitoraDetalhada: { samahc: 58, caed: 60, parc: 70.0 },
      dadosSamahc: { simuladoSeama: 55, simuladoSaeb: 52, fluencia: 58, linguaPortuguesa: 55, matematica: 48 },
      censoEscolar: { matriculaTotal: 160, docentes: 9, turmas: 8 },
      relatorioEI: { desenvolvimento: 0 },
      registrosSAEB: [
        {
          id: 'saeb-9-2023', escolaId: '9', ano: 2023, tipoAvaliacao: 'SAEB', componenteCurricular: 'Língua Portuguesa',
          anoSerie: '9º ANO', estudantesAvaliados: 35, estudantesPrevistos: 40,
          proficienciaLp: 245, proficienciaMat: 260, notaPadronizadaLp: 4.8, notaPadronizadaMat: 5.3,
          notaSaeb: 5.05, insuficiente: 30, basico: 40, proficiente: 20, avançado: 10,
          proficienciaMedia: 252.5,
          dataRegistro: '2023-11-20', responsavel: 'Marcos Silva'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  },
  {
    id: '10',
    nome: 'U.E. Dulce Lopes',
    gestor: 'Regina Célia',
    coordenador: 'Roberto Mendes',
    segmentos: [Segmento.FUNDAMENTAL_I],
    alunosMatriculados: 130,
    localizacao: 'Zona Rural',
    indicadores: { ideb: 3.5, frequenciaMedia: 80, fluenciaLeitora: 35, taxaAprovacao: 80 },
    dadosEducacionais: {
      matricula: { infantil: 0, anosIniciais: 130, anosFinais: 0, eja: 0 },
      matriculaDetalhada: createEmptyMatriculaDetalhada(),
      turmas: { manha: 3, tarde: 3, noite: 0 },
      fluxo: { reprovacao: 10, abandono: 5, distorcaoIdadeSerie: 25 },
      avaliacoesExternas: { saeb: 3.8, seama: 3.5, ideb: 3.5 },
      resultadosCNCA: { diagnostica: 35, formativa: 40, somativa: 42 },
      fluenciaLeitoraDetalhada: { samahc: 32, caed: 35, parc: 45.0 },
      dadosSamahc: { simuladoSeama: 30, simuladoSaeb: 28, fluencia: 32, linguaPortuguesa: 30, matematica: 25 },
      censoEscolar: { matriculaTotal: 130, docentes: 7, turmas: 6 },
      relatorioEI: { desenvolvimento: 0 },
      registrosFluenciaParc: [
        {
          id: 'parc-10-e', escolaId: '10', polo: '05 - RAMPA', ano: 2025, edicao: 'Entrada', etapaAplicacao: 'Entrada / 2025', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 22, presentes: 20 },
          classificacao: { preLeitorNivel1: 10, preLeitorNivel2: 5, preLeitorNivel3: 3, preLeitorNivel4: 2, leitorIniciante: 0, leitorFluente: 0 },
          dataRegistro: '2025-02-20', responsavel: 'Roberto Mendes'
        },
        {
          id: 'parc-10-s', escolaId: '10', polo: '05 - RAMPA', ano: 2025, edicao: 'Saída', etapaAplicacao: 'Saída / 2025', tipoTurma: 'Regular',
          turma: { nome: '2º Ano Único', anoSerie: '2º Ano' }, participacao: { matriculados: 22, presentes: 22 },
          classificacao: { preLeitorNivel1: 2, preLeitorNivel2: 4, preLeitorNivel3: 6, preLeitorNivel4: 5, leitorIniciante: 4, leitorFluente: 1 },
          dataRegistro: '2025-11-25', responsavel: 'Roberto Mendes'
        }
      ]
    },
    planoAcao: [],
    recursosHumanos: [],
    acompanhamentoMensal: generateAcompanhamentoMensal(),
    relatoriosVisita: []
  }
];

export const COORDENADORES_MOCK: Coordenador[] = [
  {
    id: 'c1',
    nome: 'Fernanda Oliveira',
    contato: 'fernanda@educacao.gov.br',
    regiao: 'Regional Sede & Serraria',
    funcao: 'Coordenador Regional',
    escolasIds: ['1', '4', '6']
  },
  {
    id: 'c2',
    nome: 'Roberto Mendes',
    contato: 'roberto@educacao.gov.br',
    regiao: 'Regional Zona Rural',
    funcao: 'Coordenador Regional',
    escolasIds: ['2', '5', '7']
  }
];

export const VISITAS_MOCK: Visita[] = [
  {
    id: 'v1',
    escolaId: '1',
    escolaNome: 'U.E. Humberto de Campos - Sede',
    data: '2024-03-10',
    tipo: 'Rotina',
    foco: ['Planejamento', 'Sala de Aula'],
    topicosPauta: [
      {
        id: 't1',
        descricao: 'Análise dos diários de classe',
        categoria: 'Pedagógico',
        observacoes: 'Verificar preenchimento'
      }
    ],
    encaminhamentosRegistrados: [
      {
        id: 'e1',
        descricao: 'Atualizar diários de classe da turma 3º ano B',
        responsavel: 'Coordenador Pedagógico',
        status: 'Pendente',
        prazo: '2024-03-20'
      }
    ],
    observacoes: 'Professores do 3º ano com dificuldades na gestão de tempo. Planejamento alinhado à BNCC.',
    encaminhamentos: 'Agendar oficina de gestão de tempo.',
    status: 'Realizada'
  },
  {
    id: 'v2',
    escolaId: '2',
    escolaNome: 'Escola Municipal Rural São José',
    data: '2024-03-12',
    tipo: 'Emergencial',
    foco: ['Infraestrutura'],
    topicosPauta: [],
    encaminhamentosRegistrados: [],
    observacoes: 'Problema no abastecimento de água afetando a merenda.',
    encaminhamentos: 'Solicitado caminhão pipa à secretaria.',
    status: 'Relatório Pendente'
  }
];
