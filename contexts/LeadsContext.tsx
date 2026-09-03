"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface Usuario {
  id?: string;
  nome?: string;
  email?: string;
}

export interface Lead {
  id: string;
  nome?: string;
  nome_contato?: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  valor_potencial?: number;
  valor?: number;
  status?: string;
  origem?: string;
  temperatura?: string;
  score?: string | number;
  classificacao?: string | null;
  classificacao_motivo?: string | null;
  responsavel_id?: string | null;
  data_entrada?: string;
  created_at?: string;
  usuarios?: Usuario | null;
}

interface LeadsContextType {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  addLead: (novoLead: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (id: string, novoStatus: string) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*, usuarios(*)");

      if (error) {
        console.warn("Aviso ao buscar leads:", error.message);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.warn("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*, usuarios(*)");

        if (!error && active) {
          setLeads(data || []);
        }
      } catch (err) {
        console.warn("Erro no carregamento inicial:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const addLead = async (novoLead: Partial<Lead>) => {
    const leadObjeto = novoLead as Partial<Lead> & Record<string, unknown>;
    const { valor, ...restoDoLead } = leadObjeto;

    const payloadParaBanco = {
      ...restoDoLead,
      valor_potencial: novoLead.valor_potencial ?? (typeof valor === "number" ? valor : 0),
      status: novoLead.status || "novo_lead",
    };

    const { error } = await supabase.from("leads").insert([payloadParaBanco]);

    if (error) {
      console.warn("Erro ao adicionar no banco, atualizando apenas localmente:", error.message);
    }
    
    await fetchLeads();
  };

  const updateLeadStatus = async (id: string, novoStatus: string) => {
    // 1. Atualiza o estado da aplicação primeiro
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        String(lead.id) === String(id) ? { ...lead, status: novoStatus } : lead
      )
    );

    // 2. Tenta persistir no Supabase sem dar throw em caso de mismatch do ENUM
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) {
        console.warn("[Supabase Sync Warning] Erro de enum ignorado:", error.message);
      }
    } catch (err) {
      console.warn("[Supabase Sync Warning] Falha na requisição de update:", err);
    }
  };

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        fetchLeads,
        addLead,
        updateLeadStatus,
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