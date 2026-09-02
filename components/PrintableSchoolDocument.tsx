import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Aluno } from '../types';

interface PrintableSchoolDocumentProps {
  documentType: 'notificacao_frequencia' | 'autorizacao_imagem' | 'declaracao_matricula' | 'declaracao_frequencia';
  student: Aluno | null;
  escolaNome: string;
  escolaGestor?: string;
  turmaNome?: string;
  turmaTurno?: string;
  data: {
    responsavelNome?: string;
    responsavelCpf?: string;
    responsavelEndereco?: string;
    responsavelTelefone?: string;
    frequenciaAtual?: number;
    totalFaltas?: number;
    totalAulas?: number;
    dataAtendimento?: string;
    horarioAtendimento?: string;
    anoLetivo?: string;
    finalidade?: string;
    anoSerieEtapa?: string;
    periodoApuracao?: string;
    observacoes?: string;
  };
  onClose: () => void;
}

export const PrintableSchoolDocument: React.FC<PrintableSchoolDocumentProps> = ({
  documentType,
  student,
  escolaNome,
  escolaGestor,
  turmaNome,
  turmaTurno,
  data,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  if (!student) return null;

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '___/___/_____';
    const clean = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr;
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  };

  const getDocTitle = () => {
    switch (documentType) {
      case 'notificacao_frequencia':
        return 'NOTIFICAÇÃO DE BAIXA FREQUÊNCIA ESCOLAR';
      case 'autorizacao_imagem':
        return 'TERMO DE AUTORIZAÇÃO DE IMAGEM E SOM';
      case 'declaracao_matricula':
        return 'DECLARAÇÃO DE MATRÍCULA';
      case 'declaracao_frequencia':
        return 'DECLARAÇÃO DE FREQUÊNCIA ESCOLAR';
      default:
        return 'DECLARAÇÃO ESCOLAR';
    }
  };

  const stageStr = (student.stage || (student as any).ano_serie || '').toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]/g, '');
  const isPreEscola = stageStr.includes('preescola') || stageStr.includes('prei') || stageStr.includes('preii') || stageStr.includes('pre1') || stageStr.includes('pre2') || stageStr.includes('4a5anos') || stageStr.includes('4anos') || stageStr.includes('5anos') || stageStr.includes('infantil4') || stageStr.includes('infantil5');
  const minLegalRate = isPreEscola ? 60 : 75;
  const legalCitation = isPreEscola
    ? "Artigo 31, inciso IV, da Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei nº 9.394/1996), que estabelece a exigência de frequência mínima de 60% do total de horas para a pré-escola na Educação Infantil"
    : "Artigo 24, inciso VI, da Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei nº 9.394/1996), que estabelece a exigência de frequência mínima de 75% do total de horas letivas no Ensino Fundamental";

  const content = (
    <div className="print-only" style={{ padding: '40px 45px', fontFamily: 'Arial, sans-serif', fontSize: '13.5px', lineHeight: '1.65', color: '#000' }}>
      <style>
        {`
        @media print {
            body * {
                visibility: hidden !important;
            }
            .print-only, .print-only * {
                visibility: visible !important;
            }
            .print-only {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                padding: 35px !important;
                margin: 0 !important;
                background: white !important;
            }
        }
        `}
      </style>

      {/* Cabeçalho Oficial - Estrutura de Humberto de Campos */}
      <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '8px' }}>
        <p style={{ fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#475569', margin: '0 0 2pt 0' }}>
          ESTADO DO MARANHÃO
        </p>
        <p style={{ fontSize: '11pt', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 2pt 0' }}>
          PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
        </p>
        <p style={{ fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#475569', margin: '0 0 8pt 0' }}>
          SECRETARIA MUNICIPAL DE EDUCAÇÃO
        </p>
        <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 10pt' }} />
        <h1 style={{ fontSize: '15pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt 0' }}>
          {getDocTitle()}
        </h1>
        <p style={{ fontSize: '9pt', fontWeight: 700, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          {escolaNome}
        </p>
      </div>

      {/* 1. NOTIFICAÇÃO POR BAIXA FREQUÊNCIA */}
      {documentType === 'notificacao_frequencia' && (
        <div>
          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px' }}>
            Prezado(a) Sr(a). <strong>{data.responsavelNome || '__________________________________________________'}</strong>, 
            responsável legal pelo(a) estudante <strong>{student.name}</strong>, matriculado(a) no 
            <strong> {student.stage || (student as any).ano_serie || 'ano/etapa'}</strong> nesta unidade de ensino.
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px' }}>
            Vimos, por meio desta, comunicar que o(a) referido(a) estudante apresenta, até a presente data, uma 
            frequência escolar acumulada de apenas <strong>{data.frequenciaAtual ?? '___'}%</strong> (abaixo do percentual mínimo legal de <strong>{minLegalRate}%</strong>), acumulando um total de 
            <strong> {data.totalFaltas ?? '___'} faltas</strong> neste período letivo.
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px' }}>
            Ressaltamos que, de acordo com o <strong>{legalCitation}</strong>, conjuntamente com o <strong>Artigo 56 do Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990)</strong>, 
            é dever indeclinável dos pais ou responsáveis zelar pela frequência regular dos filhos na escola, cabendo à instituição de ensino a 
            obrigação legal de comunicar formalmente os responsáveis e, caso esgotadas as medidas escolares, acionar o Conselho Tutelar (FICAI) nos casos de reiteração de faltas injustificadas.
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px' }}>
            Diante do exposto, solicitamos o seu comparecimento a esta unidade escolar no dia 
            <strong> {formatarData(data.dataAtendimento)}</strong>, às <strong>{data.horarioAtendimento || '__:__'}h</strong>, 
            para tratarmos sobre os motivos de tais ausências, definirmos estratégias pedagógicas de recuperação e acompanhamento e firmarmos o 
            Termo de Compromisso de Frequência Escolar, visando garantir o direito fundamental à educação e evitar prejuízos ao desenvolvimento escolar do estudante.
          </p>

          <p style={{ marginBottom: '40px' }}>
            Certos de sua pronta atenção e cooperação para com a vida escolar de seu(sua) filho(a)/dependente, subscrevemo-nos.
          </p>

          <div style={{ textAlign: 'right', marginBottom: '50px' }}>
            <p>Humberto de Campos - MA, {today}.</p>
          </div>

          {/* Assinaturas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', marginBottom: '50px' }}>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{escolaGestor || 'Equipe Gestora / Coordenação'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>{escolaNome}</p>
            </div>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Responsável Legal</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Assinatura e Data</p>
            </div>
          </div>

          {/* Protocolo de Entrega */}
          <div style={{ borderTop: '1px dashed #000', paddingTop: '20px', marginTop: '40px' }}>
            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '15px' }}>
              ------------------------------------- VIA DA ESCOLA (PROTOCOLO DE RECEBIMENTO) -------------------------------------
            </p>
            <p style={{ margin: '5px 0' }}>
              Declaro que recebi a Notificação de Baixa Frequência Escolar do(a) estudante <strong>{student.name}</strong> em ___/___/______.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px' }}>
              <p style={{ margin: 0 }}>Assinatura do Responsável: __________________________________________________</p>
              <p style={{ margin: 0 }}>Grau de Parentesco: _______________</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTORIZAÇÃO DE IMAGEM E SOM */}
      {documentType === 'autorizacao_imagem' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', margin: 0, fontStyle: 'italic', fontWeight: 'bold', color: '#475569' }}>
              (Estudante Menor de Idade - Educação Infantil e Ensino Fundamental)
            </p>
          </div>

          <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
            Eu, <strong>{data.responsavelNome || '__________________________________________________'}</strong>, 
            portador(a) do CPF nº <strong>{data.responsavelCpf || '_______________________'}</strong>, 
            residente no endereço <strong>{data.responsavelEndereco || '__________________________________________________'}</strong>, 
            contato telefônico <strong>{data.responsavelTelefone || '____________________'}</strong>, na qualidade de pai, mãe ou 
            responsável legal pelo(a) estudante menor <strong>{student.name}</strong>, nascido(a) em 
            <strong> {student.birth_date ? formatarData(student.birth_date) : '____/____/______'}</strong>, matriculado(a) no 
            <strong> {student.stage || (student as any).ano_serie || 'ano/etapa'}</strong> na unidade escolar <strong>{escolaNome}</strong>:
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px', fontWeight: 'bold' }}>
            AUTORIZO a Prefeitura Municipal de Humberto de Campos, por meio de sua Secretaria Municipal de Educação e da referida Unidade Escolar, a utilizar a imagem e o som de voz do(a) estudante acima identificado(a), em conformidade com as seguintes condições:
          </p>

          <ol style={{ paddingLeft: '20px', marginBottom: '20px', textAlign: 'justify' }}>
            <li style={{ marginBottom: '8px' }}>
              A presente autorização é concedida a título totalmente gratuito, abrangendo o uso da imagem e som de voz do(a) estudante em fotos, vídeos, depoimentos, áudios e demais registros realizados durante atividades escolares, pedagógicas, esportivas e culturais.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Os materiais produzidos poderão ser divulgados nos canais oficiais de comunicação da instituição, incluindo redes sociais (Instagram, Facebook, YouTube), site oficial da prefeitura/SEMED, jornais informativos, murais escolares e projetos pedagógicos internos, sem limitação de número de exibições.
            </li>
            <li style={{ marginBottom: '8px' }}>
              A utilização das imagens e vozes será feita única e exclusivamente para fins didáticos, informativos, institucionais e pedagógicos, sendo expressamente proibido qualquer uso de caráter comercial ou que exponha o estudante a situações vexatórias ou constrangedoras.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Esta autorização é válida por tempo indeterminado ou até que seja expressamente revogada, por escrito, pelo responsável legal junto à direção da unidade escolar.
            </li>
          </ol>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '35px' }}>
            Por ser esta a expressão da minha vontade e estando de pleno acordo com os termos e condições deste instrumento, assino a presente autorização.
          </p>

          <div style={{ textAlign: 'right', marginBottom: '50px' }}>
            <p>Humberto de Campos - MA, {today}.</p>
          </div>

          {/* Assinatura do Responsável */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
            <div style={{ width: '60%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{data.responsavelNome || 'Assinatura do Pai, Mãe ou Responsável Legal'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Responsável Legal pelo(a) Estudante</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DECLARAÇÃO DE MATRÍCULA */}
      {documentType === 'declaracao_matricula' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <p style={{ fontSize: '10.5pt', fontWeight: 'bold', margin: 0, color: '#334155' }}>
              ANO LETIVO DE {data.anoLetivo || '2026'}
            </p>
          </div>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px', lineHeight: '1.9' }}>
            A Direção da <strong>{escolaNome}</strong>, Unidade Escolar integrante da Rede Municipal de Ensino de Humberto de Campos, Estado do Maranhão, 
            declara, para os devidos fins de direito a que se fizerem necessários e a pedido da parte interessada, que o(a) estudante:
          </p>

          {/* Ficha do Estudante */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px 18px', marginBottom: '22px', backgroundColor: '#f8fafc' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12pt', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
              {student.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10pt', color: '#334155' }}>
              <p style={{ margin: 0 }}><strong>Data de Nasc.:</strong> {student.birth_date ? formatarData(student.birth_date) : 'Não informada'}</p>
              <p style={{ margin: 0 }}><strong>Naturalidade:</strong> {student.municipio_nascimento ? `${student.municipio_nascimento} - ${student.uf_nascimento || 'MA'}` : 'Humberto de Campos - MA'}</p>
              <p style={{ margin: 0 }}><strong>Mãe:</strong> {student.nome_mae || (data.responsavelNome ? `${data.responsavelNome} (Responsável)` : 'Não informada')}</p>
              <p style={{ margin: 0 }}><strong>Pai:</strong> {student.nome_pai || 'Não informado'}</p>
              <p style={{ margin: 0 }}><strong>CPF:</strong> {student.cpf || (data.responsavelCpf ? `${data.responsavelCpf} (Resp.)` : 'Não informado')}</p>
              <p style={{ margin: 0 }}><strong>NIS:</strong> {student.nis || 'Não informado'}</p>
              <p style={{ margin: 0 }}><strong>Nº de Matrícula:</strong> {student.registration_number || `SIGAR-${student.id}`}</p>
              <p style={{ margin: 0 }}><strong>Situação:</strong> <span style={{ fontWeight: 'bold', color: '#15803d' }}>MATRICULADO(A) - FREQUÊNCIA ATIVA</span></p>
              <p style={{ margin: 0 }}><strong>Ano/Série/Etapa:</strong> <span style={{ fontWeight: 'bold' }}>{data.anoSerieEtapa || student.stage || (student as any).ano_serie || 'Não informada'}</span></p>
              <p style={{ margin: 0 }}><strong>Frequência Apurada:</strong> <span style={{ fontWeight: 900, color: (data.frequenciaAtual ?? 100) >= minLegalRate ? '#15803d' : '#b91c1c' }}>{data.frequenciaAtual ?? 100}% ({((data.frequenciaAtual ?? 100) >= minLegalRate) ? 'Assiduidade Regular' : 'Abaixo do Limite Legal'})</span></p>
            </div>
          </div>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px', lineHeight: '1.9' }}>
            Encontra-se regularmente matriculado(a) e com frequência ativa no <strong>{data.anoSerieEtapa || student.stage || (student as any).ano_serie || 'Ano/Etapa'}</strong>
            {turmaNome && turmaNome !== (data.anoSerieEtapa || student.stage) && (
              <>
                {', na Turma '}
                <strong>{turmaNome}</strong>
              </>
            )}
            {(turmaTurno || student.turno) && (
              <>
                {', Turno '}
                <strong>{turmaTurno || student.turno}</strong>
              </>
            )}
            {', com frequência escolar apurada de '}
            <strong>{data.frequenciaAtual ?? 100}%</strong>
            {', neste estabelecimento de ensino durante o '}
            <strong>Ano Letivo de {data.anoLetivo || '2026'}</strong>
            {', cumprindo a matriz curricular oficial em conformidade com as diretrizes da Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/96).'}
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '25px', lineHeight: '1.9' }}>
            A presente declaração é expedida a pedido do(a) interessado(a) para fins de <strong>{data.finalidade || 'comprovação de matrícula e frequência regular'}</strong>
            {data.observacoes ? `. Observação: ${data.observacoes}` : '.'}
          </p>

          <p style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic', marginBottom: '35px' }}>
            * Esta declaração tem validade de 30 (trinta) dias a contar da data de sua emissão e não substitui o Histórico Escolar Oficial.
          </p>

          <div style={{ textAlign: 'right', marginBottom: '50px' }}>
            <p>Humberto de Campos - MA, {today}.</p>
          </div>

          {/* Assinaturas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{escolaGestor || 'Direção Escolar / Gestão'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Gestor(a) Geral - Assinatura e Carimbo</p>
            </div>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Secretaria Escolar</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Assinatura e Carimbo</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. DECLARAÇÃO DE FREQUÊNCIA ESCOLAR */}
      {documentType === 'declaracao_frequencia' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <p style={{ fontSize: '10.5pt', fontWeight: 'bold', margin: 0, color: '#334155' }}>
              {data.periodoApuracao || `ANO LETIVO DE ${data.anoLetivo || '2026'}`}
            </p>
          </div>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px', lineHeight: '1.9' }}>
            A Direção da <strong>{escolaNome}</strong>, Unidade Escolar da Rede Municipal de Ensino de Humberto de Campos - MA, 
            declara para os devidos fins de direito, notadamente para fins de comprovação e acompanhamento de condicionalidades educacionais, 
            que o(a) estudante <strong>{student.name}</strong>, nascido(a) em <strong>{student.birth_date ? formatarData(student.birth_date) : '____/____/______'}</strong>, 
            filho(a) de <strong>{student.nome_mae || data.responsavelNome || '__________________________________'}</strong>
            {student.nome_pai && (
              <>
                {' e de '}
                <strong>{student.nome_pai}</strong>
              </>
            )}
            {student.cpf && (
              <>
                {', portador(a) do CPF nº '}
                <strong>{student.cpf}</strong>
              </>
            )}
            {student.nis && (
              <>
                {', NIS nº '}
                <strong>{student.nis}</strong>
              </>
            )}
            {', regularmente matriculado(a) no '}
            <strong>{student.stage || (student as any).ano_serie || 'Ano/Etapa'}</strong>
            {turmaNome && turmaNome !== student.stage && (
              <>
                {', Turma '}
                <strong>{turmaNome}</strong>
              </>
            )}
            {(turmaTurno || student.turno) && (
              <>
                {', Turno '}
                <strong>{turmaTurno || student.turno}</strong>
              </>
            )}
            {', apresenta no presente período letivo o seguinte registro oficial de assiduidade:'}
          </p>

          {/* Tabela Demonstrativa de Frequência */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0 22px 0', fontSize: '10.5pt' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #334155' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'left' }}>Aulas Ministradas</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'center' }}>Total de Faltas</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'center' }}>Frequência Apurada</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'center' }}>Exigência Legal (LDB)</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'center' }}>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>
                  {data.totalAulas ? `${data.totalAulas} aulas registradas` : 'Conforme Diário Eletrônico'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: (data.totalFaltas || 0) > 15 ? '#b91c1c' : '#0f172a' }}>
                  {data.totalFaltas ?? 0} faltas
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'center', fontWeight: 900, fontSize: '12pt', color: (data.frequenciaAtual || 0) >= minLegalRate ? '#15803d' : '#b91c1c' }}>
                  {data.frequenciaAtual ?? 100}%
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'center', fontSize: '9.5pt', color: '#475569' }}>
                  Mínimo {minLegalRate}% ({isPreEscola ? 'Art. 31 LDB' : 'Art. 24 LDB'})
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>
                  {(data.frequenciaAtual || 0) >= minLegalRate ? (
                    <span style={{ color: '#15803d', textTransform: 'uppercase' }}>REGULAR / ASSÍDUO</span>
                  ) : (
                    <span style={{ color: '#b91c1c', textTransform: 'uppercase' }}>ABAIXO DO MÍNIMO</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '20px', lineHeight: '1.9' }}>
            Atestamos a referida frequência para fins de <strong>{data.finalidade || 'comprovação de assiduidade escolar e condicionalidades de programas sociais (Programa Bolsa Família / Cadastro Único)'}</strong>
            {data.observacoes ? `. Observações: ${data.observacoes}` : '.'}
          </p>

          <p style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic', marginBottom: '35px' }}>
            * Informações apuradas com base nos registros do Diário de Classe Eletrônico do Sistema Integrado de Gestão e Acompanhamento Regional (SIGAR). Validade de 30 (trinta) dias.
          </p>

          <div style={{ textAlign: 'right', marginBottom: '50px' }}>
            <p>Humberto de Campos - MA, {today}.</p>
          </div>

          {/* Assinaturas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{escolaGestor || 'Direção Escolar / Gestão'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Gestor(a) Geral - Assinatura e Carimbo</p>
            </div>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Secretaria / Coordenação Escolar</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Assinatura e Carimbo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};
