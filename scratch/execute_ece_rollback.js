import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeRollback() {
  console.log('=== EXECUTING ECE COURSE PLAN ROLLBACK ===\n');

  // Step 1: Query all current records
  const { data: plans, error: fetchErr } = await supabase
    .from('planos_curso_infantil')
    .select('*');

  if (fetchErr) {
    console.error('Error fetching plans:', fetchErr);
    return;
  }
  console.log(`Current total records: ${plans.length}`);

  // 1. Delete 20 custom imported records by Raimundo (2026-08-28)
  const raimundoImported = plans.filter(p => 
    p.created_at && p.created_at.startsWith('2026-08-28') && p.updated_by === 'raimundoramosbarrozo@gmail.com'
  );
  console.log(`\n1. Deleting ${raimundoImported.length} records imported by Raimundo on 28/08...`);
  for (const p of raimundoImported) {
    const { error: delErr } = await supabase
      .from('planos_curso_infantil')
      .delete()
      .eq('id', p.id);
    if (delErr) {
      console.error(`Error deleting ID ${p.id}:`, delErr);
    } else {
      console.log(`  ✓ Deleted ${p.id} (${p.ano_serie} - ${p.campo_experiencia} - ${p.bimestre})`);
    }
  }

  // 2. Delete 11 records created by Valdenir (2026-08-27)
  const valdenirCreated = plans.filter(p => 
    p.created_at && p.created_at.startsWith('2026-08-27') && p.updated_by === 'valdenir.ribeiro1991@gmail.com'
  );
  console.log(`\n2. Deleting ${valdenirCreated.length} records created by Valdenir on 27/08...`);
  for (const p of valdenirCreated) {
    const { error: delErr } = await supabase
      .from('planos_curso_infantil')
      .delete()
      .eq('id', p.id);
    if (delErr) {
      console.error(`Error deleting ID ${p.id}:`, delErr);
    } else {
      console.log(`  ✓ Deleted ${p.id} (${p.ano_serie} - ${p.campo_experiencia} - ${p.bimestre})`);
    }
  }

  // 3. Restore 21 original records updated by Raimundo on 2026-08-27
  const raimundoUpdated = plans.filter(p => 
    p.created_at && p.created_at.startsWith('2026-08-17') && p.updated_by === 'raimundoramosbarrozo@gmail.com'
  );
  console.log(`\n3. Restoring ${raimundoUpdated.length} original records modified by Raimundo...`);
  for (const p of raimundoUpdated) {
    const { error: upErr } = await supabase
      .from('planos_curso_infantil')
      .update({
        created_by: 'SISTEMA_MUNICIPAL',
        updated_by: 'SISTEMA_MUNICIPAL',
        updated_at: p.created_at || '2026-08-17T18:04:20.897+00:00'
      })
      .eq('id', p.id);
    if (upErr) {
      console.error(`Error restoring ID ${p.id}:`, upErr);
    } else {
      console.log(`  ✓ Restored ${p.id} (${p.ano_serie} - ${p.campo_experiencia} - ${p.bimestre}) -> SISTEMA_MUNICIPAL`);
    }
  }

  // 4. Restore 1 original record updated by Ronald on 2026-08-17
  const ronaldUpdated = plans.filter(p => 
    p.created_at && p.created_at.startsWith('2026-08-17') && p.updated_by === 'teixeiraronald27@gmail.com'
  );
  console.log(`\n4. Restoring ${ronaldUpdated.length} original record modified by Ronald...`);
  for (const p of ronaldUpdated) {
    const { error: upErr } = await supabase
      .from('planos_curso_infantil')
      .update({
        created_by: 'SISTEMA_MUNICIPAL',
        updated_by: 'SISTEMA_MUNICIPAL',
        updated_at: p.created_at || '2026-08-17T18:04:20.897+00:00'
      })
      .eq('id', p.id);
    if (upErr) {
      console.error(`Error restoring ID ${p.id}:`, upErr);
    } else {
      console.log(`  ✓ Restored ${p.id} (${p.ano_serie} - ${p.campo_experiencia} - ${p.bimestre}) -> SISTEMA_MUNICIPAL`);
    }
  }

  // Verification step
  console.log('\n=== VERIFICATION AFTER ROLLBACK ===');
  const { data: finalPlans } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('ano_serie', { ascending: true });

  console.log(`Final total records: ${finalPlans ? finalPlans.length : 0}`);

  const countsByUser = {};
  const countsBySerie = {};
  finalPlans.forEach(p => {
    const user = p.updated_by || 'NULL';
    countsByUser[user] = (countsByUser[user] || 0) + 1;
    countsBySerie[p.ano_serie] = (countsBySerie[p.ano_serie] || 0) + 1;
  });

  console.log('Counts by User:', countsByUser);
  console.log('Counts by Serie:', countsBySerie);
}

executeRollback();
