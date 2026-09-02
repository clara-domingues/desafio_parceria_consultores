"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NovoLeadModal from "@/components/leads/NovoLeadModal";

export default function HeaderPipeline() {
  const [modalAberto, setModalAberto] = useState(false);
  const router = useRouter();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gerencie e acompanhe o progresso das suas oportunidades
        </p>
      </div>

      <button
        onClick={() => setModalAberto(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition shadow-sm"
      >
        + Novo Lead
      </button>

      <NovoLeadModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onLeadCriado={() => router.refresh()}
      />
    </div>
  );
}