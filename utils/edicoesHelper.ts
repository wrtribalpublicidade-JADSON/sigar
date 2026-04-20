import { Escola } from '../types';

export type IndicadorEdicaoKey = 
  | 'PARC' 
  | 'CNCA' 
  | 'SEAMA' 
  | 'SAEB' 
  | 'IDEB' 
  | 'SAMAHC_FLUENCIA' 
  | 'SAMAHC_SEAMA' 
  | 'SAMAHC_SAEB' 
  | 'SAMAHC_PORTUGUES' 
  | 'SAMAHC_MATEMATICA' 
  | 'EI';

export interface StatusEdicoes {
  esperadas: number;
  preenchidas: number;
  pendentes: number;
  status: 'Completo' | 'Pendente' | 'Não informado';
}

export const getEdicoesPreenchidas = (escola: Escola, indicadorKey: IndicadorEdicaoKey): number => {
  const de = escola.dadosEducacionais;
  if (!de) return 0;

  switch (indicadorKey) {
    case 'PARC':
      // Quantidade de chaves únicas: ano + edicao
      if (!de.registrosFluenciaParc) return 0;
      const unicosParc = new Set(de.registrosFluenciaParc.map(r => `${r.ano}-${r.edicao}`));
      return unicosParc.size;

    case 'CNCA':
      if (!de.registrosCNCA) return 0;
      const unicosCnca = new Set(de.registrosCNCA.map(r => `${r.ano}-${r.tipoAvaliacao}`));
      return unicosCnca.size;

    case 'SEAMA':
      if (!de.registrosSEAMA) return 0;
      const unicosSeama = new Set(de.registrosSEAMA.map(r => `${r.ano}-${r.tipoAvaliacao}`));
      return unicosSeama.size;

    case 'SAEB':
      if (!de.registrosSAEB) return 0;
      const unicosSaeb = new Set(de.registrosSAEB.map(r => `${r.ano}-${r.tipoAvaliacao}`));
      return unicosSaeb.size;

    case 'IDEB':
      if (!de.registrosIDEB) return 0;
      const unicosIdeb = new Set(de.registrosIDEB.map(r => `${r.ano}`));
      return unicosIdeb.size;

    case 'SAMAHC_FLUENCIA':
      if (!de.registrosFluenciaSamahcAgregados) return 0;
      const unicosSamahcFlu = new Set(de.registrosFluenciaSamahcAgregados.map(r => `${r.ano}-${r.edicao}`));
      return unicosSamahcFlu.size;

    case 'SAMAHC_SEAMA':
      return (de.dadosSamahc?.simuladoSeama || 0) > 0 ? 1 : 0;

    case 'SAMAHC_SAEB':
      return (de.dadosSamahc?.simuladoSaeb || 0) > 0 ? 1 : 0;

    case 'SAMAHC_PORTUGUES':
      return (de.dadosSamahc?.linguaPortuguesa || 0) > 0 ? 1 : 0;

    case 'SAMAHC_MATEMATICA':
      return (de.dadosSamahc?.matematica || 0) > 0 ? 1 : 0;

    case 'EI':
      return (de.relatorioEI?.desenvolvimento || 0) > 0 ? 1 : 0;

    default:
      return 0;
  }
};

export const getEdicoesStatus = (escola: Escola, indicadorKey: IndicadorEdicaoKey): StatusEdicoes => {
  const esperadas = escola.dadosEducacionais?.controleEdicoes?.[indicadorKey] || 0;
  const preenchidas = getEdicoesPreenchidas(escola, indicadorKey);
  const pendentes = Math.max(0, esperadas - preenchidas);
  
  let status: StatusEdicoes['status'] = 'Não informado';
  if (esperadas > 0) {
    status = pendentes > 0 ? 'Pendente' : 'Completo';
  }

  return {
    esperadas,
    preenchidas,
    pendentes,
    status
  };
};
