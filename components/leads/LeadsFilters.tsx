"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Usuario {
  id: string;
  nome: string;
}

interface LeadsFiltersProps {
  usuarios?: Usuario[];
  searchParams?: {
    status?: string;
    responsavel?: string;
    origem?: string;
    busca?: string;
  };
}

export default function LeadsFilters({ usuarios = [], searchParams = {} }: LeadsFiltersProps) {
  const router = useRouter();
  const currentParams = useSearchParams();

  const updateSearchParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(currentParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Redireciona para a raiz onde está o Kanban
      router.push(`/?${params.toString()}`);
    },
    [currentParams, router]
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Busca textual */}
      <input
        type="text"
        placeholder="Buscar por nome, e-mail ou empresa..."
        defaultValue={searchParams.busca || currentParams.get("busca") || ""}
        onChange={(e) => updateSearchParam("busca", e.target.value)}
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {/* Filtro por Status */}
     <select name="status" defaultValue={searchParams.status ?? ""}>
  <option value="">Todos os status</option>
  <option value="Novo">Novo</option>
  <option value="Qualificacao">Qualificação</option>
  <option value="Proposta">Proposta</option>
  <option value="Negociacao">Negociação</option>
  <option value="Ganho">Ganho</option>
  <option value="Perdido">Perdido</option>
</select>
      {/* Filtro por Origem */}
    <select name="origem" defaultValue={searchParams.origem ?? ""}>
  <option value="">Todas as origens</option>
  <option value="Indicacao">Indicação</option>
  <option value="WhatsApp">WhatsApp</option>
  <option value="Redes Sociais">Redes Sociais</option>
  <option value="Prospeccao Ativa">Prospecção Ativa</option>
  <option value="Outro">Outro</option>
</select>

      {/* Filtro por Responsável */}
      {usuarios.length > 0 && (
        <select
          value={searchParams.responsavel || currentParams.get("responsavel") || ""}
          onChange={(e) => updateSearchParam("responsavel", e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-md p-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Responsáveis</option>
          {usuarios.map((user) => (
            <option key={user.id} value={user.id}>
              {user.nome}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}