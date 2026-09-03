// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportLeadsToCSV(leads: any[], filename = "leads_export.csv") {
  if (!leads || leads.length === 0) {
    alert("Não há leads para exportar.");
    return;
  }

  // Cabeçalhos das colunas
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

  // Mapeia e formata os dados de cada lead
  const rows = leads.map((lead) => {
    // Trata formatação de data de forma limpa para o Excel
    let formattedDate = "";
    if (lead.createdAt || lead.created_at || lead.dataEntrada) {
      const rawDate = lead.createdAt || lead.created_at || lead.dataEntrada;
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString("pt-BR");
      } else {
        formattedDate = String(rawDate);
      }
    }

    const valor = lead.valorPotencial ?? lead.valor ?? lead.value ?? 0;

    return [
      `"${lead.id || ""}"`,
      `"${(lead.nome || lead.name || "").replace(/"/g, '""')}"`,
      `"${(lead.empresa || lead.company || "").replace(/"/g, '""')}"`,
      `"${(lead.status || "").replace(/"/g, '""')}"`,
      `"${(lead.origem || lead.source || "").replace(/"/g, '""')}"`,
      valor,
      `"${formattedDate}"`,
      `"${(lead.responsavel || lead.assignedTo || "Não atribuído").replace(/"/g, '""')}"`,
    ].join(",");
  });

  // Une os cabeçalhos e as linhas com quebra de linha
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Adiciona o BOM UTF-8 (\uFEFF) para o Excel reconhecer acentos e codificação automaticamente
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}