import { supabase } from "@/lib/supabase";
import LeadsView from "@/components/leads/LeadsView";
import LeadsFilters from "@/components/leads/LeadsFilters";
import HeaderPipeline from "@/components/leads/HeaderPipeline";

interface PageProps {
  searchParams: Promise<{
    busca?: string;
    status?: string;
    classificacao?: string;
    origem?: string;
    responsavel?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const { data: usuarios } = await supabase.from("usuarios").select("id, nome");

  let query = supabase.from("leads").select("*");

  const termo = resolvedParams.busca?.trim();
  if (termo) {
    query = query.or(`nome_contato.ilike.%${termo}%,empresa.ilike.%${termo}%`);
  }

  if (resolvedParams.status && resolvedParams.status !== "todos") {
    query = query.ilike("status", resolvedParams.status.trim());
  }

  if (resolvedParams.classificacao && resolvedParams.classificacao !== "todas") {
    query = query.ilike("classificacao", resolvedParams.classificacao.trim());
  }

  if (resolvedParams.origem && resolvedParams.origem !== "todas") {
    query = query.ilike("origem", resolvedParams.origem.trim());
  }

  if (resolvedParams.responsavel && resolvedParams.responsavel !== "todos") {
    query = query.eq("responsavel_id", resolvedParams.responsavel);
  }

  const { data: leads } = await query;

  return (
    <main className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <HeaderPipeline />
      
      <LeadsFilters usuarios={usuarios || []} />

      <LeadsView
        key={JSON.stringify(resolvedParams)}
        leadsIniciais={leads || []}
      />
    </main>
  );
}