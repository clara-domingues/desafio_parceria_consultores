"use client";

import { useState } from "react";
import { useLeads, Lead } from "@/contexts/LeadsContext";
import LeadsTable from "./LeadsTable";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface LeadsViewProps {
  leadsIniciais?: Lead[];
  modoExibicao?: "kanban" | "tabela";
}

const COLUNAS_STATUS = [
  "Novo Lead",
  "Primeiro Contato",
  "Qualificado",
  "Proposta/Apresentação",
  "Negociação",
  "Ganho",
  "Perdido",
];

export default function LeadsView({ leadsIniciais, modoExibicao }: LeadsViewProps) {
  const { leads, updateLeadStatus } = useLeads();
  const [visualizacaoInterna, setVisualizacaoInterna] = useState<"tabela" | "kanban">("kanban");
  const [reclassificandoId, setReclassificandoId] = useState<string | null>(null);

  // Usa a prop passada pelo app/page.tsx; se não fornecida, usa o estado local
  const visualizacao = modoExibicao || visualizacaoInterna;
  const listaLeads = leads && leads.length > 0 ? leads : leadsIniciais || [];

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === result.source.droppableId) return;

    const novoStatus = destination.droppableId;
    setReclassificandoId(draggableId);

    try {
      await updateLeadStatus(draggableId, novoStatus);
    } catch (error) {
      console.error("Erro ao atualizar status via drag and drop:", error);
    } finally {
      setReclassificandoId(null);
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (!val) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Exibe o alternador local apenas se o pai não estiver controlando a exibição */}
      {!modoExibicao && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setVisualizacaoInterna("kanban")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              visualizacao === "kanban"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setVisualizacaoInterna("tabela")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              visualizacao === "tabela"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Tabela
          </button>
        </div>
      )}

      {/* Renderização Condicional */}
      {visualizacao === "tabela" ? (
        <LeadsTable leads={listaLeads} />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
            {COLUNAS_STATUS.map((status) => {
              const leadsDaColuna = listaLeads.filter(
                (lead) => (lead.status || "Novo Lead") === status
              );

              return (
                <div
                  key={status}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col min-w-[260px]"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {status}
                    </h3>
                    <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                      {leadsDaColuna.length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-3 min-h-[150px] transition-colors rounded-lg p-1 ${
                          snapshot.isDraggingOver ? "bg-zinc-800/50" : ""
                        }`}
                      >
                        {leadsDaColuna.map((lead, index) => (
                          <Draggable
                            key={lead.id}
                            draggableId={String(lead.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-zinc-950 border border-zinc-800 p-4 rounded-lg shadow-sm hover:border-zinc-700 transition ${
                                  snapshot.isDragging ? "opacity-75 shadow-lg border-blue-500" : ""
                                } ${reclassificandoId === String(lead.id) ? "animate-pulse" : ""}`}
                              >
                                <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                                  {lead.nome}
                                </h4>
                                {lead.empresa && (
                                  <p className="text-xs text-zinc-400 mb-2 line-clamp-1">
                                    {lead.empresa}
                                  </p>
                                )}
                                <div className="mt-3 pt-2 border-t border-zinc-900 flex justify-between items-center text-xs">
                                  <span className="font-medium text-emerald-400">
                                    {formatCurrency(lead.valor_potencial ?? lead.valor)}
                                  </span>
                                  {lead.origem && (
                                    <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                      {lead.origem}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}