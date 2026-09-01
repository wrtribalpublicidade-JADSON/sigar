import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('=== 1. PLANOS DE CURSO INFANTIL ===');
  const { data: plans, error: errPlans } = await supabase
    .from('planos_curso_infantil')
    .select('*');
  
  if (errPlans) {
    console.error('Error fetching plans:', errPlans);
  } else {
    console.log('Total planos_curso_infantil:', plans.length);
    plans.forEach((p, idx) => {
      console.log(`[${idx+1}] ID: ${p.id} | AnoRef: ${p.ano_referencia} | Faixa: ${p.ano_serie} | Campo: ${p.campo_experiencia} | Bim: ${p.bimestre} | CreatedBy: ${p.created_by} | UpdatedBy: ${p.updated_by} | CreatedAt: ${p.created_at} | UpdatedAt: ${p.updated_at} | ItensCount: ${p.itens ? p.itens.length : 0}`);
    });
  }

  console.log('\n=== 2. AUDIT LOGS PLANO_CURSO_INFANTIL ===');
  const { data: audit, error: errAudit } = await supabase
    .from('audit_logs')
    .select('*')
    .ilike('module', '%PLANO_CURSO_INFANTIL%')
    .order('created_at', { ascending: false });

  if (errAudit) {
    console.error('Error audit:', errAudit);
  } else {
    console.log('Total audit logs for PLANO_CURSO_INFANTIL:', audit.length);
    audit.forEach((a, idx) => {
      console.log(`[Audit ${idx+1}] Action: ${a.action} | User: ${a.user_name} (${a.user_email}) | RecordId: ${a.record_id} | Date: ${a.created_at}`);
      console.log('  Details:', JSON.stringify(a.details));
    });
  }

  console.log('\n=== 3. AUDIT LOGS FOR SPECIFIC USERS ===');
  const { data: userLogs, error: errUserLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .or('user_name.ilike.%raimundo%,user_name.ilike.%valdenir%,user_name.ilike.%ronald%,user_email.ilike.%raimundo%,user_email.ilike.%valdenir%,user_email.ilike.%ronald%')
    .order('created_at', { ascending: false });

  if (errUserLogs) {
    console.error('Error user logs:', errUserLogs);
  } else {
    console.log('Total logs for specified users:', userLogs.length);
    userLogs.forEach((ul, idx) => {
      console.log(`[UserLog ${idx+1}] ${ul.created_at} | ${ul.user_name} (${ul.user_email}) | Action: ${ul.action} | Module: ${ul.module} | RecordId: ${ul.record_id}`);
      if (ul.module && ul.module.includes('PLANO_CURSO')) {
        console.log('  Details:', JSON.stringify(ul.details));
      }
    });
  }
}

run();
