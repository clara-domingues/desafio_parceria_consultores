"use client";

import Link from "next/link";
import { Lead } from "@/contexts/LeadsContext";

interface LeadsTableProps {
  leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="bg-zinc-950 text-xs uppercase text-zinc-400 border-b border-zinc-800">
          <tr>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Classificação</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Responsável</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {leads.map((lead) => {
            const valorExibido = lead.valor_potencial ?? lead.valor ?? 0;
            return (
              <tr key={lead.id} className="hover:bg-zinc-800/50 transition">
                <td className="px-4 py-3 font-medium text-white">
                  <Link href={`/leads/${lead.id}`} className="hover:underline">
                    {lead.nome_contato}
                  </Link>
                </td>
                <td className="px-4 py-3">{lead.empresa || "-"}</td>
                <td className="px-4 py-3">{lead.status}</td>
                <td className="px-4 py-3">{lead.classificacao || "-"}</td>
                <td className="px-4 py-3">
                  R$ {Number(valorExibido).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">{lead.usuarios?.nome || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}