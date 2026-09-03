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

// Configuração das colunas e mapeamento flexível dos status vindos do banco/input
const COLUNAS = [
  { 
    id: "Novo", 
    titulo: "Novo", 
    statusAceitos: ["novo", "novo_lead", "primeiro contato", "primeiro_contato"] 
  },
  { 
    id: "Qualificação", 
    titulo: "Qualificação", 
    statusAceitos: ["qualificação", "qualificacao"] 
  },
  { 
    id: "Proposta", 
    titulo: "Proposta", 
    statusAceitos: ["proposta"] 
  },
  { 
    id: "Negociação", 
    titulo: "Negociação", 
    statusAceitos: ["negociação", "negociacao"] 
  },
  { 
    id: "Ganho", 
    titulo: "Ganho", 
    statusAceitos: ["ganho"] 
  },
  { 
    id: "Perdido", 
    titulo: "Perdido", 
    statusAceitos: ["perdido"] 
  },
];

export default function LeadsView({ leadsIniciais, modoExibicao = "kanban" }: LeadsViewProps) {
  const { leads, updateLeadStatus } = useLeads();
  const [overrideStatus, setOverrideStatus] = useState<Record<string, string>>({});

  const [leadSelecionado, setLeadSelecionado] = useState<LeadDetalhes | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // 1. Damos prioridade aos leadsIniciais (já filtrados) ou aos do contexto
  const listaBruta = Array.isArray(leadsIniciais) 
    ? leadsIniciais 
    : (Array.isArray(leads) ? leads : []);

  // 2. Mapeamento direto sem necessidade de useState/useEffect
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

    const novoStatus = destination.droppableId;
    const leadMovido = listaLeads.find((l) => String(l.id) === draggableId);
    const nomeCliente = leadMovido?.nome_contato || leadMovido?.nome || "Lead";

    // 1. Atualização otimista do estado local
    setOverrideStatus((prev) => ({
      ...prev,
      [draggableId]: novoStatus,
    }));

    // 2. Persiste no banco de dados
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
      alert("Não foi possível mover o lead. Tente novamente.");
      return;
    }

    // 3. Automação e Feedback visual para "Ganho"
    if (novoStatus === "Ganho") {
      setMensagemSucesso(`🎉 Parabéns! O lead "${nomeCliente}" foi movido para GANHO e o responsável foi notificado.`);
      setTimeout(() => setMensagemSucesso(null), 6000);

      try {
        const resposta = await fetch("/api/converter-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: draggableId }),
        });
        const resultado = await resposta.json();

        if (resultado.jaConvertido) {
          console.log(`Lead "${nomeCliente}" já havia sido convertido anteriormente.`);
        }
      } catch (error) {
        console.error("Erro na API de automação/notificação de conversão:", error);
      }
    }
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
      {/* Banner de Sucesso / Parabéns ao Mover para Ganho */}
      {mensagemSucesso && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <span>{mensagemSucesso}</span>
          </div>
          <button 
            onClick={() => setMensagemSucesso(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* CONTAINER DO KANBAN RESPONSIVO */}
        <div className="w-full overflow-x-auto pb-6 pt-2">
          <div className="inline-flex gap-4 min-w-full">
            {COLUNAS.map((coluna) => {
              // Normaliza a busca para aceitar variações do status cadastrado no banco
              const leadsDaColuna = listaLeads.filter((lead) => {
                const statusNormalizado = (lead.status || "Novo").toString().toLowerCase().trim();
                return coluna.statusAceitos.includes(statusNormalizado);
              });

              return (
                <div
                  key={coluna.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col w-80 shrink-0"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 truncate pr-2">
                      {coluna.titulo}
                    </h3>
                    <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full shrink-0">
                      {leadsDaColuna.length}
                    </span>
                  </div>

                  <Droppable droppableId={coluna.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-3 min-h-[200px] transition-colors rounded-lg p-1 ${
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
                                    <span className="text-zinc-400 text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[100px]">
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