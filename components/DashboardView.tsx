import React from "react";

export interface Lead {
  id: string;
  nome_contato?: string | null;
  nome?: string | null;
  empresa?: string | null;
  status?: string | null;
  classificacao?: string | null;
  origem?: string | null;
  valor_potencial?: number | null;
  valor?: number | null;
  responsavel_id?: string | null;
  responsavel?: { nome?: string } | string | null;
  created_at?: string | null;
  data_entrada?: string | null;
}

interface DashboardViewProps {
  leads: Lead[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ leads = [] }) => {
  // 1. Métricas Principais
  const totalLeads = leads.length;

  const valorPipeline = leads.reduce((acc, lead) => {
    return acc + (lead.valor_potencial ?? lead.valor ?? 0);
  }, 0);

  const negociosGanhos = leads.filter(
    (l) => l.status?.toLowerCase() === "ganho"
  );

  const valorGanhos = negociosGanhos.reduce((acc, lead) => {
    return acc + (lead.valor_potencial ?? lead.valor ?? 0);
  }, 0);

  const taxaConversao =
    totalLeads > 0
      ? ((negociosGanhos.length / totalLeads) * 100).toFixed(1)
      : "0.0";

  const ticketMedio =
    negociosGanhos.length > 0 ? valorGanhos / negociosGanhos.length : 0;

  // 2. Gráfico de Etapas (Barras)
  const etapasContagem: Record<string, number> = {
    Novo: 0,
    Qualificação: 0,
    Proposta: 0,
    Negociação: 0,
    Ganho: 0,
    Perdido: 0,
  };

  leads.forEach((l) => {
    const st = (l.status || "").toLowerCase();
    if (st === "novo") etapasContagem["Novo"]++;
    else if (st === "qualificacao" || st === "qualificação")
      etapasContagem["Qualificação"]++;
    else if (st === "proposta") etapasContagem["Proposta"]++;
    else if (st === "negociacao" || st === "negociação")
      etapasContagem["Negociação"]++;
    else if (st === "ganho") etapasContagem["Ganho"]++;
    else if (st === "perdido") etapasContagem["Perdido"]++;
    else etapasContagem["Novo"]++;
  });

  const maxBarras = Math.max(...Object.values(etapasContagem), 1);

  // 3. Gráfico de Origem dos Leads (Pizza)
  const origensContagem: Record<string, number> = {
    "Outro": 0,
    "WhatsApp": 0,
    "Redes Sociais": 0,
    "Prospecção Ativa": 0,
  };

  leads.forEach((l) => {
    const orig = l.origem || "Outro";
    if (origensContagem[orig] !== undefined) {
      origensContagem[orig]++;
    } else {
      origensContagem["Outro"]++;
    }
  });

  // Cores fixas para a Pizza
  const coresOrigem: Record<string, string> = {
    "Outro": "#3b82f6",          // azul
    "WhatsApp": "#ef4444",       // vermelho
    "Redes Sociais": "#f59e0b",  // amarelo/laranja
    "Prospecção Ativa": "#10b981", // verde
  };

  // Construção do Conic Gradient para o gráfico de pizza em CSS
  let anguloAtual = 0;
  const fatiasGradient = Object.entries(origensContagem)
    .map(([chave, qtd]) => {
      const pct = totalLeads > 0 ? qtd / totalLeads : 0;
      const anguloFim = anguloAtual + pct * 360;
      const cor = coresOrigem[chave] || "#6b7280";
      const str = `${cor} ${anguloAtual}deg ${anguloFim}deg`;
      anguloAtual = anguloFim;
      return str;
    })
    .join(", ");

  const pizzaBackground =
    totalLeads > 0 && fatiasGradient
      ? `conic-gradient(${fatiasGradient})`
      : "#27272a";

  // 4. Classificação dos Leads (Quente / Morno / Frio)
  const classificacaoContagem = {
    Quente: 0,
    Morno: 0,
    Frio: 0,
  };

  leads.forEach((l) => {
    const c = (l.classificacao || "").toLowerCase();
    if (c === "quente") classificacaoContagem["Quente"]++;
    else if (c === "morno") classificacaoContagem["Morno"]++;
    else if (c === "frio") classificacaoContagem["Frio"]++;
    else classificacaoContagem["Morno"]++;
  });

  const formatarMoeda = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 text-white">
      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Total de Leads
          </p>
          <h3 className="text-2xl font-bold mt-2">{totalLeads}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Valor do Pipeline
          </p>
          <h3 className="text-2xl font-bold text-blue-400 mt-2">
            {formatarMoeda(valorPipeline)}
          </h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Negócios Ganhos
          </p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            {formatarMoeda(valorGanhos)}
          </h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Taxa de Conversão
          </p>
          <h3 className="text-2xl font-bold text-amber-400 mt-2">
            {taxaConversao}%
          </h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <p className="text-xs text-zinc-400 font-semibold uppercase">
            Ticket Médio
          </p>
          <h3 className="text-2xl font-bold text-purple-400 mt-2">
            {formatarMoeda(ticketMedio)}
          </h3>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GRÁFICO 1: ETAPAS DO PIPELINE */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-6">Leads por Etapa</h4>
          <div className="h-56 flex items-end justify-between gap-2 pt-8 px-2 border-b border-l border-zinc-700">
            {Object.entries(etapasContagem).map(([etapa, qtd]) => {
              const alturaPorcentagem = (qtd / maxBarras) * 100;
              return (
                <div
                  key={etapa}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-xs font-bold text-blue-400">{qtd}</span>
                  <div
                    className="w-full bg-blue-600 rounded-t transition-all duration-300 min-h-[4px]"
                    style={{ height: `${Math.max(alturaPorcentagem, 4)}%` }}
                  />
                  <span className="text-[10px] text-zinc-400 truncate w-full text-center mt-2">
                    {etapa}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO 2: ORIGEM DOS LEADS (PIZZA) */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg flex flex-col items-center">
          <h4 className="text-lg font-semibold mb-4 w-full text-left">
            Origem dos Leads
          </h4>
          <div className="flex flex-col items-center justify-center h-full w-full gap-4">
            <div
              className="w-36 h-36 rounded-full border border-zinc-700 shadow-md transition-all"
              style={{ background: pizzaBackground }}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-300 w-full pt-2">
              {Object.entries(origensContagem).map(([nome, qtd]) => {
                const pct =
                  totalLeads > 0 ? ((qtd / totalLeads) * 100).toFixed(0) : 0;
                return (
                  <div key={nome} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: coresOrigem[nome] }}
                    />
                    <span className="truncate">{nome} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRÁFICO 3: CLASSIFICAÇÃO DOS LEADS */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-6">Classificação dos Leads</h4>
          <div className="space-y-5 pt-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400 font-medium">🔥 Quente</span>
                <span>{classificacaoContagem.Quente}</span>
              </div>
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{
                    width: `${
                      totalLeads > 0
                        ? (classificacaoContagem.Quente / totalLeads) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-400 font-medium">☀️ Morno</span>
                <span>{classificacaoContagem.Morno}</span>
              </div>
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${
                      totalLeads > 0
                        ? (classificacaoContagem.Morno / totalLeads) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-400 font-medium">❄️ Frio</span>
                <span>{classificacaoContagem.Frio}</span>
              </div>
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{
                    width: `${
                      totalLeads > 0
                        ? (classificacaoContagem.Frio / totalLeads) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;