import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface LeadParaInsight {
  nome_contato?: string | null;
  empresa?: string | null;
  status?: string | null;
  origem?: string | null;
  valor_potencial?: number | null;
  observacoes?: string | null;
  classificacao?: string | null;
}

export async function POST(req: Request) {
  const { tipo, lead }: { tipo: "resumo" | "proxima_acao"; lead: LeadParaInsight } = await req.json();

  const contexto = `
Nome do contato: ${lead.nome_contato || "não informado"}
Empresa: ${lead.empresa || "não informada"}
Status atual no pipeline: ${lead.status || "Novo"}
Classificação: ${lead.classificacao || "não classificado"}
Origem: ${lead.origem || "não informada"}
Valor potencial: R$ ${lead.valor_potencial ?? 0}
Observações registradas pelo vendedor: ${lead.observacoes || "nenhuma"}
  `.trim();

  const prompt =
    tipo === "resumo"
      ? `Você é um assistente comercial. Com base nos dados abaixo, escreva um resumo executivo de 2-3 frases sobre esse lead, em português, para um vendedor entender rapidamente a situação.\n\n${contexto}`
      : `Você é um assistente comercial. Com base nos dados abaixo, sugira UMA próxima ação comercial concreta e específica que o vendedor deveria tomar agora, em 1-2 frases, em português.\n\n${contexto}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(prompt);
    const texto = result.response.text().trim();
    return NextResponse.json({ texto });
  } catch (err) {
    console.error("Erro ao gerar insight com IA:", err);
    return NextResponse.json(
      { error: "Não foi possível gerar a resposta da IA no momento." },
      { status: 500 }
    );
  }
}