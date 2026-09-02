"use client";

import { useState } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { useLeads, Lead } from "@/contexts/LeadsContext";
import LeadsTable from "./LeadsTable";

const COLUNAS = ["Novo", "Qualificacao", "Proposta", "Negociacao", "Ganho", "Perdido"];

const CORES_STATUS: Record<string, string> = {
  Novo: "border-t-zinc-500",
  Qualificacao: "border-t-blue-500",
  Proposta: "border-t-indigo-500",
  Negociacao: "border-t-amber-500",
  Ganho: "border-t-green-500",
  Perdido: "border-t-red-500",
};

const CORES_CLASSIFICACAO: Record<string, string> = {
  Quente: "bg-red-500/15 text-red-400 border border-red-500/30",
  Morno: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Frio: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

function diasSemAtualizacao(atualizadoEm?: string | null): number {
  if (!atualizadoEm) return 0;
  const ms = Date.now() - new Date(atualizadoEm).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

interface LeadsViewProps {
  leadsIniciais?: Lead[];
}

export default function LeadsView({ leadsIniciais }: LeadsViewProps) {
  const { leads, updateLeadStatus, refreshLeads } = useLeads();
  const [visualizacao, setVisualizacao] = useState<"tabela" | "kanban">("kanban");
  const [reclassificandoId, setReclassificandoId] = useState<string | null>(null);

  const listaLeads = (leads && leads.length > 0) ? leads : (leadsIniciais || []);

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const novoStatus = destination.droppableId;
    const lead = listaLeads.find((l) => l.id === draggableId);
    if (!lead) return;

    const statusAnterior = lead.status;

    try {
      await updateLeadStatus(draggableId, novoStatus);

      await supabase.from("historico").insert({
        lead_id: draggableId,
        campo_alterado: "status",
        valor_anterior: statusAnterior,
        valor_novo: novoStatus,
      });

      if (novoStatus === "Ganho") {
        await fetch("/api/converter-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: draggableId }),
        });
      }

      if (refreshLeads) {
        await refreshLeads();
      }
    } catch (error) {
      console.error("Erro ao atualizar status do lead:", error);
    }
  }

  async function reclassificar(lead: Lead) {
    setReclassificandoId(lead.id);
    try {
      const valorPotencial = lead.valor_potencial ?? lead.valor ?? 0;
      const resposta = await fetch("/api/classificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor_potencial: valorPotencial,
          origem: lead.origem,
        }),
      });
      const { classificacao, justificativa } = await resposta.json();

      await supabase
        .from("leads")
        .update({ classificacao, classificacao_motivo: justificativa })
        .eq("id", lead.id);

      await supabase.from("historico").insert({
        lead_id: lead.id,
        campo_alterado: "classificacao",
        valor_anterior: lead.classificacao,
        valor_novo: classificacao,
      });

      if (refreshLeads) {
        await refreshLeads();
      }
    } finally {
      setReclassificandoId(null);
    }
  }

  const getNomeUsuario = (usuarios: unknown): string | null => {
    if (typeof usuarios === "object" && usuarios !== null && "nome" in usuarios) {
      return String((usuarios as { nome?: unknown }).nome || "");
    }
    if (typeof usuarios === "string") return usuarios;
    return null;
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setVisualizacao("tabela")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
            visualizacao === "tabela" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Tabela
        </button>
        <button
          onClick={() => setVisualizacao("kanban")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
            visualizacao === "kanban" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Kanban
        </button>
      </div>

      {visualizacao === "tabela" ? (
        <LeadsTable leads={listaLeads} />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {COLUNAS.map((coluna) => {
              const leadsDaColuna = listaLeads.filter((l) => l.status === coluna);
              return (
                <Droppable droppableId={coluna} key={coluna}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-w-65 w-65 sm:w-70 shrink-0 bg-zinc-900 rounded-lg p-3 border-t-4 ${
                        CORES_STATUS[coluna]
                      } ${snapshot.isDraggingOver ? "bg-zinc-800" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-zinc-200">{coluna}</h3>
                        <span className="text-xs bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">
                          {leadsDaColuna.length}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 min-h-[100px]">
                        {leadsDaColuna.map((lead, index) => {
                          const estagnado = diasSemAtualizacao(lead.atualizado_em) >= 7;
                          const valorExibido = lead.valor_potencial ?? lead.valor ?? 0;
                          const nomeUsuario = getNomeUsuario(lead.usuarios);

                          return (
                            <Draggable draggableId={lead.id} index={index} key={lead.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-zinc-950 border border-zinc-800 rounded-md p-3 hover:border-zinc-700 transition ${
                                    snapshot.isDragging ? "shadow-lg shadow-black/40 rotate-1" : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <Link
                                      href={`/leads/${lead.id}`}
                                      className="font-medium text-sm text-white hover:underline"
                                    >
                                      {lead.nome_contato || lead.nome || "Sem nome"}
                                    </Link>
                                    {lead.classificacao && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                          CORES_CLASSIFICACAO[lead.classificacao] || ""
                                        }`}
                                      >
                                        {lead.classificacao}
                                      </span>
                                    )}
                                  </div>

                                  {lead.empresa && (
                                    <p className="text-xs text-zinc-500 mt-0.5">{lead.empresa}</p>
                                  )}

                                  <p className="text-xs text-zinc-400 mt-1.5">
                                    R$ {Number(valorExibido).toLocaleString("pt-BR")}
                                  </p>

                                  {nomeUsuario && (
                                    <p className="text-[11px] text-zinc-500 mt-1">
                                      {nomeUsuario}
                                    </p>
                                  )}

                                  {estagnado && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded px-1.5 py-0.5 w-fit">
                                      ⚠ {diasSemAtualizacao(lead.atualizado_em)}d sem atualização
                                    </div>
                                  )}

                                  <button
                                    onClick={() => reclassificar(lead)}
                                    disabled={reclassificandoId === lead.id}
                                    className="mt-2 text-[10px] text-zinc-500 hover:text-zinc-300 underline disabled:opacity-50"
                                  >
                                    {reclassificandoId === lead.id ? "Reclassificando..." : "Reclassificar"}
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}