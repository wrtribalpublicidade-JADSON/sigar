import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLimits() {
  const { data: defaultLimit, count: c1 } = await supabase
    .from('guias_aprendizagem')
    .select('*', { count: 'exact' })
    .or('ativo.eq.true,ativo.is.null');

  console.log(`Default query count: ${c1}, returned length: ${defaultLimit?.length}`);

  const { data: withLimit, count: c2 } = await supabase
    .from('guias_aprendizagem')
    .select('*', { count: 'exact' })
    .or('ativo.eq.true,ativo.is.null')
    .range(0, 4999);

  console.log(`With range(0, 4999) count: ${c2}, returned length: ${withLimit?.length}`);
}

testLimits();
