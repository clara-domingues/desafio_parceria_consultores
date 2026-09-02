"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Lead {
  id: string;
  nome_contato: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  status: string;
  classificacao?: string;
  origem?: string;
  valor_potencial?: number;
  responsavel_id?: string;
  observacoes?: string;
  atualizado_em?: string;
}

interface Usuario {
  id: string;
  nome: string;
}

interface HistoricoItem {
  id: string;
  campo_alterado: string;
  valor_anterior: string;
  valor_novo: string;
  criado_em: string;
}

interface LeadDetalhesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadAtualizado: () => void;
}

export default function LeadDetalhesModal({
  lead,
  isOpen,
  onClose,
  onLeadAtualizado,
}: LeadDetalhesModalProps) {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  // Inicializa o formulário diretamente com as props do lead
  const [formData, setFormData] = useState(() => ({
    nome_contato: lead?.nome_contato || "",
    empresa: lead?.empresa || "",
    email: lead?.email || "",
    telefone: lead?.telefone || "",
    valor_potencial: lead?.valor_potencial || 0,
    responsavel_id: lead?.responsavel_id || "",
    observacoes: lead?.observacoes || "",
  }));

  // Sincroniza o formulário apenas se o ID do lead mudar
  const leadId = lead?.id;
  useEffect(() => {
    if (!leadId) return;

    // Busca de usuários e histórico (sem setState síncrono no formulário)
    let isMounted = true;

    async function carregarDados() {
      const [{ data: uData }, { data: hData }] = await Promise.all([
        supabase.from("usuarios").select("id, nome"),
        supabase
          .from("historico")
          .select("*")
          .eq("lead_id", leadId)
          .order("criado_em", { ascending: false }),
      ]);

      if (isMounted) {
        if (uData) setUsuarios(uData);
        if (hData) setHistorico(hData);
      }
    }

    carregarDados();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const agora = new Date().toISOString();

    const { error } = await supabase
      .from("leads")
      .update({
        nome_contato: formData.nome_contato,
        empresa: formData.empresa,
        email: formData.email,
        telefone: formData.telefone,
        valor_potencial: formData.valor_potencial,
        responsavel_id: formData.responsavel_id || null,
        observacoes: formData.observacoes,
        atualizado_em: agora,
      })
      .eq("id", lead.id);

    setLoading(false);

    if (error) {
      console.error("Erro ao atualizar lead:", error);
      alert("Falha ao salvar as alterações.");
      return;
    }

    onLeadAtualizado();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white">{formData.nome_contato}</h2>
            <p className="text-xs text-zinc-400">ID: {lead.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-semibold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome *</label>
              <input
                type="text"
                required
                value={formData.nome_contato}
                onChange={(e) => setFormData({ ...formData, nome_contato: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Empresa</label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Valor Potencial (R$)</label>
              <input
                type="number"
                value={formData.valor_potencial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valor_potencial: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Responsável</label>
              <select
                value={formData.responsavel_id}
                onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="">Nenhum responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Observações</label>
            <textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>

        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Histórico do Lead</h3>
          {historico.length === 0 ? (
            <p className="text-xs text-zinc-500">Nenhum histórico registrado ainda.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {historico.map((h) => (
                <div
                  key={h.id}
                  className="text-xs bg-zinc-950 p-2 rounded border border-zinc-800/60 text-zinc-300"
                >
                  <span className="font-medium text-zinc-400">{h.campo_alterado}: </span>
                  <span className="line-through text-zinc-500">
                    {h.valor_anterior || "vazio"}
                  </span>{" "}
                  → <span className="text-emerald-400">{h.valor_novo}</span>
                  <span className="block text-[10px] text-zinc-600 mt-0.5">
                    {new Date(h.criado_em).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}