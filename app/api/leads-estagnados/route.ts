import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, nome_contato, empresa, responsavel_id, atualizado_em, ultima_notificacao_estagnacao")
    .lte("atualizado_em", seteDiasAtras)
    .not("status", "in", "(Ganho,Perdido)");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Só reenviar se nunca notificou, ou a última notificação já passou de 7 dias também
  const estagnados = (leads ?? []).filter((lead) => {
    if (!lead.ultima_notificacao_estagnacao) return true;
    return lead.ultima_notificacao_estagnacao <= seteDiasAtras;
  });

  return NextResponse.json({ leads: estagnados });
}