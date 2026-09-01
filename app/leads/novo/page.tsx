"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { leadSchema, LeadFormData } from "@/lib/schemas/lead";
import { classificarLead } from "@/lib/automations/classificacao";

export default function NovoLeadPage() {
  const router = useRouter();
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
  });

  async function checkDuplicate(email: string) {
    const { data } = await supabase
      .from("leads")
      .select("id, empresa")
      .eq("email", email)
      .maybeSingle();

    return data;
  }

  async function onSubmit(formData: LeadFormData) {
    setSubmitting(true);

    const existing = await checkDuplicate(formData.email);

    if (existing && !duplicateWarning) {
      setDuplicateWarning(
        `Atenção: Já existe um lead cadastrado com este e-mail (${existing.empresa ?? "sem empresa registrada"}). Clique em cadastrar novamente para confirmar.`
      );
      setSubmitting(false);
      return;
    }

    const classificacao = classificarLead(formData);

    const { error } = await supabase
      .from("leads")
      .insert([{ ...formData, status: "Novo", classificacao }])
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 flex justify-center items-center">
      <div className="w-full max-w-lg bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Lead</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Nome do Contato *
            </label>
            <input
              {...register("nome_contato")}
              type="text"
              placeholder="Ex: Ana Clara"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome_contato?.message && (
              <span className="text-red-400 text-xs mt-1 block">
                {String(errors.nome_contato.message)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              E-mail *
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="exemplo@empresa.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email?.message && (
              <span className="text-red-400 text-xs mt-1 block">
                {String(errors.email.message)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Empresa
            </label>
            <input
              {...register("empresa")}
              type="text"
              placeholder="Nome da empresa"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Telefone
            </label>
            <input
              {...register("telefone")}
              type="text"
              placeholder="(85) 99999-9999"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Valor Potencial (R$)
            </label>
            <input
              {...register("valor_potencial")}
              type="number"
              placeholder="Ex: 5000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Origem
            </label>
            <select
              {...register("origem")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              <option value="Indicação">Indicação</option>
              <option value="Prospecção Ativa">Prospecção Ativa</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Previsão de Fechamento
            </label>
            <input
              {...register("previsao_fechamento")}
              type="date"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {duplicateWarning && (
            <div className="bg-amber-500/10 border border-amber-500/50 p-3 rounded-md">
              <p className="text-amber-400 text-xs">{duplicateWarning}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-md transition duration-200 disabled:opacity-50"
          >
            {submitting ? "Salvando..." : "Cadastrar lead"}
          </button>
        </form>
      </div>
    </main>
  );
}