import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectCrecheIII() {
  const { data: plans } = await supabase
    .from('planos_curso_infantil')
    .select('*')
    .eq('ano_serie', 'Creche III')
    .order('bimestre', { ascending: true });

  console.log(`Total Creche III records: ${plans.length}`);
  plans.forEach(p => {
    console.log(`- ${p.bimestre} | ${p.campo_experiencia} | CreatedAt: ${p.created_at?.slice(0, 10)} | UpdatedBy: ${p.updated_by} | Itens:`, p.itens?.length);
  });
}

inspectCrecheIII();
