import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: tData, error: tErr } = await supabase.from('transferencias_estudantes').select('*');
  console.log('transferencias_estudantes:', tData ? tData.length : 'error', tErr);
  if (tData && tData.length > 0) {
    console.log('Sample transferencias:', tData.slice(0, 5));
  }

  const { data: aData, error: aErr } = await supabase.from('alunos').select('id, name, status, class_id, escola_id');
  console.log('Total alunos:', aData ? aData.length : 'error', aErr);
  if (aData) {
    const statusCounts = {};
    aData.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    console.log('Status counts in alunos:', statusCounts);

    const transfAlunos = aData.filter(a => a.status && a.status.toLowerCase().includes('transf'));
    console.log('Transferidos in alunos count:', transfAlunos.length);
    console.log('Transferidos sample:', transfAlunos.slice(0, 5));
  }
}

check();
