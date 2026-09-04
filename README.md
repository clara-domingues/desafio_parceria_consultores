This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Mini CRM — Desafio Técnico Parceria Consultores

Protótipo de CRM comercial desenvolvido para o processo seletivo de Tecnologia, Automação e Dados da Parceria Consultores.

**Autora:** Clara Domingues
**Deploy:** https://desafio-parceria-consultores-xp3h.vercel.app
**Repositório:** https://github.com/clara-domingues/desafio_parceria_consultores

## Objetivo

Aplicação web para gerenciamento de leads comerciais, acompanhando cada oportunidade desde a entrada até a conversão ou perda, com automações, dashboard gerencial e uso de IA integrado ao fluxo de trabalho.

## Stack e decisões técnicas

- **Frontend + Backend: Next.js (App Router) + TypeScript + Tailwind CSS**
  Escolhido por unificar interface e rotas de API num único projeto — as automações (classificação, conversão, notificação) vivem como rotas de API do próprio Next.js, sem precisar de um backend separado.
- **Banco de dados: PostgreSQL via Supabase**
  Relacional, o que se encaixa naturalmente no modelo de dados (lead → histórico, lead → cliente). O Supabase também entrega autenticação e políticas de acesso (Row Level Security) prontas, o que evita construir esse sistema do zero.
- **Kanban: `@hello-pangea/dnd`** — drag and drop entre as etapas do pipeline.
- **Gráficos: Recharts** — dashboard com barras (leads por etapa), pizza (origem) e barra de progresso (classificação).
- **IA: Google Gemini API** — detalhado na seção "Uso de IA".
- **Automação agendada: n8n** — dispara a notificação de leads estagnados.
- **Deploy: Vercel.**

## Estrutura do banco de dados

- **`leads`** — entidade principal: nome do contato, empresa, e-mail, telefone, origem, segmento, responsável, status, valor potencial, datas de entrada/fechamento, observações, além de `classificacao` e `classificacao_motivo` (preenchidos pela Automação 1) e `ultima_notificacao_estagnacao` (controle da notificação de inatividade).
- **`usuarios`** — responsáveis comerciais; `leads.responsavel_id` referencia esta tabela.
- **`historico`** — uma linha por alteração relevante de um lead (status, responsável, valor, conversão), referenciando `leads.id`. Optei por uma tabela separada em vez de um campo JSON dentro de `leads` para permitir consultas diretas (ex: quantas mudanças de status um lead teve) e para o dashboard/timeline não depender de parsear JSON.
- **`clientes`** — criada automaticamente pela Automação 2 quando um lead vira "Ganho", referenciando o lead de origem via `lead_origem_id`.
- **`notificacoes`** — avisos internos (conversão e leads estagnados), ligados a `usuarios` e `leads`.

O campo `status` é um `enum` do Postgres (`Novo`, `Qualificação`, `Proposta`, `Negociação`, `Ganho`, `Perdido`), garantindo que nenhum valor inconsistente seja salvo.

## Gestão do pipeline

Interface combinando **Kanban** (visão padrão) e **Tabela**, com busca por nome/e-mail/empresa, filtros por status, origem, responsável e período de entrada, e ordenação clicável por valor e data. Cada lead pode ser editado (todos os campos, incluindo status e responsável) diretamente pelo modal de detalhes, e cada alteração relevante é registrada no histórico.

## Automações

### Automação 1 — Qualificação (regra + IA)
Ao cadastrar um lead, a rota `/api/classificar` calcula um score com base em três critérios objetivos: valor potencial, origem do lead e proximidade da previsão de fechamento. Esse score define Quente/Morno/Frio. Quando o campo "Observações" está preenchido, a Gemini API analisa o texto e pode ajustar o score em ±1 ponto, capturando sinais de urgência que a regra sozinha não capta (ex: "cliente quer fechar essa semana"). Se a chamada à IA falhar, o sistema usa só a regra — o cadastro nunca trava por causa da IA.

### Automação 2 — Conversão
Quando um lead é movido para "Ganho" (via Kanban ou edição manual), a rota `/api/converter-lead` cria automaticamente um registro em `clientes`, gera uma notificação para o responsável e registra a conversão no histórico. Uma checagem evita duplicar o cliente caso o mesmo lead seja movido para "Ganho" mais de uma vez.

### Notificação automática (7+ dias sem atualização)
Um workflow no n8n roda em um agendamento fixo e chama `/api/leads-estagnados`, que retorna os leads sem atualização há 7+ dias (excluindo Ganho/Perdido) e ainda não notificados recentemente. Para cada um, o n8n chama `/api/notificar-estagnado`, que registra a notificação e marca a data do aviso, evitando notificar o mesmo lead repetidamente. Separei essa lógica em duas rotas de propósito: a regra de negócio (o que conta como "estagnado") fica no código, testável e versionada; o n8n cuida só do agendamento — se um dia eu trocar de ferramenta de automação, só troco quem chama a API.

## Uso de IA

- **Desenvolvimento:** o projeto foi construído com apoio do Claude (Claude Code) e Claude via chat, usados para gerar e revisar componentes React, rotas de API, queries SQL, e depurar erros de build e runtime. Todo código gerado foi testado manualmente antes de aceito — nem todo código gerado por IA funcionou de primeira (ver seção seguinte).
- **Classificação de leads (Automação 1):** Google Gemini API, como ajuste fino sobre uma regra determinística.
- **Resumo Inteligente do lead:** Gemini API gera uma síntese executiva de 2-3 frases a partir dos dados cadastrais do lead, disponível sob demanda no modal de detalhes.
- **Sugestão de Próxima Ação:** Gemini API sugere uma ação comercial concreta com base no status, valor, origem e observações do lead.

## Dificuldades encontradas e como foram resolvidas

- **Desalinhamento entre nomes de status no código e no enum do banco.** Em alguns momentos o front-end usava valores diferentes dos aceitos pelo Postgres (ex: `qualificacao` minúsculo sem acento vs. `Qualificação` no enum), o que causava erros silenciosos ao mover leads no Kanban. Resolvido padronizando os 6 valores oficiais (`Novo, Qualificação, Proposta, Negociação, Ganho, Perdido`) em todos os arquivos e migrando os dados já existentes no banco.
- **Modelo de IA descontinuado em produção.** O modelo `gemini-2.0-flash` parou de responder durante o desenvolvimento (a Google o descontinuou). Identificado lendo a mensagem de erro retornada pela própria API, que já indicava o modelo substituto, e corrigido trocando a referência do modelo nas duas rotas que usam IA.
- **Duplicação de arquivos gerados por IA.** Em algumas iterações rápidas com ferramentas de IA, componentes e pastas foram recriados em locais diferentes (ex: `components/leads/` vs. uma pasta duplicada), causando conflitos de importação. Resolvido consolidando os arquivos em um único local e adicionando instruções de convenção de projeto para reduzir recorrência.
- **Variáveis de ambiente ausentes no ambiente de produção.** O deploy na Vercel ficou preso em estado de carregamento porque as chaves do Supabase (guardadas apenas em `.env.local`, fora do controle de versão por segurança) nunca haviam sido configuradas manualmente no painel da Vercel. Resolvido cadastrando as variáveis nas configurações do projeto e forçando um novo deploy.
- **URL de preview protegida bloqueando a automação externa.** O workflow do n8n falhava ao consultar a API porque a URL usada era uma URL de preview da Vercel, que exige login — n8n recebia uma página HTML de autenticação em vez de JSON. Resolvido usando a URL de produção estável (sem o sufixo de preview) na configuração do workflow.

## Diferenciais implementados

- Interface Kanban (com Tabela como visão alternativa)
- Edição completa do lead, incluindo status e responsável, com histórico de mudanças
- Detecção de duplicidade por e-mail (aviso não bloqueante, permite confirmar mesmo assim)
- Exportação de dados em CSV
- IA para resumo do lead
- IA para sugestão de próxima ação comercial
- Deploy em ambiente acessível (Vercel)

## Próximos passos (com mais 2 semanas)

- Login e autenticação de usuários (a base já existe via Supabase Auth, falta conectar ao fluxo da aplicação)
- Controle de permissões por papel (vendedor vs. gestor)
- Importação de leads via CSV
- Testes automatizados para as rotas de automação (classificação, conversão, notificação)
- Revisão e ajustes finos de responsividade mobile
- Evoluir a detecção de duplicidade para considerar também telefone e variações de texto (maiúsculas/acentos)

## Como rodar localmente

```bash
npm install
# Configurar .env.local com:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# GEMINI_API_KEY=
npm run dev
```
