
import React, { useState, useEffect } from 'react';
import { AccessLog, AuditLog } from '../types';
import { fetchAccessLogs, fetchAuditLogs } from '../services/logService';
import { Search, Filter, Download, ArrowLeft, RefreshCw, Shield, Clock, User, Activity, FileText } from 'lucide-react';

interface AuditLogDashboardProps {
    onBack: () => void;
}

export const AuditLogDashboard: React.FC<AuditLogDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'ACCESS' | 'AUDIT'>('ACCESS');
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterUser, setFilterUser] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDay, setFilterDay] = useState('');

    const MONTHS = [
        { value: '0', label: 'Janeiro' },
        { value: '1', label: 'Fevereiro' },
        { value: '2', label: 'Março' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Maio' },
        { value: '5', label: 'Junho' },
        { value: '6', label: 'Julho' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Setembro' },
        { value: '9', label: 'Outubro' },
        { value: '10', label: 'Novembro' },
        { value: '11', label: 'Dezembro' }
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'ACCESS') {
                const data = await fetchAccessLogs();
                setAccessLogs(data);
            } else {
                const data = await fetchAuditLogs();
                setAuditLogs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const years = React.useMemo(() => {
        const allYears = new Set<string>();
        const logs = activeTab === 'ACCESS' ? accessLogs : auditLogs;
        logs.forEach(log => {
            if (log.created_at) {
                allYears.add(new Date(log.created_at).getFullYear().toString());
            }
        });
        return Array.from(allYears).sort((a, b) => b.localeCompare(a));
    }, [accessLogs, auditLogs, activeTab]);

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const matchesDate = (logDateStr: string) => {
        if (!logDateStr) return false;
        const date = new Date(logDateStr);
        const logYear = date.getFullYear().toString();
        const logMonth = date.getMonth().toString();
        const logDay = date.getDate().toString();

        const matchY = filterYear === '' || logYear === filterYear;
        const matchM = filterMonth === '' || logMonth === filterMonth;
        const matchD = filterDay === '' || logDay === filterDay;

        return matchY && matchM && matchD;
    };

    const filteredAccessLogs = accessLogs.filter(log =>
        (log.user_email?.toLowerCase().includes(filterUser.toLowerCase()) || 
         log.user_name?.toLowerCase().includes(filterUser.toLowerCase()) || 
         log.user_id?.includes(filterUser)) &&
        matchesDate(log.created_at)
    );

    const filteredAuditLogs = auditLogs.filter(log =>
        (log.user_email?.toLowerCase().includes(filterUser.toLowerCase()) || 
         log.user_name?.toLowerCase().includes(filterUser.toLowerCase()) || 
         log.user_id?.includes(filterUser)) &&
        (filterModule === '' || log.module === filterModule) &&
        matchesDate(log.created_at)
    );

    const getAuditDescription = (log: AuditLog) => {
        const actionStr = log.action === 'CREATE' ? 'Cadastrou' : log.action === 'UPDATE' ? 'Alterou' : 'Excluiu';
        
        switch (log.module) {
            case 'ESCOLA':
                return `${actionStr} a escola ${log.details?.nome || log.details?.new?.nome || 'não identificada'}`;
            case 'VISITA':
                return `${actionStr} relatório de visita técnica para a escola ${log.details?.escolaNome || log.details?.escola_nome || 'não identificada'}`;
            case 'COORDENADOR':
                return `${actionStr} o cadastro do coordenador(a) ${log.details?.nome || 'não identificado'}`;
            case 'COORDENADOR_TURMAS':
                return `Vinculou turmas ao coordenador/professor`;
            case 'ESTUDANTE':
                if (log.details?.bulk) {
                    return `Importou ${log.details.count} estudantes em lote na escola ${log.details.school || ''}`;
                }
                return `${actionStr} o estudante ${log.details?.name || 'não identificado'}`;
            case 'TURMA':
                return `${actionStr} a turma ${log.details?.name || log.details?.identificacao || 'não identificada'}`;
            case 'NOTAS':
                return `${actionStr === 'Excluiu' || log.action === 'DELETE' ? 'Apagou' : 'Lançou'} notas da turma ${log.details?.class || ''} (${log.details?.component || ''} - ${log.details?.period || ''})`;
            default:
                return `${actionStr} no módulo ${log.module}`;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-brand-orange transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-orange" />
                        Auditoria e Segurança
                    </h2>
                    <p className="text-slate-500 mt-1">Monitoramento de acesso e alterações no sistema</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-orange transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('ACCESS')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ACCESS'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Logs de Acesso
                </button>
                <button
                    onClick={() => setActiveTab('AUDIT')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'AUDIT'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Logs de Auditoria (Alterações)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Filter className="w-4 h-4" />
                    Filtros:
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário/nome/email..."
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange w-64"
                    />
                </div>

                {activeTab === 'AUDIT' && (
                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                    >
                        <option value="">Todos os Módulos</option>
                        <option value="ESCOLA">Escolas</option>
                        <option value="VISITA">Visitas</option>
                        <option value="COORDENADOR">Coordenadores</option>
                        <option value="TURMA">Turmas</option>
                        <option value="ESTUDANTE">Estudantes</option>
                        <option value="NOTAS">Notas</option>
                    </select>
                )}

                {/* Filtro de Ano */}
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                >
                    <option value="">Todos os Anos</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                {/* Filtro de Mês */}
                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                >
                    <option value="">Todos os Meses</option>
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>

                {/* Filtro de Dia */}
                <select
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                >
                    <option value="">Todos os Dias</option>
                    {days.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'ACCESS' ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Ação</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">IP / User Agent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando logs...</td></tr>
                                ) : filteredAccessLogs.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                                ) : filteredAccessLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-800">{log.user_name || log.user_email || 'N/A'}</div>
                                            {log.user_name && <div className="text-xs text-slate-400">{log.user_email}</div>}
                                            <div className="text-xs text-[10px] text-slate-400">{log.user_id}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {log.status === 'SUCCESS' ? 'Sucesso' : 'Falha'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate" title={log.user_agent}>
                                            <div>IP: {log.ip_address || '-'}</div>
                                            <div className="truncate">{log.user_agent}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Módulo / Ação</th>
                                    <th className="px-6 py-4">Descrição da Atividade</th>
                                    <th className="px-6 py-4">Registro ID</th>
                                    <th className="px-6 py-4">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Carregando auditoria...</td></tr>
                                ) : filteredAuditLogs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                                ) : filteredAuditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-800">{log.user_name || log.user_email || 'N/A'}</div>
                                            {log.user_name && <div className="text-xs text-slate-400">{log.user_email}</div>}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-500">{log.module}</span>
                                                <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-bold ${log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                                                    log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-red-50 text-red-700'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-700 font-medium whitespace-normal max-w-xs">
                                            {getAuditDescription(log)}
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                            {log.record_id?.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500 max-w-sm">
                                            <details>
                                                <summary className="cursor-pointer hover:text-brand-orange">Ver JSON</summary>
                                                <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-[10px] overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
