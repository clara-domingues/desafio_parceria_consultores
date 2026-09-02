"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Lead {
  id: string;
  nome?: string | null;
  nome_contato?: string | null;
  empresa?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: string | null;
  valor_potencial?: number | null;
  valor?: number | null;
  origem?: string | null;
  classificacao?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usuarios?: any;
  atualizado_em?: string | null;
  criado_em?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface LeadsContextType {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  updateLeadStatus: (id: string, newStatus: string) => Promise<void>;
  addLead: (newLead: Partial<Lead>) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

const statusEnumMap: Record<string, string> = {
  Novo: "Novo",
  Qualificacao: "Qualificação",
  Proposta: "Proposta",
  Negociacao: "Negociação",
  Ganho: "Ganho",
  Perdido: "Perdido",
};

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao buscar leads:", error.message);
      } else if (data) {
        setLeads(data as Lead[]);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar leads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) await fetchLeads();
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchLeads]);

  const updateLeadStatus = async (id: string, newStatus: string) => {
    const statusFormatado = statusEnumMap[newStatus] || newStatus;

    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
    );

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: statusFormatado,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar status do lead:", error.message);
        await fetchLeads();
      }
    } catch (err) {
      console.error("Erro inesperado ao atualizar status:", err);
      await fetchLeads();
    }
  };

  const addLead = async (newLead: Partial<Lead>) => {
    try {
      const { error } = await supabase.from("leads").insert([newLead]);
      if (error) {
        console.error("Erro ao adicionar lead:", error.message);
      } else {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Erro inesperado ao adicionar lead:", err);
    }
  };

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        fetchLeads,
        refreshLeads: fetchLeads,
        updateLeadStatus,
        addLead,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeads deve ser usado dentro de um LeadsProvider");
  }
  return context;
}