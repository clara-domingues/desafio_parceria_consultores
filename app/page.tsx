"use client";

import { useState } from "react";
import { useLeads } from "@/contexts/LeadsContext";
import LeadsView from "@/components/leads/LeadsView";
import NovoLeadModal from "@/components/leads/NovoLeadModal";
import { DashboardView } from "@/components/DashboardView";

export default function LeadsPage() {
  const { leads, fetchLeads } = useLeads();

  const [modoExibicao, setModoExibicao] = useState<"kanban" | "tabela" | "dashboard">("kanban");
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho com Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Leads</h1>
          <p className="text-sm text-zinc-400">Acompanhe seu pipeline em tempo real</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Cadastrar Novo Lead */}
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
          >
            <span>+</span> Novo Lead
          </button>

          {/* Seletor de Modos de Exibição */}
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => setModoExibicao("kanban")}
              className={`px-3 py-1.5 rounded-lg transition ${
                modoExibicao === "kanban" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setModoExibicao("tabela")}
              className={`px-3 py-1.5 rounded-lg transition ${
                modoExibicao === "tabela" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setModoExibicao("dashboard")}
              className={`px-3 py-1.5 rounded-lg transition ${
                modoExibicao === "dashboard" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* A barra de filtros e a filtragem em si vivem inteiramente dentro
          de LeadsView agora — não duplicar aqui. */}
      {modoExibicao === "dashboard" ? (
        <DashboardView leads={leads} />
      ) : (
        <LeadsView modoExibicao={modoExibicao} />
      )}

      {/* Modal / Form de Cadastro de Lead */}
      {modalAberto && (
        <NovoLeadModal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  );
}