import React, { useState } from 'react';
import { 
    BookOpen, Trophy, Music, Palette, Code, Users, 
    Calendar, Search, Plus, Filter, ChevronRight, 
    Clock, MapPin, Star
} from 'lucide-react';

interface Atividade {
    id: string;
    nome: string;
    categoria: string;
    instrutor: string;
    vagas: number;
    inscritos: number;
    horario: string;
    sala: string;
    status: 'Ativa' | 'Encerrada' | 'Planejada';
}

const CATEGORIAS = [
    { id: 'esportes', name: 'Esportes', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'artes', name: 'Artes', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'musica', name: 'Música', icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'tecnologia', name: 'Tecnologia', icon: Code, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'reforco', name: 'Reforço', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const ATIVIDADES_MOCK: Atividade[] = [
    { id: '1', nome: 'Futsal Masculino', categoria: 'esportes', instrutor: 'Prof. Carlos', vagas: 30, inscritos: 28, horario: 'Seg/Qua 14:00', sala: 'Quadra Poliesportiva', status: 'Ativa' },
    { id: '2', nome: 'Artes Visuais', categoria: 'artes', instrutor: 'Profa. Marina', vagas: 20, inscritos: 15, horario: 'Ter/Qui 15:30', sala: 'Ateliê 02', status: 'Ativa' },
    { id: '3', nome: 'Iniciação à Programação', categoria: 'tecnologia', instrutor: 'Prof. Ricardo', vagas: 15, inscritos: 12, horario: 'Sex 14:00', sala: 'Lab Informática', status: 'Ativa' },
    { id: '4', nome: 'Fanfarra Municipal', categoria: 'musica', instrutor: 'Maestro Silas', vagas: 50, inscritos: 42, horario: 'Sáb 09:00', sala: 'Pátio Coberto', status: 'Ativa' },
    { id: '5', nome: 'Reforço de Matemática', categoria: 'reforco', instrutor: 'Profa. Eliane', vagas: 25, inscritos: 10, horario: 'Qua 16:00', sala: 'Sala 05', status: 'Planejada' },
];

export const AtividadesComplementares: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCat, setSelectedCat] = useState('todas');

    const filteredAtividades = ATIVIDADES_MOCK.filter(a => {
        const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || a.instrutor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCat === 'todas' || a.categoria === selectedCat;
        return matchesSearch && matchesCat;
    });

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
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95 self-start md:self-center">
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
                        <p className="text-2xl font-black text-slate-800">107</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Star size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oficinas Ativas</p>
                        <p className="text-2xl font-black text-slate-800">12</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Média Presença</p>
                        <p className="text-2xl font-black text-slate-800">84%</p>
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
                        <div key={atv.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col">
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
                                        <span className="text-xs font-bold">{atv.horario}</span>
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
                            
                            <button className="mt-auto w-full py-4 bg-slate-50 group-hover:bg-indigo-600 transition-colors text-slate-400 group-hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100/50">
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
        </div>
    );
};
