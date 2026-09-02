import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Body {
  leadId: string;
  nomeContato: string;
  responsavelId: string | null;
}

export async function POST(req: Request) {
  const { leadId, nomeContato, responsavelId }: Body = await req.json();

  if (responsavelId) {
    await supabase.from("notificacoes").insert({
      usuario_id: responsavelId,
      lead_id: leadId,
      mensagem: `O lead "${nomeContato}" está há mais de 7 dias sem atualização.`,
    });
  }

  await supabase
    .from("leads")
    .update({ ultima_notificacao_estagnacao: new Date().toISOString() })
    .eq("id", leadId);

  return NextResponse.json({ ok: true });
}