import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Aluno, Escola } from '../types';
import { formatCPF, formatNIS, formatCEP, formatCertidao } from './modals/CadastroEstudanteModal';

interface PrintableDossieEstudanteProps {
  student: Aluno;
  escola?: Escola | null;
  turmaInfo?: string;
  onClose: () => void;
}

export const PrintableDossieEstudante: React.FC<PrintableDossieEstudanteProps> = ({
  student,
  escola,
  turmaInfo = '',
  onClose
}) => {
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 200);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  // Format birth date and calculate age
  const formatBirthDateWithAge = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        const formattedDate = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        return `${formattedDate} (${age} ${age === 1 ? 'ano' : 'anos'})`;
      }
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dateStr || '---';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr || '---';
    }
  };

  const formatGender = (g?: string) => {
    if (!g) return '---';
    const upper = g.trim().toUpperCase();
    if (upper === 'M' || upper === 'MASCULINO') return 'MASCULINO (M)';
    if (upper === 'F' || upper === 'FEMININO') return 'FEMININO (F)';
    return g.toUpperCase();
  };

  const isStatusActive = (student.status as string === 'Ativo' || student.status as string === 'active');

  const hasSpecialNeeds = student.possui_deficiencia === 'Sim';
  const deficiencias = Array.isArray(student.deficiencia_tipos) && student.deficiencia_tipos.length > 0 
    ? student.deficiencia_tipos 
    : [];
  const recursosSaeb = Array.isArray(student.recursos_sala_saeb) && student.recursos_sala_saeb.length > 0 
    ? student.recursos_sala_saeb 
    : [];

  const enderecoCompleto = [
    student.endereco_logradouro ? student.endereco_logradouro : '',
    student.endereco_numero ? `Nº ${student.endereco_numero}` : '',
    student.endereco_complemento ? `(${student.endereco_complemento})` : ''
  ].filter(Boolean).join(', ') || '---';

  return createPortal(
    <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: '8pt 10pt' }}>
      
      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-3 pb-2" style={{ borderBottom: '2.5pt solid #0f172a' }}>
        <p style={{ fontSize: '8pt', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
          ESTADO DO MARANHÃO
        </p>
        <p style={{ fontSize: '10.5pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
          PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
        </p>
        <p style={{ fontSize: '8pt', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '6pt' }}>
          SECRETARIA MUNICIPAL DE EDUCAÇÃO • SEMED
        </p>
        <div style={{ width: '60pt', height: '2pt', background: '#f97316', margin: '0 auto 5pt' }} />
        <h1 style={{ fontSize: '15pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 2pt' }}>
          DOSSIÊ INDIVIDUAL DO ESTUDANTE
        </h1>
        <p style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          CADASTRO UNIFICADO E REGISTRO ESCOLAR INTEGRADO • EDUCACENSO / CENSO ESCOLAR
        </p>
      </div>

      {/* ====== PROTOCOL & EMISSION BAR ====== */}
      <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5pt 8pt', background: '#f8fafc', border: '0.5pt solid #cbd5e1', marginBottom: '8pt', borderRadius: '4pt' }}>
        <div>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1pt' }}>
            Identificação do Documento
          </p>
          <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
            DOSSIÊ Nº {student.registration_number || student.id}/{currentYear}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1pt' }}>
            Situação Cadastral
          </p>
          <span style={{
            display: 'inline-block',
            padding: '2pt 8pt',
            borderRadius: '10pt',
            fontSize: '7.5pt',
            fontWeight: 900,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backgroundColor: isStatusActive ? '#d1fae5' : '#fee2e2',
            color: isStatusActive ? '#047857' : '#b91c1c',
            border: isStatusActive ? '0.5pt solid #a7f3d0' : '0.5pt solid #fecaca'
          }}>
            {student.status?.toUpperCase() || 'ATIVO'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1pt' }}>
            Emissão do Sistema SIGAR
          </p>
          <p style={{ fontSize: '8.5pt', fontWeight: 700, color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
            {emissionDate} às {emissionTime}
          </p>
        </div>
      </div>

      {/* ====== 1. DADOS PESSOAIS E FILIAÇÃO ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          1. Dados Pessoais e Filiação do Estudante
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Nome Completo
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9.5pt', fontWeight: 900, color: '#0f172a' }} colSpan={3}>
                {student.name}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Nº de Matrícula
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', width: '28%' }}>
                {student.registration_number || '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                CPF do Estudante
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', width: '28%' }}>
                {student.cpf ? formatCPF(student.cpf) : '---'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Data de Nascimento
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {formatBirthDateWithAge(student.birth_date)}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Sexo / Gênero
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {formatGender(student.gender)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Nome da Mãe (1ª Filiação)
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {student.nome_mae || '---'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Nome do Pai (2ª Filiação / Resp.)
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {student.nome_pai || '---'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 2. DOCUMENTOS COMPLEMENTARES E IDENTIFICADORES OFICIAIS ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          2. Documentos Complementares e Identificadores Oficiais
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Certidão de Nascimento
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a', width: '28%' }}>
                {student.certidao_nascimento ? formatCertidao(student.certidao_nascimento) : '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                ID EducaCenso / INEP
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", width: '28%' }}>
                {student.id_educacenso || '---'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                NIS (Social)
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }}>
                {student.nis ? formatNIS(student.nis) : '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                RG / Órgão Emissor
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }}>
                {student.rg || '---'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 3. CARACTERÍSTICAS, NACIONALIDADE E NATURALIDADE ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          3. Características, Origem e Naturalidade
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Cor / Raça
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.cor_raca || 'Não declarada'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Nacionalidade
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.nacionalidade || 'Brasileira'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Naturalidade (Município / UF)
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {student.municipio_nascimento ? `${student.municipio_nascimento} - ${student.uf_nascimento || 'MA'}` : (student.uf_nascimento ? `UF: ${student.uf_nascimento}` : '---')}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                País de Nascimento
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {student.pais_nascimento || 'Brasil'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Estudante Estrangeiro / Refúgio
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }} colSpan={3}>
                {student.estudante_estrangeiro || 'Não'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 4. ENDEREÇO RESIDENCIAL E LOCALIZAÇÃO ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          4. Endereço Residencial e Localização
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Logradouro / Número
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {enderecoCompleto}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Bairro
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.endereco_bairro || '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Distrito / Povoado / Localidade
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.endereco_distrito || '---'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Município / UF
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {student.endereco_municipio ? `${student.endereco_municipio} / ${student.endereco_uf || 'MA'}` : 'Humberto de Campos / MA'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                CEP / Localização Residencial
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                CEP: {student.cep ? formatCEP(student.cep) : '---'} • Zona: <strong style={{ textTransform: 'uppercase' }}>{student.endereco_zona || 'Urbana'}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 5. EDUCAÇÃO ESPECIAL, AEE E ACESSIBILIDADE ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          5. Educação Especial, AEE e Acessibilidade
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Público da Ed. Especial?
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', width: '28%' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '1.5pt 6pt',
                  borderRadius: '6pt',
                  fontSize: '7.5pt',
                  fontWeight: 900,
                  backgroundColor: hasSpecialNeeds ? '#f3e8ff' : '#f1f5f9',
                  color: hasSpecialNeeds ? '#7e22ce' : '#475569',
                  border: hasSpecialNeeds ? '0.5pt solid #d8b4fe' : '0.5pt solid #cbd5e1'
                }}>
                  {hasSpecialNeeds ? 'SIM (Possui Deficiência / TEA / Superdotação)' : 'NÃO'}
                </span>
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Atendimento AEE
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.recebe_aee || 'Não recebe AEE'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Condição / Deficiência Diagnosticada
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {hasSpecialNeeds && deficiencias.length > 0 
                  ? deficiencias.join('; ')
                  : (hasSpecialNeeds ? 'Sim (especificação pendente de laudo)' : 'Não declarada / Sem laudo')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Recursos Saeb / Acessibilidade
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }} colSpan={3}>
                {recursosSaeb.length > 0 
                  ? recursosSaeb.join('; ')
                  : 'Nenhum recurso especial de avaliação solicitado'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 6. VÍNCULO ESCOLAR E MATRÍCULA ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          6. Vínculo Escolar e Matrícula
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Unidade Escolar
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9pt', fontWeight: 900, color: '#0f172a' }} colSpan={3}>
                {escola?.nome || 'Unidade Escolar Municipal de Humberto de Campos'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Etapa / Nível
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.stage || '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Turma / Ano / Turno
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, color: '#0f172a', width: '28%' }}>
                {turmaInfo || student.ano_serie || '---'} {student.turno ? `(${student.turno})` : ''}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Modalidade de Ensino
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {student.modalidade || 'Ensino Regular'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Ano Letivo de Matrícula
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {student.ano_matricula || currentYear}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Data da Matrícula
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b' }}>
                {formatDate(student.data_matricula)}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Situação do Vínculo
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a' }}>
                {student.situacao_vinculo || 'Matriculado'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', background: '#f8fafc' }}>
                Professor(a) Responsável / Regente
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {student.professor_responsavel || 'Não Atribuído / Equipe Docente Geral'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== 7. REGISTROS PEDAGÓGICOS E OBSERVAÇÕES ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '8pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          7. Registros Pedagógicos, Laudos e Observações Complementares
        </div>
        <div style={{ padding: '8pt 10pt', border: '0.5pt solid #cbd5e1', borderTop: 'none', fontSize: '8.5pt', color: '#334155', lineHeight: '1.5', minHeight: '36pt' }}>
          <p className="whitespace-pre-line">{student.observations || 'Sem observações ou ressalvas pedagógicas cadastradas até a presente data.'}</p>
        </div>
      </div>

      {/* ====== 8. CONTROLE DO REGISTRO ESCOLAR E AUDITORIA ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
          8. Controle do Registro Escolar e Auditoria
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                Data de Cadastramento no Sistema
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#1e293b', width: '28%' }}>
                {student.created_at ? formatDate(student.created_at) : '---'}
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: '22%', background: '#f8fafc' }}>
                ID de Registro no SIGAR
              </td>
              <td style={{ padding: '4.5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace", width: '28%' }}>
                #{student.id}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div className="print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30pt', paddingTop: '18pt', marginTop: '14pt' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
          <p style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '1pt' }}>
            Responsável pelo Cadastro / Secretaria Escolar
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '1pt' }}>
            SECRETARIA ESCOLAR
          </p>
          <p style={{ fontSize: '6.5pt', color: '#94a3b8', fontStyle: 'italic' }}>
            Assinatura e Carimbo
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
          <p style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '1pt' }}>
            Direção / Coordenação Pedagógica
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '1pt' }}>
            EQUIPE GESTORA / PEDAGÓGICA
          </p>
          <p style={{ fontSize: '6.5pt', color: '#94a3b8', fontStyle: 'italic' }}>
            Assinatura e Carimbo
          </p>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div className="print-avoid-break" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.25em', borderTop: '0.5pt solid #cbd5e1', paddingTop: '4pt' }}>
        <span>SIGAR • Sistema Integrado de Gestão de Aprendizagem</span>
        <span>Secretaria Municipal de Educação • Humberto de Campos/MA</span>
      </div>
    </div>,
    document.body
  );
};
