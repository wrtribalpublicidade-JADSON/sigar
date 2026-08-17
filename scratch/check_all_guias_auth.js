import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuth() {
  const email = `test_temp_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      console.log('Sign up error:', signUpError.message);
      return;
    }

    const { data: fundamental, error: err1 } = await supabase
      .from('guias_aprendizagem')
      .select('*');

    if (err1) {
      console.error('Erro Fundamental:', err1.message);
    } else {
      console.log(`\n=== GUIAS DE APRENDIZAGEM FUNDAMENTAL (Total: ${fundamental.length}) ===`);
      fundamental.forEach((g, idx) => {
        console.log(`[${idx+1}] ID: ${g.id} | Escola: ${g.escola_id} | Turma: ${g.turma_id} | Ano: ${g.ano_serie} | Periodo: ${g.periodo} | Comp: ${g.componente} | Ativo: ${g.ativo} | Status: ${g.status} | Data: ${g.data || g.data_criacao} | Autor: ${g.updated_by || g.created_by} | Titulo: ${g.titulo}`);
      });
    }

    const { data: infantil, error: err2 } = await supabase
      .from('guias_aprendizagem_infantil')
      .select('*');

    if (err2) {
      console.error('Erro Infantil:', err2.message);
    } else {
      console.log(`\n=== GUIAS DE APRENDIZAGEM INFANTIL (Total: ${infantil.length}) ===`);
      infantil.forEach((g, idx) => {
        console.log(`[${idx+1}] ID: ${g.id} | Escola: ${g.escola_id} | Turma: ${g.turma_id} | Ano: ${g.ano_serie} | Periodo: ${g.periodo} | Campo: ${g.campo_experiencia} | Ativo: ${g.ativo} | Status: ${g.status} | Data: ${g.data || g.data_criacao} | Autor: ${g.updated_by || g.created_by} | Titulo: ${g.titulo}`);
      });
    }

  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testWithAuth();
