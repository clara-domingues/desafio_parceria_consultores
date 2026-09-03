"use client";

import { useState } from "react";
import { useLeads, Lead } from "@/contexts/LeadsContext";
import LeadsTable from "./LeadsTable";
import LeadDetailsModal, { LeadDetalhes } from "./LeadDetailsModal";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface LeadEstendido extends Lead {
  title?: string;
  name?: string;
  temperatura?: string;
  score?: string | number;
}

interface LeadsViewProps {
  leadsIniciais?: Lead[];
  modoExibicao?: "kanban" | "tabela";
}

// Precisa bater EXATAMENTE com os valores do enum status_lead no Postgres:
// 'Novo', 'Qualificacao', 'Proposta', 'Negociacao', 'Ganho', 'Perdido'
// NÃO adicionar etapas novas nem renomear sem atualizar o enum no banco junto.
const COLUNAS_STATUS = ["Novo", "Qualificação", "Proposta", "Negociação", "Ganho", "Perdido"];

export default function LeadsView({ leadsIniciais, modoExibicao = "kanban" }: LeadsViewProps) {
  const { leads, updateLeadStatus } = useLeads();
  const [overrideStatus, setOverrideStatus] = useState<Record<string, string>>({});

  const [leadSelecionado, setLeadSelecionado] = useState<LeadDetalhes | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  const listaBruta = Array.isArray(leads) && leads.length > 0
    ? leads
    : (Array.isArray(leadsIniciais) ? leadsIniciais : []);

  const listaLeads: LeadEstendido[] = (listaBruta as LeadEstendido[]).map((lead) => ({
    ...lead,
    status: overrideStatus[String(lead.id)] || lead.status,
  }));

  const abrirDetalhes = (lead: LeadEstendido) => {
    setLeadSelecionado(lead as LeadDetalhes);
    setModalDetalhesAberto(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    // O nome da coluna já É o valor do enum — sem conversão nenhuma
    const novoStatus = destination.droppableId;
    const statusAnterior = listaLeads.find((l) => String(l.id) === draggableId)?.status;

    // 1. Atualização otimista da interface
    setOverrideStatus((prev) => ({
      ...prev,
      [draggableId]: novoStatus,
    }));

    // 2. Persiste no banco
    try {
      if (typeof updateLeadStatus === "function") {
        await updateLeadStatus(draggableId, novoStatus);
      }
    } catch (error) {
      console.error("[DragDrop Erro Backend]:", error);
      // Desfaz a atualização otimista — o banco recusou, não faz sentido manter na tela
      setOverrideStatus((prev) => {
        const copia = { ...prev };
        delete copia[draggableId];
        return copia;
      });
      alert("Não foi possível mover o lead. Tente novamente.");
      return;
    }

    // 3. Automação de conversão de verdade (Requisito 5) — dispara a rota que
    // cria o cliente e registra a notificação. O alert é só um feedback visual
    // de que a automação rodou, não é a automação em si.
    if (novoStatus === "Ganho") {
      const leadConvertido = listaLeads.find((l) => String(l.id) === draggableId);
      const nomeCliente = leadConvertido?.nome_contato || leadConvertido?.nome || "Lead";

      try {
        const resposta = await fetch("/api/converter-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: draggableId }),
        });
        const resultado = await resposta.json();

        if (resultado.jaConvertido) {
          console.log(`Lead "${nomeCliente}" já havia sido convertido antes.`);
        } else {
          alert(`🎉 Lead "${nomeCliente}" convertido em cliente com sucesso! O responsável foi notificado.`);
        }
      } catch (error) {
        console.error("Erro ao converter lead:", error);
        alert(`Lead movido para Ganho, mas houve um erro ao converter em cliente. Confira manualmente.`);
      }
    }

    void statusAnterior; // mantido caso queira logar a transição futuramente
  };

  const formatCurrency = (val?: number | null) => {
    if (!val) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const renderBadgeClassificacao = (lead: LeadEstendido) => {
    const temp = (lead.classificacao || lead.temperatura || lead.score || "").toString().toLowerCase();

    if (temp.includes("quente")) {
      return (
        <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap">
          🔥 Quente
        </span>
      );
    }
    if (temp.includes("frio")) {
      return (
        <span className="text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800/80 px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap">
          ❄️ Frio
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap">
        ☀️ Morno
      </span>
    );
  };

  if (modoExibicao === "tabela") {
    return <LeadsTable leads={listaLeads} />;
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 w-full">
          {COLUNAS_STATUS.map((statusColuna) => {
            // Comparação direta — os valores já são idênticos ao enum, sem normalização
            const leadsDaColuna = listaLeads.filter(
              (lead) => (lead.status || "Novo") === statusColuna
            );

            return (
              <div
                key={statusColuna}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col w-75 shrink-0"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 truncate pr-2">
                    {statusColuna}
                  </h3>
                  <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full shrink-0">
                    {leadsDaColuna.length}
                  </span>
                </div>

                <Droppable droppableId={statusColuna}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-3 min-h-50 transition-colors rounded-lg p-1 ${
                        snapshot.isDraggingOver ? "bg-zinc-800/40" : ""
                      }`}
                    >
                      {leadsDaColuna.map((lead, index) => (
                        <Draggable
                          key={String(lead.id)}
                          draggableId={String(lead.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => abrirDetalhes(lead)}
                              className={`bg-zinc-950 border border-zinc-800 p-4 rounded-lg shadow-sm hover:border-zinc-700 transition space-y-3 cursor-pointer ${
                                snapshot.isDragging ? "opacity-75 shadow-xl border-blue-500 scale-105" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-semibold text-white text-sm line-clamp-2">
                                  {lead.nome_contato || lead.nome || lead.title || lead.name || "Lead sem nome"}
                                </h4>
                                {renderBadgeClassificacao(lead)}
                              </div>

                              {lead.empresa && (
                                <p className="text-xs text-zinc-400 truncate">
                                  {lead.empresa}
                                </p>
                              )}

                              <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-xs">
                                <span className="font-semibold text-emerald-400">
                                  {formatCurrency(lead.valor_potencial ?? lead.valor)}
                                </span>
                                {lead.origem && (
                                  <span className="text-zinc-400 text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-25">
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

      <LeadDetailsModal
        lead={leadSelecionado}
        isOpen={modalDetalhesAberto}
        onClose={() => setModalDetalhesAberto(false)}
      />
    </>
  );
}