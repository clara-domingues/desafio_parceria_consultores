"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  status: string | null;
  valor_potencial: number | null;
  valor?: number | null;
  origem: string | null;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;

    requestAnimationFrame(() => {
      if (active) setMounted(true);
    });

    async function fetchLeads() {
      const { data, error } = await supabase.from("leads").select("*");

      if (!active) return;

      if (error) {
        console.error("[Dashboard] Erro ao buscar leads:", error);
      } else if (data) {
        setLeads(data);
      }
      setLoading(false);
    }

    fetchLeads();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-zinc-400 font-medium">Carregando dados do dashboard...</div>
      </main>
    );
  }

  // Métricas Principais (KPIs)
  const totalLeads = leads.length;
  const totalValorPipeline = leads.reduce(
    (acc, lead) => acc + (lead.valor_potencial ?? lead.valor ?? 0),
    0
  );

  const leadsGanhos = leads.filter((l) => l.status === "Ganho");
  const totalValorGanhos = leadsGanhos.reduce(
    (acc, lead) => acc + (lead.valor_potencial ?? lead.valor ?? 0),
    0
  );

  const taxaConversao = totalLeads > 0 ? ((leadsGanhos.length / totalLeads) * 100).toFixed(1) : "0";
  const ticketMedio = leadsGanhos.length > 0 ? totalValorGanhos / leadsGanhos.length : 0;

  // Dados para o Gráfico 1: Leads por Etapa (Garantindo alinhamento com as colunas do Kanban)
  const etapas = ["Novo", "Qualificacao", "Proposta", "Negociacao", "Ganho", "Perdido"];
  const dadosPorEtapa = etapas.map((etapa) => ({
    etapa,
    quantidade: leads.filter((l) => (l.status || "Novo") === etapa).length,
  }));

  // Dados para o Gráfico 2: Leads por Origem
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
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Gerencial</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Visão geral do pipeline de vendas e indicadores comerciais.
            </p>
          </div>
          <Link
            href="/"
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ← Voltar para o CRM
          </Link>
        </div>

        {/* Métricas / KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <span className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
              Total de Leads
            </span>
            <span className="text-2xl font-bold">{totalLeads}</span>
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
            {/* Gráfico 1: Leads por Etapa */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Leads por Etapa do Pipeline</h2>
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

            {/* Gráfico 2: Leads por Origem */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Origem dos Leads</h2>
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
    </main>
  );
}