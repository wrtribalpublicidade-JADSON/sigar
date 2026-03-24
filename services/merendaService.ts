import { supabase } from './supabase';

export interface MerendaItem {
  id: string;
  nome: string;
  categoria: string;
  estoque_inicial: number;
  estoque_atual: number;
  estoque_ideal: number;
  unidade: string;
  ultima_atualizacao: string;
}

export interface MerendaEntrada {
  id: string;
  item_id: string;
  data: string;
  quantidade: number;
  origem: string;
  observacao: string;
  usuario_id: string;
}

export interface MerendaEntrega {
  id: string;
  escola_id: string;
  data: string;
  status: string;
  observacoes: string;
}

export const buscarItensMerenda = async () => {
  const { data, error } = await supabase
    .from('merenda_itens')
    .select(`
      *,
      merenda_entradas (origem, data)
    `)
    .order('nome');
  
  if (error) throw error;
  
  return data.map((item: any) => {
    let ultimaOrigem = '-';
    if (item.merenda_entradas && item.merenda_entradas.length > 0) {
      const sorted = [...item.merenda_entradas].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      ultimaOrigem = sorted[0].origem || '-';
    }
    // Remove the large nested array to save memory component-side
    delete item.merenda_entradas;
    return {
       ...item,
       ultimaOrigem
    };
  }) as (MerendaItem & { ultimaOrigem?: string })[];
};

export const buscarHistoricoEntradas = async (itemId: string) => {
  const { data, error } = await supabase
    .from('merenda_entradas')
    .select('*')
    .eq('item_id', itemId)
    .order('data', { ascending: false });
  
  if (error) throw error;
  return data as MerendaEntrada[];
};

export const buscarMovimentacoesItem = async (itemId: string) => {
  const { data: entradas, error: errEntradas } = await supabase
    .from('merenda_entradas')
    .select('id, data, quantidade, origem, observacao')
    .eq('item_id', itemId);

  const { data: saidas, error: errSaidas } = await supabase
    .from('merenda_entrega_itens')
    .select(`
      id,
      quantidade,
      merenda_entregas (
        data,
        escola_id,
        observacoes,
        status
      )
    `)
    .eq('item_id', itemId);

  if (errEntradas) throw errEntradas;
  if (errSaidas) throw errSaidas;

  const historico = [
    ...(entradas || []).map(e => ({
      id: e.id,
      tipo: 'entrada' as const,
      data: e.data,
      quantidade: e.quantidade,
      origem_destino: e.origem,
      observacao: e.observacao
    })),
    ...(saidas || []).map((s: any) => ({
      id: s.id,
      tipo: 'saida' as const,
      data: s.merenda_entregas?.data || new Date().toISOString(),
      quantidade: s.quantidade,
      escola_id: s.merenda_entregas?.escola_id,
      observacao: s.merenda_entregas?.observacoes || ''
    }))
  ];

  return historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const salvarItemMerenda = async (item: Partial<MerendaItem>) => {
  if (item.id) {
    // Update
    const { data, error } = await supabase
      .from('merenda_itens')
      .update({
        nome: item.nome,
        categoria: item.categoria,
        estoque_ideal: item.estoque_ideal,
        unidade: item.unidade
      })
      .eq('id', item.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new item
    const { data, error } = await supabase
      .from('merenda_itens')
      .insert([{
        nome: item.nome,
        categoria: item.categoria,
        estoque_ideal: item.estoque_ideal,
        unidade: item.unidade,
        estoque_inicial: 0,
        estoque_atual: 0
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

export const excluirItemMerenda = async (id: string) => {
  const { error } = await supabase
    .from('merenda_itens')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const registrarEntradaEstoque = async (entrada: {item_id: string, quantidade: number, origem: string, observacao?: string}) => {
  const { data, error } = await supabase
    .from('merenda_entradas')
    .insert([entrada])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const registrarEntregaSaida = async (entrega: {escola_id: string, observacoes: string, itens: {item_id: string, quantidade: number}[]}) => {
  // 1. Inserir a entrega
  const { data: entregaData, error: entregaError } = await supabase
    .from('merenda_entregas')
    .insert([{ escola_id: entrega.escola_id, observacoes: entrega.observacoes }])
    .select()
    .single();

  if (entregaError) throw entregaError;

  // 2. Inserir os itens da entrega
  const itensParaInserir = entrega.itens.map(i => ({
    entrega_id: entregaData.id,
    item_id: i.item_id,
    quantidade: i.quantidade
  }));

  const { error: itensError } = await supabase
    .from('merenda_entrega_itens')
    .insert(itensParaInserir);

  if (itensError) throw itensError;

  return entregaData;
};

export const buscarHistoricoEntregas = async () => {
  const { data, error } = await supabase
    .from('merenda_entregas')
    .select(`
      *,
      merenda_entrega_itens (
        item_id,
        quantidade,
        merenda_itens (nome, unidade)
      )
    `)
    .order('data', { ascending: false });

  if (error) throw error;
  return data;
};

export const excluirEntregaMerenda = async (entregaId: string) => {
  const { data: itensEntrega, error: fetchError } = await supabase
    .from('merenda_entrega_itens')
    .select('item_id, quantidade')
    .eq('entrega_id', entregaId);

  if (fetchError) throw fetchError;

  // Estornar o saldo físico no estoque
  if (itensEntrega && itensEntrega.length > 0) {
    for (const item of itensEntrega) {
      const { data: currentItem } = await supabase
         .from('merenda_itens')
         .select('estoque_atual')
         .eq('id', item.item_id)
         .single();
      
      if (currentItem) {
         await supabase
           .from('merenda_itens')
           .update({ estoque_atual: currentItem.estoque_atual + item.quantidade })
           .eq('id', item.item_id);
      }
    }
  }

  await supabase.from('merenda_entrega_itens').delete().eq('entrega_id', entregaId);
  
  const { error } = await supabase
    .from('merenda_entregas')
    .delete()
    .eq('id', entregaId);

  if (error) throw error;
};

export const importarLoteMerenda = async (itens: any[]) => {
  const itensParaInserir = itens.map(i => ({
    nome: i.nome,
    categoria: i.categoria,
    estoque_ideal: Number(i.estoque_ideal) || 100,
    unidade: i.unidade || 'unid',
    estoque_inicial: 0,
    estoque_atual: 0
  }));

  const { data: itensInseridos, error: itensError } = await supabase
    .from('merenda_itens')
    .insert(itensParaInserir)
    .select();

  if (itensError || !itensInseridos) throw itensError || new Error('Nenhum item inserido');

  const entradasParaInserir = itens
    .map((itemOriginal, index) => {
      const qtd_inicial = typeof itemOriginal.qtd_inicial === 'string' 
        ? Number(itemOriginal.qtd_inicial.replace(',', '.')) 
        : Number(itemOriginal.qtd_inicial);

      if (qtd_inicial > 0 && itensInseridos[index]) {
        return {
          item_id: itensInseridos[index].id,
          quantidade: qtd_inicial,
          origem: itemOriginal.origem || 'Licitação',
          observacao: 'Importação em Massa Inicial'
        };
      }
      return null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (entradasParaInserir.length > 0) {
    const { error: entradasError } = await supabase
      .from('merenda_entradas')
      .insert(entradasParaInserir);
    
    if (entradasError) throw entradasError;
  }
};
