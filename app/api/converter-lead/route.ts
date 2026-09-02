import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { leadId } = await req.json();

  // Evita duplicar cliente se o lead já foi convertido antes
  const { data: clienteExistente } = await supabase
    .from("clientes")
    .select("id")
    .eq("lead_origem_id", leadId)
    .maybeSingle();

  if (clienteExistente) {
    return NextResponse.json({ jaConvertido: true });
  }

  const { data: lead, error: erroLead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (erroLead || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .insert({
      lead_origem_id: lead.id,
      nome: lead.nome_contato,
      empresa: lead.empresa,
    })
    .select()
    .single();

  if (erroCliente) {
    return NextResponse.json({ error: erroCliente.message }, { status: 500 });
  }

  if (lead.responsavel_id) {
    await supabase.from("notificacoes").insert({
      usuario_id: lead.responsavel_id,
      lead_id: lead.id,
      mensagem: `O lead "${lead.nome_contato}" (${lead.empresa ?? "sem empresa"}) foi convertido em cliente!`,
    });
  }

  await supabase.from("historico").insert({
    lead_id: lead.id,
    campo_alterado: "conversao",
    valor_anterior: null,
    valor_novo: `Convertido em cliente (${cliente.id})`,
  });

  return NextResponse.json({ cliente });
}