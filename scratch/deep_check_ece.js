import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAll() {
  const { data: plans, error } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total records: ${plans.length}`);

  const byCreatedBy = {};
  const byUpdatedBy = {};
  const byCreatedAtBatch = {};

  plans.forEach(p => {
    const cb = p.created_by || 'NULL';
    const ub = p.updated_by || 'NULL';
    const batch = p.created_at ? p.created_at.slice(0, 16) : 'NO_DATE';

    byCreatedBy[cb] = (byCreatedBy[cb] || 0) + 1;
    byUpdatedBy[ub] = (byUpdatedBy[ub] || 0) + 1;
    byCreatedAtBatch[batch] = (byCreatedAtBatch[batch] || 0) + 1;
  });

  console.log('\n--- Count by created_by ---');
  console.log(byCreatedBy);

  console.log('\n--- Count by updated_by ---');
  console.log(byUpdatedBy);

  console.log('\n--- Batches by created_at ---');
  console.log(byCreatedAtBatch);

  console.log('\n--- Records by user RAIMUNDO / VALDENIR / RONALD ---');
  const userPlans = plans.filter(p => {
    const s = `${p.created_by} ${p.updated_by}`.toLowerCase();
    return s.includes('raimundo') || s.includes('valdenir') || s.includes('ronald');
  });

  console.log(`Matching records count: ${userPlans.length}`);
  userPlans.forEach((p, i) => {
    console.log(`[${i+1}] ID: ${p.id} | AnoRef: ${p.ano_referencia} | Faixa: ${p.ano_serie} | Campo: ${p.campo_experiencia} | Bim: ${p.bimestre} | CreatedBy: ${p.created_by} | UpdatedBy: ${p.updated_by} | CreatedAt: ${p.created_at} | UpdatedAt: ${p.updated_at}`);
  });
}

inspectAll();
