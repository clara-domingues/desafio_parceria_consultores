"use client";

import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import LeadsFilters, { FilterState } from "./LeadsFilters";
import LeadsTable from "./LeadsTable";
import LeadDetailsModal, { LeadDetalhes } from "./LeadDetailsModal";
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

const COLUNAS = ["Novo", "Qualificação", "Proposta", "Negociação", "Ganho", "Perdido"];

// Função utilitária para estilizar a classificação (Quente, Morno, Frio)
function getBadgeClassificacao(classificacao: string) {
  const normalizado = classificacao.toLowerCase().trim();

  if (normalizado.includes("quente")) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }
  if (normalizado.includes("morno")) {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
  if (normalizado.includes("frio")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  return "bg-zinc-800 text-zinc-300 border-zinc-700";
}

export default function LeadsView({
  leadsIniciais,
  modoExibicao = "kanban",
}: LeadsViewProps) {
  const context = useLeads?.();
  const contextLeads = context?.leads || [];
  const updateLeadStatus = context?.updateLeadStatus;

  const rawLeads: Lead[] = useMemo(() => {
    return contextLeads.length > 0 ? contextLeads : leadsIniciais || [];
  }, [contextLeads, leadsIniciais]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [overrideStatus, setOverrideStatus] = useState<Record<string, string>>({});
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estado do modal de detalhes
  const [leadSelecionado, setLeadSelecionado] = useState<LeadDetalhes | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  const abrirDetalhes = (lead: unknown) => {
    setLeadSelecionado(lead as LeadDetalhes);
    setModalDetalhesAberto(true);
  };

  const leadsComOverride = useMemo(() => {
    return rawLeads.map((lead) => {
      const rawObj = lead as unknown as Record<string, unknown>;
      // Garante que todo lead sem classificação receba 'Frio' como padrão
      const classificacaoTratada = String(
        rawObj.classificacao || rawObj.temperatura || rawObj.nivel_interesse || "Frio"
      );

      return {
        ...lead,
        status: overrideStatus[String(lead.id)] || lead.status,
        classificacao: classificacaoTratada,
        temperatura: classificacaoTratada,
      };
    });
  }, [rawLeads, overrideStatus]);

  const filteredLeads = useMemo(() => {
    return leadsComOverride.filter((leadItem) => {
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
        if (statusVal.toLowerCase() !== filters.status.toLowerCase()) return false;
      }

      if (filters.origem) {
        const origemVal = String(lead.origem || lead.source || "");
        if (origemVal.toLowerCase() !== filters.origem.toLowerCase()) return false;
      }

      if (filters.responsavel) {
        const respVal = String(
          lead.responsavel || lead.responsavel_id || lead.assignedTo || ""
        );
        if (respVal.toLowerCase() !== filters.responsavel.toLowerCase()) return false;
      }

      if (filters.startDate || filters.endDate) {
        const dateVal = String(
          lead.created_at || lead.createdAt || lead.data_entrada || lead.dataEntrada || ""
        );
        if (dateVal) {
          const leadDate = new Date(dateVal).getTime();
          if (filters.startDate && leadDate < new Date(filters.startDate).getTime())
            return false;
          if (filters.endDate && leadDate > new Date(filters.endDate).getTime() + 86400000)
            return false;
        }
      }

      return true;
    });
  }, [leadsComOverride, filters]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const novoStatus = destination.droppableId;

    setOverrideStatus((prev) => ({ ...prev, [draggableId]: novoStatus }));

    try {
      if (typeof updateLeadStatus === "function") {
        await updateLeadStatus(draggableId, novoStatus);
      }
    } catch (error) {
      console.error("[DragDrop Erro Backend]:", error);
      setOverrideStatus((prev) => {
        const copia = { ...prev };
        delete copia[draggableId];
        return copia;
      });
      return;
    }

    if (novoStatus === "Ganho") {
      const lead = leadsComOverride.find((l) => String(l.id) === draggableId) as
        | Record<string, unknown>
        | undefined;
      const nome = String(lead?.nome_contato || lead?.nome || "Lead");

      try {
        await fetch("/api/converter-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: draggableId }),
        });
      } catch (error) {
        console.error("Erro ao converter lead:", error);
      }

      setMensagemSucesso(`🎉 Parabéns! O lead "${nome}" foi movido para GANHO e o responsável foi notificado.`);
    }
  };

  return (
    <div className="space-y-6">
      {mensagemSucesso && (
        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium transition-all">
          <span>{mensagemSucesso}</span>
          <button
            onClick={() => setMensagemSucesso(null)}
            className="text-emerald-400/70 hover:text-emerald-300 text-lg leading-none transition"
          >
            &times;
          </button>
        </div>
      )}

      <LeadsFilters
        filters={filters}
        onFilterChange={setFilters}
        leads={filteredLeads}
      />

      {modoExibicao === "kanban" ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUNAS.map((col) => {
              const columnLeads = filteredLeads.filter(
                (item) => (item.status || "Novo") === col
              );

              return (
                <div
                  key={col}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 min-w-[250px] w-[250px] shrink-0 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      {col}
                    </span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                      {columnLeads.length}
                    </span>
                  </div>

                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2.5 flex-1 min-h-[150px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-zinc-800/40" : ""
                        }`}
                      >
                        {columnLeads.map((item, index) => {
                          const lead = item as unknown as Record<string, unknown>;
                          const valorNum = Number(
                            lead.valor_potencial ?? lead.valorPotencial ?? lead.valor ?? lead.value ?? 0
                          );
                          const nomeStr = String(
                            lead.nome_contato || lead.nome || lead.name || lead.cliente || lead.title || "Sem Nome"
                          );
                          const empresaStr = String(lead.empresa || lead.company || "Sem empresa");
                          const origemStr = String(lead.origem || lead.source || "Outro");
                          const classificacaoStr = String(
                            lead.classificacao || lead.temperatura || lead.nivel_interesse || "Frio"
                          );

                          return (
                            <Draggable draggableId={String(lead.id)} index={index} key={String(lead.id)}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => abrirDetalhes(item)}
                                  className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition cursor-pointer space-y-2 shadow-sm ${
                                    snapshot.isDragging ? "opacity-75 shadow-xl border-blue-500 scale-105" : ""
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-xs font-semibold text-zinc-200 capitalize">
                                      {nomeStr}
                                    </h4>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 whitespace-nowrap capitalize ${getBadgeClassificacao(
                                        classificacaoStr
                                      )}`}
                                    >
                                      {classificacaoStr}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 truncate">{empresaStr}</p>
                                  <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60 text-[11px]">
                                    <span className="text-emerald-400 font-medium">
                                      R$ {valorNum.toLocaleString("pt-BR")}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{origemStr}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {columnLeads.length === 0 && (
                          <div className="h-full flex items-center justify-center text-[11px] text-zinc-600 italic py-8">
                            Nenhum lead
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <LeadsTable leads={filteredLeads} onRowClick={abrirDetalhes} />
      )}

      <LeadDetailsModal
        lead={leadSelecionado}
        isOpen={modalDetalhesAberto}
        onClose={() => setModalDetalhesAberto(false)}
      />
    </div>
  );
}