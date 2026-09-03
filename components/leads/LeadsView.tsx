"use client";

import React, { useState, useMemo } from "react";
import LeadsFilters, { FilterState } from "./LeadsFilters";
import LeadsTable from "./LeadsTable";
import { useLeads, Lead } from "@/contexts/LeadsContext";

export interface LeadsViewProps {
  leadsIniciais?: Lead[];
  modoExibicao?: "kanban" | "tabela";
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  startDate: "",
  endDate: "",
  status: "",
  origem: "",
  responsavel: "",
};

export default function LeadsView({
  leadsIniciais,
  modoExibicao = "kanban",
}: LeadsViewProps) {
  const context = useLeads?.();
  const contextLeads = context?.leads || [];

  const rawLeads: Lead[] = useMemo(() => {
    return contextLeads.length > 0 ? contextLeads : leadsIniciais || [];
  }, [contextLeads, leadsIniciais]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Aplica filtros cobrindo todas as variações de chaves possíveis
  const filteredLeads = useMemo(() => {
    return rawLeads.filter((leadItem) => {
      const lead = leadItem as unknown as Record<string, unknown>;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameVal = String(
          lead.nome || lead.nome_contato || lead.name || lead.cliente || lead.title || ""
        );
        const emailVal = String(lead.email || "");
        const companyVal = String(lead.empresa || lead.company || "");

        const matchesName = nameVal.toLowerCase().includes(searchLower);
        const matchesEmail = emailVal.toLowerCase().includes(searchLower);
        const matchesCompany = companyVal.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesEmail && !matchesCompany) return false;
      }

      if (filters.status) {
        const statusVal = String(lead.status || "");
        if (statusVal.toLowerCase() !== filters.status.toLowerCase()) {
          return false;
        }
      }

      if (filters.origem) {
        const origemVal = String(lead.origem || lead.source || "");
        if (origemVal.toLowerCase() !== filters.origem.toLowerCase()) {
          return false;
        }
      }

      if (filters.responsavel) {
        const respVal = String(
          lead.responsavel || lead.responsavel_id || lead.assignedTo || ""
        );
        if (respVal.toLowerCase() !== filters.responsavel.toLowerCase()) {
          return false;
        }
      }

      if (filters.startDate || filters.endDate) {
        const dateVal = String(
          lead.created_at || lead.createdAt || lead.data_entrada || lead.dataEntrada || ""
        );
        if (dateVal) {
          const leadDate = new Date(dateVal).getTime();
          if (
            filters.startDate &&
            leadDate < new Date(filters.startDate).getTime()
          )
            return false;
          if (
            filters.endDate &&
            leadDate > new Date(filters.endDate).getTime() + 86400000
          )
            return false;
        }
      }

      return true;
    });
  }, [rawLeads, filters]);

  const columns = [
    "Novo",
    "Qualificação",
    "Proposta",
    "Negociação",
    "Ganho",
    "Perdido",
  ];

  return (
    <div className="space-y-6">
      {/* Exibe os filtros apenas se o componente pai não os estiver renderizando */}
      <LeadsFilters
        filters={filters}
        onFilterChange={setFilters}
        leads={filteredLeads}
      />

      {modoExibicao === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const columnLeads = filteredLeads.filter((item) => {
              const statusVal = String(item.status || "");
              return statusVal.toLowerCase() === col.toLowerCase();
            });

            return (
              <div
                key={col}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 min-w-[250px] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {col}
                  </span>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 min-h-[150px]">
                  {columnLeads.map((item) => {
                    const lead = item as unknown as Record<string, unknown>;
                    const valorNum = Number(
                      lead.valor_potencial ?? lead.valorPotencial ?? lead.valor ?? lead.value ?? 0
                    );

                    // Mapeia todas as possíveis variações do nome usadas na tabela
                    const nomeStr = String(
                      lead.nome ||
                        lead.nome_contato ||
                        lead.name ||
                        lead.cliente ||
                        lead.title ||
                        "Sem Nome"
                    );

                    const empresaStr = String(
                      lead.empresa || lead.company || "Sem empresa"
                    );
                    const origemStr = String(
                      lead.origem || lead.source || "Outro"
                    );

                    return (
                      <div
                        key={String(lead.id)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition cursor-pointer space-y-2 shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-zinc-200 capitalize">
                            {nomeStr}
                          </h4>
                          {Boolean(lead.temperatura) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                              {String(lead.temperatura)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {empresaStr}
                        </p>
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60 text-[11px]">
                          <span className="text-emerald-400 font-medium">
                            R$ {valorNum.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {origemStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[11px] text-zinc-600 italic py-8">
                      Nenhum lead
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <LeadsTable leads={filteredLeads} />
      )}
    </div>
  );
}