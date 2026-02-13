
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tymdfeldkwszealrnhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bWRmZWxka3dzemVhbHJuaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIzOTEsImV4cCI6MjA4NDE1ODM5MX0.3R7Ggt-j1s_H4U8n8038ZdMQMdWWhA_zlKiF27LrEOk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
