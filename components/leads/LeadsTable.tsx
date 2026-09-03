import React from "react";

export interface Lead {
  id: string;
  nome_contato?: string | null;
  nome?: string | null;
  empresa?: string | null;
  status?: string | null;
  classificacao?: string | null;
  valor_potencial?: number | null;
  valor?: number | null;
  responsavel_id?: string | null;
  responsavel?: { nome?: string } | string | null;
  created_at?: string | null;
  data_entrada?: string | null;
}

interface LeadsTableProps {
  leads: Lead[];
  onRowClick?: (lead: Lead) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onRowClick }) => {
  const formatarMoeda = (valor?: number | null) => {
    return (valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  };

  const formatarData = (dataString?: string | null) => {
    if (!dataString) return "-";
    return new Date(dataString).toLocaleDateString("pt-BR");
  };

  const renderClassificacaoBadge = (classificacao?: string | null) => {
    const val = (classificacao || "").toLowerCase();
    if (val === "quente") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          🔥 Quente
        </span>
      );
    }
    if (val === "morno") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ☀️ Morno
        </span>
      );
    }
    if (val === "frio") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          ❄️ Frio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
        —
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto border border-zinc-800 rounded-lg bg-zinc-950">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-400 border-b border-zinc-800">
          <tr>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Classificação</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Responsável</th>
            <th className="px-4 py-3">Entrada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {leads && leads.length > 0 ? (
            leads.map((lead) => {
              const nomeContato = lead.nome_contato || lead.nome || "-";
              const valorLead = lead.valor_potencial ?? lead.valor ?? 0;
              const dataEntrada = lead.created_at || lead.data_entrada;

              let nomeResponsavel = "Usuário Padrão";
              if (typeof lead.responsavel === "object" && lead.responsavel?.nome) {
                nomeResponsavel = lead.responsavel.nome;
              } else if (typeof lead.responsavel === "string") {
                nomeResponsavel = lead.responsavel;
              }

              return (
                <tr
                  key={lead.id}
                  onClick={() => onRowClick?.(lead)}
                  className={`hover:bg-zinc-900/30 transition ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-white">{nomeContato}</td>
                  <td className="px-4 py-3">{lead.empresa || "-"}</td>
                  <td className="px-4 py-3">{lead.status || "Novo"}</td>
                  <td className="px-4 py-3">{renderClassificacaoBadge(lead.classificacao)}</td>
                  <td className="px-4 py-3 font-semibold text-white">{formatarMoeda(valorLead)}</td>
                  <td className="px-4 py-3 text-zinc-300">{nomeResponsavel}</td>
                  <td className="px-4 py-3">{formatarData(dataEntrada)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 font-medium">
                Nenhum lead encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;