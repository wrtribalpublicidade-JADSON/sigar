import { supabase } from './supabase';
import { ChamadoSuporte, MensagemSuporte, StatusSuporte, PrioridadeSuporte, CategoriaSuporte } from '../types';
import { logAudit } from './logService';
import { generateUUID } from '../utils';

const STORAGE_KEY = 'sigar_suporte_chamados_cache';

// Mock initial data for demo mode or local offline testing
const MOCK_CHAMADOS: ChamadoSuporte[] = [
    {
        id: 'mock-1',
        protocolo: 'SUP-2026-1042',
        usuario_id: 'user-1',
        usuario_nome: 'ERALDINA MENDES CARVALHO',
        usuario_email: 'eraldinamendes@gmail.com',
        usuario_funcao: 'Coordenador Regional',
        usuario_contato: '(98) 98845-1234',
        escola_id: '1',
        escola_nome: 'UNIDADE INTEGRADA MUNICIPAL PROFESSORA MARIA DO SOCORRO',
        categoria: 'Diário de Classe',
        prioridade: 'Alta',
        assunto: 'Dificuldade para homologar notas do 1º Bimestre',
        descricao: 'Alguns professores da regional estão relatando lentidão ao tentar salvar o fechamento das notas no diário do fundamental.',
        status: 'Em Atendimento',
        atendente_nome: 'Jadson Carlos (Administrador)',
        resposta_admin: 'Estamos analisando a sincronização dos registros. Ajuste em andamento.',
        mensagens: [
            {
                id: 'm-1',
                autor_nome: 'ERALDINA MENDES CARVALHO',
                autor_email: 'eraldinamendes@gmail.com',
                autor_tipo: 'USUARIO',
                mensagem: 'Olá Administrador, preciso de suporte para verificar a lentidão no fechamento das notas da Regional 01.',
                created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
            },
            {
                id: 'm-2',
                autor_nome: 'Jadson Carlos (Administrador)',
                autor_email: 'jadsoncsilv@gmail.com',
                autor_tipo: 'ADMIN',
                mensagem: 'Olá Eraldina! Identificamos que a fila de sincronização estava sobrecarregada. Já realizamos a otimização no servidor.',
                created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
            }
        ],
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
    },
    {
        id: 'mock-2',
        protocolo: 'SUP-2026-1055',
        usuario_id: 'user-2',
        usuario_nome: 'MARIA FRANCISCA DA SILVA DOS SANTOS',
        usuario_email: 'tecasantos985@gmail.com',
        usuario_funcao: 'Professor',
        usuario_contato: '(98) 98712-3456',
        categoria: 'Cadastro e Permissões',
        prioridade: 'Média',
        assunto: 'Solicitação de vinculação de nova turma no Polo 10',
        descricao: 'Favor liberar acesso para a turma de 4º ano B do turno vespertino para preenchimento de frequência.',
        status: 'Aberto',
        mensagens: [
            {
                id: 'm-3',
                autor_nome: 'MARIA FRANCISCA DA SILVA DOS SANTOS',
                autor_email: 'tecasantos985@gmail.com',
                autor_tipo: 'USUARIO',
                mensagem: 'Boa tarde, peço a gentileza de vincular meu usuário à turma do 4º ano B vespertino para que eu possa lançar o diário.',
                created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
            }
        ],
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
    }
];

function getLocalCache(): ChamadoSuporte[] {
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) {
            return JSON.parse(item);
        }
    } catch (e) {
        console.error('Erro ao ler cache local de suporte:', e);
    }
    return MOCK_CHAMADOS;
}

function saveLocalCache(chamados: ChamadoSuporte[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chamados));
    } catch (e) {
        console.error('Erro ao gravar cache local de suporte:', e);
    }
}

/**
 * Gera um número de protocolo único legível
 */
export function generateProtocolo(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `SUP-${year}-${randomNum}`;
}

/**
 * Busca a lista de chamados de suporte técnico
 */
export async function fetchChamados(
    userEmail?: string | null,
    isAdmin: boolean = false,
    isDemoMode: boolean = false
): Promise<ChamadoSuporte[]> {
    if (isDemoMode) {
        const local = getLocalCache();
        if (!isAdmin && userEmail) {
            return local.filter(c => c.usuario_email.toLowerCase() === userEmail.toLowerCase());
        }
        return local;
    }

    try {
        let query = supabase
            .from('suporte_chamados')
            .select('*')
            .order('created_at', { ascending: false });

        if (!isAdmin && userEmail) {
            query = query.eq('usuario_email', userEmail);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar chamados do Supabase:', error);
            const cached = getLocalCache();
            if (!isAdmin && userEmail) {
                return cached.filter(c => c.usuario_email.toLowerCase() === userEmail.toLowerCase());
            }
            return cached;
        }

        const list = (data || []).map((item: any) => ({
            id: item.id,
            protocolo: item.protocolo || `SUP-${item.id.slice(0, 8)}`,
            usuario_id: item.usuario_id,
            usuario_nome: item.usuario_nome,
            usuario_email: item.usuario_email,
            usuario_funcao: item.usuario_funcao,
            usuario_contato: item.usuario_contato,
            escola_id: item.escola_id,
            escola_nome: item.escola_nome,
            categoria: item.categoria as CategoriaSuporte,
            prioridade: item.prioridade as PrioridadeSuporte,
            assunto: item.assunto,
            descricao: item.descricao,
            status: item.status as StatusSuporte,
            atendente_nome: item.atendente_nome,
            resposta_admin: item.resposta_admin,
            mensagens: Array.isArray(item.mensagens) ? item.mensagens : [],
            created_at: item.created_at,
            updated_at: item.updated_at,
            resolvido_em: item.resolvido_em
        }));

        saveLocalCache(list);
        return list;
    } catch (err) {
        console.error('Falha na comunicação com Supabase:', err);
        return getLocalCache();
    }
}

/**
 * Cria um novo chamado de suporte
 */
export async function createChamado(
    dados: {
        usuario_id?: string;
        usuario_nome: string;
        usuario_email: string;
        usuario_funcao?: string;
        usuario_contato?: string;
        escola_id?: string;
        escola_nome?: string;
        categoria: CategoriaSuporte;
        prioridade: PrioridadeSuporte;
        assunto: string;
        descricao: string;
    },
    isDemoMode: boolean = false
): Promise<ChamadoSuporte> {
    const protocolo = generateProtocolo();
    const now = new Date().toISOString();
    const messageId = generateUUID();

    const primeiraMensagem: MensagemSuporte = {
        id: messageId,
        autor_nome: dados.usuario_nome,
        autor_email: dados.usuario_email,
        autor_tipo: 'USUARIO',
        mensagem: dados.descricao,
        created_at: now
    };

    const novoChamado: ChamadoSuporte = {
        id: generateUUID(),
        protocolo,
        usuario_id: dados.usuario_id,
        usuario_nome: dados.usuario_nome,
        usuario_email: dados.usuario_email,
        usuario_funcao: dados.usuario_funcao,
        usuario_contato: dados.usuario_contato,
        escola_id: dados.escola_id,
        escola_nome: dados.escola_nome,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        assunto: dados.assunto,
        descricao: dados.descricao,
        status: 'Aberto',
        mensagens: [primeiraMensagem],
        created_at: now,
        updated_at: now
    };

    if (isDemoMode) {
        const list = [novoChamado, ...getLocalCache()];
        saveLocalCache(list);
        return novoChamado;
    }

    try {
        const { data, error } = await supabase
            .from('suporte_chamados')
            .insert({
                protocolo,
                usuario_id: dados.usuario_id,
                usuario_nome: dados.usuario_nome,
                usuario_email: dados.usuario_email,
                usuario_funcao: dados.usuario_funcao,
                usuario_contato: dados.usuario_contato,
                escola_id: dados.escola_id,
                escola_nome: dados.escola_nome,
                categoria: dados.categoria,
                prioridade: dados.prioridade,
                assunto: dados.assunto,
                descricao: dados.descricao,
                status: 'Aberto',
                mensagens: [primeiraMensagem]
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao inserir chamado no Supabase:', error);
            const list = [novoChamado, ...getLocalCache()];
            saveLocalCache(list);
            return novoChamado;
        }

        const created: ChamadoSuporte = {
            ...novoChamado,
            id: data.id,
            created_at: data.created_at || now,
            updated_at: data.updated_at || now
        };

        // Log de Auditoria
        await logAudit(
            'CREATE',
            'SUPORTE',
            created.id,
            { protocolo: created.protocolo, assunto: created.assunto, categoria: created.categoria },
            dados.usuario_id,
            dados.usuario_email,
            dados.usuario_nome
        );

        const list = [created, ...getLocalCache().filter(c => c.id !== created.id)];
        saveLocalCache(list);
        return created;
    } catch (err) {
        console.error('Erro geral ao criar chamado:', err);
        const list = [novoChamado, ...getLocalCache()];
        saveLocalCache(list);
        return novoChamado;
    }
}

/**
 * Adiciona uma nova mensagem à conversa do chamado
 */
export async function addMensagemChamado(
    chamado: ChamadoSuporte,
    mensagemTexto: string,
    autorNome: string,
    autorEmail: string,
    autorTipo: 'USUARIO' | 'ADMIN',
    isDemoMode: boolean = false
): Promise<ChamadoSuporte> {
    const now = new Date().toISOString();
    const novaMensagem: MensagemSuporte = {
        id: generateUUID(),
        autor_nome: autorNome,
        autor_email: autorEmail,
        autor_tipo: autorTipo,
        mensagem: mensagemTexto,
        created_at: now
    };

    const mensagensAtualizadas = [...(chamado.mensagens || []), novaMensagem];
    let novoStatus = chamado.status;

    // Se o admin respondeu a um chamado aberto, muda para "Em Atendimento"
    if (autorTipo === 'ADMIN' && chamado.status === 'Aberto') {
        novoStatus = 'Em Atendimento';
    }

    const chamadoAtualizado: ChamadoSuporte = {
        ...chamado,
        status: novoStatus,
        resposta_admin: autorTipo === 'ADMIN' ? mensagemTexto : chamado.resposta_admin,
        atendente_nome: autorTipo === 'ADMIN' ? autorNome : chamado.atendente_nome,
        mensagens: mensagensAtualizadas,
        updated_at: now
    };

    if (isDemoMode) {
        const list = getLocalCache().map(c => c.id === chamado.id ? chamadoAtualizado : c);
        saveLocalCache(list);
        return chamadoAtualizado;
    }

    try {
        const updatePayload: any = {
            mensagens: mensagensAtualizadas,
            updated_at: now,
            status: novoStatus
        };

        if (autorTipo === 'ADMIN') {
            updatePayload.resposta_admin = mensagemTexto;
            updatePayload.atendente_nome = autorNome;
        }

        const { error } = await supabase
            .from('suporte_chamados')
            .update(updatePayload)
            .eq('id', chamado.id);

        if (error) {
            console.error('Erro ao adicionar mensagem no Supabase:', error);
        }

        await logAudit(
            'UPDATE',
            'SUPORTE_MENSAGEM',
            chamado.id,
            { protocolo: chamado.protocolo, autor_tipo: autorTipo },
            undefined,
            autorEmail,
            autorNome
        );

        const list = getLocalCache().map(c => c.id === chamado.id ? chamadoAtualizado : c);
        saveLocalCache(list);
        return chamadoAtualizado;
    } catch (err) {
        console.error('Erro ao atualizar mensagem do chamado:', err);
        return chamadoAtualizado;
    }
}

/**
 * Atualiza o status do chamado
 */
export async function updateStatusChamado(
    chamadoId: string,
    novoStatus: StatusSuporte,
    atendenteNome?: string,
    userEmail?: string,
    userName?: string,
    isDemoMode: boolean = false
): Promise<void> {
    const now = new Date().toISOString();
    const payload: any = {
        status: novoStatus,
        updated_at: now
    };

    if (atendenteNome) {
        payload.atendente_nome = atendenteNome;
    }

    if (novoStatus === 'Resolvido') {
        payload.resolvido_em = now;
    } else {
        payload.resolvido_em = null;
    }

    if (isDemoMode) {
        const list = getLocalCache().map(c => {
            if (c.id === chamadoId) {
                return {
                    ...c,
                    status: novoStatus,
                    atendente_nome: atendenteNome || c.atendente_nome,
                    resolvido_em: novoStatus === 'Resolvido' ? now : undefined,
                    updated_at: now
                };
            }
            return c;
        });
        saveLocalCache(list);
        return;
    }

    try {
        const { error } = await supabase
            .from('suporte_chamados')
            .update(payload)
            .eq('id', chamadoId);

        if (error) throw error;

        await logAudit(
            'UPDATE',
            'SUPORTE_STATUS',
            chamadoId,
            { novo_status: novoStatus, atendente: atendenteNome },
            undefined,
            userEmail,
            userName
        );

        const list = getLocalCache().map(c => {
            if (c.id === chamadoId) {
                return {
                    ...c,
                    status: novoStatus,
                    atendente_nome: atendenteNome || c.atendente_nome,
                    resolvido_em: novoStatus === 'Resolvido' ? now : undefined,
                    updated_at: now
                };
            }
            return c;
        });
        saveLocalCache(list);
    } catch (err) {
        console.error('Erro ao atualizar status do chamado:', err);
    }
}

/**
 * Atualiza a prioridade do chamado
 */
export async function updatePrioridadeChamado(
    chamadoId: string,
    novaPrioridade: PrioridadeSuporte,
    userEmail?: string,
    userName?: string,
    isDemoMode: boolean = false
): Promise<void> {
    const now = new Date().toISOString();

    if (isDemoMode) {
        const list = getLocalCache().map(c => c.id === chamadoId ? { ...c, prioridade: novaPrioridade, updated_at: now } : c);
        saveLocalCache(list);
        return;
    }

    try {
        const { error } = await supabase
            .from('suporte_chamados')
            .update({ prioridade: novaPrioridade, updated_at: now })
            .eq('id', chamadoId);

        if (error) throw error;

        await logAudit(
            'UPDATE',
            'SUPORTE_PRIORIDADE',
            chamadoId,
            { nova_prioridade: novaPrioridade },
            undefined,
            userEmail,
            userName
        );

        const list = getLocalCache().map(c => c.id === chamadoId ? { ...c, prioridade: novaPrioridade, updated_at: now } : c);
        saveLocalCache(list);
    } catch (err) {
        console.error('Erro ao alterar prioridade do chamado:', err);
    }
}

/**
 * Exclui um chamado
 */
export async function deleteChamado(
    chamadoId: string,
    userEmail?: string,
    userName?: string,
    isDemoMode: boolean = false
): Promise<void> {
    if (isDemoMode) {
        const list = getLocalCache().filter(c => c.id !== chamadoId);
        saveLocalCache(list);
        return;
    }

    try {
        const { error } = await supabase
            .from('suporte_chamados')
            .delete()
            .eq('id', chamadoId);

        if (error) throw error;

        await logAudit(
            'DELETE',
            'SUPORTE',
            chamadoId,
            { chamado_id: chamadoId },
            undefined,
            userEmail,
            userName
        );

        const list = getLocalCache().filter(c => c.id !== chamadoId);
        saveLocalCache(list);
    } catch (err) {
        console.error('Erro ao excluir chamado:', err);
        throw err;
    }
}
