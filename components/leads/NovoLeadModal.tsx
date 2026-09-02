"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface NovoLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCriado: () => void;
}

export default function NovoLeadModal({
  isOpen,
  onClose,
  onLeadCriado,
}: NovoLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_contato: "",
    empresa: "",
    email: "",
    telefone: "",
    origem: "Outro",
    valor_potencial: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("leads").insert([
      {
        nome_contato: formData.nome_contato,
        empresa: formData.empresa || null,
        email: formData.email,
        telefone: formData.telefone || null,
        origem: formData.origem,
        valor_potencial: formData.valor_potencial
          ? parseFloat(formData.valor_potencial)
          : 0,
        status: "Novo",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Erro ao criar lead:", error);
      alert("Erro ao cadastrar lead. Verifique os dados.");
      return;
    }

    setFormData({
      nome_contato: "",
      empresa: "",
      email: "",
      telefone: "",
      origem: "Outro",
      valor_potencial: "",
    });

    onLeadCriado();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-white">Adicionar Novo Lead</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-semibold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nome do Contato *
            </label>
            <input
              type="text"
              required
              value={formData.nome_contato}
              onChange={(e) =>
                setFormData({ ...formData, nome_contato: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) =>
                  setFormData({ ...formData, empresa: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Origem
              </label>
              <select
                value={formData.origem}
                onChange={(e) =>
                  setFormData({ ...formData, origem: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="Outro">Outro</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Indicação">Indicação</option>
                <option value="Redes Sociais">Redes Sociais</option>
                <option value="Prospecção Ativa">Prospecção Ativa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Valor Potencial (R$)
            </label>
            <input
              type="number"
              value={formData.valor_potencial}
              onChange={(e) =>
                setFormData({ ...formData, valor_potencial: e.target.value })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Criar Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}