import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeDetails() {
  const { data: plans } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('created_at', { ascending: true });

  console.log('=== TOTAL PLANS ===', plans.length);

  // Group 1: Original 2026-08-17 records
  const orig = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-17'));
  console.log('\n--- 1. Plans created on 2026-08-17 (Original batch) --- Total:', orig.length);
  
  const origUntouched = orig.filter(p => p.updated_by === 'SISTEMA_MUNICIPAL');
  const origRaimundo = orig.filter(p => p.updated_by === 'raimundoramosbarrozo@gmail.com');
  const origRonald = orig.filter(p => p.updated_by === 'teixeiraronald27@gmail.com');

  console.log(`- Untouched (updated_by: SISTEMA_MUNICIPAL): ${origUntouched.length}`);
  console.log(`- Updated by Raimundo: ${origRaimundo.length}`);
  console.log(`- Updated by Ronald: ${origRonald.length}`);

  console.log('\nSample Untouched Item:');
  if (origUntouched[0]) {
    console.log(JSON.stringify(origUntouched[0], null, 2));
  }

  console.log('\nSample Raimundo Updated Item (from 2026-08-17):');
  if (origRaimundo[0]) {
    console.log(JSON.stringify(origRaimundo[0], null, 2));
  }

  console.log('\nRonald Updated Item:');
  if (origRonald[0]) {
    console.log(JSON.stringify(origRonald[0], null, 2));
  }

  // Group 2: Valdenir plans created on 2026-08-27
  const valdenir = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-27'));
  console.log('\n--- 2. Plans created on 2026-08-27 (Valdenir) --- Total:', valdenir.length);
  valdenir.forEach((p, idx) => {
    console.log(`[V${idx+1}] ID: ${p.id} | Faixa: ${p.ano_serie} | Campo: ${p.campo_experiencia} | Bim: ${p.bimestre} | ItensCount: ${p.itens?.length}`);
  });
  if (valdenir[0]) {
    console.log('Sample Valdenir item:');
    console.log(JSON.stringify(valdenir[0], null, 2));
  }

  // Group 3: Raimundo imported plans created on 2026-08-28
  const raimundoNew = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-28'));
  console.log('\n--- 3. Plans created on 2026-08-28 (Raimundo new/imported) --- Total:', raimundoNew.length);
  raimundoNew.forEach((p, idx) => {
    console.log(`[R${idx+1}] ID: ${p.id} | Faixa: "${p.ano_serie}" | Campo: "${p.campo_experiencia}" | Bim: "${p.bimestre}" | ItensCount: ${p.itens?.length}`);
  });
}

analyzeDetails();
