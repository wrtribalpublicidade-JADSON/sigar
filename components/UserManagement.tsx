import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Shield, Search, Filter, Mail, Edit2, Lock, KeyRound, Plus, Users, UserCheck, AlertCircle, RefreshCw, X, Save } from 'lucide-react';
import { Coordenador, Escola } from '../types';
import { supabase } from '../services/supabase';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ConfirmModal } from './ui/ConfirmModal';
import { useNotification } from '../context/NotificationContext';

interface UserManagementProps {
    userEmail: string | null;
    isAdmin: boolean;
    currentUserRole?: string;
    coordenadores: Coordenador[];
    escolas: Escola[];
    isDemoMode: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ userEmail, isAdmin, currentUserRole, coordenadores, escolas: appEscolas, isDemoMode }) => {
    const { showNotification } = useNotification();
    const [users, setUsers] = useState<Coordenador[]>([]);
    const [escolas, setEscolas] = useState<Escola[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Ativo' | 'Inativo'>('ALL');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Coordenador | null>(null);

    // Edit Form State
    const [editRole, setEditRole] = useState<string>('');
    const [editStatus, setEditStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
    const [editSchools, setEditSchools] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (isDemoMode) {
                setEscolas(appEscolas);
                let mappedUsers = [...coordenadores];
                if (!isAdmin && currentUserRole === 'Coordenador Regional') {
                    const myProfile = mappedUsers.find(u => u.contato === userEmail);
                    if (myProfile) {
                        mappedUsers = mappedUsers.filter(u =>
                            u.id === myProfile.id ||
                            u.escolasIds.some(eid => myProfile.escolasIds.includes(eid))
                        );
                    } else {
                        mappedUsers = [];
                    }
                }
                setUsers(mappedUsers);
                return;
            }

            // Fetch users from coordenadores table
            const { data: coordData, error: coordError } = await supabase
                .from('coordenadores')
                .select('*, coordenador_escolas(escola_id)');

            if (coordError) throw coordError;

            // Map the data
            let mappedUsers: Coordenador[] = coordData?.map((c: any) => ({
                id: c.id,
                nome: c.nome,
                contato: c.contato,
                regiao: c.regiao,
                funcao: c.funcao,
                status: c.status || 'Ativo',
                escolasIds: c.coordenador_escolas?.map((ce: any) => ce.escola_id) || []
            })) || [];

            // Apply RBAC Logic: If not Admin, Coordinator can only see users linked to their schools (or themselves)
            if (!isAdmin && currentUserRole === 'Coordenador Regional') {
                const myProfile = mappedUsers.find(u => u.contato === userEmail);
                if (myProfile) {
                    mappedUsers = mappedUsers.filter(u =>
                        u.id === myProfile.id ||
                        u.escolasIds.some(eid => myProfile.escolasIds.includes(eid))
                    );
                } else {
                    mappedUsers = [];
                }
            }
            setUsers(mappedUsers);

            const { data: schoolData, error: schoolError } = await supabase.from('escolas').select('id, nome');
            if (schoolError) throw schoolError;
            setEscolas((schoolData as any) || []);

        } catch (error: any) {
            console.error(error);
            showNotification('error', 'Erro ao carregar usuários.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isAdmin, userEmail, currentUserRole]);

    // Filtering logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) || user.contato.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
            const matchesRole = roleFilter === 'ALL' || user.funcao === roleFilter;
            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);

    const handleEditUser = (user: Coordenador) => {
        setSelectedUser(user);
        setEditRole(user.funcao || '');
        setEditStatus(user.status || 'Ativo');
        setEditSchools([...user.escolasIds]);
        setIsEditModalOpen(true);
    };

    const handleTriggerPasswordReset = (user: Coordenador) => {
        setSelectedUser(user);
        setIsPasswordModalOpen(true);
    };

    const confirmPasswordReset = async () => {
        if (!selectedUser) return;
        try {
            if (isDemoMode) {
                showNotification('success', `E-mail de redefinição de senha enviado para ${selectedUser.contato}. (Modo Demo - e-mail não enviado real)`);
                setIsPasswordModalOpen(false);
                setSelectedUser(null);
                return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.contato);
            if (error) throw error;
            showNotification('success', `E-mail de redefinição de senha enviado para ${selectedUser.contato}.`);
        } catch (error: any) {
            console.error(error);
            showNotification('error', 'Erro ao enviar e-mail de redefinição.');
        } finally {
            setIsPasswordModalOpen(false);
            setSelectedUser(null);
        }
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            if (isDemoMode) {
                showNotification('success', 'Usuário atualizado com sucesso! (Modo Demo - as alterações não são salvas no servidor)');
                const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, funcao: editRole as any, status: editStatus, escolasIds: editSchools } : u);
                setUsers(updatedUsers);
                setIsEditModalOpen(false);
                setIsSaving(false);
                return;
            }

            const roleToSave = editRole === '' ? null : editRole;
            const { error: profileError } = await supabase
                .from('coordenadores')
                .update({ funcao: roleToSave, status: editStatus })
                .eq('id', selectedUser.id);
            if (profileError) {
                console.error("Profile Update Error:", profileError);
                throw new Error(profileError.message || 'Erro ao atualizar o perfil na base de dados.');
            }

            // Update School Links
            // 1. Delete existing
            const { error: delError } = await supabase
                .from('coordenador_escolas')
                .delete()
                .eq('coordenador_id', selectedUser.id);
            if (delError) throw delError;

            // 2. Insert new
            if (editSchools.length > 0) {
                const inserts = editSchools.map(schoolId => ({
                    coordenador_id: selectedUser.id,
                    escola_id: schoolId
                }));
                const { error: insError } = await supabase
                    .from('coordenador_escolas')
                    .insert(inserts);
                if (insError) throw insError;
            }

            showNotification('success', 'Usuário atualizado com sucesso!');
            setIsEditModalOpen(false);
            loadData(); // Refresh grid
        } catch (error) {
            console.error(error);
            showNotification('error', 'Erro ao salvar modificações no usuário.');
        } finally {
            setIsSaving(false);
        }
    };

    const getSchoolNames = (ids: string[]) => {
        if (!ids || ids.length === 0) return '-';
        const names = ids.map(id => escolas.find(e => e.id === id)?.nome).filter(Boolean);
        if (names.length === 0) return '-';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Gestão de Usuários"
                subtitle="Controle de acessos, perfis e permissões do sistema"
                icon={Shield}
            />

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
                    >
                        <option value="ALL">Todos os Perfis</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Coordenador Regional">Coordenador Regional</option>
                        <option value="Gestor">Gestor</option>
                        <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value="Ativo">Ativos</option>
                        <option value="Inativo">Inativos</option>
                    </select>

                    <Button className="flex items-center gap-2 whitespace-nowrap bg-slate-800 text-white hover:bg-slate-900 border-none shadow-md px-6">
                        <Plus className="w-5 h-5" />
                        Novo Usuário
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden p-0 border-0 shadow-xl bg-white rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-extrabold text-slate-500 tracking-wider">
                                <th className="p-4 pl-6 font-bold w-1/4">Nome e E-mail</th>
                                <th className="p-4 font-bold w-1/6">Perfil</th>
                                <th className="p-4 font-bold w-1/3">Vínculo (Escolas/Região)</th>
                                <th className="p-4 font-bold text-center w-24">Status</th>
                                <th className="p-4 pr-6 font-bold text-right w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-300" />
                                        <p>Carregando usuários...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>Nenhum usuário encontrado com os filtros atuais.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm
                                                    ${user.funcao === 'Administrador' ? 'bg-indigo-100 text-indigo-700' :
                                                        user.funcao === 'Coordenador Regional' ? 'bg-brand-orange/10 text-brand-orange' :
                                                            'bg-slate-100 text-slate-600'}`}>
                                                    {user.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{user.nome}</p>
                                                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                        {user.contato}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <span className="font-semibold text-slate-700">{user.funcao || 'Não Atribuído'}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 line-clamp-2 mt-2" title={getSchoolNames(user.escolasIds)}>
                                            {user.funcao === 'Administrador' ? (
                                                <span className="text-slate-400 italic">Acesso Global</span>
                                            ) : (
                                                getSchoolNames(user.escolasIds)
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap
                                                ${user.status !== 'Inativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.status !== 'Inativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                {user.status || 'Ativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleTriggerPasswordReset(user)}
                                                    className="p-2 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Redefinir Senha"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar Usuário"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ConfirmModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={confirmPasswordReset}
                title="Redefinir Senha"
                message={`Um link de redefinição de senha seguro será enviado para o e-mail: ${selectedUser?.contato}. O usuário precisará acessá-lo para escolher uma nova senha.`}
                icon={Mail}
                variant="warning"
                confirmText="Sim, Enviar Link"
            />

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && setIsEditModalOpen(false)} />

                    <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                                    {selectedUser.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedUser.nome}</h3>
                                    <p className="text-slate-500 text-sm">{selectedUser.contato}</p>
                                </div>
                            </div>
                            <button onClick={() => !isSaving && setIsEditModalOpen(false)} disabled={isSaving} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Perfil de Acesso</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 text-slate-700"
                                        disabled={!isAdmin && selectedUser.funcao === 'Administrador'} // Coordinators can't edit Admins
                                    >
                                        <option value="">Selecione um perfil</option>
                                        {isAdmin && <option value="Administrador">Administrador</option>}
                                        <option value="Coordenador Regional">Coordenador Regional</option>
                                        <option value="Gestor">Gestor(a)</option>
                                        <option value="Coordenador Pedagógico">Coordenador(a) Pedagógico (Local)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Status da Conta</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as any)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 text-slate-700"
                                    >
                                        <option value="Ativo">Ativo (Pode acessar)</option>
                                        <option value="Inativo">Inativo (Sem acesso)</option>
                                    </select>
                                </div>
                            </div>

                            {/* School Links */}
                            {editRole !== 'Administrador' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Vínculo com Escolas</label>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                                        {escolas.map(escola => {
                                            const isLinked = editSchools.includes(escola.id);
                                            return (
                                                <label key={escola.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={isLinked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setEditSchools(prev => [...prev, escola.id]);
                                                            else setEditSchools(prev => prev.filter(id => id !== escola.id));
                                                        }}
                                                        className="w-4 h-4 text-brand-orange rounded border-slate-300 focus:ring-brand-orange"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{escola.nome}</span>
                                                </label>
                                            )
                                        })}
                                        {escolas.length === 0 && <p className="text-sm text-slate-500 italic">Nenhuma escola cadastrada no sistema.</p>}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSaveUser} disabled={isSaving} className="flex items-center gap-2">
                                {isSaving ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
