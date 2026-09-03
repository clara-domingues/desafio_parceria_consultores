"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLeads, Lead } from "@/contexts/LeadsContext";
import LeadsView from "@/components/leads/LeadsView";
import LeadsFilters from "@/components/leads/LeadsFilters";
import NovoLeadModal from "@/components/leads/NovoLeadModal";
import { DashboardView } from "@/components/DashboardView";

export default function LeadsPage() {
  const { leads, fetchLeads } = useLeads();
  const searchParams = useSearchParams();

  const [modoExibicao, setModoExibicao] = useState<"kanban" | "tabela" | "dashboard">("kanban");
  const [modalAberto, setModalAberto] = useState(false);

  // Extrai os parâmetros do LeadsFilters da URL e trata o termo de busca (+ por espaço)
  const rawBusca = searchParams.get("busca") || "";
  const busca = decodeURIComponent(rawBusca).replace(/\+/g, " ").trim().toLowerCase();

  const status = searchParams.get("status") || "";
  const origem = searchParams.get("origem") || "";
  const responsavel = searchParams.get("responsavel") || "";
  const dataInicio = searchParams.get("dataInicio") || "";
  const dataFim = searchParams.get("dataFim") || "";

  // Filtra a lista de leads dinamicamente respeitando a interface Lead
  const leadsFiltrados = (leads || []).filter((lead: Lead) => {
    // Cast seguro para acessar propriedades opcionais sem erro de compilador
    const item = lead as Lead & {
      nome_contato?: string;
      nome?: string;
      name?: string;
      title?: string;
      empresa?: string;
      email?: string;
      origem?: string;
      responsavel_id?: string | number;
      responsavel?: string | number;
      created_at?: string;
      data_entrada?: string;
    };

    // 1. Busca textual (Nome, E-mail ou Empresa)
    const nomeContato = (item.nome_contato || item.nome || item.name || item.title || "").toLowerCase();
    const empresa = (item.empresa || "").toLowerCase();
    const email = (item.email || "").toLowerCase();

    const atendeBusca =
      !busca ||
      nomeContato.includes(busca) ||
      empresa.includes(busca) ||
      email.includes(busca);

    // 2. Status
    const statusLead = (item.status || "").toLowerCase();
    const atendeStatus =
      !status || status === "todos" || statusLead === status.toLowerCase();

    // 3. Origem
    const origemLead = (item.origem || "").toLowerCase();
    const atendeOrigem =
      !origem || origem === "todas" || origemLead === origem.toLowerCase();

    // 4. Responsável
    const idResponsavel = String(item.responsavel_id || item.responsavel || "");
    const atendeResponsavel =
      !responsavel || responsavel === "todos" || idResponsavel === responsavel;

    // 5. Período (Data)
    const dataLeadStr = item.created_at || item.data_entrada;
    let atendeData = true;

    if (dataLeadStr) {
      const dataLead = new Date(dataLeadStr);
      if (dataInicio) {
        atendeData = atendeData && dataLead >= new Date(dataInicio);
      }
      if (dataFim) {
        atendeData = atendeData && dataLead <= new Date(`${dataFim}T23:59:59`);
      }
    }

    return (
      atendeBusca &&
      atendeStatus &&
      atendeOrigem &&
      atendeResponsavel &&
      atendeData
    );
  });

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

      {/* Barra de Filtros (Busca, Datas, Status, Origem, Responsável) */}
      <LeadsFilters />

      {/* Exibição Condicional repassando os Leads já filtrados */}
      {modoExibicao === "dashboard" ? (
        <DashboardView leads={leadsFiltrados} />
      ) : (
        <LeadsView leadsIniciais={leadsFiltrados} modoExibicao={modoExibicao} />
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