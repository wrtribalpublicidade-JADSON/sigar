import React, { useMemo } from 'react';
import { Escola, Coordenador, StatusMeta } from '../types';
import { AlertTriangle, ArrowRight, CheckCircle, ClipboardList, Users, School, FileText, Activity } from 'lucide-react';
import { Button } from './ui/Button';
import { checkSchoolPendencies } from '../utils';

interface PendingAlertsProps {
    escolas: Escola[];
    coordenador: Coordenador;
    onNavigateToEscola: (escolaId: string) => void;
}

interface Pendency {
    escolaId: string;
    escolaNome: string;
    type: 'MATRICULA' | 'TURMAS' | 'RH' | 'PLANO_ACAO' | 'MONITORAMENTO';
    message: string;
    severity: 'critical' | 'warning';
}

export const PendingAlerts: React.FC<PendingAlertsProps> = ({
    escolas,
    coordenador,
    onNavigateToEscola
}) => {
    // Filter schools linked to this coordinator
    const mySchools = useMemo(() => {
        return escolas.filter(e => coordenador.escolasIds.includes(e.id));
    }, [escolas, coordenador]);

    const pendencies = useMemo(() => {
        const list: Pendency[] = [];

        mySchools.forEach(escola => {
            const schoolPendencies = checkSchoolPendencies(escola);
            schoolPendencies.forEach(p => {
                list.push({
                    escolaId: escola.id,
                    escolaNome: escola.nome,
                    type: p.type,
                    message: p.label,
                    severity: p.severity
                });
            });
        });

        // Sort: Critical first, then by school name
        const sorted = list.sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            return a.escolaNome.localeCompare(b.escolaNome);
        });

        return sorted;
    }, [mySchools]);

    if (pendencies.length === 0) return null;

    const criticalCount = pendencies.filter(p => p.severity === 'critical').length;
    const warningCount = pendencies.filter(p => p.severity === 'warning').length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 animate-fade-in relative group">
            {/* Left accent border */}
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${criticalCount > 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${criticalCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {criticalCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                Atenção, {coordenador.nome.split(' ')[0]}!
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Você possui <span className="font-bold text-slate-800">{pendencies.length} pendências</span> que precisam de sua atenção.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pendencies.map((pendency, index) => (
                        <div
                            key={`${pendency.escolaId}-${pendency.type}-${index}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors group/item"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pendency.type === 'MATRICULA' ? 'bg-blue-100 text-blue-600' :
                                    pendency.type === 'TURMAS' ? 'bg-indigo-100 text-indigo-600' :
                                        pendency.type === 'RH' ? 'bg-purple-100 text-purple-600' :
                                            pendency.type === 'PLANO_ACAO' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-orange-100 text-orange-600'
                                    }`}>
                                    {pendency.type === 'MATRICULA' && <Users className="w-4 h-4" />}
                                    {pendency.type === 'TURMAS' && <School className="w-4 h-4" />}
                                    {pendency.type === 'RH' && <Users className="w-4 h-4" />}
                                    {pendency.type === 'PLANO_ACAO' && <TargetIcon className="w-4 h-4" />}
                                    {pendency.type === 'MONITORAMENTO' && <Activity className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate" title={pendency.escolaNome}>
                                        {pendency.escolaNome}
                                    </p>
                                    <p className={`text-[10px] uppercase font-bold tracking-wide mt-0.5 ${pendency.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`}>
                                        {pendency.message}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onNavigateToEscola(pendency.escolaId)}
                                className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                                title="Resolver"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper icon component since Lucide's Target is already imported as TargetIcon to avoid conflict if needed, 
// strictly checking imports: I used 'Target' icon from lucide-react in App.tsx imports but here I need to import it.
// Wait, I didn't import Target above. Only AlertTriangle, etc.
// Let me update imports.

function TargetIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
