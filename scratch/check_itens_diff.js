import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkItensDifferences() {
  const { data: plans } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('created_at', { ascending: true });

  const orig = plans.filter(p => p.created_at && p.created_at.startsWith('2026-08-17'));
  const origRaimundo = orig.filter(p => p.updated_by === 'raimundoramosbarrozo@gmail.com');
  const origRonald = orig.filter(p => p.updated_by === 'teixeiraronald27@gmail.com');
  const origUntouched = orig.filter(p => p.updated_by === 'SISTEMA_MUNICIPAL');

  console.log('--- Checking 21 original plans updated by Raimundo ---');
  origRaimundo.forEach(p => {
    console.log(`[Raimundo Mod] ID: ${p.id} | ${p.ano_serie} | ${p.campo_experiencia} | ${p.bimestre} | UpdatedAt: ${p.updated_at}`);
    // Check if itens format matches SISTEMA_MUNICIPAL format (e.g. direitos array or new format)
    const it = p.itens && p.itens[0];
    if (it) {
      console.log('  item keys:', Object.keys(it));
      if (it.direitos) console.log('  has old format direitos:', it.direitos);
      if (it.eixoTematico) console.log('  has new format eixoTematico:', it.eixoTematico);
    }
  });

  console.log('\n--- Checking 1 original plan updated by Ronald ---');
  origRonald.forEach(p => {
    console.log(`[Ronald Mod] ID: ${p.id} | ${p.ano_serie} | ${p.campo_experiencia} | ${p.bimestre} | UpdatedAt: ${p.updated_at}`);
    const it = p.itens && p.itens[0];
    if (it) {
      console.log('  item keys:', Object.keys(it));
    }
  });

  console.log('\n--- Checking Untouched SISTEMA_MUNICIPAL plans ---');
  origUntouched.slice(0, 5).forEach(p => {
    console.log(`[Untouched] ID: ${p.id} | ${p.ano_serie} | ${p.campo_experiencia} | ${p.bimestre} | UpdatedAt: ${p.updated_at}`);
    const it = p.itens && p.itens[0];
    if (it) {
      console.log('  item keys:', Object.keys(it));
      if (it.direitos) console.log('  has old format direitos:', it.direitos);
      if (it.eixoTematico) console.log('  has new format eixoTematico:', it.eixoTematico);
    }
  });
}

checkItensDifferences();
