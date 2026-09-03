"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface LeadDetalhes {
  id: string | number;
  nome?: string | null;
  nome_contato?: string | null;
  title?: string | null;
  name?: string | null;
  empresa?: string | null;
  status?: string | null;
  origem?: string | null;
  valor_potencial?: number | null;
  valor?: number | null;
  created_at?: string | null;
  data_entrada?: string | null;
  responsavel_id?: string | null;
  responsavel?: { nome?: string } | string | null;
  classificacao?: string | null;
  observacoes?: string | null;
  temperatura?: string | null;
  score?: string | number | null;
}

interface RegistroHistorico {
  id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  criado_em: string;
}

interface LeadDetailsModalProps {
  lead: LeadDetalhes | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const [sugestaoIa, setSugestaoIa] = useState<string | null>(null);
  const [carregandoIa, setCarregandoIa] = useState(false);

  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Busca o histórico REAL no Supabase toda vez que um lead diferente é aberto.
  // Toda a lógica fica dentro de uma função assíncrona nomeada (carregar), e o
  // efeito só a invoca — isso evita chamadas de setState "soltas" direto no
  // corpo do efeito, que é o que o eslint (react-hooks/set-state-in-effect) reclama.
  useEffect(() => {
    if (!isOpen || !lead) return;

    let ativo = true;

    async function carregar() {
      setResumoIa(null);
      setSugestaoIa(null);
      setCarregandoHistorico(true);

      const { data, error } = await supabase
        .from("historico")
        .select("id, campo_alterado, valor_anterior, valor_novo, criado_em")
        .eq("lead_id", lead!.id)
        .order("criado_em", { ascending: false });

      if (!ativo) return;

      if (error) {
        console.error("Erro ao buscar histórico:", error.message);
        setHistorico([]);
      } else {
        setHistorico(data || []);
      }
      setCarregandoHistorico(false);
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Não informada";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const gerarInsightIA = async (tipo: "resumo" | "proxima_acao") => {
    const setCarregando = tipo === "resumo" ? setCarregandoResumo : setCarregandoIa;
    const setTexto = tipo === "resumo" ? setResumoIa : setSugestaoIa;

    setCarregando(true);
    try {
    const resposta = await fetch("/api/leads-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, lead }),
      });
      const dados = await resposta.json();
      if (dados.error) throw new Error(dados.error);
      setTexto(dados.texto);
    } catch (err) {
      console.error(`Erro ao gerar ${tipo}:`, err);
      setTexto("Não foi possível gerar a resposta da IA agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  let nomeResponsavel = "Usuário Padrão";
  if (typeof lead.responsavel === "object" && lead.responsavel?.nome) {
    nomeResponsavel = lead.responsavel.nome;
  } else if (typeof lead.responsavel === "string" && lead.responsavel.trim() !== "") {
    nomeResponsavel = lead.responsavel;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-start bg-zinc-950">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {lead.empresa || "Pessoa Física"}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {lead.nome || lead.nome_contato || lead.title || lead.name || "Lead sem nome"}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg transition">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Valor Potencial</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {formatCurrency(lead.valor_potencial ?? lead.valor)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Status</p>
              <p className="text-sm font-semibold text-white mt-0.5">{lead.status || "Novo"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Origem</p>
              <p className="text-sm font-semibold text-white mt-0.5">{lead.origem || "Não informada"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Data de Entrada</p>
              <p className="text-sm text-zinc-300 mt-0.5">
                {formatDate(lead.created_at || lead.data_entrada)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Responsável</p>
              <p className="text-sm text-zinc-300 mt-0.5">{nomeResponsavel}</p>
            </div>
          </div>

          <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                📝 Resumo Inteligente (IA)
              </h3>
              <button
                onClick={() => gerarInsightIA("resumo")}
                disabled={carregandoResumo}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              >
                {carregandoResumo ? "Gerando..." : "Gerar Resumo"}
              </button>
            </div>
            {resumoIa ? (
              <p className="text-xs text-zinc-200 bg-zinc-900/80 p-3 rounded border border-purple-800/40 leading-relaxed">
                {resumoIa}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Clique no botão para a IA gerar uma síntese executiva deste lead.
              </p>
            )}
          </div>

          <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                ✨ Sugestão de Próxima Ação (IA)
              </h3>
              <button
                onClick={() => gerarInsightIA("proxima_acao")}
                disabled={carregandoIa}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              >
                {carregandoIa ? "Gerando..." : "Gerar Ação"}
              </button>
            </div>
            {sugestaoIa ? (
              <p className="text-xs text-zinc-200 bg-zinc-900/80 p-3 rounded border border-blue-800/40 leading-relaxed">
                {sugestaoIa}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Clique no botão para a IA sugerir uma próxima ação comercial para este lead.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider mb-3 text-zinc-400">
              Histórico de Alterações
            </h3>
            {carregandoHistorico ? (
              <p className="text-xs text-zinc-500 italic">Carregando histórico...</p>
            ) : historico.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Nenhuma alteração registrada ainda.</p>
            ) : (
              <div className="space-y-2 border-l-2 border-zinc-800 pl-4 ml-1">
                {historico.map((item) => (
                  <div key={item.id} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                    <p className="text-zinc-400 text-[10px]">{formatDateTime(item.criado_em)}</p>
                    <p className="text-zinc-200 mt-0.5">
                      {item.campo_alterado === "status"
                        ? `Status alterado de ${item.valor_anterior ?? "—"} → ${item.valor_novo}`
                        : item.campo_alterado === "conversao"
                        ? item.valor_novo
                        : `${item.campo_alterado} alterado de ${item.valor_anterior ?? "—"} para ${item.valor_novo}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}