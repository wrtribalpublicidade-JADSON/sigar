import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `test_temp_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  try {
    console.log('Signing up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      console.log('Sign up error:', signUpError.message);
      return;
    }
    
    console.log('Signed up successfully. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError.message);
      return;
    }
    
    console.log('Signed in successfully! Fetching coordinators...');
    const { data, error } = await supabase.from('coordenadores')
      .select('*, coordenador_escolas(escola_id), coordenador_turmas(turma_id)');
      
    if (error) {
      console.log('Fetch error:', error.message);
      return;
    }
    
    console.log(`Total coordinators fetched: ${data.length}`);
    const schoolId = '13c62dfb-c711-4c17-a2ab-37df3fb6468a';
    const teachers = data.filter(c => {
      const escolasIds = c.coordenador_escolas?.map(ce => ce.escola_id) || [];
      return c.funcao === 'Professor' && escolasIds.includes(schoolId);
    });
    console.log(`Total teachers filtered: ${teachers.length}`);
    teachers.forEach(t => {
      console.log(`- ${t.nome}`);
    });
  } catch (err) {
    console.error(err);
  }
}

test();
