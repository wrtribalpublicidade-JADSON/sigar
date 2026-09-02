import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: schools, error: sErr } = await supabase.from('escolas').select('id, nome');
  console.log('Schools count:', schools ? schools.length : 'error', sErr);

  const { data: alunos, error: aErr } = await supabase.from('alunos').select('id, name, status, class_id, escola_id').limit(10);
  console.log('Alunos count:', alunos ? alunos.length : 'error', aErr);

  const { data: transf, error: tErr } = await supabase.from('transferencias_estudantes').select('*').limit(10);
  console.log('Transferencias count:', transf ? transf.length : 'error', tErr);
}

run();
