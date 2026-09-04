#  Mini CRM — Desafio Técnico Parceria Consultores

Protótipo de CRM comercial web desenvolvido para o processo seletivo da área de Tecnologia, Automação e Dados da **Parceria Consultores**.

**Autora:** Clara Domingues  
**Deploy:** [https://desafio-parceria-consultores-xp3h.vercel.app](https://desafio-parceria-consultores-xp3h.vercel.app)  
**Repositório:** [https://github.com/clara-domingues/desafio_parceria_consultores](https://github.com/clara-domingues/desafio_parceria_consultores)  
**Servidor Discord (Alertas de Leads Estagnados):** [https://discord.gg/dkHSNXaEB](https://discord.gg/dkHSNXaEB)

---

## Objetivo

Aplicação web desenvolvida para a centralização, acompanhamento e otimização do funil de vendas comercial. O sistema permite gerenciar contatos desde a prospecção inicial até a conversão em cliente ou perda, contando com automações de regras, visão gerencial em tempo real e assistente de Inteligência Artificial para qualificação e apoio à tomada de decisão.

---

##  Stack Tecnológica & Decisões Técnicas

- **Frontend & Backend:** `Next.js` (App Router) + `TypeScript` + `Tailwind CSS`  
  *Decisão:* Escolhido por unificar a interface e as rotas de API em um único repositório — as automações (classificação, conversão, notificação) operam como Serverless Route Handlers do próprio Next.js.
- **Banco de Dados:** `PostgreSQL` via `Supabase`  
  *Decisão:* Estrutura relacional nativa adequada ao modelo comercial (Lead → Histórico, Lead → Cliente). O Supabase oferece autenticação e políticas de acesso (Row Level Security).
- **Kanban (Drag and Drop):** `@hello-pangea/dnd` para a movimentação fluida dos cards entre as colunas do funil.
- **Gráficos & Dashboards:** `Recharts` para geração de gráficos dinâmicos (distribuição por etapas, origens e barra de progresso).
- **Inteligência Artificial:** `Google Gemini API` integrada nas automações e análises do modal.
- **Automação Agendada & Integrador:** `n8n` para orquestração da notificação de leads estagnados e disparo via **Discord Webhook**.
- **Deploy & Hospedagem:** `Vercel`.

---

##  Estrutura do Banco de Dados

- **`leads`**: Entidade principal contendo dados cadastrais (nome, empresa, e-mail, telefone, origem, segmento, responsável, status, valor potencial, datas de entrada/fechamento e observações), além dos campos `classificacao` e `classificacao_motivo` (Automação 1) e `ultima_notificacao_estagnacao`.
- **`usuarios`**: Tabela de responsáveis comerciais (referenciada por `leads.responsavel_id`).
- **`historico`**: Registro cronológico de auditoria por alteração relevante (status, responsável, valor, conversão), referenciando `leads.id`. Permite consultas estruturadas de métricas sem necessidade de parsear campos JSON.
- **`clientes`**: Registros gerados automaticamente pela Automação 2 quando um lead é movido para a etapa "Ganho", vinculando o `lead_origem_id`.
- **`notificacoes`**: Avisos internos do sistema (conversão e estagnação de leads) vinculados aos usuários e leads.

> **Validação de Dados:** O campo `status` utiliza um tipo `enum` do PostgreSQL (`Novo`, `Qualificação`, `Proposta`, `Negociação`, `Ganho`, `Perdido`), garantindo a consistência das etapas no banco de dados.

---

##  Gestão do Pipeline (Kanban e Tabela)

Interface adaptável oferecendo duas visualizações do funil:
1. **Visão Kanban (Padrão):** Colunas organizadas por etapas com suporte a *drag and drop* para transição rápida de status.
2. **Visão Tabela:** Visualização em lista estruturada com busca global (nome, e-mail, empresa), filtros combinados por status, origem, responsável e intervalo de datas de entrada, além de ordenação por valor e data.

Cada lead possui um **Modal de Detalhes** que permite edição completa das informações cadastrais, geração de insumos via IA e auditoria do histórico de modificações.

---

##  Automações Implementadas

### Automação 1 — Qualificação de Leads (Regra + IA)
Ao cadastrar um novo lead, a rota `/api/classificar` calcula um score baseado em três critérios objetivos: valor potencial, origem do lead e proximidade do fechamento (definindo a temperatura em *Quente*, *Morno* ou *Frio*). Se houver texto no campo "Observações", a Gemini API analisa o contexto e ajusta a pontuação em ±1 ponto para capturar urgências. Caso ocorra alguma oscilação na API de IA, o sistema mantém a classificação via regra determinística sem travar o cadastro.

### Automação 2 — Conversão em Cliente
Ao mover um lead para a etapa "Ganho" (seja via Kanban ou edição manual), a rota `/api/converter-lead` cria o registro correspondente na tabela `clientes`, notifica o responsável e registra o evento no histórico. O sistema possui trava de duplicidade para impedir que o mesmo lead seja convertido múltiplos momentos.

### Automação 3 — Notificação de Leads Estagnados via Discord (7+ Dias)
Um workflow agendado no **n8n** realiza chamadas periódicas para a rota `/api/leads-estagnados`, identificando negociações sem movimentação há 7 dias ou mais (excluindo etapas finais). Em seguida, o n8n dispara as mensagens de alerta diretamente para o canal da equipe no **Discord via Webhook** ([Entre no servidor para conferir](https://discord.gg/dkHSNXaEB)) e aciona a rota `/api/notificar-estagnado` para atualizar a data do último aviso no banco, evitando alertas repetitivos.

---

##  Uso de Inteligência Artificial

- **Assistente de Desenvolvimento (Vibe Coding):** Utilização do Claude (Claude Code e Chat) para prototipagem de componentes React, construção de rotas de API Next.js, modelagem de queries SQL e depuração de código.
- **Qualificação Contextual (Automação 1):** Chamadas à Gemini API para ajuste de pontuação de leads com base no campo de observações.
- **Resumo Inteligente:** Botão no modal do lead que aciona a Gemini API para gerar uma síntese executiva de 2 a 3 frases sobre o estado da negociação.
- **Sugestão de Próxima Ação:** Módulo de IA no modal que fornece recomendações estratégicas imediatas ao vendedor para dar andamento ao ciclo de vendas.

---

## Dificuldades Encontradas e Soluções

- **Desalinhamento de Enums no Postgres:** Divergência entre a grafia dos status no frontend e no banco de dados (ex: `qualificacao` vs `Qualificação`). Solucionado com a padronização e tipagem estática das 6 etapas oficiais em toda a aplicação.
- **Depreciação de Modelo de IA:** O modelo `gemini-2.0-flash` foi descontinuado durante o desenvolvimento. O erro foi identificado no log da API e corrigido pela atualização para a versão estável mais recente do modelo Gemini nas rotas Serverless.
- **Duplicação de Componentes:** Inconsistências de diretórios durante a geração de código via IA. Resolvido mediante consolidação da estrutura de arquivos na convenção do Next.js App Router.
- **Variáveis de Ambiente na Vercel:** Falha na inicialização em produção devido à ausência das chaves do Supabase na plataforma de deploy. Solucionado com o cadastro manual das variáveis no painel da Vercel e re-deploy da aplicação.
- **Autenticação em URLs de Preview:** O workflow do n8n recebia bloqueios de acesso ao tentar consumir a API em URLs de preview protegidas da Vercel. Solucionado fixando o endpoint oficial no domínio de produção estável.

---

## Diferenciais Implementados

- [x] Alternância de visões entre Kanban interativo e Tabela
- [x] Edição cadastral completa com histórico de auditoria
- [x] Validação preventiva de duplicidade por e-mail e telefone
- [x] Exportação de dados filtrados em formato CSV
- [x] Síntese de contexto do cliente via Resumo Inteligente (IA)
- [x] Recomendação estratégica de vendas via Próxima Ação (IA)
- [x] Orquestração de tarefas agendadas via n8n com integração Webhook no Discord
- [x] Publicação e deploy em produção na Vercel

---

## Próximos Passos (Melhorias com mais duas semanas)

- Implementação de tela de login e controle de sessão via Supabase Auth
- Controle de acesso baseado em funções (RBAC: Vendedor vs. Gestor)
- Funcionalidade para importação em massa de leads via arquivo CSV
- Cobertura de testes automatizados (unitários e de integração) para as rotas de API
- Evolução do algoritmo de duplicidade com busca por semelhança textual (fuzzy search)

---

## Como Rodar o Projeto Localmente

1. **Clonar o repositório:**
```bash
git clone (https://github.com/clara-domingues/desafio_parceria_consultores.git)
cd desafio_parceria_consultores
Instalar as dependências:

Bash
npm install
Configurar as Variáveis de Ambiente:
Crie um arquivo .env.local na raiz do projeto com as seguintes chaves:

Snippet de código
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
GEMINI_API_KEY=sua_chave_da_api_gemini
Iniciar o servidor de desenvolvimento:

Bash
npm run dev
Acesse http://localhost:3000 no seu navegador.


--