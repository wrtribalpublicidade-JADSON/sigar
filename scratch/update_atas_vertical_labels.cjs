const fs = require('fs');

const filePath = "c:\\Users\\JADSON CARLOS\\OneDrive\\Documentos\\sigar-–-sistema-integrado-de-gestão\\sigar\\components\\AtasFinaisTab.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Docx exporter header changes
content = content.replace(
  "children: [new Paragraph({ children: [new TextRun({ text: 'Média G.', bold: true })], alignment: AlignmentType.CENTER })],",
  "children: [new Paragraph({ children: [new TextRun({ text: 'Média Geral', bold: true })], alignment: AlignmentType.CENTER })],"
);

content = content.replace(
  "children: [new Paragraph({ children: [new TextRun({ text: 'Freq. (%)', bold: true })], alignment: AlignmentType.CENTER })],",
  "children: [new Paragraph({ children: [new TextRun({ text: 'Frequência', bold: true })], alignment: AlignmentType.CENTER })],"
);

// 2. Screen preview table changes
const targetScreenHeader = `                    {listColumnNames.map(col => (
                      <th key={col} className="border border-slate-300 px-1 py-2 text-center text-[9px] max-w-[80px]" title={col}>
                        {col.length > 8 ? col.substring(0, 7) + '.' : col}
                      </th>
                    ))}
                    {!isInfantil && <th className="border border-slate-300 px-2 py-2 text-center w-16">Média G.</th>}
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Freq.</th>`;

const replacementScreenHeader = `                    {listColumnNames.map(col => (
                      <th key={col} className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                        <div 
                          className="inline-block whitespace-nowrap text-left font-bold" 
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', maxHeight: '130px' }}
                        >
                          {col}
                        </div>
                      </th>
                    ))}
                    {!isInfantil && (
                      <th className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                        <div 
                          className="inline-block whitespace-nowrap text-left font-bold" 
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}
                        >
                          Média Geral
                        </div>
                      </th>
                    )}
                    <th className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                      <div 
                        className="inline-block whitespace-nowrap text-left font-bold" 
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}
                      >
                        Frequência
                      </div>
                    </th>`;

content = content.replace(targetScreenHeader, replacementScreenHeader);

// 3. Print portal table changes
const targetPrintHeader = `                {listColumnNames.map(col => (
                  <th key={col} className="text-center">
                    {col.length > 10 ? col.substring(0, 8) + '.' : col}
                  </th>
                ))}
                {!isInfantil && <th style={{ width: '8%' }} className="text-center">Média G.</th>}
                <th style={{ width: '8%' }} className="text-center">Freq.</th>`;

const replacementPrintHeader = `                {listColumnNames.map(col => (
                  <th key={col} style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                    <div 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left' }}
                    >
                      {col}
                    </div>
                  </th>
                ))}
                {!isInfantil && (
                  <th style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                    <div 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold' }}
                    >
                      Média Geral
                    </div>
                  </th>
                )}
                <th style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                  <div 
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold' }}
                  >
                    Frequência
                  </div>
                </th>`;

content = content.replace(targetPrintHeader, replacementPrintHeader);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AtasFinaisTab.tsx with vertical headers and full names!');
