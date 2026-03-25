import React, { useState } from 'react';
import { 
    BookOpen, Trophy, Music, Palette, Code, Users, 
    Calendar, Search, Plus, Filter, ChevronRight, 
    Clock, MapPin, Star, Pencil, Trash2
} from 'lucide-react';
import { AtividadeModal } from './AtividadeModal';
import { DiarioAtividadeModal } from './DiarioAtividadeModal';
import { activitiesService, Atividade } from '../services/activitiesService';

const CATEGORIAS = [
    { id: 'esportes', name: 'Esportes', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'artes', name: 'Artes', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'musica', name: 'Música', icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'tecnologia', name: 'Tecnologia', icon: Code, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'reforco', name: 'Reforço', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

interface AtividadesComplementaresProps {
    userEscolaIds?: string[];
    escolaName?: string;
}

export const AtividadesComplementares: React.FC<AtividadesComplementaresProps> = ({ userEscolaIds, escolaName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCat, setSelectedCat] = useState('todas');
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
    const [isDiarioOpen, setIsDiarioOpen] = useState(false);
    const [activityForDiario, setActivityForDiario] = useState<Atividade | null>(null);

    const fetchAtividades = async () => {
        setIsLoading(true);
        try {
            const data = await activitiesService.getAtividades(userEscolaIds);
            setAtividades(data);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAtividades();
    }, [userEscolaIds]);

    const handleSaveAtividade = async (newAtv: Omit<Atividade, 'id' | 'inscritos'>) => {
        try {
            if (editingAtividade) {
                await activitiesService.saveAtividade({ ...newAtv, id: editingAtividade.id });
            } else {
                await activitiesService.saveAtividade(newAtv);
            }
            fetchAtividades();
            setEditingAtividade(null);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving activity:', err);
            alert('Erro ao salvar atividade. Tente novamente.');
        }
    };

    const handleDeleteAtividade = async (id: string, nome: string) => {
        if (confirm(`Tem certeza que deseja excluir a atividade "${nome}"?`)) {
            try {
                await activitiesService.deleteAtividade(id);
                fetchAtividades();
            } catch (err) {
                console.error('Error deleting activity:', err);
                alert('Erro ao excluir atividade.');
            }
        }
    };

    const openEditModal = (atv: Atividade) => {
        setEditingAtividade(atv);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingAtividade(null);
        setIsModalOpen(true);
    };

    const openDiario = (atv: Atividade) => {
        setActivityForDiario(atv);
        setIsDiarioOpen(true);
    };

    const filteredAtividades = atividades.filter(atv => {
        if (!atv) return false;
        const search = searchTerm.toLowerCase();
        const matchesSearch = (atv.nome?.toLowerCase()?.includes(search) || 
                               atv.instrutor?.toLowerCase()?.includes(search) || false);
        const matchesCat = selectedCat === 'todas' || atv.categoria === selectedCat;
        return matchesSearch && matchesCat;
    });

    // Dynamic Stats Calculation
    const totalInscritos = atividades.reduce((sum: number, atv: Atividade) => sum + (atv?.inscritos || 0), 0);
    const totalOficinasAtivas = atividades.filter(a => a?.status === 'Ativa').length;
    const totalVagas = atividades.reduce((sum: number, atv: Atividade) => sum + (atv?.vagas || 0), 0);
    const presencaMedia = totalVagas > 0 ? Math.round((totalInscritos / totalVagas) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                            <BookOpen size={24} />
                        </div>
                        Atividades Complementares
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de oficinas, esportes e projetos extracurriculares</p>
                </div>
                <button 
                    onClick={openNewModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95 self-start md:self-center"
                >
                    <Plus size={20} /> Nova Atividade
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alunos Inscritos</p>
                        <p className="text-2xl font-black text-slate-800">{totalInscritos}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Star size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oficinas Ativas</p>
                        <p className="text-2xl font-black text-slate-800">{totalOficinasAtivas}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unidade Escolar</p>
                        <p className="text-xl font-black text-slate-800 truncate max-w-[200px]" title={escolaName || 'Múltiplas Unidades'}>
                            {escolaName || (userEscolaIds && userEscolaIds.length > 0 ? 'Múltiplas Unidades' : 'Todas as Unidades')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl shadow-slate-200/20 p-4 sticky top-4 z-20">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por atividade ou instrutor..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <button 
                            onClick={() => setSelectedCat('todas')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCat === 'todas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                        >
                            Todas
                        </button>
                        {CATEGORIAS.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCat(cat.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${selectedCat === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                            >
                                <cat.icon size={14} />
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAtividades.map(atv => {
                    const cat = CATEGORIAS.find(c => c.id === atv.categoria);
                    const percentInscritos = (atv.inscritos / atv.vagas) * 100;
                    
                    return (
                        <div key={atv.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col relative">
                            {/* Actions overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(atv);
                                    }}
                                    className="p-2 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100"
                                    title="Editar Atividade"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAtividade(atv.id, atv.nome);
                                    }}
                                    className="p-2 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-100"
                                    title="Excluir Atividade"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${cat?.bg || 'bg-slate-50'} ${cat?.color || 'text-slate-600'}`}>
                                        {cat && <cat.icon size={24} />}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${atv.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {atv.status}
                                    </span>
                                </div>
                                
                                <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{atv.nome}</h3>
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-4">
                                    <Users size={14} />
                                    <span>{atv.instrutor}</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={16} className="text-indigo-400" />
                                        <span className="text-xs font-bold">{atv.diasSemana?.join('/')} {atv.horarioInicio}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={16} className="text-indigo-400" />
                                        <span className="text-xs font-bold">{atv.sala}</span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ocupação</span>
                                        <span className="text-sm font-black text-indigo-600">{atv.inscritos}/{atv.vagas}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${percentInscritos > 90 ? 'bg-rose-500' : percentInscritos > 50 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${percentInscritos}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => openDiario(atv)}
                                className="mt-auto w-full py-4 bg-slate-50 group-hover:bg-indigo-600 transition-colors text-slate-400 group-hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100/50"
                            >
                                Visualizar Diário <ChevronRight size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {filteredAtividades.length === 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-200 py-24 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Filter size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Nenhuma atividade encontrada</h3>
                    <p className="text-slate-500 font-medium">Tente ajustar seus filtros de busca.</p>
                </div>
            )}

            <AtividadeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAtividade}
                atividadeToEdit={editingAtividade}
            />

            <DiarioAtividadeModal 
                isOpen={isDiarioOpen}
                onClose={() => setIsDiarioOpen(false)}
                atividade={activityForDiario}
            />
        </div>
    );
};
