import { z } from "zod";

export const leadSchema = z.object({
  nome_contato: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  empresa: z.string().optional(),
  telefone: z.string().optional(),
  valor_potencial: z
    .union([z.number(), z.string().transform((val) => (val === "" ? undefined : Number(val)))])
    .optional(),
  origem: z.string().optional(),
  previsao_fechamento: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  observacoes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;