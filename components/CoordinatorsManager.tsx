import React, { useState } from 'react';
import { Coordenador, Escola, StatusMeta, Visita } from '../types';
import {
  UserPlus, Edit2, Trash2, MapPin, Mail, School as SchoolIcon,
  Save, X, ClipboardList, ArrowLeft, AlertTriangle, CheckCircle,
  TrendingUp, BookOpen, Target, ShieldCheck, User, Download, Users
} from 'lucide-react';
import { exportToCSV, checkSchoolPendencies } from '../utils';
import { ConfirmModal } from './ui/ConfirmModal';

interface CoordinatorsManagerProps {
  coordenadores: Coordenador[];
  escolas: Escola[];
  visitas: Visita[];
  onSave: (coord: Coordenador) => void;
  onDelete: (id: string) => void;
}

export const CoordinatorsManager: React.FC<CoordinatorsManagerProps> = ({
  coordenadores, escolas, visitas, onSave, onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [viewSummaryCoord, setViewSummaryCoord] = useState<Coordenador | null>(null);
  const [formData, setFormData] = useState<Coordenador | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleCreate = () => {
    setFormData({ id: '', nome: '', contato: '', regiao: '', funcao: 'Coordenador Regional', escolasIds: [] });
    setViewSummaryCoord(null);
    setIsEditing(true);
  };

  const handleEdit = (coord: Coordenador) => {
    setFormData({ ...coord, funcao: coord.funcao || 'Coordenador Regional' });
    setViewSummaryCoord(null);
    setIsEditing(true);
  };

  const handleViewSummary = (coord: Coordenador) => { setViewSummaryCoord(coord); setIsEditing(false); };
  const handleToggleEscola = (escolaId: string) => {
    if (!formData) return;
    const newIds = formData.escolasIds.includes(escolaId) ? formData.escolasIds.filter(id => id !== escolaId) : [...formData.escolasIds, escolaId];
    setFormData({ ...formData, escolasIds: newIds });
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData) { onSave(formData); setIsEditing(false); setFormData(null); } };
  const confirmDelete = () => { if (deleteConfirmationId) { onDelete(deleteConfirmationId); setDeleteConfirmationId(null); } };
  const handleExport = () => {
    const dataToExport = coordenadores.map(c => {
      const escolasDoCoord = escolas.filter(e => c.escolasIds.includes(e.id));
      const totalPendencias = escolasDoCoord.reduce((sum, escola) => sum + checkSchoolPendencies(escola).length, 0);

      return {
        NOME: c.nome, EMAIL: c.contato, FUNCAO: c.funcao || 'Coordenador Regional', REGIAO: c.regiao,
        QTD_ESCOLAS: c.escolasIds.length,
        PENDENCIAS: totalPendencias,
        ESCOLAS_VINCULADAS: escolasDoCoord.map(e => e.nome).join(', ')
      };
    });
    exportToCSV(dataToExport, 'lista_usuarios_sistema');
  };

  if (viewSummaryCoord) {
    const escolasVinculadas = escolas.filter(e => viewSummaryCoord.escolasIds.includes(e.id));
    const metasAtrasadas = escolasVinculadas.flatMap(escola => escola.planoAcao.filter(meta => meta.status === StatusMeta.ATRASADO).map(meta => ({ ...meta, escolaNome: escola.nome })));

    return (
      <div className="max-w-5xl 2xl:max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-4 md:p-5 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
            <button onClick={() => setViewSummaryCoord(null)} className="p-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider rounded-full border border-orange-500/30">
                Monitoramento
              </span>
              <h2 className="text-2xl font-black text-white mt-2">Região: {viewSummaryCoord.regiao}</h2>
              <p className="text-slate-400 text-sm">Coordenador: <span className="font-semibold text-orange-400">{viewSummaryCoord.nome}</span></p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
              <SchoolIcon className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Escolas Vinculadas</p>
              <p className="text-3xl font-black text-slate-800">{escolasVinculadas.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Metas Atrasadas</p>
              <p className="text-3xl font-black text-red-600">{metasAtrasadas.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Região</p>
              <p className="text-lg font-bold text-slate-800">{viewSummaryCoord.regiao}</p>
            </div>
          </div>
        </div>

        {/* Indicators Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="font-bold text-slate-800">Indicadores das Escolas</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escolasVinculadas.map(escola => (
              <div key={escola.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition hover:border-orange-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-700 text-sm truncate w-3/4">{escola.nome}</h4>
                  <div className={`text-right ${escola.indicadores.ideb >= 4.5 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    <span className="text-xs font-bold uppercase">IDEB</span>
                    <br />
                    <span className="text-xl font-black">{escola.indicadores.ideb}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Fluência</span>
                      <span className="font-semibold">{escola.indicadores.fluenciaLeitora}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${escola.indicadores.fluenciaLeitora}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 flex items-center gap-1"><Target className="w-3 h-3" /> Aprovação</span>
                      <span className="font-semibold">{escola.indicadores.taxaAprovacao}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${escola.indicadores.taxaAprovacao}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delayed Goals */}
        {metasAtrasadas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100 bg-red-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-red-800">Metas Atrasadas</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {metasAtrasadas.map((meta, idx) => (
                <div key={`${meta.id}-${idx}`} className="p-4 hover:bg-red-50/30 transition">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded mr-2">{meta.escolaNome}</span>
                  <span className="font-medium text-slate-800">{meta.descricao}</span>
                  <span className="text-xs text-red-600 ml-2">(Prazo: {meta.prazo})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isEditing && formData) {
    return (
      <div className="max-w-5xl 2xl:max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                {formData.id ? <Edit2 className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{formData.id ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <p className="text-slate-400 text-sm">Preencha os dados do profissional</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo</label>
              <input type="text" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 border px-4 py-2.5" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
              <input type="email" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 border px-4 py-2.5" value={formData.contato} onChange={e => setFormData({ ...formData, contato: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Função</label>
              <select className="w-full rounded-xl border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 border px-4 py-2.5" value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value as any })}>
                <option value="Coordenador Regional">Coordenador Regional</option>
                <option value="Administrador">Administrador</option>
                <option value="Técnico">Técnico Pedagógico</option>
                <option value="Professor">Professor</option>
                <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                <option value="Gestor Geral">Gestor Geral</option>
                <option value="Gestor Pedagógico">Gestor Pedagógico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Região</label>
              <input type="text" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 border px-4 py-2.5" value={formData.regiao} onChange={e => setFormData({ ...formData, regiao: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <SchoolIcon className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="font-bold text-slate-800">Vincular Escolas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {escolas.map(escola => {
                const isSelected = formData.escolasIds.includes(escola.id);
                return (
                  <div
                    key={escola.id}
                    onClick={() => handleToggleEscola(escola.id)}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition ${isSelected ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200 hover:border-orange-200'}`}
                  >
                    <div>
                      <span className={`font-semibold text-sm ${isSelected ? 'text-orange-800' : 'text-slate-700'}`}>{escola.nome}</span>
                      <br />
                      <span className="text-xs text-slate-500">{escola.localizacao}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition flex items-center gap-2 font-semibold shadow-lg shadow-orange-500/20">
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-4 md:p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider rounded-full border border-orange-500/30">
                Administração
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">Gestão de Usuários</h2>
            <p className="text-slate-400 text-sm mt-1">Profissionais com acesso ao sistema SIGAR</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition font-medium text-sm">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={handleCreate} className="flex-1 md:flex-none bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 font-semibold">
              <UserPlus className="w-4 h-4" /> Novo
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuário</th>
                <th className="px-6 py-4 font-semibold">E-mail</th>
                <th className="px-6 py-4 font-semibold">Função</th>
                <th className="px-6 py-4 font-semibold">Região</th>
                <th className="px-6 py-4 font-semibold text-center">Escolas</th>
                <th className="px-6 py-4 font-semibold text-center">Pendências</th>
                <th className="px-6 py-4 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coordenadores.map(coord => {
                const escolasDoCoord = escolas.filter(e => coord.escolasIds.includes(e.id));
                const totalPendencias = escolasDoCoord.reduce((sum, escola) => sum + checkSchoolPendencies(escola).length, 0);

                return (
                  <tr key={coord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-orange-400 font-bold shrink-0">
                          {coord.nome.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{coord.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />{coord.contato}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${coord.funcao === 'Administrador' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                        {coord.funcao === 'Administrador' && <ShieldCheck className="w-3 h-3 inline mr-1" />}{coord.funcao || 'Coordenador'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />{coord.regiao}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{coord.escolasIds.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-bold px-3 py-1 rounded-full ${totalPendencias > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {totalPendencias}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleViewSummary(coord)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Monitorar">
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(coord)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmationId(coord.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remover">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal isOpen={deleteConfirmationId !== null} onClose={() => setDeleteConfirmationId(null)} onConfirm={confirmDelete} title="Remover Usuário?" message="Esta ação removerá o acesso do profissional." icon={Trash2} iconColor="red" confirmText="Sim, Remover" cancelText="Cancelar" variant="danger" />
    </div>
  );
};
