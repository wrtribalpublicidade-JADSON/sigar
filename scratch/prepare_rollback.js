import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runBackupAndPlan() {
  const { data: plans, error } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }

  // Save backup
  fs.writeFileSync('scratch/backup_planos_curso_infantil_before_rollback.json', JSON.stringify(plans, null, 2));
  console.log(`[BACKUP SAVED] ${plans.length} records saved to scratch/backup_planos_curso_infantil_before_rollback.json`);

  // Target for deletion:
  const toDelete = plans.filter(p => {
    // 20 records imported on 2026-08-28 by Raimundo
    if (p.created_at && p.created_at.startsWith('2026-08-28') && p.updated_by === 'raimundoramosbarrozo@gmail.com') return true;
    // 11 records created on 2026-08-27 by Valdenir
    if (p.created_at && p.created_at.startsWith('2026-08-27') && p.updated_by === 'valdenir.ribeiro1991@gmail.com') return true;
    return false;
  });

  console.log(`\nRecords to DELETE: ${toDelete.length}`);
  toDelete.forEach((p, i) => {
    console.log(`- Del ${i+1}: ID=${p.id} | Faixa="${p.ano_serie}" | Campo="${p.campo_experiencia}" | Bim="${p.bimestre}" | User=${p.updated_by} | CreatedAt=${p.created_at}`);
  });

  // Target for restoration:
  const toRestore = plans.filter(p => {
    if (p.created_at && p.created_at.startsWith('2026-08-17')) {
      if (p.updated_by === 'raimundoramosbarrozo@gmail.com' || p.updated_by === 'teixeiraronald27@gmail.com') {
        return true;
      }
    }
    return false;
  });

  console.log(`\nOriginal Records to RESTORE to SISTEMA_MUNICIPAL: ${toRestore.length}`);
  toRestore.forEach((p, i) => {
    console.log(`- Restore ${i+1}: ID=${p.id} | Faixa="${p.ano_serie}" | Campo="${p.campo_experiencia}" | Bim="${p.bimestre}" | User=${p.updated_by}`);
  });
}

runBackupAndPlan();
