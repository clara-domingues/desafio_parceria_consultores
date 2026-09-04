"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLeads } from "@/contexts/LeadsContext";

export interface LeadDetalhes {
  id: string | number;
  nome?: string | null;
  nome_contato?: string | null;
  title?: string | null;
  name?: string | null;
  empresa?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: string | null;
  origem?: string | null;
  segmento?: string | null;
  valor_potencial?: number | null;
  valor?: number | null;
  created_at?: string | null;
  data_entrada?: string | null;
  previsao_fechamento?: string | null;
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

interface UsuarioOpcao {
  id: string;
  nome: string;
}

interface LeadDetailsModalProps {
  lead: LeadDetalhes | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPCOES = ["Novo", "Qualificação", "Proposta", "Negociação", "Ganho", "Perdido"];
const ORIGEM_OPCOES = [
  { valor: "Indicacao", rotulo: "Indicação" },
  { valor: "WhatsApp", rotulo: "WhatsApp" },
  { valor: "Redes Sociais", rotulo: "Redes Sociais" },
  { valor: "Prospeccao Ativa", rotulo: "Prospecção Ativa" },
  { valor: "Outro", rotulo: "Outro" },
];

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const { fetchLeads } = useLeads();

  const [sugestaoIa, setSugestaoIa] = useState<string | null>(null);
  const [carregandoIa, setCarregandoIa] = useState(false);
  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Estado da edição
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioOpcao[]>([]);
  const [form, setForm] = useState<Record<string, string | number>>({});

  const carregarHistorico = React.useCallback(async () => {
    if (!lead) return;
    setCarregandoHistorico(true);
    const { data, error } = await supabase
      .from("historico")
      .select("id, campo_alterado, valor_anterior, valor_novo, criado_em")
      .eq("lead_id", lead.id)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico:", error.message);
      setHistorico([]);
    } else {
      setHistorico(data || []);
    }
    setCarregandoHistorico(false);
  }, [lead]);

  useEffect(() => {
    if (!isOpen || !lead) return;

    let ativo = true;

    async function carregar() {
      setResumoIa(null);
      setSugestaoIa(null);
      setEditando(false);
      await carregarHistorico();
      if (!ativo) return;
    }

    carregar();

    supabase
      .from("usuarios")
      .select("id, nome")
      .then(({ data }) => {
        if (ativo) setUsuarios(data || []);
      });

    return () => {
      ativo = false;
    };
  }, [isOpen, lead, carregarHistorico]);

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

  const iniciarEdicao = () => {
    setForm({
      nome_contato: lead.nome_contato || lead.nome || "",
      empresa: lead.empresa || "",
      email: lead.email || "",
      telefone: lead.telefone || "",
      origem: lead.origem || "Outro",
      segmento: lead.segmento || "",
      responsavel_id: lead.responsavel_id || "",
      status: lead.status || "Novo",
      valor_potencial: lead.valor_potencial ?? lead.valor ?? 0,
      data_entrada: (lead.created_at || lead.data_entrada || "").slice(0, 10),
      previsao_fechamento: (lead.previsao_fechamento || "").slice(0, 10),
      observacoes: lead.observacoes || "",
    });
    setEditando(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "valor_potencial" ? Number(value) : value,
    }));
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    try {
      const nomeResponsavelAntigo =
        typeof lead.responsavel === "object" ? lead.responsavel?.nome : lead.responsavel;
      const nomeResponsavelNovo = usuarios.find((u) => u.id === form.responsavel_id)?.nome;

      const entradasHistorico: { campo_alterado: string; valor_anterior: string | null; valor_novo: string | null }[] = [];

      if (form.status !== lead.status) {
        entradasHistorico.push({
          campo_alterado: "status",
          valor_anterior: lead.status ?? null,
          valor_novo: String(form.status),
        });
      }
      if (form.responsavel_id !== (lead.responsavel_id || "")) {
        entradasHistorico.push({
          campo_alterado: "responsavel",
          valor_anterior: nomeResponsavelAntigo ?? null,
          valor_novo: nomeResponsavelNovo ?? null,
        });
      }
      const valorAntigo = lead.valor_potencial ?? lead.valor ?? 0;
      if (Number(form.valor_potencial) !== valorAntigo) {
        entradasHistorico.push({
          campo_alterado: "valor_potencial",
          valor_anterior: formatCurrency(valorAntigo),
          valor_novo: formatCurrency(Number(form.valor_potencial)),
        });
      }

      const { error: erroUpdate } = await supabase
        .from("leads")
        .update({
          nome_contato: form.nome_contato,
          empresa: form.empresa || null,
          email: form.email,
          telefone: form.telefone || null,
          origem: form.origem,
          segmento: form.segmento || null,
          responsavel_id: form.responsavel_id || null,
          status: form.status,
          valor_potencial: form.valor_potencial,
          data_entrada: form.data_entrada || null,
          previsao_fechamento: form.previsao_fechamento || null,
          observacoes: form.observacoes || null,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (erroUpdate) throw erroUpdate;

      if (entradasHistorico.length > 0) {
        await supabase.from("historico").insert(
          entradasHistorico.map((e) => ({ ...e, lead_id: lead.id }))
        );
      }

      // Modificação aqui: dispara o alerta independentemente de ser primeira conversão ou reenviado
      if (form.status === "Ganho" && lead.status !== "Ganho") {
        const nomeLead = String(form.nome_contato || lead.nome_contato || lead.nome || "Lead");
        try {
          const respostaConversao = await fetch("/api/converter-lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: lead.id }),
          });
          
          await respostaConversao.json();
          alert(`🎉 Parabéns! O lead "${nomeLead}" foi movido para Ganho e o responsável foi notificado.`);
        } catch (erroConversao) {
          console.error("Erro ao converter lead:", erroConversao);
          alert(`🎉 Parabéns! O lead "${nomeLead}" foi alterado para Ganho.`);
        }
      }

      await carregarHistorico();
      await fetchLeads();
      setEditando(false);
    } catch (err) {
      console.error("Erro ao salvar edição do lead:", err);
      alert("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setSalvando(false);
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
          <div className="flex items-center gap-2">
            {!editando && (
              <button
                onClick={iniciarEdicao}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition"
              >
                ✎ Editar
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg transition">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          {editando ? (
            <div className="space-y-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Nome do Contato</label>
                  <input
                    name="nome_contato"
                    value={form.nome_contato as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Empresa</label>
                  <input
                    name="empresa"
                    value={form.empresa as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">E-mail</label>
                  <input
                    name="email"
                    value={form.email as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Telefone</label>
                  <input
                    name="telefone"
                    value={form.telefone as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  >
                    {STATUS_OPCOES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Responsável</label>
                  <select
                    name="responsavel_id"
                    value={form.responsavel_id as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  >
                    <option value="">Sem responsável</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Origem</label>
                  <select
                    name="origem"
                    value={form.origem as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  >
                    {ORIGEM_OPCOES.map((o) => (
                      <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Segmento</label>
                  <input
                    name="segmento"
                    value={form.segmento as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Valor Potencial (R$)</label>
                  <input
                    type="number"
                    name="valor_potencial"
                    value={form.valor_potencial as number}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Data de Entrada</label>
                  <input
                    type="date"
                    name="data_entrada"
                    value={form.data_entrada as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Previsão de Fechamento</label>
                  <input
                    type="date"
                    name="previsao_fechamento"
                    value={form.previsao_fechamento as string}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  rows={2}
                  value={form.observacoes as string}
                  onChange={handleFormChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setEditando(false)}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  disabled={salvando}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          ) : (
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
          )}

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
                        : item.campo_alterado === "responsavel"
                        ? `Responsável alterado de ${item.valor_anterior ?? "ninguém"} para ${item.valor_novo ?? "ninguém"}`
                        : item.campo_alterado === "valor_potencial"
                        ? `Valor alterado de ${item.valor_anterior} para ${item.valor_novo}`
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