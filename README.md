# money-control — Lash Studio

PWA de gestão financeira e operacional para **lash designers**: faturamento,
gastos, materiais em estoque e agenda de atendimentos, tudo recortado por mês.
Desenhado para o celular primeiro.

O app é de uma conta só, da dona do studio. Não há cadastro aberto.

---

## Como rodar

Precisa de **Node 20+**, **Yarn** e uma string de conexão Postgres (o projeto
usa [Neon](https://neon.tech), mas qualquer Postgres serve para desenvolver).

```bash
yarn install
```

Copie o template de variáveis e preencha:

```bash
cp .env.example .env.local
```

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres. No app, use a URL *pooled* |
| `AUTH_SECRET` | Assina a sessão. Gere com `npx auth secret` |
| `SEED_EMAIL` / `SEED_SENHA` | Conta criada pelo seed. Só o seed usa |

`.env.local` fica fora do git. Nunca comite valores reais.

Crie as tabelas, popule com dados de exemplo e suba o servidor:

```bash
yarn db:migrate && yarn db:seed && yarn dev
```

Abra <http://localhost:3000>. Entre em `/login` com `SEED_EMAIL` e
`SEED_SENHA`.

---

## Comandos

| Comando | O que faz |
|---|---|
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` | Aplica migrações pendentes e compila |
| `yarn lint` | ESLint — roda antes de considerar qualquer coisa pronta |
| `yarn db:migrate` | Aplica migrações (Prisma) |
| `yarn db:seed` | Recria a conta e os dados de exemplo. Idempotente |
| `yarn db:studio` | Prisma Studio, para olhar as tabelas |
| `yarn db:generate` | Regenera o client do Prisma |

> **Yarn, não npm.** Existe um único `yarn.lock`, e misturar gerenciadores
> reintroduz divergência de versão sem avisar.

---

## Como está montado

Next.js fullstack: **Server Components leem**, **Server Actions escrevem**,
Postgres via Prisma, Auth.js v5 no login. Não há API separada nem cliente de
dados no navegador.

```
requisição → proxy.js (sessão?) → page.jsx (Server, busca no banco)
                                     → AppRoot (Client, resolve "hoje")
                                        → AppDataProvider → telas
```

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + MUI v9, tema centralizado em `src/theme/` |
| Formulários | React Hook Form |
| Banco | Postgres (Neon) via Prisma 7 |
| Sessão | Auth.js v5, credenciais, JWT, hash `bcryptjs` |
| Linguagem | JavaScript — **não** TypeScript, por decisão |

Quatro rotas: `/` (landing), `/login`, `/cadastro` e `/app`. Dentro de `/app`
as cinco abas trocam por estado, não por navegação.

```
src/
├── app/          rotas (App Router)
├── auth.js       Auth.js completo (credenciais + banco)
├── auth.config.js  a metade leve, que o proxy consegue carregar
├── proxy.js      guarda de rota
├── server/       leitura, escrita e o usuário da sessão — só no servidor
├── actions/      Server Actions ("use server")
├── context/      AppDataProvider — estado de UI e derivados
├── theme/        design system: tokens, tema, variantes
├── lib/          períodos e datas, cliente Prisma
├── data/         listas de domínio
└── components/   onboarding/ (telas públicas) e lash-studio/ (o app)
```

---

## Onde está o resto

Este README diz **o que é** e **como rodar**. O *porquê* de cada decisão está
em outro lugar, e vale ler antes de mexer na estrutura:

- **[`.claude/ARCHITECTURE.md`](.claude/ARCHITECTURE.md)** — arquitetura
  completa: decisões e seus motivos, convenções obrigatórias, o modelo de
  dados, o roadmap e as alternativas que foram recusadas (com o gatilho que
  faria cada uma voltar à mesa).
- **[`CLAUDE.md`](CLAUDE.md)** — o resumo operacional, incluindo as armadilhas
  que já custaram tempo neste projeto. Escrito para agentes, útil para gente.
- **[`prisma/schema.prisma`](prisma/schema.prisma)** — o modelo de dados, com
  os porquês no cabeçalho.

---

## Estado

| | Etapa | |
|---|---|---|
| 0 | Datas reais e noção de período | ✅ |
| 1 | Banco, schema e seed | ✅ |
| 2 | App lê do servidor | ✅ |
| 3 | App grava por Server Actions | ✅ |
| 4 | Autenticação (Auth.js v5) | ✅ |
| 5 | Deploy na Vercel | ✅ |

O que ficou conscientemente de fora — "manter conectada", recuperação de
senha, login com Google, persistência do tema, PWA instalável — está listado
com os motivos em **6.4** do ARCHITECTURE.
