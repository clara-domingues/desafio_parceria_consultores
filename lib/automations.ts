import { supabase } from "@/lib/supabase";

/**
 * Automação 1: Qualificação Automática
 * Se o lead for movido para 'Proposta' ou 'Negociação', altera a classificação para 'Quente'.
 */
export async function aplicarAutomacaoQualificacao(
  leadId: string | number,
  novoStatus: string,
  classificacaoAtual?: string
): Promise<string | undefined> {
  const statusAlvo = ["proposta", "negociação", "negociacao"];

  if (
    statusAlvo.includes(novoStatus.toLowerCase()) &&
    classificacaoAtual?.toLowerCase() !== "quente"
  ) {
    const { error } = await supabase
      .from("leads")
      .update({ classificacao: "Quente", atualizado_em: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      console.error("Erro na Automação 1 (Qualificação):", error);
      return undefined;
    }

    return "Quente";
  }

  return undefined;
}

/**
 * Automação 2: Fechamento / Ganho
 * Se o lead for movido para 'Ganho', atualiza 'atualizado_em' com a data e hora do fechamento.
 */
export async function aplicarAutomacaoFechamento(
  leadId: string | number,
  novoStatus: string
): Promise<string | undefined> {
  if (novoStatus.toLowerCase() === "ganho") {
    const dataAtual = new Date().toISOString();

    const { error } = await supabase
      .from("leads")
      .update({ atualizado_em: dataAtual })
      .eq("id", leadId);

    if (error) {
      console.error("Erro na Automação 2 (Fechamento):", error);
      return undefined;
    }

    return dataAtual;
  }

  return undefined;
}