import { supabase } from "@/lib/supabase";
import LeadsView from "@/components/leads/LeadsView";
import LeadsFilters from "@/components/leads/LeadsFilters";

interface PageProps {
  searchParams: Promise<{
    busca?: string;
    status?: string;
    classificacao?: string;
    origem?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  // 1. Resolve a Promise do searchParams no Next.js 15+
  const resolvedParams = await searchParams;

  let query = supabase.from("leads").select("*");

  // 2. Filtro de Busca (aplica apenas se houver termo digitado)
  const termo = resolvedParams.busca?.trim();
  if (termo) {
    query = query.or(`nome_contato.ilike.%${termo}%,empresa.ilike.%${termo}%`);
  }

  // 3. Filtro por Status (aplica ilike para evitar problemas com acentuação como 'Negociação')
  if (resolvedParams.status) {
    query = query.ilike("status", resolvedParams.status.trim());
  }

  // 4. Filtro por Classificação
  if (resolvedParams.classificacao) {
    query = query.ilike("classificacao", resolvedParams.classificacao.trim());
  }

  // 5. Filtro por Origem
  if (resolvedParams.origem) {
    query = query.ilike("origem", resolvedParams.origem.trim());
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error("Erro do Supabase:", error);
  }

  return (
    <main className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie e acompanhe o progresso das suas oportunidades
          </p>
        </div>
      </div>

      <LeadsFilters />

      <LeadsView
        key={JSON.stringify(resolvedParams)}
        leadsIniciais={leads || []}
      />
    </main>
  );
}