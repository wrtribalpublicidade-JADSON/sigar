import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOriginalsAndDifferences() {
  const { data: plans } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('created_at', { ascending: true });

  const orig = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-17'));
  console.log('Originals (2026-08-17) count:', orig.length);

  // Group originals by ano_serie
  const origBySerie = {};
  orig.forEach(p => {
    origBySerie[p.ano_serie] = (origBySerie[p.ano_serie] || 0) + 1;
  });
  console.log('Originals by ano_serie:', origBySerie);

  // Check the 21 updated by Raimundo from 2026-08-17
  const origRaimundo = orig.filter(p => p.updated_by === 'raimundoramosbarrozo@gmail.com');
  console.log('\nOriginals updated by Raimundo count:', origRaimundo.length);
  origRaimundo.forEach((p, idx) => {
    console.log(`- [${idx+1}] ID: ${p.id} | Faixa: ${p.ano_serie} | Campo: ${p.campo_experiencia} | Bim: ${p.bimestre} | UpdatedAt: ${p.updated_at}`);
  });

  // Check if the original 2026-08-17 records had their content changed or just updated_by/updated_at touched
  console.log('\nComparing origUntouched vs origRaimundo itens structure:');
  const sampleUntouched = orig.find(p => p.updated_by === 'SISTEMA_MUNICIPAL');
  console.log('Untouched itens sample:', JSON.stringify(sampleUntouched?.itens, null, 2));

  const sampleRaimundo = origRaimundo[0];
  console.log('Raimundo updated itens sample:', JSON.stringify(sampleRaimundo?.itens, null, 2));

  // Check Valdenir (2026-08-27)
  const valdenir = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-27'));
  console.log('\nValdenir new records count:', valdenir.length);
  valdenir.forEach((p, idx) => {
    console.log(`- [${idx+1}] ID: ${p.id} | Faixa: ${p.ano_serie} | Campo: ${p.campo_experiencia} | Bim: ${p.bimestre}`);
    // Check if there was already an original record with same Faixa, Campo, Bimestre
    const match = orig.find(o => o.ano_serie === p.ano_serie && o.campo_experiencia === p.campo_experiencia && o.bimestre === p.bimestre);
    console.log(`    -> Existing in 2026-08-17 original? ${match ? 'YES (ID: ' + match.id + ', UpdatedBy: ' + match.updated_by + ')' : 'NO'}`);
  });

  // Check Raimundo new (2026-08-28)
  const raimundoNew = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-28'));
  console.log('\nRaimundo new records count:', raimundoNew.length);
  raimundoNew.forEach((p, idx) => {
    console.log(`- [${idx+1}] ID: ${p.id} | Faixa: "${p.ano_serie}" | Campo: "${p.campo_experiencia}" | Bim: "${p.bimestre}"`);
  });
}

checkOriginalsAndDifferences();
