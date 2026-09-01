'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface Lead {
  id?: string | number;
  [key: string]: unknown;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setError('Variáveis de ambiente do Supabase não encontradas.');
        return;
      }

      const client = createClient(url, key);
      const { data, error } = await client.from('leads').select('*');

      if (error) {
        console.error('Erro ao buscar leads:', error.message);
        setError(error.message);
      } else {
        setLeads((data as Lead[]) || []);
      }
    }

    fetchLeads();
  }, []);

  return (
    <main className="p-8 min-h-screen bg-black text-white font-sans">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
      {error && <p className="text-red-500 mb-4">Erro: {error}</p>}
      <pre className="bg-zinc-900 p-4 rounded-md text-sm overflow-auto">
        {JSON.stringify(leads, null, 2)}
      </pre>
    </main>
  );
}