"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Lead {
  id: string;
  nome_contato: string;
  email: string;
  empresa: string | null;
  telefone: string | null;
  status: string | null;
  classificacao: string | null;
  criado_em: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert("Erro ao buscar leads: " + error.message);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-block-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel de Leads</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Gerencie seus contatos e acompanhe a classificação automatizada.
            </p>
          </div>
          <Link
            href="/leads/novo"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-md transition duration-200"
          >
            + Novo Lead
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-400">Carregando leads...</p>
        ) : leads.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg p-8 text-center bg-zinc-900/50">
            <p className="text-zinc-400">Nenhum lead cadastrado até o momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-800 rounded-lg shadow-xl">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs border-b border-zinc-800">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Classificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-900/50 transition duration-150">
                    <td className="p-4 font-medium text-white">{lead.nome_contato}</td>
                    <td className="p-4">{lead.email}</td>
                    <td className="p-4">{lead.empresa || "-"}</td>
                    <td className="p-4">
                      <span className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full border border-zinc-700">
                        {lead.status || "Novo"}
                      </span>
                    </td>
                    <td className="p-4">
                      {lead.classificacao === "Quente" && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                          🔥 Quente
                        </span>
                      )}
                      {lead.classificacao === "Morno" && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                          ⚡ Morno
                        </span>
                      )}
                      {lead.classificacao === "Frio" && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                          ❄️ Frio
                        </span>
                      )}
                      {!lead.classificacao && <span className="text-zinc-500">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}