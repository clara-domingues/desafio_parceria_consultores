"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Lead {
  id: string;
  nome_contato: string;
  email: string;
  empresa: string | null;
  telefone: string | null;
  status: string | null;
  responsavel: string | null;
  valor_potencial: number | null;
  classificacao: string | null;
  origem: string | null;
  segmento: string | null;
  observacoes: string | null;
  criado_em: string;
}

interface Historico {
  id: string;
  campo_alterado: string;
  valor_antigo: string | null;
  valor_novo: string | null;
  criado_em: string;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoStatus, setNovoStatus] = useState("");

  useEffect(() => {
    async function fetchLeadDetails() {
      // 1. Buscar dados do lead
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (!leadError && leadData) {
        setLead(leadData);
        setNovoStatus(leadData.status || "Novo");
      }

      // 2. Buscar histórico do lead
      const { data: histData } = await supabase
        .from("historico_lead")
        .select("*")
        .eq("lead_id", id)
        .order("criado_em", { ascending: false });

      if (histData) {
        setHistorico(histData);
      }

      setLoading(false);
    }

    fetchLeadDetails();
  }, [id]);

  async function handleStatusChange(statusAtualizado: string) {
    if (!lead || lead.status === statusAtualizado) return;

    const statusAntigo = lead.status;

    // Actualiza o lead no Supabase
    const { error: updateError } = await supabase
      .from("leads")
      .update({ status: statusAtualizado })
      .eq("id", lead.id);

    if (!updateError) {
      // Registra no historico
      const { data: newHist } = await supabase
        .from("historico_lead")
        .insert({
          lead_id: lead.id,
          campo_alterado: "status",
          valor_antigo: statusAntigo,
          valor_novo: statusAtualizado,
        })
        .select()
        .single();

      setLead({ ...lead, status: statusAtualizado });
      if (newHist) {
        setHistorico([newHist, ...historico]);
      }
    }
  }

  if (loading) {
    return <div className="p-8 text-zinc-400">Carregando detalhes do lead...</div>;
  }

  if (!lead) {
    return (
      <div className="p-8 text-white">
        <p>Lead não encontrado.</p>
        <Link href="/" className="text-blue-500 underline mt-4 block">
          Voltar para a listagem
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navegação e Ações */}
        <div className="flex justify-between items-center">
          <Link href="/" className="text-zinc-400 hover:text-white transition text-sm">
            ← Voltar para a listagem
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Status atual:</span>
            <select
              value={novoStatus}
              onChange={(e) => {
                setNovoStatus(e.target.value);
                handleStatusChange(e.target.value);
              }}
              className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-1.5 text-sm"
            >
              <option value="Novo">Novo</option>
              <option value="Qualificação">Qualificação</option>
              <option value="Proposta">Proposta</option>
              <option value="Negociação">Negociação</option>
              <option value="Ganho">Ganho</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{lead.nome_contato}</h1>
              {lead.classificacao && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    lead.classificacao === "Quente"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : lead.classificacao === "Morno"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {lead.classificacao}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm">{lead.empresa || "Sem empresa cadastrada"}</p>
          </div>

          <div className="flex flex-col justify-center md:items-end">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Valor Potencial</span>
            <span className="text-2xl font-bold text-emerald-400">
              {lead.valor_potencial
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    lead.valor_potencial
                  )
                : "R$ 0,00"}
            </span>
          </div>
        </div>

        {/* Grade de Detalhes e Histórico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dados Cadastrais */}
          <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2">
              Dados Cadastrais
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block">E-mail</span>
                <span className="text-zinc-200">{lead.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Telefone / WhatsApp</span>
                <span className="text-zinc-200">{lead.telefone || "-"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Origem</span>
                <span className="text-zinc-200">{lead.origem || "-"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Responsável Comercial</span>
                <span className="text-zinc-200">{lead.responsavel || "Não atribuído"}</span>
              </div>
            </div>

            {lead.observacoes && (
              <div className="pt-2">
                <span className="text-zinc-500 block text-sm">Observações</span>
                <p className="text-zinc-300 text-sm bg-zinc-950 p-3 rounded-lg mt-1 border border-zinc-800/80">
                  {lead.observacoes}
                </p>
              </div>
            )}
          </div>

          {/* Linha do Tempo do Histórico */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2 mb-4">
              Histórico
            </h2>
            {historico.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nenhuma alteração registrada.</p>
            ) : (
              <div className="space-y-4 relative border-l border-zinc-800 ml-2 pl-4">
                {historico.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <p className="text-xs text-zinc-500">
                      {new Date(item.criado_em).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-zinc-300 mt-0.5">
                      <span className="capitalize">{item.campo_alterado}</span> alterado de{" "}
                      <strong className="text-zinc-400">{item.valor_antigo || "vazio"}</strong> para{" "}
                      <strong className="text-white">{item.valor_novo}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}