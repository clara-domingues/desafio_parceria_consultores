import Link from "next/link";

interface Lead {
  id: string;
  nome_contato: string;
  empresa: string | null;
  status: string;
  classificacao: "Quente" | "Morno" | "Frio" | null;
  valor_potencial: number;
  data_entrada?: string;
  usuarios?: { nome: string } | null;
}

const corClassificacao: Record<string, string> = {
  Quente: "text-red-400",
  Morno: "text-amber-400",
  Frio: "text-blue-400",
};

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="py-2 pr-4">Nome</th>
            <th className="py-2 pr-4">Empresa</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Classificação</th>
            <th className="py-2 pr-4">Valor</th>
            <th className="py-2 pr-4">Responsável</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
              <td className="py-2 pr-4">
                <Link href={`/leads/${lead.id}`} className="text-white hover:underline">
                  {lead.nome_contato}
                </Link>
              </td>
              <td className="py-2 pr-4 text-zinc-400">{lead.empresa ?? "—"}</td>
              <td className="py-2 pr-4 text-zinc-400">{lead.status}</td>
              <td className={`py-2 pr-4 ${lead.classificacao ? corClassificacao[lead.classificacao] : "text-zinc-600"}`}>
                {lead.classificacao ?? "—"}
              </td>
              <td className="py-2 pr-4 text-zinc-400">
                R$ {Number(lead.valor_potencial).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 pr-4 text-zinc-400">{lead.usuarios?.nome ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}