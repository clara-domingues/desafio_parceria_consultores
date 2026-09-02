import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface LeadParaClassificar {
  valor_potencial: number;
  origem: string;
  previsao_fechamento?: string | null;
  observacoes?: string | null;
}

interface RespostaIA {
  ajuste: -1 | 0 | 1;
  justificativa: string;
}

function scoreRegra(lead: LeadParaClassificar): number {
  let score = 0;

  if (lead.valor_potencial >= 10000) score += 2;
  else if (lead.valor_potencial >= 3000) score += 1;

  if (["Indicacao", "Prospeccao Ativa"].includes(lead.origem)) score += 2;
  else if (lead.origem === "WhatsApp") score += 1;

  if (lead.previsao_fechamento) {
    const dias = Math.ceil(
      (new Date(lead.previsao_fechamento).getTime() - Date.now()) / 86400000
    );
    if (dias <= 30) score += 2;
    else if (dias <= 90) score += 1;
  }

  return score;
}

export async function POST(req: Request) {
  const lead: LeadParaClassificar = await req.json();

  let score = scoreRegra(lead);
  let justificativa = "Classificação baseada em valor, origem e prazo de fechamento.";

  if (lead.observacoes?.trim()) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(
        `Você analisa observações de um vendedor sobre um lead comercial e avalia o quanto ` +
        `elas indicam urgência ou intenção real de compra. ` +
        `Responda apenas em JSON: {"ajuste": -1 | 0 | 1, "justificativa": "uma frase curta em português"}. ` +
        `Observação do vendedor: "${lead.observacoes}"`
      );

      const ia = JSON.parse(result.response.text()) as RespostaIA;
      score += ia.ajuste;
      justificativa = ia.justificativa;
    } catch (err) {
      console.error("Gemini falhou, mantendo score da regra:", err);
      // fallback silencioso: score da regra pura continua valendo
    }
  }

  const classificacao = score >= 4 ? "Quente" : score >= 2 ? "Morno" : "Frio";

  return NextResponse.json({ classificacao, justificativa });
}