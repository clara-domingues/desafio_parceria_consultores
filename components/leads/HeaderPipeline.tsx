"use client";

import { useState } from "react";
import NovoLeadModal from "@/components/leads/NovoLeadModal";
import { useLeads } from "@/contexts/LeadsContext";

export default function HeaderPipeline() {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const { fetchLeads } = useLeads();

  function abrirModal() {
    // Incrementar a key força o React a criar uma instância nova do modal,
    // então o formulário sempre nasce limpo — sem precisar resetar via useEffect.
    setModalKey((k) => k + 1);
    setModalAberto(true);
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gerencie e acompanhe o progresso das suas oportunidades
        </p>
      </div>

      <button
        onClick={abrirModal}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition shadow-sm"
      >
        + Novo Lead
      </button>

      <NovoLeadModal
        key={modalKey}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}