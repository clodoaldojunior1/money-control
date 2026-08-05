# Arquitetura — money-control (Lash Studio)

PWA de gestão financeira e operacional para lash designers: faturamento
(entradas), gastos, materiais (estoque) e agenda de atendimentos.

Origem do desenho: protótipo Claude Design `Lash Studio App.dc.html`
(projeto "PWA para gestão financeira Lash"). O protótipo é a fonte da
verdade visual; o código o traduz para MUI.

---

## 1. Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | |
| UI | React 19 + MUI v9 (`@mui/material`, `@mui/icons-material`) | **não** usamos as classes CSS do protótipo |
| Estilo | Tema MUI centralizado (`src/theme/`) | sem CSS Modules, sem styled-components |
| Estado | React Context (`src/context/`) | sem Redux/Zustand |
| Fontes | `next/font/google` — Instrument Sans (títulos), Plus Jakarta Sans (corpo) | expostas como `--font-heading` / `--font-body` |
| Linguagem | JavaScript (`.jsx`/`.js`) | decisão explícita: **não** TypeScript, por produtividade |
| Gerenciador | **Yarn** | `yarn dev`, `yarn lint`, `yarn build` |

Tailwind está instalado como resíduo do `create-next-app` e **não é usado**.

---

## 2. Estrutura de pastas

```
src/
├── app/                      Next.js App Router
│   ├── layout.jsx            fontes + <Providers>, metadata, viewport
│   ├── page.jsx              "use client" → renderiza <AppShell />
│   └── providers.js          AppRouterCache > ColorMode > AppData
│
├── theme/                    Design system (fonte única de verdade visual)
│   ├── tokens.js             tokens light/dark: cores, rampas, sombras, raios
│   ├── theme.js              buildTheme(mode) → createTheme + styleOverrides
│   └── tagStyles.js          tagSx(kind, tokens) para variantes de Chip
│
├── context/                  Estado global
│   ├── ColorModeProvider.jsx tema claro/escuro + ThemeProvider + CssBaseline
│   └── AppDataProvider.jsx   TODO o estado de domínio e de UI do app
│
├── data/
│   └── seed.js               dados mockados + helpers (BRL, fmtDia, listas)
│
└── components/lash-studio/
    ├── AppShell.jsx          composition root: topbar, tabs, nav, FAB,
    │                         drawer, bottom sheet, snackbar
    ├── tabs/                 uma tela por aba (Home, Gastos, Agenda,
    │                         Entradas, Materiais)
    ├── sheets/               4 formulários em bottom sheet
    │                         (Gasto, Agenda, Entrada, Material)
    └── ui/                   primitivas reutilizáveis
                              (SegmentedControl, SelectableOption,
                               MoneyField, SheetFrame, HeaderIconButton)
```

---

## 3. Decisões de arquitetura

### 3.1 Design system no tema, não em CSS solto

Cores, tipografia, raios e sombras vivem em `src/theme/tokens.js`. O
`buildTheme(mode)` em `theme.js` mapeia isso para `palette` / `typography` /
`shape` e reestiliza os componentes MUI via `components.*.styleOverrides`
(Button, Paper, Chip, OutlinedInput, ToggleButton, Fab, BottomNavigation…).

Os tokens crus também ficam acessíveis em `theme.custom.tokens` para casos que
o `palette` não cobre (rampas tonais, sombras nomeadas):

```jsx
const { custom } = useTheme();
const t = custom.tokens;   // t.accent, t.accent2Ramp[700], t.shadow.md…
```

**Regra:** cor nova → adicionar em `tokens.js`. Nunca hex solto no componente.

### 3.2 Navegação por estado, não por rota

O app inteiro é **uma única rota** (`/`). As 5 abas trocam via `tab` no
`AppDataProvider`. Isso mantém drawer, FAB, bottom sheet e snackbar com estado
compartilhado e transições instantâneas — como no protótipo.

Consequência aceita: as abas não são deep-linkáveis. Se isso passar a importar
(compartilhar link, botão voltar do Android), migrar para rotas reais exige
subir o shell para um `layout.jsx`.

### 3.3 Um provider para todo o domínio

`AppDataProvider` concentra estado de domínio **e** de UI, expostos por
`useAppData()`:

- **Domínio:** `items` (ledger unificado: entradas `kind:"in"` + gastos
  `kind:"out"`), `materiais`, `agenda`
- **Derivados (`useMemo`):** `entradas`, `ledgerOut` (gastos + materiais
  projetados como gasto), `totals` (faturamento, trabalho, pessoal, materiais)
- **UI:** `tab`, `sheet`, `drawerOpen`, `filtro`, `snack`
- **Formulários:** `form`/`aform`/`eform`/`mform` + `set*FormField` +
  flags `*Touched` e `*Edit`
- **Ações:** `open*` / `save*` / `remove*` por entidade, cada uma com validação
  e toast com desfazer

**Materiais entram automaticamente em Gastos** (via `ledgerOut`), como
Trabalho › Variável. Não existe registro duplicado — é projeção derivada.

### 3.4 Desfazer (undo)

Toda ação destrutiva/criadora chama `toast(texto, undo)`. O `undo` é um closure
que restaura o estado anterior (reinserindo no índice original em exclusões).
Timer de 4,2s limpo no `closeSheet` e nas trocas.

---

## 4. Convenções obrigatórias

### 4.1 MUI v9 — só `sx`

**MUI v9 removeu as system props de `Stack`/`Box`.** `alignItems="center"`,
`justifyContent`, `p`, `gap` etc. como props soltas vazam para o DOM e geram
erro no console.

```jsx
// ❌ errado (MUI v9)
<Stack direction="row" alignItems="center" spacing={1}>

// ✅ certo
<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
```

`direction` e `spacing` continuam sendo props válidas de `Stack`.

### 4.2 `Card` com `gap` precisa de `display: "flex"`

`Card` é `block` por padrão; `gap` só funciona com flex/grid explícito.

### 4.3 Comparadores de `sort` devem ser ordem total

Comparador não-transitivo ordena diferente no Node (SSR) e no Chrome
(cliente) → **erro de hidratação**. Sempre comparar `a` *com* `b` e retornar
`0` em empate real. Já nos custou um bug em `HomeTab`.

### 4.4 Formatação de moeda

Sempre `money(n)` do `useAppData()` (ou `BRL` de `data/seed.js`). Nunca
`toLocaleString` inline — locale divergente entre servidor e cliente também
quebra hidratação.

---

## 5. Dados (estado atual)

**Tudo é mockado e em memória.** Nada persiste entre recarregamentos.

- `data/seed.js` gera 42 entradas, 3 gastos, 4 materiais, 5 agendamentos
- "Hoje" é fixo: `HOJE_ISO = "2026-08-01"` — datas são estáticas de propósito,
  para o protótipo ser determinístico
- Listas de domínio (`SERVICES`, `DURATIONS`, `STATUSES`, `METHODS`, `UNITS`)
  também vivem aí e alimentam os selects/segmented controls

---

## 6. Planejamento futuro

### 6.1 Próximo passo definido — backend próprio

Backend **NestJS** desenhado sob medida para este frontend. Ordem sugerida:

1. **Contratos primeiro.** Extrair os tipos de `data/seed.js` para um contrato
   compartilhado (entrada, gasto, material, agendamento). O formato atual do
   `items`/`materiais`/`agenda` já é o modelo — mantê-lo como base do schema.
2. **Camada de acesso.** Introduzir `src/services/` (fetch/axios — `axios` já
   está no `package.json`) e fazer o `AppDataProvider` consumir dela em vez do
   seed. A API pública do `useAppData()` **não deve mudar** — os componentes não
   devem saber se o dado veio de mock ou de rede.
3. **Estados de rede.** Loading/erro/otimista. O padrão de undo atual já é
   otimista por natureza; ao ligar na API ele vira "otimista + rollback".
4. **Datas reais.** Trocar `HOJE_ISO` fixo por data corrente — atenção: isso
   reintroduz risco de hidratação, então a data deve vir do servidor ou ser
   resolvida após a montagem.

### 6.2 Módulos marcados "Em breve" no drawer

Já existem como itens desabilitados em `AppShell.jsx` (`MENU_ITEMS`), aguardando
implementação: **Clientes**, **Relatórios**, **Configurações**.

### 6.3 Itens em aberto (não decididos)

- **Persistência local** — `localStorage` foi considerado e adiado; faz sentido
  como camada offline depois que a API existir
- **Autenticação** — o drawer já tem perfil e "Sair" mockados
- **PWA de fato** — manifest, service worker, instalação. Hoje é "mobile-first",
  não instalável
- **React Hook Form** — previsto no desenho original; os formulários hoje são
  controlados à mão no provider. Migrar só se a complexidade de validação
  justificar
- **Rotas reais por aba** — ver 3.2
- **Testes** — não há nenhum ainda

---

## 7. Rodando e verificando

```bash
yarn dev
```

O preview do Claude Code está configurado em `.claude/launch.json` (anexa em
`http://localhost:3000`, não sobe processo novo).

Antes de considerar uma mudança pronta:

```bash
yarn lint
```

E validar no navegador em viewport mobile: trocar as 5 abas, alternar tema
(topbar e drawer), abrir o FAB em cada aba, salvar/editar/excluir com desfazer,
e conferir o console sem erros de hidratação.
