"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/contexts/LeadsContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function DashboardView({ leads }: { leads: Lead[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Métricas Principais
  const totalLeads = leads.length;
  const totalValorPipeline = leads.reduce(
    (acc, lead) => acc + (lead.valor_potencial ?? lead.valor ?? 0),
    0
  );

  const leadsGanhos = leads.filter((l) => l.status === "Ganho" || l.status === "Ganho");
  const totalValorGanhos = leadsGanhos.reduce(
    (acc, lead) => acc + (lead.valor_potencial ?? lead.valor ?? 0),
    0
  );

  const taxaConversao = totalLeads > 0 ? ((leadsGanhos.length / totalLeads) * 100).toFixed(1) : "0";
  const ticketMedio = leadsGanhos.length > 0 ? totalValorGanhos / leadsGanhos.length : 0;

  // Gráfico 1: Etapas
  const etapas = ["Novo", "Qualificacao", "Proposta", "Negociacao", "Ganho", "Perdido"];
  const dadosPorEtapa = etapas.map((etapa) => ({
    etapa,
    quantidade: leads.filter((l) => (l.status || "Novo").replace("ção", "cao") === etapa).length,
  }));

  // Gráfico 2: Origem
  const origensMap: Record<string, number> = {};
  leads.forEach((l) => {
    const orig = l.origem || "Outros";
    origensMap[orig] = (origensMap[orig] || 0) + 1;
  });
  const dadosPorOrigem = Object.keys(origensMap).map((key) => ({
    name: key,
    value: origensMap[key],
  }));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
            Total de Leads
          </span>
          <span className="text-2xl font-bold text-white">{totalLeads}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
            Valor do Pipeline
          </span>
          <span className="text-xl font-bold text-blue-400">
            {formatCurrency(totalValorPipeline)}
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
            Negócios Ganhos
          </span>
          <span className="text-xl font-bold text-emerald-400">
            {formatCurrency(totalValorGanhos)}
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
            Taxa de Conversão
          </span>
          <span className="text-2xl font-bold text-amber-400">{taxaConversao}%</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
            Ticket Médio
          </span>
          <span className="text-xl font-bold text-purple-400">
            {formatCurrency(ticketMedio)}
          </span>
        </div>
      </div>

      {/* Gráficos */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 text-white">Leads por Etapa do Pipeline</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorEtapa}>
                  <XAxis dataKey="etapa" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 text-white">Origem dos Leads</h2>
            <div className="h-72 w-full flex items-center justify-center">
              {dadosPorOrigem.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhum dado disponível.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPorOrigem}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {dadosPorOrigem.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}