"use client";

import React, { useState } from "react";

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
  temperatura?: string | null;
  score?: string | number | null;
}

interface LeadDetailsModalProps {
  lead: LeadDetalhes | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const [sugestaoIa, setSugestaoIa] = useState<string | null>(null);
  const [carregandoIa, setCarregandoIa] = useState(false);

  // Estados para o Resumo Inteligente (IA)
  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  if (!isOpen || !lead) return null;

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Não informada";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const gerarProximaAcaoIA = () => {
    setCarregandoIa(true);
    setTimeout(() => {
      const status = (lead.status || "").toLowerCase();
      let recomendacao = "";

      if (status.includes("novo") || status.includes("contato")) {
        recomendacao = "Enviar mensagem inicial via WhatsApp apresentando o portfólio de serviços e agendando uma reunião de diagnóstico de 15 minutos.";
      } else if (status.includes("proposta")) {
        recomendacao = "Fazer follow-up focado nas dúvidas da proposta enviada e destacar o retorno sobre o investimento (ROI) para o cliente.";
      } else if (status.includes("negociacao")) {
        recomendacao = "Oferecer uma condição especial de pagamento ou bônus de implementação rápida para fechar o contrato até o final da semana.";
      } else {
        recomendacao = "Manter contato periódico quinzenal com atualizações e conteúdos relevantes do setor.";
      }

      setSugestaoIa(recomendacao);
      setCarregandoIa(false);
    }, 800);
  };

  const gerarResumoIA = () => {
    setCarregandoResumo(true);
    setTimeout(() => {
      const nomeCliente = lead.nome || lead.nome_contato || lead.title || lead.name || "Lead";
      const empresaCliente = lead.empresa ? `da empresa ${lead.empresa}` : "pessoa física";
      const valorFormatado = formatCurrency(lead.valor_potencial ?? lead.valor);
      const origemLead = lead.origem || "canal não mapeado";
      const statusAtual = lead.status || "Novo Lead";

      const resumoGerado = `O lead ${nomeCliente} (${empresaCliente}) entrou via ${origemLead} com um potencial negociado de ${valorFormatado}. Atualmente no estágio de ${statusAtual}, o contato apresenta bom potencial de conversão e aguarda movimentação do time comercial.`;

      setResumoIa(resumoGerado);
      setCarregandoResumo(false);
    }, 800);
  };

  const historicoExemplo = [
    {
      id: "1",
      data: formatDate(lead.created_at || lead.data_entrada || new Date().toISOString()),
      descricao: "Lead cadastrado no sistema.",
    },
    {
      id: "2",
      data: formatDate(new Date().toISOString()),
      descricao: `Status atualizado para: ${lead.status || "Novo Lead"}.`,
    },
  ];

  let nomeResponsavel = "Usuário Padrão";
  if (typeof lead.responsavel === "object" && lead.responsavel?.nome) {
    nomeResponsavel = lead.responsavel.nome;
  } else if (typeof lead.responsavel === "string" && lead.responsavel.trim() !== "") {
    nomeResponsavel = lead.responsavel;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* CABEÇALHO */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-start bg-zinc-950">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {lead.empresa || "Pessoa Física"}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {lead.nome || lead.nome_contato || lead.title || lead.name || "Lead sem nome"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          {/* GRID DE INFORMAÇÕES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Valor Potencial</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {formatCurrency(lead.valor_potencial ?? lead.valor)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Status</p>
              <p className="text-sm font-semibold text-white mt-0.5 capitalize">
                {lead.status || "Novo Lead"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Origem</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {lead.origem || "Não informada"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Data de Entrada</p>
              <p className="text-sm text-zinc-300 mt-0.5">
                {formatDate(lead.created_at || lead.data_entrada)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Responsável</p>
              <p className="text-sm text-zinc-300 mt-0.5">
                {nomeResponsavel}
              </p>
            </div>
          </div>

          {/* RESUMO INTELIGENTE (IA) */}
          <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                📝 Resumo Inteligente (IA)
              </h3>
              <button
                onClick={gerarResumoIA}
                disabled={carregandoResumo}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              >
                {carregandoResumo ? "Sintetizando..." : "Gerar Resumo"}
              </button>
            </div>
            {resumoIa ? (
              <p className="text-xs text-zinc-200 bg-zinc-900/80 p-3 rounded border border-purple-800/40 leading-relaxed">
                {resumoIa}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Clique no botão para gerar uma síntese executiva das informações do lead.
              </p>
            )}
          </div>

          {/* SUGESTÃO DE PRÓXIMA AÇÃO (IA) */}
          <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                ✨ Sugestão de Próxima Ação (IA)
              </h3>
              <button
                onClick={gerarProximaAcaoIA}
                disabled={carregandoIa}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition disabled:opacity-50"
              >
                {carregandoIa ? "Analisando..." : "Gerar Ação"}
              </button>
            </div>
            {sugestaoIa ? (
              <p className="text-xs text-zinc-200 bg-zinc-900/80 p-3 rounded border border-blue-800/40 leading-relaxed">
                {sugestaoIa}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Clique no botão para gerar uma estratégia comercial personalizada com IA para este lead.
              </p>
            )}
          </div>

          {/* HISTÓRICO DE ALTERAÇÕES */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider mb-3 text-zinc-400">
              Histórico de Alterações
            </h3>
            <div className="space-y-2 border-l-2 border-zinc-800 pl-4 ml-1">
              {historicoExemplo.map((item) => (
                <div key={item.id} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                  <p className="text-zinc-400 text-[10px]">{item.data}</p>
                  <p className="text-zinc-200 mt-0.5">{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
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