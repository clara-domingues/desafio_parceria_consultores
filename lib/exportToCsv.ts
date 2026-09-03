// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportLeadsToCSV(leads: any[], filename = "leads_export.csv") {
  if (!leads || leads.length === 0) {
    alert("Não há leads para exportar.");
    return;
  }

  // Cabeçalhos do arquivo CSV
  const headers = [
    "ID",
    "Nome",
    "Empresa",
    "Status",
    "Origem",
    "Valor Potencial (R$)",
    "Data de Entrada",
    "Responsável",
  ];

  // Mapeamento e tratamento das linhas
  const rows = leads.map((lead) => {
    const nome = String(lead.nome || lead.nome_contato || lead.title || lead.name || "");
    const empresa = String(lead.empresa || "");
    const status = String(lead.status || "");
    const origem = String(lead.origem || "");
    const valor = String(lead.valor_potencial ?? lead.valor ?? 0);
    const dataEntrada = String(lead.created_at || lead.data_entrada || "");

    let responsavel = "Não atribuído";
    if (typeof lead.responsavel === "object" && lead.responsavel?.nome) {
      responsavel = String(lead.responsavel.nome);
    } else if (typeof lead.responsavel === "string" && lead.responsavel.trim() !== "") {
      responsavel = String(lead.responsavel);
    }

    // Trata aspas duplas e vírgulas no CSV
    return [
      `"${lead.id}"`,
      `"${nome.replace(/"/g, '""')}"`,
      `"${empresa.replace(/"/g, '""')}"`,
      `"${status.replace(/"/g, '""')}"`,
      `"${origem.replace(/"/g, '""')}"`,
      `"${valor}"`,
      `"${dataEntrada}"`,
      `"${responsavel.replace(/"/g, '""')}"`,
    ].join(";"); // Usa ponto e vírgula para compatibilidade com o Excel em PT-BR
  });

  // Adiciona BOM (\uFEFF) para garantir acentuação correta no Excel PT-BR
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");

  // Cria e dispara o download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}