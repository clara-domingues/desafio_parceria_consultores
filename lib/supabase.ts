import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Só cria o cliente se houver uma URL válida com http/https, evitando que o pré-renderizador quebre o build
export const supabase: SupabaseClient = 
  supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (createClient('https://placeholder.supabase.co', 'placeholder-key') as SupabaseClient);