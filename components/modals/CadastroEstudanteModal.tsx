import React, { useState, useEffect } from 'react';
import { 
    X, Check, Trash2, Edit, Users, Calendar, AlertTriangle, Search, 
    Info, Lock, Plus, User, Sparkles, MapPin, HeartHandshake, 
    GraduationCap, ChevronLeft, ChevronRight, FileText, Globe, 
    Building2, CheckCircle2, Loader2, ShieldAlert, CheckCircle, AlertCircle,
    Printer
} from 'lucide-react';
import { ccEstudanteService } from '../../services/gestaoConselhoService';
import { supabase } from '../../services/supabase';
import { Aluno } from '../../types';
import { PrintableDossieEstudante } from '../PrintableDossieEstudante';

interface CadastroEstudanteModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: {
        schoolName: string;
        schoolId: string;
        responsibleName: string;
        contextName: string; // Field of Experience or Component
        groupName: string;   // Age Group or Turma/Ano
        classId: string;
    };
    escolas: any[];
    onOpenTurmaModal: () => void;
    onSuccess: () => void;
    hideList?: boolean;
    initialStudent?: any;
}

type TabType = 'identificacao' | 'caracteristicas' | 'endereco' | 'especial' | 'matricula';

const UFS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const DEFICIENCIA_OPCOES = [
    'Cegueira',
    'Baixa Visão',
    'Surdez',
    'Deficiência Auditiva',
    'Surdocegueira',
    'Deficiência Física',
    'Deficiência Intelectual',
    'Deficiência Múltipla',
    'Transtorno do Espectro Autista (TEA)',
    'Altas Habilidades / Superdotação',
    'Outra'
];

const RECURSOS_SAEB_OPCOES = [
    'Prova Ampliada (Fonte 18)',
    'Prova Superampliada (Fonte 24)',
    'Prova em Braille',
    'Auxílio Ledor',
    'Auxílio Transcritor',
    'Guia-Intérprete',
    'Tradutor-Intérprete de Libras',
    'Tempo Adicional',
    'Mobiliário Acessível',
    'Comunicação Alternativa/Aumentativa'
];

// Document Formatters
export const formatCPF = (val: string): string => {
    const nums = (val || '').replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
};

export const formatNIS = (val: string): string => {
    const nums = (val || '').replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 8) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 10) return `${nums.slice(0, 3)}.${nums.slice(3, 8)}.${nums.slice(8)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 8)}.${nums.slice(8, 10)}-${nums.slice(10, 11)}`;
};

export const formatCEP = (val: string): string => {
    const nums = (val || '').replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)}-${nums.slice(5, 8)}`;
};

export const formatCertidao = (val: string): string => {
    const nums = (val || '').replace(/\D/g, '').slice(0, 32);
    if (nums.length < 32) return val; // Se não tiver 32 dígitos, manter como o usuário digitou (padrão antigo)
    return `${nums.slice(0, 6)} ${nums.slice(6, 8)} ${nums.slice(8, 10)} ${nums.slice(10, 14)} ${nums.slice(14, 15)} ${nums.slice(15, 20)} ${nums.slice(20, 23)} ${nums.slice(23, 30)}-${nums.slice(30, 32)}`;
};

// Document Validators
export const validarCPF = (cpf: string): boolean => {
    const clean = (cpf || '').replace(/\D/g, '');
    if (clean.length === 0) return true; // Não preenchido é opcional
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(10), 10)) return false;
    
    return true;
};

export const validarNIS = (nis: string): boolean => {
    const clean = (nis || '').replace(/\D/g, '');
    if (clean.length === 0) return true; // Não preenchido é opcional
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i), 10) * weights[i];
    }
    const rest = sum % 11;
    let checkDigit = 11 - rest;
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;

    return checkDigit === parseInt(clean.charAt(10), 10);
};

// Helpers for Turma Data Mapping & Auto-fill
export const normalizeTurno = (rawTurno: string = ''): string => {
    const norm = (rawTurno || '').trim().toUpperCase();
    if (norm.includes('MANH') || norm.includes('MATUTIN')) return 'Matutino';
    if (norm.includes('TARD') || norm.includes('VESPERTIN')) return 'Vespertino';
    if (norm.includes('NOIT') || norm.includes('NOTURN')) return 'Noturno';
    if (norm.includes('INTEGRAL')) return 'Integral';
    return rawTurno || 'Matutino';
};

export const normalizeModalidade = (rawMod: string = ''): string => {
    const norm = (rawMod || '').trim().toUpperCase();
    if (norm === 'REGULAR' || norm.includes('ENSINO REGULAR')) return 'Ensino Regular';
    if (norm.includes('MULTISSERIAD')) return 'Multisseriada';
    if (norm.includes('MULTIETAP')) return 'Multietapa';
    if (norm.includes('ESPECIAL')) return 'Educação Especial';
    if (norm.includes('EJA') || norm.includes('JOVENS')) return 'EJA';
    if (norm.includes('INTEGRAL')) return 'Educação Integral';
    if (norm.includes('CAMPO')) return 'Educação do Campo';
    if (norm.includes('INDIGENA') || norm.includes('INDÍGENA')) return 'Indígena';
    if (norm.includes('QUILOMBOLA')) return 'Quilombola';
    return rawMod || 'Ensino Regular';
};

export const inferEtapaFromTurma = (turma: any): string => {
    if (turma.stage && turma.stage.trim()) {
        return turma.stage.trim();
    }
    const yearOrName = (turma.year || turma.name || turma.anoSerie || '').toLowerCase();
    if (yearOrName.includes('creche') || yearOrName.includes('pré') || yearOrName.includes('pre') || yearOrName.includes('infantil')) {
        return 'Educação Infantil';
    }
    if (yearOrName.includes('1º') || yearOrName.includes('2º') || yearOrName.includes('3º') || yearOrName.includes('4º') || yearOrName.includes('5º') || yearOrName.includes('1 ano') || yearOrName.includes('2 ano') || yearOrName.includes('3 ano') || yearOrName.includes('4 ano') || yearOrName.includes('5 ano')) {
        return 'Anos Iniciais';
    }
    if (yearOrName.includes('6º') || yearOrName.includes('7º') || yearOrName.includes('8º') || yearOrName.includes('9º') || yearOrName.includes('6 ano') || yearOrName.includes('7 ano') || yearOrName.includes('8 ano') || yearOrName.includes('9 ano')) {
        return 'Anos Finais';
    }
    if (yearOrName.includes('etapa') || yearOrName.includes('eja')) {
        return 'EJA';
    }
    return 'Ensino Fundamental';
};

export const extractAnoSerieFromTurma = (turma: any): string => {
    return turma.year || turma.anoSerie || turma.name || '';
};

export const CadastroEstudanteModal: React.FC<CadastroEstudanteModalProps> = ({
    isOpen,
    onClose,
    context,
    escolas,
    onOpenTurmaModal,
    onSuccess,
    hideList = false,
    initialStudent = null
}) => {
    // Current Active Tab
    const [activeTab, setActiveTab] = useState<TabType>('identificacao');

    // Form state - Identificação
    const [id, setId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [nomeMae, setNomeMae] = useState('');
    const [nomePai, setNomePai] = useState('');
    const [certidaoNascimento, setCertidaoNascimento] = useState('');
    const [idEducacenso, setIdEducacenso] = useState('');
    const [nis, setNis] = useState('');
    const [rg, setRg] = useState('');

    // Validation touched states
    const [cpfTouched, setCpfTouched] = useState(false);
    const [nisTouched, setNisTouched] = useState(false);

    // Form state - Características
    const [corRaca, setCorRaca] = useState('Não declarada');
    const [nacionalidade, setNacionalidade] = useState('Brasileira');
    const [paisNascimento, setPaisNascimento] = useState('Brasil');
    const [ufNascimento, setUfNascimento] = useState('MA');
    const [municipioNascimento, setMunicipioNascimento] = useState('');
    const [estudanteEstrangeiro, setEstudanteEstrangeiro] = useState('Não');

    // Form state - Endereço
    const [cep, setCep] = useState('');
    const [enderecoUf, setEnderecoUf] = useState('MA');
    const [enderecoMunicipio, setEnderecoMunicipio] = useState('');
    const [enderecoDistrito, setEnderecoDistrito] = useState('');
    const [enderecoBairro, setEnderecoBairro] = useState('');
    const [enderecoLogradouro, setEnderecoLogradouro] = useState('');
    const [enderecoNumero, setEnderecoNumero] = useState('');
    const [enderecoComplemento, setEnderecoComplemento] = useState('');
    const [enderecoZona, setEnderecoZona] = useState<'Urbana' | 'Rural'>('Urbana');
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    // Form state - Educação Especial
    const [possuiDeficiencia, setPossuiDeficiencia] = useState<'Sim' | 'Não'>('Não');
    const [deficienciaTipos, setDeficienciaTipos] = useState<string[]>([]);
    const [recursosSalaSaeb, setRecursosSalaSaeb] = useState<string[]>([]);
    const [recebeAee, setRecebeAee] = useState('Não recebe AEE');

    // Form state - Matrícula Escolar
    const [selectedSchoolId, setSelectedSchoolId] = useState(context.schoolId);
    const [selectedTurmaId, setSelectedTurmaId] = useState(context.classId);
    const [stage, setStage] = useState('');
    const [anoSerie, setAnoSerie] = useState('');
    const [turno, setTurno] = useState('Matutino');
    const [modalidade, setModalidade] = useState('Ensino Regular');
    const [dataMatricula, setDataMatricula] = useState(new Date().toISOString().split('T')[0]);
    const [anoMatricula, setAnoMatricula] = useState<number>(2025);
    const [situacaoVinculo, setSituacaoVinculo] = useState('Matriculado');
    const [selectedResponsible, setSelectedResponsible] = useState(context.responsibleName);
    const [status, setStatus] = useState('Ativo');
    const [observations, setObservations] = useState('');

    // Select options & UI State
    const [teachers, setTeachers] = useState<any[]>([]);
    const [turmas, setTurmas] = useState<any[]>([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPrintingDossie, setIsPrintingDossie] = useState(false);

    // Calculations for validations
    const isCpfValid = validarCPF(cpf);
    const isCpfFilled = cpf.replace(/\D/g, '').length > 0;
    const isNisValid = validarNIS(nis);
    const isNisFilled = nis.replace(/\D/g, '').length > 0;

    // ViaCEP lookup
    const handleCepLookup = async (cepValue: string) => {
        const cleanCep = (cepValue || '').replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setIsSearchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    if (data.logradouro) setEnderecoLogradouro(data.logradouro);
                    if (data.bairro) setEnderecoBairro(data.bairro);
                    if (data.localidade) setEnderecoMunicipio(data.localidade);
                    if (data.uf) setEnderecoUf(data.uf);
                }
            } catch (err) {
                console.error('Erro ao buscar CEP:', err);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (initialStudent) {
                handleEdit(initialStudent);
            } else if (!id) {
                resetForm();
            }
        }
    }, [isOpen, initialStudent]);

    useEffect(() => {
        if (isOpen && selectedTurmaId && !hideList) {
            loadStudents();
        } else if (hideList) {
            setStudents([]);
        }
    }, [isOpen, selectedTurmaId, hideList]);

    useEffect(() => {
        if (isOpen && selectedSchoolId) {
            loadTeachers();
            loadTurmas();
        }
    }, [isOpen, selectedSchoolId]);

    useEffect(() => {
        if (context.classId) {
            setSelectedTurmaId(context.classId);
        }
        if (context.schoolId) {
            setSelectedSchoolId(context.schoolId);
        }
    }, [context.classId, context.schoolId]);

    // When a turma is selected, auto-fill stage, year, shift and modality
    const handleTurmaChange = (turmaId: string) => {
        setSelectedTurmaId(turmaId);
        if (!turmaId) return;

        const found = turmas.find(t => String(t.id) === String(turmaId));
        if (found) {
            const detectedStage = inferEtapaFromTurma(found);
            const detectedAnoSerie = extractAnoSerieFromTurma(found);
            const detectedTurno = normalizeTurno(found.shift || found.turno || '');
            const detectedModality = normalizeModalidade(found.modality || found.tipo || '');

            setStage(detectedStage);
            setAnoSerie(detectedAnoSerie);
            setTurno(detectedTurno);
            setModalidade(detectedModality);

            if (found.teacher && (!selectedResponsible || selectedResponsible === '')) {
                setSelectedResponsible(found.teacher);
            }
        }
    };

    useEffect(() => {
        if (selectedTurmaId && turmas.length > 0) {
            const found = turmas.find(t => String(t.id) === String(selectedTurmaId));
            if (found) {
                if (!stage) setStage(inferEtapaFromTurma(found));
                if (!anoSerie) setAnoSerie(extractAnoSerieFromTurma(found));
                if (found.shift) setTurno(normalizeTurno(found.shift || found.turno || ''));
                if (found.modality) setModalidade(normalizeModalidade(found.modality || found.tipo || ''));
                if (found.teacher && !selectedResponsible) setSelectedResponsible(found.teacher);
            }
        }
    }, [selectedTurmaId, turmas]);

    const loadTurmas = async () => {
        setIsLoadingTurmas(true);
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .order('name');
            
            if (error) throw error;
            setTurmas(data || []);
        } catch (err) {
            console.error('Error loading turmas:', err);
        } finally {
            setIsLoadingTurmas(false);
        }
    };

    const loadTeachers = async () => {
        setIsLoadingTeachers(true);
        try {
            const { data, error } = await supabase
                .from('recursos_humanos')
                .select('nome')
                .eq('escola_id', selectedSchoolId)
                .order('nome');
            
            if (error) throw error;
            setTeachers(data || []);
        } catch (err) {
            console.error('Error loading teachers:', err);
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    const loadStudents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ccEstudanteService.getByTurma(selectedTurmaId);
            setStudents(data || []);
        } catch (err: any) {
            console.error('Error loading students:', err);
            setError('Erro ao carregar estudantes.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDeficienciaTipo = (tipo: string) => {
        setDeficienciaTipos(prev => 
            prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
        );
    };

    const toggleRecursoSaeb = (recurso: string) => {
        setRecursosSalaSaeb(prev => 
            prev.includes(recurso) ? prev.filter(r => r !== recurso) : [...prev, recurso]
        );
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!name.trim()) {
            setActiveTab('identificacao');
            setError('O Nome Completo do estudante é obrigatório.');
            return;
        }

        if (isCpfFilled && !isCpfValid) {
            setActiveTab('identificacao');
            setCpfTouched(true);
            setError('O número de CPF informado é inválido. Por favor, verifique os dígitos.');
            return;
        }

        if (isNisFilled && !isNisValid) {
            setActiveTab('identificacao');
            setNisTouched(true);
            setError('O número de NIS informado é inválido. Por favor, verifique os dígitos.');
            return;
        }

        if (!selectedSchoolId) {
            setActiveTab('matricula');
            setError('Selecione uma Unidade Escolar.');
            setIsSaving(false);
            return;
        }

        if (!selectedTurmaId) {
            setActiveTab('matricula');
            setError('Uma Turma / Grupo deve ser selecionada.');
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        setError(null);

        const currentTurma = turmas.find(t => String(t.id) === String(selectedTurmaId));

        const payload: Partial<Aluno> = {
            name: name.trim().toUpperCase(),
            cpf: cpf.trim() || undefined,
            birth_date: birthDate || undefined,
            gender: gender || undefined,
            status,
            observations: observations.trim() || undefined,
            stage: stage || currentTurma?.stage || currentTurma?.year || context.groupName.split('-')[0].trim() || 'Ensino Fundamental',
            ano_serie: anoSerie || currentTurma?.year || undefined,
            class_id: selectedTurmaId,
            escola_id: selectedSchoolId,
            professor_responsavel: selectedResponsible || undefined,
            ano_matricula: Number(anoMatricula) || 2025,

            // Identificação EducaCenso
            nome_mae: nomeMae.trim() || undefined,
            nome_pai: nomePai.trim() || undefined,
            certidao_nascimento: certidaoNascimento.trim() || undefined,
            id_educacenso: idEducacenso.trim() || undefined,
            nis: nis.trim() || undefined,
            rg: rg.trim() || undefined,

            // Características
            cor_raca: corRaca || 'Não declarada',
            nacionalidade: nacionalidade || 'Brasileira',
            pais_nascimento: paisNascimento.trim() || 'Brasil',
            uf_nascimento: ufNascimento || undefined,
            municipio_nascimento: municipioNascimento.trim() || undefined,
            estudante_estrangeiro: estudanteEstrangeiro || 'Não',

            // Endereço
            cep: cep.trim() || undefined,
            endereco_uf: enderecoUf || undefined,
            endereco_municipio: enderecoMunicipio.trim() || undefined,
            endereco_distrito: enderecoDistrito.trim() || undefined,
            endereco_bairro: enderecoBairro.trim() || undefined,
            endereco_logradouro: enderecoLogradouro.trim() || undefined,
            endereco_numero: enderecoNumero.trim() || undefined,
            endereco_complemento: enderecoComplemento.trim() || undefined,
            endereco_zona: enderecoZona || 'Urbana',

            // Educação Especial
            possui_deficiencia: possuiDeficiencia,
            deficiencia_tipos: possuiDeficiencia === 'Sim' ? deficienciaTipos : [],
            recursos_sala_saeb: possuiDeficiencia === 'Sim' ? recursosSalaSaeb : [],
            recebe_aee: possuiDeficiencia === 'Sim' ? recebeAee : 'Não recebe AEE',

            // Matrícula Escolar
            turno: turno || 'Matutino',
            modalidade: modalidade || 'Ensino Regular',
            data_matricula: dataMatricula || undefined,
            situacao_vinculo: situacaoVinculo || 'Matriculado'
        };

        try {
            if (id) {
                await ccEstudanteService.update(id, payload);
            } else {
                await ccEstudanteService.add(payload);
            }
            
            resetForm();
            loadStudents();
            onSuccess();
        } catch (err: any) {
            console.error('Error saving student:', err);
            setError(err.message || 'Erro ao salvar estudante.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (student: any) => {
        setId(student.id);
        setName(student.name || '');
        setCpf(formatCPF(student.cpf || ''));
        setBirthDate(student.birth_date || '');
        setGender(student.gender || '');
        setNomeMae(student.nome_mae || '');
        setNomePai(student.nome_pai || '');
        setCertidaoNascimento(student.certidao_nascimento ? formatCertidao(student.certidao_nascimento) : '');
        setIdEducacenso(student.id_educacenso || '');
        setNis(formatNIS(student.nis || ''));
        setRg(student.rg || '');

        setCpfTouched(false);
        setNisTouched(false);

        setCorRaca(student.cor_raca || 'Não declarada');
        setNacionalidade(student.nacionalidade || 'Brasileira');
        setPaisNascimento(student.pais_nascimento || 'Brasil');
        setUfNascimento(student.uf_nascimento || 'MA');
        setMunicipioNascimento(student.municipio_nascimento || '');
        setEstudanteEstrangeiro(student.estudante_estrangeiro || 'Não');

        setCep(formatCEP(student.cep || ''));
        setEnderecoUf(student.endereco_uf || 'MA');
        setEnderecoMunicipio(student.endereco_municipio || '');
        setEnderecoDistrito(student.endereco_distrito || '');
        setEnderecoBairro(student.endereco_bairro || '');
        setEnderecoLogradouro(student.endereco_logradouro || '');
        setEnderecoNumero(student.endereco_numero || '');
        setEnderecoComplemento(student.endereco_complemento || '');
        setEnderecoZona((student.endereco_zona as any) || 'Urbana');

        setPossuiDeficiencia((student.possui_deficiencia as any) || 'Não');
        setDeficienciaTipos(Array.isArray(student.deficiencia_tipos) ? student.deficiencia_tipos : []);
        setRecursosSalaSaeb(Array.isArray(student.recursos_sala_saeb) ? student.recursos_sala_saeb : []);
        setRecebeAee(student.recebe_aee || 'Não recebe AEE');

        if (student.escola_id) setSelectedSchoolId(student.escola_id);
        if (student.class_id) setSelectedTurmaId(student.class_id);
        setStage(student.stage || '');
        setAnoSerie(student.ano_serie || '');
        setTurno(student.turno || 'Matutino');
        setModalidade(student.modalidade || 'Ensino Regular');
        setDataMatricula(student.data_matricula || new Date().toISOString().split('T')[0]);
        setAnoMatricula(student.ano_matricula || 2025);
        setSituacaoVinculo(student.situacao_vinculo || 'Matriculado');
        if (student.professor_responsavel) setSelectedResponsible(student.professor_responsavel);
        setStatus(student.status || 'Ativo');
        setObservations(student.observations || '');

        setError(null);
        setActiveTab('identificacao');
    };

    const handleDelete = async (studentId: string) => {
        if (!window.confirm('Tem certeza que deseja desativar/excluir este estudante?')) return;

        try {
            await ccEstudanteService.remove(studentId);
            loadStudents();
            onSuccess();
        } catch (err: any) {
            console.error('Error deleting student:', err);
            setError('Erro ao remover estudante.');
        }
    };

    const resetForm = () => {
        setId(null);
        setName('');
        setCpf('');
        setBirthDate('');
        setGender('');
        setNomeMae('');
        setNomePai('');
        setCertidaoNascimento('');
        setIdEducacenso('');
        setNis('');
        setRg('');

        setCpfTouched(false);
        setNisTouched(false);

        setCorRaca('Não declarada');
        setNacionalidade('Brasileira');
        setPaisNascimento('Brasil');
        setUfNascimento('MA');
        setMunicipioNascimento('');
        setEstudanteEstrangeiro('Não');

        setCep('');
        setEnderecoUf('MA');
        setEnderecoMunicipio('');
        setEnderecoDistrito('');
        setEnderecoBairro('');
        setEnderecoLogradouro('');
        setEnderecoNumero('');
        setEnderecoComplemento('');
        setEnderecoZona('Urbana');

        setPossuiDeficiencia('Não');
        setDeficienciaTipos([]);
        setRecursosSalaSaeb([]);
        setRecebeAee('Não recebe AEE');

        setStage('');
        setAnoSerie('');
        setTurno('Matutino');
        setModalidade('Ensino Regular');
        setDataMatricula(new Date().toISOString().split('T')[0]);
        setAnoMatricula(2025);
        setSituacaoVinculo('Matriculado');
        setStatus('Ativo');
        setObservations('');
        setError(null);
        setActiveTab('identificacao');
    };

    const getInitials = (studentName: string) => {
        const names = (studentName || '').split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return (studentName || '').substring(0, 2).toUpperCase();
    };

    const tabsConfig = [
        { id: 'identificacao' as TabType, label: '1. Identificação', icon: User, desc: 'Dados Pessoais & Documentos' },
        { id: 'caracteristicas' as TabType, label: '2. Características', icon: Sparkles, desc: 'Cor/Raça & Origem' },
        { id: 'endereco' as TabType, label: '3. Endereço', icon: MapPin, desc: 'Residência & Localização' },
        { id: 'especial' as TabType, label: '4. Educação Especial', icon: HeartHandshake, desc: 'Deficiências, SAEB & AEE' },
        { id: 'matricula' as TabType, label: '5. Matrícula Escolar', icon: GraduationCap, desc: 'Turma, Turno & Vínculo' }
    ];

    const currentTabIndex = tabsConfig.findIndex(t => t.id === activeTab);

    const handleNextTab = () => {
        if (currentTabIndex < tabsConfig.length - 1) {
            setActiveTab(tabsConfig[currentTabIndex + 1].id);
        }
    };

    const handlePrevTab = () => {
        if (currentTabIndex > 0) {
            setActiveTab(tabsConfig[currentTabIndex - 1].id);
        }
    };

    const filteredStudents = students.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cpf || '').includes(searchTerm) ||
        (s.registration_number || '').includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-5xl h-[96vh] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-scale-up">
                
                {/* Header */}
                <div className="bg-[#1a1f26] p-6 sm:p-8 text-white relative flex justify-between items-center shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center border border-orange-400/40 shadow-lg shadow-orange-950/20">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Cadastro de Estudantes</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group cursor-pointer"
                        title="Fechar modal"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Tab Navigation Strip */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-8 py-3 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
                    {tabsConfig.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
                                    isActive
                                        ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-orange-500/20'
                                        : 'bg-white border-slate-200/80 text-slate-600 hover:border-orange-300 hover:bg-orange-50/50 hover:text-brand-orange'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar bg-slate-50/40">

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-rose-50 text-rose-700 p-4 sm:p-5 rounded-2xl border border-rose-200 flex items-center gap-3 text-sm font-bold animate-shake">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Form Container */}
                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm relative">
                        
                        {/* Form Title & Edit Indicator */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                                    <Edit className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                        {id ? 'Editar Dados do Estudante' : 'Cadastrar Novo Estudante'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        {tabsConfig[currentTabIndex]?.desc}
                                    </p>
                                </div>
                            </div>
                            {id && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPrintingDossie(true)}
                                        className="text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-emerald-200 shadow-sm flex items-center gap-1.5"
                                        title="Imprimir Dossiê do Estudante"
                                    >
                                        <Printer size={14} />
                                        <span>Imprimir Dossiê</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-xs font-black text-brand-orange hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-orange-100 shadow-sm"
                                    >
                                        + Novo Cadastro
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">

                            {/* ======================================================== */}
                            {/* ABA 1: IDENTIFICAÇÃO                                     */}
                            {/* ======================================================== */}
                            {activeTab === 'identificacao' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    {/* Nome Completo */}
                                    <div>
                                        <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                            Nome Completo *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nome completo do estudante..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm sm:text-base font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    {/* CPF, Data de Nascimento e Sexo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div>
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                                                    CPF
                                                </label>
                                                {isCpfFilled && (
                                                    isCpfValid ? (
                                                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle size={12} /> Válido
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                                                            <AlertCircle size={12} /> Inválido
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={cpf}
                                                onChange={(e) => {
                                                    setCpf(formatCPF(e.target.value));
                                                    setCpfTouched(true);
                                                }}
                                                onBlur={() => setCpfTouched(true)}
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                className={`w-full bg-white border rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 outline-none transition-all placeholder:text-slate-300 ${
                                                    isCpfFilled && !isCpfValid && cpfTouched
                                                        ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-500 bg-rose-50/20'
                                                        : isCpfFilled && isCpfValid
                                                        ? 'border-emerald-300 focus:ring-emerald-500/15 focus:border-emerald-500 bg-emerald-50/10'
                                                        : 'border-slate-200 focus:ring-brand-orange/15 focus:border-brand-orange'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Data de Nascimento
                                            </label>
                                            <input
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Sexo
                                            </label>
                                            <select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Filiação (Mãe e Pai) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Nome da Mãe
                                            </label>
                                            <input
                                                type="text"
                                                value={nomeMae}
                                                onChange={(e) => setNomeMae(e.target.value.toUpperCase())}
                                                placeholder="Nome completo da mãe..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Nome do Pai / 2ª Filiação
                                            </label>
                                            <input
                                                type="text"
                                                value={nomePai}
                                                onChange={(e) => setNomePai(e.target.value.toUpperCase())}
                                                placeholder="Nome do pai ou responsável..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Documentos Complementares: Certidão de Nascimento, ID Educacenso, NIS e RG */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Certidão de Nascimento
                                            </label>
                                            <input
                                                type="text"
                                                value={certidaoNascimento}
                                                onChange={(e) => setCertidaoNascimento(formatCertidao(e.target.value))}
                                                placeholder="Nº termo ou 32 dígitos..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                ID Único EducaCenso / INEP
                                            </label>
                                            <input
                                                type="text"
                                                value={idEducacenso}
                                                onChange={(e) => setIdEducacenso(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                                placeholder="Código INEP do estudante"
                                                maxLength={12}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                                                    NIS (quando existente)
                                                </label>
                                                {isNisFilled && (
                                                    isNisValid ? (
                                                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle size={12} /> Válido
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                                                            <AlertCircle size={12} /> Inválido
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={nis}
                                                onChange={(e) => {
                                                    setNis(formatNIS(e.target.value));
                                                    setNisTouched(true);
                                                }}
                                                onBlur={() => setNisTouched(true)}
                                                placeholder="000.00000.00-0"
                                                maxLength={14}
                                                className={`w-full bg-white border rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 outline-none transition-all placeholder:text-slate-300 ${
                                                    isNisFilled && !isNisValid && nisTouched
                                                        ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-500 bg-rose-50/20'
                                                        : isNisFilled && isNisValid
                                                        ? 'border-emerald-300 focus:ring-emerald-500/15 focus:border-emerald-500 bg-emerald-50/10'
                                                        : 'border-slate-200 focus:ring-brand-orange/15 focus:border-brand-orange'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                RG (quando existente)
                                            </label>
                                            <input
                                                type="text"
                                                value={rg}
                                                onChange={(e) => setRg(e.target.value.toUpperCase())}
                                                placeholder="Nº RG e Órgão Emissor"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* ABA 2: CARACTERÍSTICAS                                   */}
                            {/* ======================================================== */}
                            {activeTab === 'caracteristicas' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Cor / Raça
                                            </label>
                                            <select
                                                value={corRaca}
                                                onChange={(e) => setCorRaca(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Não declarada">Não declarada</option>
                                                <option value="Branca">Branca</option>
                                                <option value="Preta">Preta</option>
                                                <option value="Parda">Parda</option>
                                                <option value="Amarela">Amarela</option>
                                                <option value="Indígena">Indígena</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Nacionalidade
                                            </label>
                                            <select
                                                value={nacionalidade}
                                                onChange={(e) => setNacionalidade(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Brasileira">Brasileira</option>
                                                <option value="Brasileira - Nascido no exterior ou naturalizado">Brasileira - Nascido no exterior ou naturalizado</option>
                                                <option value="Estrangeira">Estrangeira</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                País de Nascimento
                                            </label>
                                            <input
                                                type="text"
                                                value={paisNascimento}
                                                onChange={(e) => setPaisNascimento(e.target.value)}
                                                placeholder="Brasil"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                UF de Nascimento
                                            </label>
                                            <select
                                                value={ufNascimento}
                                                onChange={(e) => setUfNascimento(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Selecione UF...</option>
                                                {UFS_BRASIL.map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                                <option value="Exterior">Exterior</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Município de Nascimento
                                            </label>
                                            <input
                                                type="text"
                                                value={municipioNascimento}
                                                onChange={(e) => setMunicipioNascimento(e.target.value)}
                                                placeholder="Município natal..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                            Estudante Estrangeiro (quando aplicável)
                                        </label>
                                        <input
                                            type="text"
                                            value={estudanteEstrangeiro}
                                            onChange={(e) => setEstudanteEstrangeiro(e.target.value)}
                                            placeholder="Ex: País de origem, RNE / Documento de refúgio ou 'Não'..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* ABA 3: ENDEREÇO                                          */}
                            {/* ======================================================== */}
                            {activeTab === 'endereco' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    {/* CEP com busca automática e Localização Urbana/Rural */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                CEP (Busca Automática)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={cep}
                                                    onChange={(e) => {
                                                        const formatted = formatCEP(e.target.value);
                                                        setCep(formatted);
                                                        if (formatted.replace(/\D/g, '').length === 8) {
                                                            handleCepLookup(formatted);
                                                        }
                                                    }}
                                                    onBlur={() => handleCepLookup(cep)}
                                                    placeholder="00000-000"
                                                    maxLength={9}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-10 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                                />
                                                {isSearchingCep ? (
                                                    <Loader2 className="w-5 h-5 text-brand-orange animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                                                ) : (
                                                    <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                UF
                                            </label>
                                            <select
                                                value={enderecoUf}
                                                onChange={(e) => setEnderecoUf(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                {UFS_BRASIL.map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Localização
                                            </label>
                                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 h-[50px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setEnderecoZona('Urbana')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                                        enderecoZona === 'Urbana' 
                                                            ? 'bg-brand-orange text-white shadow-md' 
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    URBANA
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEnderecoZona('Rural')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                                        enderecoZona === 'Rural' 
                                                            ? 'bg-brand-orange text-white shadow-md' 
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    RURAL
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Município, Distrito e Bairro */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Município
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoMunicipio}
                                                onChange={(e) => setEnderecoMunicipio(e.target.value)}
                                                placeholder="Município..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Distrito / Povoado
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoDistrito}
                                                onChange={(e) => setEnderecoDistrito(e.target.value)}
                                                placeholder="Distrito ou localidade..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Bairro
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoBairro}
                                                onChange={(e) => setEnderecoBairro(e.target.value)}
                                                placeholder="Bairro..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Logradouro, Número e Complemento */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                                        <div className="sm:col-span-6">
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Logradouro (Rua, Avenida, Estrada)
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoLogradouro}
                                                onChange={(e) => setEnderecoLogradouro(e.target.value)}
                                                placeholder="Rua, Av, Travessa..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Número
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoNumero}
                                                onChange={(e) => setEnderecoNumero(e.target.value)}
                                                placeholder="Nº ou S/N"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div className="sm:col-span-4">
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Complemento
                                            </label>
                                            <input
                                                type="text"
                                                value={enderecoComplemento}
                                                onChange={(e) => setEnderecoComplemento(e.target.value)}
                                                placeholder="Casa, Bloco, Apto..."
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* ABA 4: EDUCAÇÃO ESPECIAL                                 */}
                            {/* ======================================================== */}
                            {activeTab === 'especial' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    {/* Pergunta Principal: Possui deficiência/TEA/altas habilidades? */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                                        <label className="block text-xs font-black tracking-wide text-slate-800 uppercase mb-3">
                                            Possui deficiência / TEA / Altas Habilidades ou Superdotação? *
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPossuiDeficiencia('Não');
                                                    setDeficienciaTipos([]);
                                                    setRecursosSalaSaeb([]);
                                                }}
                                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                                    possuiDeficiencia === 'Não'
                                                        ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                NÃO
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPossuiDeficiencia('Sim')}
                                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                                    possuiDeficiencia === 'Sim'
                                                        ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-orange-500/20'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                SIM
                                            </button>
                                        </div>
                                    </div>

                                    {possuiDeficiencia === 'Sim' && (
                                        <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                                            
                                            {/* Tipo Específico de Deficiência */}
                                            <div>
                                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">
                                                    Tipo Específico de Deficiência / Condição (Marque todos que se aplicam)
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                    {DEFICIENCIA_OPCOES.map((tipo) => {
                                                        const isSelected = deficienciaTipos.includes(tipo);
                                                        return (
                                                            <button
                                                                key={tipo}
                                                                type="button"
                                                                onClick={() => toggleDeficienciaTipo(tipo)}
                                                                className={`p-3 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-orange-50 border-orange-300 text-orange-950 shadow-sm'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{tipo}</span>
                                                                {isSelected && <CheckCircle2 size={16} className="text-brand-orange shrink-0 ml-2" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Necessidade de Recursos para Sala de Aula / SAEB */}
                                            <div>
                                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">
                                                    Necessidade de Recursos de Acessibilidade / Saeb
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {RECURSOS_SAEB_OPCOES.map((recurso) => {
                                                        const isSelected = recursosSalaSaeb.includes(recurso);
                                                        return (
                                                            <button
                                                                key={recurso}
                                                                type="button"
                                                                onClick={() => toggleRecursoSaeb(recurso)}
                                                                className={`p-3 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-orange-50 border-orange-300 text-orange-950 shadow-sm'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span>{recurso}</span>
                                                                {isSelected && <CheckCircle2 size={16} className="text-brand-orange shrink-0 ml-2" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Informações relacionadas ao AEE */}
                                            <div>
                                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                    Atendimento Educacional Especializado (AEE)
                                                </label>
                                                <select
                                                    value={recebeAee}
                                                    onChange={(e) => setRecebeAee(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                                >
                                                    <option value="Não recebe AEE">Não recebe AEE</option>
                                                    <option value="Recebe AEE na própria escola (SRM)">Recebe AEE na própria escola (Sala de Recursos Multifuncionais)</option>
                                                    <option value="Recebe AEE em outra escola da rede">Recebe AEE em outra escola da rede pública</option>
                                                    <option value="Recebe AEE em centro especializado / conveniado">Recebe AEE em centro especializado / conveniado (APAE, etc.)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* ABA 5: MATRÍCULA ESCOLAR                                 */}
                            {/* ======================================================== */}
                            {activeTab === 'matricula' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    {/* Unidade Escolar e Professor Responsável */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Unidade Escolar *
                                            </label>
                                            <select
                                                value={selectedSchoolId}
                                                onChange={(e) => setSelectedSchoolId(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all appearance-none cursor-pointer"
                                                disabled={!!context.schoolId && !id}
                                            >
                                                <option value="">Selecione a escola...</option>
                                                {escolas.map(e => (
                                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Professor Responsável
                                            </label>
                                            <select
                                                value={selectedResponsible}
                                                onChange={(e) => setSelectedResponsible(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all appearance-none cursor-pointer"
                                                disabled={isLoadingTeachers}
                                            >
                                                <option value="">Selecione o professor...</option>
                                                {teachers.map((t, idx) => (
                                                    <option key={idx} value={t.nome}>{t.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Turma / Grupo e Botão Nova Turma */}
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                                        <div className="sm:col-span-8">
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Turma / Grupo *
                                            </label>
                                            <div className="flex gap-2.5">
                                                <select
                                                    value={selectedTurmaId}
                                                    onChange={(e) => handleTurmaChange(e.target.value)}
                                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all appearance-none cursor-pointer"
                                                    disabled={isLoadingTurmas || (!!context.classId && !id)}
                                                >
                                                    <option value="">Selecione a turma...</option>
                                                    {turmas.map(t => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.year || t.stage || ''} - {t.name} {t.shift ? `(${t.shift})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onOpenTurmaModal();
                                                    }}
                                                    className="w-12 h-12 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all shrink-0 active:scale-95 cursor-pointer"
                                                    title="Cadastrar Nova Turma"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-4">
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Ano Letivo de Matrícula *
                                            </label>
                                            <select
                                                value={anoMatricula}
                                                onChange={(e) => setAnoMatricula(Number(e.target.value))}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value={2024}>2024</option>
                                                <option value={2025}>2025</option>
                                                <option value={2026}>2026</option>
                                                <option value={2027}>2027</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Etapa, Ano/Série, Turno e Modalidade */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Etapa
                                            </label>
                                            <input
                                                type="text"
                                                value={stage}
                                                onChange={(e) => setStage(e.target.value)}
                                                placeholder="Ex: Ensino Fundamental"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Ano / Série
                                            </label>
                                            <input
                                                type="text"
                                                value={anoSerie}
                                                onChange={(e) => setAnoSerie(e.target.value)}
                                                placeholder="Ex: 5º Ano"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Turno
                                            </label>
                                            <select
                                                value={turno}
                                                onChange={(e) => setTurno(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Matutino">Matutino</option>
                                                <option value="Vespertino">Vespertino</option>
                                                <option value="Noturno">Noturno</option>
                                                <option value="Integral">Integral</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Modalidade
                                            </label>
                                            <select
                                                value={modalidade}
                                                onChange={(e) => setModalidade(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Ensino Regular">Ensino Regular</option>
                                                <option value="Multisseriada">Multisseriada</option>
                                                <option value="Multietapa">Multietapa</option>
                                                <option value="Educação Especial">Educação Especial</option>
                                                <option value="EJA">EJA (Jovens e Adultos)</option>
                                                <option value="Educação Integral">Educação Integral</option>
                                                <option value="Educação do Campo">Educação do Campo</option>
                                                <option value="Indígena">Indígena</option>
                                                <option value="Quilombola">Quilombola</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Data de Matrícula, Situação/Vínculo e Status */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Data de Matrícula
                                            </label>
                                            <input
                                                type="date"
                                                value={dataMatricula}
                                                onChange={(e) => setDataMatricula(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Situação / Vínculo
                                            </label>
                                            <select
                                                value={situacaoVinculo}
                                                onChange={(e) => setSituacaoVinculo(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Matriculado">Matriculado (Ativo)</option>
                                                <option value="Transferido">Transferido</option>
                                                <option value="Desistente">Deixou de Frequentar / Desistente</option>
                                                <option value="Concluído">Concluído</option>
                                                <option value="Inativo">Inativo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                                Status Geral
                                            </label>
                                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 h-[50px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setStatus('Ativo')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                                        status === 'Ativo' 
                                                            ? 'bg-brand-orange text-white shadow-md' 
                                                            : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    ATIVO
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setStatus('Inativo')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                                        status === 'Inativo' 
                                                            ? 'bg-slate-400 text-white shadow-md' 
                                                            : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    INATIVO
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observações Gerais */}
                                    <div>
                                        <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2 ml-1">
                                            Observações Pedagógicas / Gerais
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            placeholder="Informações adicionais, laudos médicos, histórico escolar relevante..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all resize-none placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Navigation and Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentTabIndex === 0}
                                        onClick={handlePrevTab}
                                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                            currentTabIndex === 0
                                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
                                        }`}
                                    >
                                        <ChevronLeft size={16} />
                                        <span>Anterior</span>
                                    </button>

                                    {currentTabIndex < tabsConfig.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={handleNextTab}
                                            className="px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50/50 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                                        >
                                            <span>Próximo: {tabsConfig[currentTabIndex + 1]?.label.split('. ')[1]}</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase transition-all tracking-wider cursor-pointer"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2.5 tracking-wider active:scale-95 cursor-pointer"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Check className="w-5 h-5" />
                                        )}
                                        <span>{id ? 'Atualizar Estudante' : 'Salvar Estudante'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Bottom Student List (Contextual) */}
                    {!hideList && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                                        <Users className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                            Estudantes Cadastrados Nesta Turma
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {students.length} estudantes vinculados
                                        </p>
                                    </div>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome, CPF ou MAT..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-brand-orange/15 focus:border-brand-orange outline-none transition-all w-full shadow-sm placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nascimento</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Educação Especial</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ano Matrícula</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-16 text-center">
                                                        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mb-3" />
                                                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Carregando estudantes...</p>
                                                    </td>
                                                </tr>
                                            ) : filteredStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-16 text-center text-slate-400">
                                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Nenhum estudante encontrado</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStudents.map((student) => (
                                                    <tr 
                                                        key={student.id} 
                                                        className={`transition-all group ${id === student.id ? 'bg-orange-50/80 shadow-inner' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                                                    {getInitials(student.name)}
                                                                </div>
                                                                <div>
                                                                    <div className={`font-black text-xs uppercase ${id === student.id ? 'text-orange-950' : 'text-slate-800'}`}>{student.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold tracking-tight">
                                                                        CPF: {student.cpf ? formatCPF(student.cpf) : 'Não inf.'} {student.nis ? `• NIS: ${formatNIS(student.nis)}` : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
                                                            {student.birth_date ? new Date(student.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {student.possui_deficiencia === 'Sim' ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200">
                                                                    AEE / Especial
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
                                                            {student.ano_matricula || 2025}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                                                student.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {student.status === 'Ativo' ? 'ATIVO' : 'INATIVO'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEdit(student)}
                                                                    className={`p-2 rounded-xl transition-all border shadow-sm cursor-pointer ${
                                                                        id === student.id 
                                                                            ? 'bg-brand-orange text-white border-brand-orange' 
                                                                            : 'bg-white text-brand-orange border-orange-100 hover:bg-brand-orange hover:text-white'
                                                                    }`}
                                                                    title="Editar Estudante"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(student.id)}
                                                                    className="p-2 rounded-xl bg-white text-rose-500 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                                                    title="Desativar / Excluir"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 sm:p-5 px-6 sm:px-10 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        ESTUDANTES NESSE CONTEXTO: <span className="text-slate-800 ml-1 font-bold">{students.length}</span>
                    </p>
                </div>
            </div>

            {/* Printable Dossiê Component */}
            {isPrintingDossie && (
                <PrintableDossieEstudante
                    student={{
                        id: Number(id) || initialStudent?.id || 0,
                        name: name.trim().toUpperCase(),
                        cpf: cpf.trim() || undefined,
                        birth_date: birthDate || undefined,
                        gender: gender || undefined,
                        registration_number: initialStudent?.registration_number || undefined,
                        escola_id: selectedSchoolId,
                        class_id: selectedTurmaId,
                        stage: stage || 'Ensino Fundamental',
                        status: status || 'Ativo',
                        observations: observations.trim() || undefined,
                        professor_responsavel: selectedResponsible || undefined,
                        ano_matricula: Number(anoMatricula) || 2025,
                        created_at: initialStudent?.created_at,
                        nome_mae: nomeMae.trim() || undefined,
                        nome_pai: nomePai.trim() || undefined,
                        certidao_nascimento: certidaoNascimento.trim() || undefined,
                        id_educacenso: idEducacenso.trim() || undefined,
                        nis: nis.trim() || undefined,
                        rg: rg.trim() || undefined,
                        cor_raca: corRaca || 'Não declarada',
                        nacionalidade: nacionalidade || 'Brasileira',
                        pais_nascimento: paisNascimento.trim() || 'Brasil',
                        uf_nascimento: ufNascimento || undefined,
                        municipio_nascimento: municipioNascimento.trim() || undefined,
                        estudante_estrangeiro: estudanteEstrangeiro || 'Não',
                        cep: cep.trim() || undefined,
                        endereco_uf: enderecoUf || undefined,
                        endereco_municipio: enderecoMunicipio.trim() || undefined,
                        endereco_distrito: enderecoDistrito.trim() || undefined,
                        endereco_bairro: enderecoBairro.trim() || undefined,
                        endereco_logradouro: enderecoLogradouro.trim() || undefined,
                        endereco_numero: enderecoNumero.trim() || undefined,
                        endereco_complemento: enderecoComplemento.trim() || undefined,
                        endereco_zona: enderecoZona || 'Urbana',
                        possui_deficiencia: possuiDeficiencia,
                        deficiencia_tipos: possuiDeficiencia === 'Sim' ? deficienciaTipos : [],
                        recursos_sala_saeb: possuiDeficiencia === 'Sim' ? recursosSalaSaeb : [],
                        recebe_aee: possuiDeficiencia === 'Sim' ? recebeAee : 'Não recebe AEE',
                        turno: turno || 'Matutino',
                        modalidade: modalidade || 'Ensino Regular',
                        data_matricula: dataMatricula || undefined,
                        situacao_vinculo: situacaoVinculo || 'Matriculado',
                        ano_serie: anoSerie || undefined
                    }}
                    escola={escolas.find(e => String(e.id) === String(selectedSchoolId)) || null}
                    turmaInfo={turmas.find(t => String(t.id) === String(selectedTurmaId)) ? `${turmas.find(t => String(t.id) === String(selectedTurmaId))?.year || ''} - ${turmas.find(t => String(t.id) === String(selectedTurmaId))?.name || ''}` : anoSerie}
                    onClose={() => setIsPrintingDossie(false)}
                />
            )}
        </div>
    );
};
