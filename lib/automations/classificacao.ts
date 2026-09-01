import { LeadFormData } from "@/lib/schemas/lead";

export function classificarLead(
  lead: Partial<LeadFormData>
): "Quente" | "Morno" | "Frio" {
  let score = 0;

  // Pontuação por valor potencial
  if (lead.valor_potencial && lead.valor_potencial >= 10000) {
    score += 2;
  } else if (lead.valor_potencial && lead.valor_potencial >= 3000) {
    score += 1;
  }

  // Pontuação por origem
  if (lead.origem && ["Indicação", "Prospecção Ativa"].includes(lead.origem)) {
    score += 2;
  } else if (lead.origem === "WhatsApp") {
    score += 1;
  }

  // Pontuação por previsão de fechamento
  if (lead.previsao_fechamento) {
    const dias = Math.ceil(
      (new Date(lead.previsao_fechamento).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    if (dias <= 30) score += 2;
    else if (dias <= 90) score += 1;
  }

  // Definição da classificação final
  if (score >= 4) return "Quente";
  if (score >= 2) return "Morno";
  return "Frio";
}