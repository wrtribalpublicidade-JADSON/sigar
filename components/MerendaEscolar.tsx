import React, { useState, useEffect } from 'react';
import { Utensils, Package, Truck, Calendar, Plus, Search, PackageOpen, CheckCircle2, History, Edit, Trash2, X, RefreshCw, AlertCircle, FileType, CalendarClock } from 'lucide-react';
import { Escola } from '../types';
import { 
  MerendaItem, 
  MerendaEntrada, 
  MerendaEntrega, 
  buscarItensMerenda, 
  buscarMovimentacoesItem, 
  salvarItemMerenda, 
  excluirItemMerenda, 
  registrarEntradaEstoque, 
  registrarEntregaSaida, 
  buscarHistoricoEntregas,
  excluirEntregaMerenda
} from '../services/merendaService';
import { ImportMerendaModal } from './modals/ImportMerendaModal';
import { PrintableMerendaReport } from './PrintableMerendaReport';
import { Printer } from 'lucide-react'; // Adding missing icons

interface MerendaEscolarProps {
  escolas: Escola[];
  isAdmin: boolean;
  isDemoMode: boolean;
}

export const MerendaEscolar: React.FC<MerendaEscolarProps> = ({ escolas, isAdmin, isDemoMode }) => {
  const [activeTab, setActiveTab] = useState<'estoque' | 'entregas' | 'mapa'>('estoque');
  const [loading, setLoading] = useState(true);
  
  const [estoque, setEstoque] = useState<MerendaItem[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]); // Any due to nested select Join
  const [searchTerm, setSearchTerm] = useState('');

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MerendaItem | null>(null);
  const [itemForm, setItemForm] = useState({nome: '', categoria: '', estoqueIdeal: '', unidade: 'kg'});
  const [novoItemQtdInicial, setNovoItemQtdInicial] = useState(''); // Usado apenas ao criar novo item
  const [novoItemOrigemInicial, setNovoItemOrigemInicial] = useState('Licitação');
  
  // Historico e Nova Entrada (Dentro do modal do item)
  const [historicoMovimentacoes, setHistoricoMovimentacoes] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [novaEntradaForm, setNovaEntradaForm] = useState({ quantidade: '', origem: 'Licitação', observacao: '' });

  // New Delivery State
  const [isNovaEntrega, setIsNovaEntrega] = useState(false);
  const [novaEntregaEscolaId, setNovaEntregaEscolaId] = useState('');
  const [novaEntregaItens, setNovaEntregaItens] = useState<{itemId: string, quantidade: number}[]>([]);
  const [novoItemSelecao, setNovoItemSelecao] = useState('');
  const [novoItemQuantidade, setNovoItemQuantidade] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<{id: string, nome: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Delivery State
  const [deliveryToDelete, setDeliveryToDelete] = useState<string | null>(null);
  const [isDeletingDelivery, setIsDeletingDelivery] = useState(false);

  // Print & Edit Delivery State
  const user = { nome: 'Administração do Sistema' };
  const [printingEntrega, setPrintingEntrega] = useState<any>(null);
  const [editingEntregaId, setEditingEntregaId] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [itensDB, entregasDB] = await Promise.all([
        buscarItensMerenda(),
        buscarHistoricoEntregas()
      ]);
      setEstoque(itensDB);
      setEntregas(entregasDB);
    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message || JSON.stringify(error)} \nCertifique-se que você rodou o script SQL no Supabase.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarHistoricoItem = async (itemId: string) => {
    try {
      setLoadingHistorico(true);
      const historico = await buscarMovimentacoesItem(itemId);
      setHistoricoMovimentacoes(historico);
    } catch (error) {
       console.error(error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleOpenAddItem = () => {
    setItemForm({nome: '', categoria: '', estoqueIdeal: '', unidade: 'kg'});
    setNovoItemQtdInicial('');
    setNovoItemOrigemInicial('Licitação');
    setEditingItem(null);
    setHistoricoMovimentacoes([]);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MerendaItem) => {
    setItemForm({nome: item.nome, categoria: item.categoria, estoqueIdeal: String(item.estoque_ideal), unidade: item.unidade});
    setEditingItem(item);
    setNovaEntradaForm({ quantidade: '', origem: 'Licitação', observacao: '' });
    carregarHistoricoItem(item.id);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (id: string, nome: string) => {
    setItemToDelete({ id, nome });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
        await excluirItemMerenda(itemToDelete.id);
        setEstoque(estoque.filter(i => i.id !== itemToDelete.id));
        setItemToDelete(null);
    } catch(e) {
        alert('Erro ao excluir item.');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.nome || !itemForm.categoria || !itemForm.estoqueIdeal) return;
    
    try {
        const itemSalvo = await salvarItemMerenda({
            id: editingItem?.id,
            nome: itemForm.nome,
            categoria: itemForm.categoria,
            estoque_ideal: Number(itemForm.estoqueIdeal),
            unidade: itemForm.unidade
        });

        // Se é um item NOVO e tem quantidade inicial > 0, registra a entrada
        if (!editingItem && Number(novoItemQtdInicial) > 0) {
            await registrarEntradaEstoque({
                item_id: itemSalvo.id,
                quantidade: Number(novoItemQtdInicial),
                origem: novoItemOrigemInicial,
                observacao: 'Balanço Inicial'
            });
        }
        
        await carregarDados();
        setIsItemModalOpen(false);
    } catch(e: any) {
        console.error(e);
        alert(`Erro ao salvar item: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSalvarEntrada = async () => {
      if(!editingItem || !novaEntradaForm.quantidade) return;
      try {
          await registrarEntradaEstoque({
             item_id: editingItem.id,
             quantidade: Number(novaEntradaForm.quantidade),
             origem: novaEntradaForm.origem,
             observacao: novaEntradaForm.observacao
          });
          setNovaEntradaForm({ quantidade: '', origem: 'Licitação', observacao: '' });
          await carregarHistoricoItem(editingItem.id);
          await carregarDados(); // atualiza o saldo na tabela ao fundo
      } catch (e) {
          alert('Erro ao registrar entrada.');
      }
  };

  const handleAddItemToDelivery = () => {
    if (!novoItemSelecao || !novoItemQuantidade) return;
    
    const existingIndex = novaEntregaItens.findIndex(i => i.itemId === novoItemSelecao);
    if (existingIndex >= 0) {
      const updated = [...novaEntregaItens];
      updated[existingIndex].quantidade += Number(novoItemQuantidade);
      setNovaEntregaItens(updated);
    } else {
      setNovaEntregaItens([...novaEntregaItens, { itemId: novoItemSelecao, quantidade: Number(novoItemQuantidade) }]);
    }
    setNovoItemSelecao('');
    setNovoItemQuantidade('');
  };

  const handleRemoveItemFromDelivery = (itemId: string) => {
    setNovaEntregaItens(novaEntregaItens.filter(i => i.itemId !== itemId));
  };

  const handleSaveDelivery = async () => {
    if (!novaEntregaEscolaId || novaEntregaItens.length === 0) return;
    setIsSavingDelivery(true);
    try {
        if (editingEntregaId) {
            await excluirEntregaMerenda(editingEntregaId);
        }
        await registrarEntregaSaida({
            escola_id: novaEntregaEscolaId,
            observacoes: '',
            itens: novaEntregaItens.map(ni => ({ item_id: ni.itemId, quantidade: ni.quantidade }))
        });

        await carregarDados(); // Recarrega saldos e histórico
        setIsNovaEntrega(false);
        setNovaEntregaEscolaId('');
        setNovaEntregaItens([]);
        setEditingEntregaId(null);
    } catch(e) {
        alert('Erro ao salvar entrega.');
    } finally {
        setIsSavingDelivery(false);
    }
  };

  const handleEditEntrega = (entrega: any) => {
    setIsNovaEntrega(true);
    setEditingEntregaId(entrega.id);
    setNovaEntregaEscolaId(entrega.escola_id);
    const itens = (entrega.merenda_entrega_itens || []).map((i: any) => ({
      itemId: i.item_id,
      quantidade: i.quantidade
    }));
    setNovaEntregaItens(itens);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntrega = (entregaId: string) => {
    setDeliveryToDelete(entregaId);
  };

  const confirmDeleteEntrega = async () => {
    if (!deliveryToDelete) return;
    setIsDeletingDelivery(true);
    try {
      await excluirEntregaMerenda(deliveryToDelete);
      await carregarDados();
      setDeliveryToDelete(null);
    } catch (e: any) {
      alert('Erro ao excluir entrega.');
    } finally {
      setIsDeletingDelivery(false);
    }
  };

  const handlePrintEntrega = (entrega: any) => {
    const evt = { ...entrega, escolaNome: escolas.find((e: any) => e.id === entrega.escola_id)?.nome };
    setPrintingEntrega(evt);
    setTimeout(() => {
      window.print();
      setPrintingEntrega(null);
    }, 500);
  };

  const filteredEstoque = estoque.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Utensils className="w-8 h-8 text-brand-orange" />
            Merenda Escolar
            {loading && <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />}
          </h2>
          <p className="text-slate-500 mt-1">Gestão de estoque integrada em tempo real e rastreabilidade</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
             <button 
              onClick={() => {
                setActiveTab('entregas');
                setIsNovaEntrega(true);
              }}
              className="px-4 py-2 bg-brand-orange text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-lg shadow-brand-orange/20"
            >
              <Truck className="w-5 h-5" />
              Registrar Entrega
            </button>
          </div>
        )}
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
          <p className="text-sm text-amber-800 font-medium">Você está visualizando o módulo mas o BD pode estar com poucos dados. Realize testes!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('estoque'); setIsNovaEntrega(false); }}
          className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'estoque'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque Central
        </button>
        <button
          onClick={() => setActiveTab('entregas')}
          className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'entregas'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Entregas
        </button>
        <button
          onClick={() => { setActiveTab('mapa'); setIsNovaEntrega(false); }}
          className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'mapa'
              ? 'border-brand-orange text-brand-orange'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Mapa de Abastecimento
        </button>
      </div>

      {/* Estoque Central */}
      {activeTab === 'estoque' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800">Itens em Estoque</h3>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar item ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange w-full"
                />
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm">
                      <FileType className="w-4 h-4 text-brand-orange" /> <span className="hidden md:inline">Importar XML/CSV</span>
                  </button>
                  <button onClick={handleOpenAddItem} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition">
                      <Plus className="w-4 h-4" /> <span className="hidden md:inline">Adicionar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Item</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Estoque Atual</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Última Atualização</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstoque.length === 0 && !loading ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-slate-500">Nenhum item encontrado no estoque ou aguardando conexão.</td></tr>
                ) : (
                  filteredEstoque.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{item.nome}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Acumulado total de entradas: {item.estoque_inicial}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black text-slate-800`}>
                              {item.estoque_atual}
                            </span>
                            <span className="text-xs font-bold text-slate-400">{item.unidade}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Meta: {item.estoque_ideal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                           const percentage = (item.estoque_atual / item.estoque_ideal) * 100;
                           let statusText = 'Adequado';
                           let statusClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                           
                           if (percentage <= 5) {
                               statusText = 'Crítico';
                               statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';
                           } else if (percentage <= 10) {
                               statusText = 'Urgente';
                               statusClass = 'bg-orange-50 text-orange-700 border border-orange-200';
                           } else if (percentage <= 20) {
                               statusText = 'Atenção';
                               statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                           }

                           return (
                             <div className="flex flex-col items-center gap-1">
                               <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${statusClass}`}>
                                 {statusText}
                               </span>
                               <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(1)}%</span>
                             </div>
                           );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(item.ultima_atualizacao).toLocaleDateString('pt-BR')} às {new Date(item.ultima_atualizacao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenEditItem(item)} className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition" title="Registro e Edição">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id, item.nome)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir Definitivamente">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Nova Entrega Form */}
          {isNovaEntrega && (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-orange/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange" />
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <PackageOpen className="w-5 h-5 text-brand-orange" />
                    Registrar Nova Entrega para Escola
                  </h3>
                  <button onClick={() => setIsNovaEntrega(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 bg-slate-50/50">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione a Escola Destino</label>
                  <select
                    value={novaEntregaEscolaId}
                    onChange={(e) => setNovaEntregaEscolaId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-3 font-medium transition-all"
                  >
                    <option value="" disabled>Escolha uma escola</option>
                    {escolas.map(esc => (
                      <option key={esc.id} value={esc.id}>{esc.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Itens da Expedição</h4>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Item do Estoque</label>
                      <select 
                        value={novoItemSelecao}
                        onChange={(e) => setNovoItemSelecao(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                      >
                        <option value="">Selecione um item disponível</option>
                        {estoque.map(item => (
                          <option key={item.id} value={item.id} disabled={item.estoque_atual <= 0}>
                            {item.nome} (Saldo Físico: {item.estoque_atual} {item.unidade}) {item.estoque_atual <= 0 ? '🚫' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 shrink-0">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Qtd.</label>
                      <input 
                        type="number"
                        min="1"
                        onInput={(e: any) => { if(e.target.value.length > 4) e.target.value = e.target.value.slice(0,4); }}
                        value={novoItemQuantidade}
                        onChange={(e) => setNovoItemQuantidade(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                        placeholder="Ex: 10"
                      />
                    </div>
                    <button 
                      onClick={handleAddItemToDelivery}
                      disabled={!novoItemSelecao || !novoItemQuantidade}
                      className="w-full md:w-auto px-4 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>

                  {novaEntregaItens.length > 0 ? (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold text-xs">
                          <tr>
                            <th className="px-4 py-2">Item</th>
                            <th className="px-4 py-2 text-right">Quantidade</th>
                            <th className="px-4 py-2 text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {novaEntregaItens.map(ni => {
                            const ref = estoque.find(e => e.id === ni.itemId);
                            return (
                              <tr key={ni.itemId}>
                                <td className="px-4 py-3 font-medium text-slate-800">{ref?.nome}</td>
                                <td className="px-4 py-3 text-right font-bold text-brand-orange">{ni.quantidade} <span className="text-xs text-slate-400 font-normal">{ref?.unidade}</span></td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => handleRemoveItemFromDelivery(ni.itemId)} className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1">
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Nenhum item adicionado à entrega.
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button 
                    onClick={handleSaveDelivery}
                    disabled={!novaEntregaEscolaId || novaEntregaItens.length === 0 || isSavingDelivery}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingDelivery ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Finalizar Entrega & Baixa Estoque
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Deliveries */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Histórico de Entregas Realizadas</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entregas.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm">
                  {loading ? 'Carregando banco de dados...' : 'Nenhuma entrega registrada no Supabase.'}
                </div>
              ) : (
                entregas.map(entrega => {
                  const escolaDestino = escolas.find(e => e.id === entrega.escola_id);
                  return (
                    <div key={entrega.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                      <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destino</p>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{escolaDestino?.nome || 'Escola Desconhecida'}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => handlePrintEntrega(entrega)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition" title="Imprimir Relatório">
                               <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditEntrega(entrega)} className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-slate-100 rounded-lg transition" title="Editar Expedição">
                               <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteEntrega(entrega.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition" title="Excluir Expedição">
                               <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 mb-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 mb-2">ITENS ENVIADOS:</p>
                        {entrega.merenda_entrega_itens && entrega.merenda_entrega_itens.map((i: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 border-dashed pb-1">
                             <span className="text-slate-600 line-clamp-1">{i.merenda_itens?.nome}</span>
                             <span className="font-bold text-slate-800">{i.quantidade} <span className="text-slate-400 font-normal text-xs">{i.merenda_itens?.unidade}</span></span>
                           </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(entrega.data).toLocaleDateString()}
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                          {entrega.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapa de Abastecimento (Ciclo 15 dias) */}
      {activeTab === 'mapa' && (() => {
         const previsoes = escolas.map(escola => {
           const schoolDeliveries = entregas.filter(e => e.escola_id === escola.id);
           let lastDeliveryDate: Date | null = null;
           let nextDeliveryDate: Date | null = null;
           let daysRemaining: number | null = null;
           let status = 'Sem Registro';
           let sortPriority = 1;
           let colorClass = 'bg-slate-50 text-slate-600 border-slate-200';

           if (schoolDeliveries.length > 0) {
             lastDeliveryDate = new Date(schoolDeliveries[0].data);
             
             // Cria data da proxima entrega (+15 dias)
             nextDeliveryDate = new Date(lastDeliveryDate.getTime() + (15 * 24 * 60 * 60 * 1000));
             
             const today = new Date();
             today.setHours(0,0,0,0);
             const target = new Date(nextDeliveryDate);
             target.setHours(0,0,0,0);
             
             daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
             
             if (daysRemaining < 0) {
                 status = 'Atrasado';
                 sortPriority = 0;
                 colorClass = 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm shadow-rose-100/50';
             } else if (daysRemaining <= 5) {
                 status = 'Atenção';
                 sortPriority = 2;
                 colorClass = 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm shadow-amber-100/50';
             } else {
                 status = 'Em Dia';
                 sortPriority = 3;
                 colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm shadow-emerald-100/50';
             }
           }

           return { escola, lastDeliveryDate, nextDeliveryDate, daysRemaining, status, sortPriority, colorClass };
         });

         previsoes.sort((a, b) => {
            if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
            if (a.daysRemaining !== null && b.daysRemaining !== null) return a.daysRemaining - b.daysRemaining;
            return 0;
         });

         return (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-brand-orange" />
                    Mapa de Abastecimento (Ciclo de 15 Dias)
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Painel logístico atualizado em tempo real. Escolas que demandam reposição aparecem no topo.
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
                  {previsoes.map((prev, idx) => (
                     <div key={prev.escola.id} className={`border rounded-xl p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md ${prev.colorClass}`}>
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <h4 className="font-bold text-sm tracking-tight line-clamp-2 pr-2">{prev.escola.nome}</h4>
                          <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full whitespace-nowrap bg-white/60 border border-current shadow-sm`}>
                             {prev.status}
                          </span>
                        </div>
                        
                        <div className="flex-1 space-y-3 text-xs font-medium opacity-90 mb-5">
                          <div className="flex justify-between border-b border-current pb-2 border-opacity-10">
                            <span>Última Entrega:</span>
                            <span className="font-bold">
                               {prev.lastDeliveryDate ? prev.lastDeliveryDate.toLocaleDateString('pt-BR') : 'Nenhuma'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-current pb-2 border-opacity-10">
                            <span>Previsão (15d):</span>
                            <span className="font-bold">
                               {prev.nextDeliveryDate ? prev.nextDeliveryDate.toLocaleDateString('pt-BR') : 'Indefinido'}
                            </span>
                          </div>
                          {prev.daysRemaining !== null ? (
                            <div className="flex justify-between pt-1">
                              <span>Prazo Restante:</span>
                              <span className="font-black text-sm">
                                 {prev.daysRemaining < 0 
                                     ? `${Math.abs(prev.daysRemaining)} dias em atraso`
                                     : `${prev.daysRemaining} dias`}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between pt-1">
                              <span>Prazo Restante:</span>
                              <span className="font-black text-sm">Escola s/ Histórico</span>
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <button 
                            onClick={() => {
                                setActiveTab('entregas');
                                setIsNovaEntrega(true);
                                setNovaEntregaEscolaId(prev.escola.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-2.5 bg-white/60 hover:bg-white text-current rounded-lg text-xs font-black flex items-center justify-center gap-2 transition border border-white/50 shadow-sm"
                          >
                             <Truck className="w-4 h-4" />
                             {prev.status === 'Sem Registro' ? 'Primeira Entrega' : 'Registrar Nova Entrega'}
                          </button>
                        )}
                     </div>
                  ))}
                </div>
             </div>
         );
      })()}

      {/* Item Modal Completamente Reformulado para Entradas e Histórico */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in relative mt-10">
            <div className="sticky top-0 bg-white p-5 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-orange" />
                {editingItem ? 'Gerenciamento do Item' : 'Criar Novo Item'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 bg-slate-50 hover:bg-rose-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Form de Dados Base */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                     Dados do Cadastro
                     {editingItem && (
                         <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="text-slate-500">Saldo Atual: <strong className="text-brand-orange text-sm ml-1">{editingItem.estoque_atual} {editingItem.unidade}</strong></span>
                            <span className="text-slate-500">Total Entradas: <strong className="text-slate-800 text-sm ml-1">{editingItem.estoque_inicial}</strong></span>
                         </div>
                     )}
                 </h4>
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Item <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={itemForm.nome}
                            onChange={e => setItemForm({...itemForm, nome: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-2.5 transition-all"
                            placeholder="Ex: Arroz Tipo 1"
                        />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria <span className="text-rose-500">*</span></label>
                        <select
                            value={itemForm.categoria}
                            onChange={e => setItemForm({...itemForm, categoria: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-2.5 transition-all"
                        >
                            <option value="">Selecione uma categoria...</option>
                            <option value="Grãos">Grãos</option>
                            <option value="Massas">Massas</option>
                            <option value="Proteínas">Proteínas</option>
                            <option value="Laticínios">Laticínios</option>
                            <option value="Hortifruti">Hortifruti</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Outros">Outros</option>
                        </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" title="Capacidade máxima/ideal do estoque">Capacid. <span className="text-rose-500">*</span></label>
                        <input
                            type="number"
                            min="1"
                            value={itemForm.estoqueIdeal}
                            onChange={e => setItemForm({...itemForm, estoqueIdeal: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-2.5 transition-all"
                            placeholder="Ex: 2000"
                        />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unidade <span className="text-rose-500">*</span></label>
                        <select
                            value={itemForm.unidade}
                            onChange={e => setItemForm({...itemForm, unidade: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-2.5 transition-all"
                        >
                            <option value="kg">Quilogramas (kg)</option>
                            <option value="L">Litros (L)</option>
                            <option value="unid">Unidades</option>
                            <option value="pacote">Pacotes</option>
                            <option value="caixa">Caixas</option>
                        </select>
                        </div>
                        
                        {!editingItem && (
                           <>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Qtd de Início</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={novoItemQtdInicial}
                                    onChange={e => setNovoItemQtdInicial(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 focus:border-brand-orange block p-2.5 transition-all"
                                    placeholder="Opcional. Ex: 100"
                                />
                             </div>
                             {Number(novoItemQtdInicial) > 0 && (
                                 <div className="lg:col-span-3">
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Origem da Entrada do Estoque Inicial</label>
                                      <select
                                        value={novoItemOrigemInicial}
                                        onChange={e => setNovoItemOrigemInicial(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-orange/20 block p-2.5"
                                    >
                                        <option value="Licitação">Licitação</option>
                                        <option value="Agricultura Familiar">Agricultura Familiar</option>
                                    </select>
                                 </div>
                             )}
                           </>
                        )}
                    </div>
                </div>
                 
                 <div className="mt-5 flex justify-end">
                    <button
                        onClick={handleSaveItem}
                        disabled={!itemForm.nome || !itemForm.categoria || !itemForm.estoqueIdeal}
                        className="px-5 py-2.5 bg-brand-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {editingItem ? 'Salvar Alterações Base' : 'Cadastrar na Base'}
                    </button>
                 </div>
              </div>

              {/* Registro Manual de Entradas */}
              {editingItem && (
                 <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <h4 className="text-sm font-bold text-emerald-900 mb-4 border-b border-emerald-200/50 pb-2">
                        📥 Registro de Nova Entrada de [{editingItem.nome}]
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                           <label className="block text-xs font-bold text-emerald-700/80 mb-1">Quantidade <span className="text-rose-500">*</span></label>
                           <input 
                             type="number"
                             min="1"
                             value={novaEntradaForm.quantidade}
                             onChange={e => setNovaEntradaForm({...novaEntradaForm, quantidade: e.target.value})}
                             className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                             placeholder="Apenas números..."
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-emerald-700/80 mb-1">Origem da Entrada <span className="text-rose-500">*</span></label>
                           <select 
                             value={novaEntradaForm.origem}
                             onChange={e => setNovaEntradaForm({...novaEntradaForm, origem: e.target.value})}
                             className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                           >
                              <option value="Licitação">Licitação</option>
                              <option value="Agricultura Familiar">Agricultura Familiar</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-emerald-700/80 mb-1">Nota/Observação (Opcional)</label>
                           <input 
                             type="text"
                             value={novaEntradaForm.observacao}
                             onChange={e => setNovaEntradaForm({...novaEntradaForm, observacao: e.target.value})}
                             className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                             placeholder="Ex: NF 1234"
                           />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                       <button
                          onClick={handleSalvarEntrada}
                          disabled={!novaEntradaForm.quantidade}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
                       >
                          <Plus className="w-4 h-4" /> Registrar Suprimento
                       </button>
                    </div>
                 </div>
              )}

              {/* Tabela de Histórico (Só na Edição) */}
              {editingItem && (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <h4 className="text-sm font-bold text-slate-800 p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" /> Histórico de Movimentações
                    </h4>
                    {loadingHistorico ? (
                         <div className="p-8 flex justify-center"><RefreshCw className="w-5 h-5 text-slate-400 animate-spin" /></div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3 text-right">Qtd</th>
                                    <th className="px-4 py-3">Origem/Destino</th>
                                    <th className="px-4 py-3">Obs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historicoMovimentacoes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500 text-sm flex items-center justify-center gap-2 border-none">
                                            <AlertCircle className="w-4 h-4" /> Nenhuma movimentação registrada para este item no sistema ainda.
                                        </td>
                                    </tr>
                                ) : (
                                    historicoMovimentacoes.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-slate-600 whitespace-nowrap">
                                                {new Date(mov.data).toLocaleDateString()} {new Date(mov.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-black ${mov.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                                            </td>
                                            <td className="px-4 py-2">
                                                {mov.tipo === 'entrada' ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${mov.origem_destino === 'Agricultura Familiar' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        ENTRADA: {mov.origem_destino}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rose-100 text-rose-800">
                                                        SAÍDA: {escolas.find(e => e.id === mov.escola_id)?.nome || 'Escola não vinculada'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500 text-xs line-clamp-1 max-w-[120px]" title={mov.observacao}>
                                                {mov.observacao || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                 </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Modal de Importação em Lote via Excel */}
      <ImportMerendaModal 
         isOpen={isImportModalOpen}
         onClose={() => setIsImportModalOpen(false)}
         onSuccess={() => {
             carregarDados();
             // Notificação opcional aqui
         }}
      />

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-up">
            <button onClick={() => setItemToDelete(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Remover Item?</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Esta ação removerá o item <strong className="text-slate-700">{itemToDelete.nome}</strong> e apagará todo o histórico associado. Essa ação é irreversível.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 justify-center">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
                {isDeleting ? 'Removendo...' : 'Sim, Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão de Entrega */}
      {deliveryToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-up">
            <button onClick={() => setDeliveryToDelete(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Excluir Expedição?</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Tem certeza que deseja excluir esta entrega? O saldo de todos os itens do despacho 
                <strong> retornará </strong> ao estoque central.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 justify-center">
              <button 
                onClick={() => setDeliveryToDelete(null)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteEntrega}
                disabled={isDeletingDelivery}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeletingDelivery ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
                {isDeletingDelivery ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relatório Imprimível Renderizado (Oculto em tela, visivel no print) */}
      <PrintableMerendaReport entrega={printingEntrega} responsavel={user?.nome} />
    </div>
  );
};
