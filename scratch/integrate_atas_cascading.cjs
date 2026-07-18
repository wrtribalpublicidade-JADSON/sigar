const fs = require('fs');

const filePath = "c:\\Users\\JADSON CARLOS\\OneDrive\\Documentos\\sigar-–-sistema-integrado-de-gestão\\sigar\\components\\AtasFinaisTab.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states and memos
const targetStateCode = "  const { configuracao } = useConfiguracao();\n  const [selectedTurmaId, setSelectedTurmaId] = useState('');";
const replacementStateCode = `  const { configuracao } = useConfiguracao();
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [selectedAnoSerie, setSelectedAnoSerie] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');

  const availableAnosSeries = useMemo(() => {
    const years = schoolTurmas.map(t => t.year).filter(Boolean);
    return Array.from(new Set(years)).sort();
  }, [schoolTurmas]);

  const filteredTurmasByYear = useMemo(() => {
    if (!selectedAnoSerie) return [];
    return schoolTurmas.filter(t => t.year === selectedAnoSerie);
  }, [schoolTurmas, selectedAnoSerie]);

  const availableShifts = useMemo(() => {
    if (!selectedTurmaId) return [];
    const match = schoolTurmas.find(t => String(t.id) === String(selectedTurmaId));
    return match?.shift ? [match.shift] : ['MANHÃ', 'TARDE', 'NOITE'];
  }, [schoolTurmas, selectedTurmaId]);`;

content = content.replace(targetStateCode, replacementStateCode);

// 2. Replace selector UI block
const targetUIBlock = `      <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar Turma</label>
            <select
              value={selectedTurmaId}
              onChange={e => setSelectedTurmaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
            >
              <option value="">Selecione uma turma...</option>
              {schoolTurmas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name || t.year} • {t.shift || 'MANHÃ'} | {t.stage || (t.level === 'Infantil' ? 'Ed. Infantil' : 'Ens. Fundamental')}
                </option>
              ))}
            </select>
          </div>`;

const replacementUIBlock = `      <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* ANO/SÉRIE */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar ANO/SÉRIE</label>
              <select
                value={selectedAnoSerie}
                onChange={e => {
                  setSelectedAnoSerie(e.target.value);
                  setSelectedTurmaId('');
                  setSelectedTurno('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
              >
                <option value="">Selecione o ano/série...</option>
                {availableAnosSeries.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* TURMA */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar TURMA</label>
              <select
                value={selectedTurmaId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedTurmaId(id);
                  const matched = schoolTurmas.find(t => String(t.id) === String(id));
                  setSelectedTurno(matched?.shift || '');
                }}
                disabled={!selectedAnoSerie}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione a turma...</option>
                {filteredTurmasByYear.map(t => (
                  <option key={t.id} value={t.id}>{t.name || t.year}</option>
                ))}
              </select>
            </div>

            {/* TURNO */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar TURNO</label>
              <select
                value={selectedTurno}
                onChange={e => setSelectedTurno(e.target.value)}
                disabled={!selectedTurmaId}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o turno...</option>
                {availableShifts.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>`;

content = content.replace(targetUIBlock, replacementUIBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AtasFinaisTab.tsx with cascading filters!');
