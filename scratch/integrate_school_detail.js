const fs = require('fs');

const filePath = "c:\\Users\\JADSON CARLOS\\OneDrive\\Documentos\\sigar-–-sistema-integrado-de-gestão\\sigar\\components\\SchoolDetail.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { AtasFinaisTab }")) {
  content = content.replace(
    "import { PrintableSchoolDocument } from './PrintableSchoolDocument';",
    "import { PrintableSchoolDocument } from './PrintableSchoolDocument';\nimport { AtasFinaisTab } from './AtasFinaisTab';"
  );
}

// 2. Add 'atas_finais' to activeTab state type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'plano' | 'visitas' | 'turmas' | 'rh' | 'acompanhamento' | 'detalhamento_turmas' | 'documentos' | 'matriculas' | 'professores'>('acompanhamento');",
  "const [activeTab, setActiveTab] = useState<'plano' | 'visitas' | 'turmas' | 'rh' | 'acompanhamento' | 'detalhamento_turmas' | 'documentos' | 'matriculas' | 'professores' | 'atas_finais'>('acompanhamento');"
);

// 3. Add to visibleTabs list
content = content.replace(
  "      { id: 'documentos', icon: FileText, label: 'Documentos' },\n      { id: 'professores', icon: Users, label: 'Professores' }",
  "      { id: 'documentos', icon: FileText, label: 'Documentos' },\n      { id: 'professores', icon: Users, label: 'Professores' },\n      { id: 'atas_finais', icon: FileText, label: 'Atas Finais' }"
);

// 4. Render AtasFinaisTab when active
content = content.replace(
  "                )}\n              </div>\n            )\n          }\n        </div>",
  "                )}\n              </div>\n            )\n          }\n          {\n            activeTab === 'atas_finais' && (\n              <AtasFinaisTab\n                escola={escola}\n                schoolTurmas={schoolTurmas}\n                isDemoMode={isDemoMode}\n                userRole={userRole}\n              />\n            )\n          }\n        </div>"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated SchoolDetail.tsx!');
