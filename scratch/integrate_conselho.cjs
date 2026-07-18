const fs = require('fs');

const filePath = "c:\\Users\\JADSON CARLOS\\OneDrive\\Documentos\\sigar-–-sistema-integrado-de-gestão\\sigar\\components\\ConselhoClasse.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("useConfiguracao")) {
  content = content.replace(
    "import { PageHeader } from './ui/PageHeader';",
    "import { PageHeader } from './ui/PageHeader';\nimport { useConfiguracao } from '../context/ConfiguracaoContext';"
  );
}

// 2. Add useConfiguracao call matching the multiline signature exactly
const targetDecl = `export const ConselhoClasse: React.FC<ConselhoClasseProps> = ({
    escolas = [],
    isAdmin = false,
    userEmail = null,
    currentUser = null,
    forcedEtapa,
    externalSelectedEscolaId,
    onEscolaChange,
    isDemoMode = false
}) => {`;

const replacementDecl = `export const ConselhoClasse: React.FC<ConselhoClasseProps> = ({
    escolas = [],
    isAdmin = false,
    userEmail = null,
    currentUser = null,
    forcedEtapa,
    externalSelectedEscolaId,
    onEscolaChange,
    isDemoMode = false
}) => {
    const { configuracao, isPeriodoBloqueado } = useConfiguracao();`;

if (content.includes(targetDecl)) {
    content = content.replace(targetDecl, replacementDecl);
} else {
    console.error("COULD NOT FIND THE DECLARATION BLOCK!");
}

// 3. Define COMPONENTES_CURRICULARES dynamically
content = content.replace(
    "    const COMPONENTES_CURRICULARES = [\n        'Língua Portuguesa',\n        'Matemática',\n        'Ciências',\n        'Geografia',\n        'História',\n        'Educação Física',\n        'Arte',\n        'Ensino Religioso',\n        'Língua Inglesa'\n    ];",
    "    const COMPONENTES_CURRICULARES = configuracao?.componentes_curriculares?.length > 0\n        ? configuracao.componentes_curriculares\n        : [\n            'Língua Portuguesa',\n            'Matemática',\n            'Ciências',\n            'Geografia',\n            'História',\n            'Educação Física',\n            'Arte',\n            'Ensino Religioso',\n            'Língua Inglesa'\n        ];"
);

// 4. Define CAMPOS_EXPERIENCIA_BNCC dynamically
content = content.replace(
    "    const CAMPOS_EXPERIENCIA_BNCC = [\n        'O eu, o outro e o nós',\n        'Corpo, gestos e movimentos',\n        'Traços, sons, cores e formas',\n        'Escuta, fala, pensamento e imaginação',\n        'Espaços, tempos, quantidades, relações e transformações'\n    ];",
    "    const CAMPOS_EXPERIENCIA_BNCC = configuracao?.campos_experiencia?.length > 0\n        ? configuracao.campos_experiencia\n        : [\n            'O eu, o outro e o nós',\n            'Corpo, gestos e movimentos',\n            'Traços, sons, cores e formas',\n            'Escuta, fala, pensamento e imaginação',\n            'Espaços, tempos, quantidades, relações e transformações'\n        ];"
);

// 5. Define isBlocked
content = content.replace(
    "    const [activeTurma, setActiveTurma] = useState<TurmaData | null>(null);",
    "    const [activeTurma, setActiveTurma] = useState<TurmaData | null>(null);\n    const isBlocked = isPeriodoBloqueado(avaliacaoBimestre, currentUser?.funcao);"
);

// 6. Update grade threshold checks
content = content.replace(
    "alert: mediaFinal < 7 // Threshold updated to 7.0",
    "alert: mediaFinal < (configuracao?.nota_minima_aprovacao ?? 7.0)"
);
content = content.replace(
    "const acimaMedia = visaoGeralData.filter(s => s.mediaFinal >= 7).length;",
    "const acimaMedia = visaoGeralData.filter(s => s.mediaFinal >= (configuracao?.nota_minima_aprovacao ?? 7.0)).length;"
);

// Replace colors
content = content.split("student.b1 < 7").join("student.b1 < (configuracao?.nota_minima_aprovacao ?? 7.0)");
content = content.split("student.b2 < 7").join("student.b2 < (configuracao?.nota_minima_aprovacao ?? 7.0)");
content = content.split("student.b3 < 7").join("student.b3 < (configuracao?.nota_minima_aprovacao ?? 7.0)");
content = content.split("student.b4 < 7").join("student.b4 < (configuracao?.nota_minima_aprovacao ?? 7.0)");
content = content.split("student.mediaFinal < 7").join("student.mediaFinal < (configuracao?.nota_minima_aprovacao ?? 7.0)");
content = content.split("item.imported.media >= 7").join("item.imported.media >= (configuracao?.nota_minima_aprovacao ?? 7.0)");

// 7. Inject checks in handlers
content = content.replace(
    "    const handleSaveGrades = async () => {\n        if (!activeTurma) {",
    "    const handleSaveGrades = async () => {\n        if (isBlocked) return;\n        if (!activeTurma) {"
);
content = content.replace(
    "    const handleSaveRascunho = async () => {\n        if (!activeTurma) {",
    "    const handleSaveRascunho = async () => {\n        if (isBlocked) return;\n        if (!activeTurma) {"
);
content = content.replace(
    "    const handleSaveAcompInfantil = async (e: React.FormEvent) => {\n        e.preventDefault();",
    "    const handleSaveAcompInfantil = async (e: React.FormEvent) => {\n        e.preventDefault();\n        if (isBlocked) return;"
);
content = content.replace(
    "    const handleDeleteAcompInfantil = async (id: string) => {\n        if (!confirm('Deseja realmente excluir este registro?')) return;",
    "    const handleDeleteAcompInfantil = async (id: string) => {\n        if (isBlocked) return;\n        if (!confirm('Deseja realmente excluir este registro?')) return;"
);
content = content.replace(
    "    const handleSaveAcomp = async (e: React.FormEvent) => {\n        e.preventDefault();",
    "    const handleSaveAcomp = async (e: React.FormEvent) => {\n        e.preventDefault();\n        if (isBlocked) return;"
);
content = content.replace(
    "    const handleDeleteAcomp = async (id: string) => {\n        if (!confirm('Deseja realmente excluir este registro?')) return;",
    "    const handleDeleteAcomp = async (id: string) => {\n        if (isBlocked) return;\n        if (!confirm('Deseja realmente excluir este registro?')) return;"
);
content = content.replace(
    "    const handleSaveEnc = async (e: React.FormEvent) => {\n        e.preventDefault();",
    "    const handleSaveEnc = async (e: React.FormEvent) => {\n        e.preventDefault();\n        if (isBlocked) return;"
);
content = content.replace(
    "    const handleDeleteEnc = async (id: string) => {\n        if (!confirm('Deseja realmente excluir este encaminhamento?')) return;",
    "    const handleDeleteEnc = async (id: string) => {\n        if (isBlocked) return;\n        if (!confirm('Deseja realmente excluir este encaminhamento?')) return;"
);
content = content.replace(
    "    const handleSaveEncInfantil = async (e: React.FormEvent) => {\n        e.preventDefault();",
    "    const handleSaveEncInfantil = async (e: React.FormEvent) => {\n        e.preventDefault();\n        if (isBlocked) return;"
);
content = content.replace(
    "    const handleDeleteEncInfantil = async (id: string) => {\n        if (!confirm('Deseja realmente excluir este encaminhamento?')) return;",
    "    const handleDeleteEncInfantil = async (id: string) => {\n        if (isBlocked) return;\n        if (!confirm('Deseja realmente excluir este encaminhamento?')) return;"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ConselhoClasse.tsx!');
