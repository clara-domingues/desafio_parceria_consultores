"use client";

import { useState } from "react";
import { useLeads } from "@/contexts/LeadsContext";
import LeadsView from "@/components/leads/LeadsView";
import { DashboardView } from "@/components/DashboardView";

export const dynamic = "force-dynamic";

export default function Home() {
  const { leads, loading } = useLeads();
  const [view, setView] = useState<"kanban" | "tabela" | "dashboard">("kanban");

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-zinc-400 font-medium">Carregando CRM...</div>
      </main>
    );
  }

  // Cálculos para o cabeçalho rápido
  const totalLeads = leads.length;
  const valorPipeline = leads.reduce(
    (acc, lead) => acc + (lead.valor_potencial ?? lead.valor ?? 0),
    0
  );

  const agora = new Date();
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const leadsEstagnados = leads.filter((l) => {
    if (!l.atualizado_em) return false;
    const dataAtualizacao = new Date(l.atualizado_em);
    return (
      dataAtualizacao < seteDiasAtras &&
      l.status !== "Ganho" &&
      l.status !== "Perdido"
    );
  }).length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho principal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Acompanhe seu pipeline em tempo real
            </p>
          </div>

          {/* Botões de alternância de visualização */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setView("kanban")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                view === "kanban"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("tabela")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                view === "tabela"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setView("dashboard")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                view === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Resumo Rápido no Topo (KPIs curtos) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
              Total de Leads
            </span>
            <span className="text-2xl font-bold">{totalLeads}</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
              Valor em Pipeline
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              {formatCurrency(valorPipeline)}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
              Leads Estagnados (+7D)
            </span>
            <span className="text-2xl font-bold text-amber-400">
              {leadsEstagnados}
            </span>
          </div>
        </div>

        {/* Conteúdo dinâmico conforme a aba selecionada */}
        {view === "dashboard" ? (
          <DashboardView leads={leads} />
        ) : (
          <LeadsView />
        )}
      </div>
    </main>
  );
}