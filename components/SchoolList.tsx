import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, Segmento, DadosEducacionais, MatriculaDetalhada, DadosNivel } from '../types';
import { MapPin, Users, Download, Plus, Save, X, School as SchoolIcon, AlertCircle, Edit2, Trash2, ChevronRight, Layers, Search, Filter } from 'lucide-react';
import { exportToCSV, generateUUID } from '../utils';
import { generateAcompanhamentoMensal } from '../constants';
import { ConfirmModal } from './ui/ConfirmModal';
import { Button, ActionButton } from './ui/Button';

interface SchoolListProps {
  escolas: Escola[];
  onSelectEscola: (escolaId: string) => void;
  onSave: (escola: Escola) => void;
  onUpdate: (escola: Escola) => void;
  onDelete: (escolaId: string) => void;
}

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

const createEmptyDadosEducacionais = (): DadosEducacionais => ({
  matricula: { infantil: 0, anosIniciais: 0, anosFinais: 0, eja: 0 },
  matriculaDetalhada: createEmptyMatriculaDetalhada(),
  turmas: { manha: 0, tarde: 0, noite: 0 },
  fluxo: { reprovacao: 0, abandono: 0, distorcaoIdadeSerie: 0 },
  avaliacoesExternas: { saeb: 0, seama: 0, ideb: 0 },
  resultadosCNCA: { diagnostica: 0, formativa: 0, somativa: 0 },
  fluenciaLeitoraDetalhada: { samahc: 0, caed: 0, parc: 0 },
  dadosSamahc: { simuladoSeama: 0, simuladoSaeb: 0, fluencia: 0, linguaPortuguesa: 0, matematica: 0 },
  censoEscolar: { matriculaTotal: 0, docentes: 0, turmas: 0 },
  relatorioEI: { desenvolvimento: 0 }
});

const calcTotalAlunos = (escola: Escola): number => {
  const md = escola.dadosEducacionais?.matriculaDetalhada;
  if (!md) return escola.alunosMatriculados || 0;
  let total = 0;
  // Infantil
  if (md.infantil) {
    Object.values(md.infantil).forEach((nivel: any) => {
      if (nivel?.alunos) {
        total += (nivel.alunos.integral || 0) + (nivel.alunos.manha || 0) + (nivel.alunos.tarde || 0);
      }
    });
  }
  // Fundamental
  if (md.fundamental) {
    Object.values(md.fundamental).forEach((nivel: any) => {
      if (nivel?.alunos) {
        total += (nivel.alunos.integral || 0) + (nivel.alunos.manha || 0) + (nivel.alunos.tarde || 0);
      }
    });
  }
  return total;
};

export const SchoolList: React.FC<SchoolListProps> = ({ escolas, onSelectEscola, onSave, onUpdate, onDelete }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Escola>>({
    nome: '',
    gestor: '',
    coordenador: '',
    localizacao: 'Sede',
    alunosMatriculados: 0,
    segmentos: []
  });

  const handleExport = () => {
    const dataToExport = escolas.map(e => ({
      ESCOLA: e.nome,
      GESTOR: e.gestor,
      COORDENADOR: e.coordenador,
      LOCALIZACAO: e.localizacao,
      SEGMENTOS: e.segmentos.join(', '),
      ALUNOS: calcTotalAlunos(e),
      IDEB: e.indicadores.ideb
    }));
    exportToCSV(dataToExport, 'lista_escolas');
  };

  const handleSegmentoToggle = (segmento: Segmento) => {
    const current = formData.segmentos || [];
    const updated = current.includes(segmento)
      ? current.filter(s => s !== segmento)
      : [...current, segmento];
    setFormData({ ...formData, segmentos: updated });
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.gestor) return;
    setShowConfirmModal(true);
  };

  const handleEditClick = (e: React.MouseEvent, escola: Escola) => {
    e.stopPropagation();
    setFormData({
      nome: escola.nome,
      gestor: escola.gestor,
      coordenador: escola.coordenador,
      localizacao: escola.localizacao,
      alunosMatriculados: escola.alunosMatriculados,
      segmentos: escola.segmentos
    });
    setEditingSchoolId(escola.id);
    setIsRegistering(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowDeleteModal(id);
  };

  const handleConfirmDelete = () => {
    if (showDeleteModal) {
      onDelete(showDeleteModal);
      setShowDeleteModal(null);
    }
  };

  const handleConfirmSave = () => {
    if (editingSchoolId) {
      const originalSchool = escolas.find(e => e.id === editingSchoolId);
      if (originalSchool) {
        const updatedSchool: Escola = {
          ...originalSchool,
          nome: formData.nome || '',
          gestor: formData.gestor || '',
          coordenador: formData.coordenador || '',
          localizacao: formData.localizacao || 'Sede',
          alunosMatriculados: Number(formData.alunosMatriculados) || 0,
          segmentos: formData.segmentos || []
        };
        onUpdate(updatedSchool);
      }
    } else {
      const newSchool: Escola = {
        id: generateUUID(),
        nome: formData.nome || '',
        gestor: formData.gestor || '',
        coordenador: formData.coordenador || '',
        localizacao: formData.localizacao || 'Sede',
        alunosMatriculados: Number(formData.alunosMatriculados) || 0,
        segmentos: formData.segmentos || [],
        indicadores: { ideb: 0, frequenciaMedia: 0, fluenciaLeitora: 0, taxaAprovacao: 0 },
        dadosEducacionais: createEmptyDadosEducacionais(),
        planoAcao: [],
        recursosHumanos: [],
        acompanhamentoMensal: generateAcompanhamentoMensal(),
        relatoriosVisita: []
      };
      onSave(newSchool);
    }
    setIsRegistering(false);
    setEditingSchoolId(null);
    setShowConfirmModal(false);
    setFormData({ nome: '', gestor: '', coordenador: '', localizacao: 'Sede', alunosMatriculados: 0, segmentos: [] });
  };

  const filteredEscolas = escolas.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.gestor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isRegistering) {
    return (
      <div className="max-w-5xl 2xl:max-w-6xl mx-auto space-y-8 animate-fade-in relative font-sans pb-20">

        {/* Header */}
        <div className="bg-slate-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center">
                <SchoolIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{editingSchoolId ? 'Editar Escola' : 'Nova Escola'}</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Cadastro e atualização de unidade escolar</p>
              </div>
            </div>
            <button onClick={() => { setIsRegistering(false); setEditingSchoolId(null); }} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all backdrop-blur-sm"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-500">Nome Oficial da Unidade</label>
                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder-slate-300" placeholder="Nome completo da escola" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
              </div>

              {[{ key: 'gestor', label: 'Gestor(a) Geral' }, { key: 'coordenador', label: 'Coordenador(a)' }].map(f => (
                <div key={f.key} className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">{f.label}</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                </div>
              ))}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Localização</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={formData.localizacao} onChange={e => setFormData({ ...formData, localizacao: e.target.value })}>
                  <option value="Sede">Sede</option>
                  <option value="Zona Rural">Zona Rural</option>
                  <option value="Litoral">Litoral</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Capacidade de Alunos</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" value={formData.alunosMatriculados} onChange={e => setFormData({ ...formData, alunosMatriculados: Number(e.target.value) })} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Modalidades de Ensino</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[Segmento.INFANTIL, Segmento.FUNDAMENTAL_I, Segmento.FUNDAMENTAL_II].map(seg => {
                  const isActive = formData.segmentos?.includes(seg);
                  return (
                    <button key={seg} type="button" onClick={() => handleSegmentoToggle(seg)} className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${isActive ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isActive ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                        <SchoolIcon size={18} />
                      </div>
                      <span className={`text-xs font-bold uppercase ${isActive ? 'text-orange-700' : 'text-slate-500'}`}>{seg}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsRegistering(false)} className="px-6 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-sm">Cancelar</button>
            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all">
              <Save className="w-5 h-5" /> Salvar Dados
            </button>
          </div>
        </form>

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSave}
          title={editingSchoolId ? 'Confirmar Edição' : 'Confirmar Cadastro'}
          message={editingSchoolId ? 'Deseja salvar as alterações realizadas nesta escola?' : 'Deseja cadastrar esta nova unidade escolar?'}
          icon={Save}
          variant="success"
          confirmText="Salvar"
          cancelText="Cancelar"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      <PageHeader
        title="Gestão de Escolas"
        subtitle="Administração e Monitoramento das Unidades Escolares"
        icon={SchoolIcon}
        badgeText={`${escolas.length} Unidades Ativas`}
        actions={[
          { label: 'Exportar', icon: Download, onClick: handleExport, variant: 'secondary' },
          { label: 'Nova Escola', icon: Plus, onClick: () => setIsRegistering(true), variant: 'primary' }
        ]}
      />

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, gestor ou localização..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 pl-12 pr-4 py-2.5 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-5">
        {filteredEscolas.map((escola) => (
          <div key={escola.id} onClick={() => onSelectEscola(escola.id)} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden">
            <div className="p-4 pb-3 border-b border-slate-50">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-orange-400 font-bold text-lg shadow-md">
                  {escola.nome.charAt(0)}
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold ${escola.indicadores.ideb >= 5.5 ? 'bg-emerald-100 text-emerald-700' : escola.indicadores.ideb >= 4.5 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                    IDEB {escola.indicadores.ideb > 0 ? escola.indicadores.ideb.toFixed(1) : '-'}
                  </div>
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-800 leading-tight mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem]">{escola.nome}</h3>
              <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {escola.localizacao}</p>
            </div>

            <div className="p-4 pt-3 flex-1 flex flex-col justify-end space-y-2">
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gestor(a)</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{escola.gestor}</p>
                </div>
              </div>
              {(escola.recursosHumanos?.length > 0) && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    {escola.recursosHumanos.filter(r => r.tipoVinculo === 'Efetivo').length} Efetivos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                    {escola.recursosHumanos.filter(r => r.tipoVinculo === 'Contratado').length} Contratados
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2">
                <span className="text-xs font-medium text-slate-500">{calcTotalAlunos(escola)} alunos</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-200">
                  <button onClick={e => handleEditClick(e, escola)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"><Edit2 size={16} /></button>
                  <button onClick={e => handleDeleteClick(e, escola.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleConfirmDelete}
        title="PURGE_RECORD?"
        message="This operation will irreversibly expunge the unit and all associated data logs from the system core."
        icon={Trash2}
        variant="danger"
      />
    </div>
  );
};
