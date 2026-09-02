"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface Usuario {
  id: string;
  nome: string;
}

interface LeadsFiltersProps {
  usuarios?: Usuario[];
}

export default function LeadsFilters({ usuarios = [] }: LeadsFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "todos" && value !== "todas") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
      {/* Campo de Busca */}
      <div className="flex-1 min-w-[240px]">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou empresa..."
          defaultValue={searchParams.get("busca")?.toString()}
          onChange={(e) => handleFilter("busca", e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Filtro por Período */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          name="dataInicio"
          defaultValue={searchParams.get("dataInicio")?.toString()}
          onChange={(e) => handleFilter("dataInicio", e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
        />
        <span className="text-zinc-500 text-sm self-center">até</span>
        <input
          type="date"
          name="dataFim"
          defaultValue={searchParams.get("dataFim")?.toString()}
          onChange={(e) => handleFilter("dataFim", e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Filtro Status */}
      <select
        defaultValue={searchParams.get("status") || "todos"}
        onChange={(e) => handleFilter("status", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
      >
        <option value="todos">Todos os status</option>
        <option value="Novo">Novo</option>
        <option value="Qualificação">Qualificação</option>
        <option value="Proposta">Proposta</option>
        <option value="Negociação">Negociação</option>
        <option value="Ganho">Ganho</option>
        <option value="Perdido">Perdido</option>
      </select>

      {/* Filtro Origem */}
      <select
        defaultValue={searchParams.get("origem") || "todas"}
        onChange={(e) => handleFilter("origem", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
      >
        <option value="todas">Todas as origens</option>
        <option value="WhatsApp">WhatsApp</option>
        <option value="Indicação">Indicação</option>
        <option value="Redes Sociais">Redes Sociais</option>
        <option value="Prospecção Ativa">Prospecção Ativa</option>
        <option value="Outro">Outro</option>
      </select>

      {/* Filtro Responsável */}
      <select
        defaultValue={searchParams.get("responsavel") || "todos"}
        onChange={(e) => handleFilter("responsavel", e.target.value)}
        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
      >
        <option value="todos">Todos os responsáveis</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
    </div>
  );
}