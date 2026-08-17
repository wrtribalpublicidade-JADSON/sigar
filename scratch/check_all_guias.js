import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGuias() {
  console.log('=== CONSULTANDO GUIA DE APRENDIZAGEM (FUNDAMENTAL) ===');
  const { data: fundamental, error: err1 } = await supabase
    .from('guias_aprendizagem')
    .select('*');

  if (err1) {
    console.error('Erro Fundamental:', err1);
  } else {
    console.log(`Total Fundamental encontrados: ${fundamental.length}`);
    fundamental.forEach((g, idx) => {
      console.log(`[${idx+1}] ID: ${g.id} | EscolaID: ${g.escola_id} | TurmaID: ${g.turma_id} | Ano: ${g.ano_serie} | Periodo: ${g.periodo} | Componente: ${g.componente} | Ativo: ${g.ativo} | Status: ${g.status} | Data: ${g.data || g.data_criacao} | Autor: ${g.updated_by || g.created_by} | Titulo: ${g.titulo}`);
    });
  }

  console.log('\n=== CONSULTANDO GUIA DE APRENDIZAGEM (INFANTIL) ===');
  const { data: infantil, error: err2 } = await supabase
    .from('guias_aprendizagem_infantil')
    .select('*');

  if (err2) {
    console.error('Erro Infantil:', err2);
  } else {
    console.log(`Total Infantil encontrados: ${infantil.length}`);
    infantil.forEach((g, idx) => {
      console.log(`[${idx+1}] ID: ${g.id} | EscolaID: ${g.escola_id} | TurmaID: ${g.turma_id} | Ano: ${g.ano_serie} | Periodo: ${g.periodo} | Campo: ${g.campo_experiencia} | Ativo: ${g.ativo} | Status: ${g.status} | Data: ${g.data || g.data_criacao} | Autor: ${g.updated_by || g.created_by} | Titulo: ${g.titulo}`);
    });
  }
}

checkGuias();
