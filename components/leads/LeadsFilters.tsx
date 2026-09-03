"use client";

import React from "react";
import { exportLeadsToCSV } from "@/lib/exportToCsv";
import { useLeads } from "@/contexts/LeadsContext";

export interface FilterState {
  search: string;
  startDate: string;
  endDate: string;
  status: string;
  origem: string;
  responsavel: string;
}

export interface LeadsFiltersProps {
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leads?: any[];
}

export default function LeadsFilters({
  filters,
  onFilterChange,
  leads: propsLeads,
}: LeadsFiltersProps) {
  // Pega o estado do contexto de forma segura sem usar 'any' diretamente
  const context = useLeads?.() as unknown as { leads?: unknown[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contextLeads = (context?.leads || []) as any[];

  // Prioriza os leads passados via props e faz o fallback seguro para o contexto
  const leadsToExport =
    propsLeads && propsLeads.length > 0 ? propsLeads : contextLeads;

  const currentFilters: FilterState = filters || {
    search: "",
    startDate: "",
    endDate: "",
    status: "",
    origem: "",
    responsavel: "",
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (onFilterChange) {
      onFilterChange({
        ...currentFilters,
        [name]: value,
      });
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* BUSCA GERAL */}
        <div className="flex-1">
          <input
            type="text"
            name="search"
            value={currentFilters.search}
            onChange={handleChange}
            placeholder="Buscar por nome, e-mail ou empresa..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
          />
        </div>

        {/* PERÍODO */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="startDate"
            value={currentFilters.startDate}
            onChange={handleChange}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
          />
          <span className="text-xs text-zinc-500">até</span>
          <input
            type="date"
            name="endDate"
            value={currentFilters.endDate}
            onChange={handleChange}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
          />
        </div>

        {/* SELECTS DE FILTRO */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2">
          <select
            name="status"
            value={currentFilters.status}
            onChange={handleChange}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition capitalize"
          >
            <option value="">Todos os status</option>
            <option value="Novo">Novo</option>
            <option value="Qualificação">Qualificação</option>
            <option value="Proposta">Proposta</option>
            <option value="Negociação">Negociação</option>
            <option value="Ganho">Ganho</option>
            <option value="Perdido">Perdido</option>
          </select>

          <select
            name="origem"
            value={currentFilters.origem}
            onChange={handleChange}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
          >
            <option value="">Todas as origens</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Redes Sociais">Redes Sociais</option>
            <option value="Prospecção Ativa">Prospecção Ativa</option>
            <option value="Indicação">Indicação</option>
            <option value="Outro">Outro</option>
          </select>

          <select
            name="responsavel"
            value={currentFilters.responsavel}
            onChange={handleChange}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
          >
            <option value="">Todos os responsáveis</option>
            <option value="Usuário Padrão">Usuário Padrão</option>
          </select>

          {/* BOTÃO DE EXPORTAÇÃO CSV */}
          <button
            type="button"
            onClick={() => exportLeadsToCSV(leadsToExport)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3.5 py-2 rounded-lg border border-zinc-700 transition font-medium whitespace-nowrap"
            title="Exportar lista atual de leads para CSV"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}