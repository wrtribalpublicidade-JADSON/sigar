import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Aluno } from '../types';

interface PrintableSchoolDocumentProps {
  documentType: 'notificacao_frequencia' | 'autorizacao_imagem';
  student: Aluno | null;
  escolaNome: string;
  data: {
    responsavelNome: string;
    responsavelCpf?: string;
    responsavelEndereco?: string;
    responsavelTelefone?: string;
    frequenciaAtual?: number;
    totalFaltas?: number;
    dataAtendimento?: string;
    horarioAtendimento?: string;
  };
  onClose: () => void;
}

export const PrintableSchoolDocument: React.FC<PrintableSchoolDocumentProps> = ({
  documentType,
  student,
  escolaNome,
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
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const isNotificacao = documentType === 'notificacao_frequencia';

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
    <div className="print-only" style={{ padding: '50px 40px', fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#000' }}>
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
                padding: 40px !important;
                margin: 0 !important;
                background: white !important;
            }
        }
        `}
      </style>

      {/* Cabeçalho Oficial - Estrutura de Humberto de Campos */}
      <div style={{ textAlign: 'center', marginBottom: '35px', paddingBottom: '10px' }}>
        <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', margin: '0 0 2pt 0' }}>
          ESTADO DO MARANHÃO
        </p>
        <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 2pt 0' }}>
          PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
        </p>
        <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', margin: '0 0 10pt 0' }}>
          SECRETARIA MUNICIPAL DE EDUCAÇÃO
        </p>
        <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 12pt' }} />
        <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt 0' }}>
          {isNotificacao ? 'NOTIFICAÇÃO DE BAIXA FREQUÊNCIA ESCOLAR' : 'TERMO DE AUTORIZAÇÃO DE IMAGEM E SOM'}
        </h1>
        <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
          {escolaNome}
        </p>
      </div>

      {isNotificacao ? (
        // TEMPLATE 1: NOTIFICAÇÃO POR BAIXA FREQUÊNCIA
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', marginBottom: '60px' }}>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Equipe Gestora / Coordenação</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>{escolaNome}</p>
            </div>
            <div style={{ width: '45%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Responsável Legal</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Assinatura e Data</p>
            </div>
          </div>

          {/* Protocolo de Entrega */}
          <div style={{ borderTop: '1px dashed #000', paddingTop: '20px', marginTop: '50px' }}>
            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px' }}>
              ------------------------------------- VIA DA ESCOLA (PROTOCOLO DE RECEBIMENTO) -------------------------------------
            </p>
            <p style={{ margin: '5px 0' }}>
              Declaro que recebi a Notificação de Baixa Frequência Escolar do(a) estudante <strong>{student.name}</strong> em ___/___/______.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <p style={{ margin: 0 }}>Assinatura do Responsável: __________________________________________________</p>
              <p style={{ margin: 0 }}>Grau de Parentesco: _______________</p>
            </div>
          </div>
        </div>
      ) : (
        // TEMPLATE 2: AUTORIZAÇÃO DE USO DE IMAGEM E SOM
        <div>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <p style={{ fontSize: '12px', margin: 0, fontStyle: 'italic', fontWeight: 'bold' }}>
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
            <strong> {student.stage}</strong> na unidade escolar <strong>{escolaNome}</strong>:
          </p>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '25px', fontWeight: 'bold' }}>
            AUTORIZO a Prefeitura Municipal de Humberto de Campos, por meio de sua Secretaria Municipal de Educação e da referida Unidade Escolar, a utilizar a imagem e o som de voz do(a) estudante acima identificado(a), em conformidade com as seguintes condições:
          </p>

          <ol style={{ paddingLeft: '20px', marginBottom: '25px', textAlign: 'justify' }}>
            <li style={{ marginBottom: '10px' }}>
              A presente autorização é concedida a título totalmente gratuito, abrangendo o uso da imagem e som de voz do(a) estudante em fotos, vídeos, depoimentos, áudios e demais registros realizados durante atividades escolares, pedagógicas, esportivas e culturais.
            </li>
            <li style={{ marginBottom: '10px' }}>
              Os materiais produzidos poderão ser divulgados nos canais oficiais de comunicação da instituição, incluindo redes sociais (Instagram, Facebook, YouTube), site oficial da prefeitura/SEMED, jornais informativos, murais escolares e projetos pedagógicos internos, sem limitação de número de exibições.
            </li>
            <li style={{ marginBottom: '10px' }}>
              A utilização das imagens e vozes será feita única e exclusivamente para fins didáticos, informativos, institucionais e pedagógicos, sendo expressamente proibido qualquer uso de caráter comercial ou que exponha o estudante a situações vexatórias ou constrangedoras.
            </li>
            <li style={{ marginBottom: '10px' }}>
              Esta autorização é válida por tempo indeterminado ou até que seja expressamente revogada, por escrito, pelo responsável legal junto à direção da unidade escolar.
            </li>
          </ol>

          <p style={{ textIndent: '40px', textAlign: 'justify', marginBottom: '40px' }}>
            Por ser esta a expressão da minha vontade e estando de pleno acordo com os termos e condições deste instrumento, assino a presente autorização.
          </p>

          <div style={{ textAlign: 'right', marginBottom: '60px' }}>
            <p>Humberto de Campos - MA, {today}.</p>
          </div>

          {/* Assinatura do Responsável */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }}>
            <div style={{ width: '60%', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{data.responsavelNome || 'Assinatura do Pai, Mãe ou Responsável Legal'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Responsável Legal pelo(a) Estudante</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};
