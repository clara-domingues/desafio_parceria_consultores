'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Lead {
  id?: string | number;
  [key: string]: unknown;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      // Garante que só executa no navegador
      if (typeof window === 'undefined') return;

      try {
        const { data, error } = await supabase.from('leads').select('*');
        if (error) {
          console.error('Erro ao buscar leads:', error.message);
          setError(error.message);
        } else {
          console.log('Leads retornados do Supabase:', data);
          setLeads((data as Lead[]) || []);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
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