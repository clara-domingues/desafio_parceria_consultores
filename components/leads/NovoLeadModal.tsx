import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NovoLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UsuarioOpcao {
  id: string;
  nome: string;
}

const ORIGENS = [
  { valor: "Indicacao", rotulo: "Indicação" },
  { valor: "WhatsApp", rotulo: "WhatsApp" },
  { valor: "Redes Sociais", rotulo: "Redes Sociais" },
  { valor: "Prospeccao Ativa", rotulo: "Prospecção Ativa" },
  { valor: "Outro", rotulo: "Outro" },
];

const ESTADO_INICIAL = {
  nome_contato: "",
  empresa: "",
  email: "",
  telefone: "",
  origem: "Outro",
  segmento: "",
  responsavel_id: "",
  status: "Novo",
  valor_potencial: 0,
  data_entrada: new Date().toISOString().slice(0, 10),
  previsao_fechamento: "",
  observacoes: "",
};

function extrairMensagemErro(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Erro desconhecido";
}

export const NovoLeadModal: React.FC<NovoLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioOpcao[]>([]);
  const [avisoDuplicidade, setAvisoDuplicidade] = useState<string | null>(null);
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  useEffect(() => {
    if (!isOpen) return;

    supabase
      .from("usuarios")
      .select("id, nome")
      .then(({ data }) => setUsuarios(data || []));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFechar = () => {
    setAvisoDuplicidade(null);
    setFormData(ESTADO_INICIAL);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (avisoDuplicidade) setAvisoDuplicidade(null);
    setFormData((prev) => ({
      ...prev,
      [name]: name === "valor_potencial" ? Number(value) : value,
    }));
  };

  const verificarDuplicidade = async (email: string, telefone: string) => {
    const query = supabase
      .from("leads")
      .select("id, nome_contato, empresa, email, telefone");

    const filtros: string[] = [];
    if (email.trim()) filtros.push(`email.eq.${email.trim()}`);
    if (telefone.trim()) filtros.push(`telefone.eq.${telefone.trim()}`);

    if (filtros.length === 0) return null;

    const { data, error } = await query.or(filtros.join(",")).limit(1);

    if (error) {
      console.error("Erro ao verificar duplicidade:", extrairMensagemErro(error));
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!avisoDuplicidade) {
        const existente = await verificarDuplicidade(
          formData.email,
          formData.telefone
        );

        if (existente) {
          const nomeExistente =
            existente.nome_contato || existente.empresa || "já cadastrado";
          setAvisoDuplicidade(
            `⚠️ Lead duplicado detectado: Já existe um cadastro com este e-mail/telefone (${nomeExistente}). Clique em "Confirmar mesmo assim" se desejar prosseguir.`
          );
          setLoading(false);
          return;
        }
      }

      let classificacao = "Frio";
      let classificacaoMotivo =
        "Classificação baseada em valor, origem e prazo de fechamento.";

      try {
        const respostaClassificacao = await fetch("/api/classificar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            valor_potencial: formData.valor_potencial,
            origem: formData.origem,
            previsao_fechamento: formData.previsao_fechamento || null,
            observacoes: formData.observacoes || null,
          }),
        });
        const dadosClassificacao = await respostaClassificacao.json();
        classificacao = dadosClassificacao.classificacao;
        classificacaoMotivo = dadosClassificacao.justificativa;
      } catch (erroClassificacao) {
        console.error(
          "Falha ao classificar automaticamente, usando padrão:",
          extrairMensagemErro(erroClassificacao)
        );
      }

      const { error } = await supabase.from("leads").insert([
        {
          nome_contato: formData.nome_contato,
          empresa: formData.empresa || null,
          email: formData.email,
          telefone: formData.telefone || null,
          origem: formData.origem,
          segmento: formData.segmento || null,
          responsavel_id: formData.responsavel_id || null,
          status: formData.status,
          classificacao,
          classificacao_motivo: classificacaoMotivo,
          valor_potencial: formData.valor_potencial,
          data_entrada: formData.data_entrada,
          previsao_fechamento: formData.previsao_fechamento || null,
          observacoes: formData.observacoes || null,
        },
      ]);

      if (error) throw error;

      if (onSuccess) onSuccess();
      handleFechar();
    } catch (err: unknown) {
      const errorMsg = extrairMensagemErro(err);
      console.error("Erro ao cadastrar lead:", errorMsg, err);
      alert("Erro ao cadastrar o lead: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-lg text-white my-8">
        <h2 className="text-xl font-bold mb-4">Cadastrar Novo Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Nome do Contato *
            </label>
            <input
              type="text"
              name="nome_contato"
              required
              value={formData.nome_contato}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Empresa</label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Origem
              </label>
              <select
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {ORIGENS.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Segmento
              </label>
              <input
                type="text"
                name="segmento"
                placeholder="Ex: Varejo, Saúde..."
                value={formData.segmento}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Responsável
              </label>
              <select
                name="responsavel_id"
                value={formData.responsavel_id}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecione...</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Valor Potencial (R$)
              </label>
              <input
                type="number"
                name="valor_potencial"
                min={0}
                value={formData.valor_potencial}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Data de Entrada
              </label>
              <input
                type="date"
                name="data_entrada"
                value={formData.data_entrada}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Previsão de Fechamento
              </label>
              <input
                type="date"
                name="previsao_fechamento"
                value={formData.previsao_fechamento}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Detalhes da conversa, urgência do cliente, etc. — usado pela IA na classificação."
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {avisoDuplicidade && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 text-sm text-amber-400">
              {avisoDuplicidade}
            </div>
          )}

          <p className="text-xs text-zinc-500">
            A classificação (Quente/Morno/Frio) é calculada automaticamente ao
            salvar, com base no valor, origem e observações.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleFechar}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold disabled:opacity-50 transition"
            >
              {loading
                ? "Salvando..."
                : avisoDuplicidade
                ? "Confirmar mesmo assim"
                : "Salvar Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoLeadModal;