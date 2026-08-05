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
| Formulários | React Hook Form | validação com regras nativas, sem zod/yup |
| Cache de servidor | **SWR** | decidido, entra junto com o backend — ver 6.2 |
| Fontes | `next/font/google` — Instrument Sans (títulos), Plus Jakarta Sans (corpo) | expostas como `--font-heading` / `--font-body` |
| Linguagem | JavaScript (`.jsx`/`.js`) | decisão explícita: **não** TypeScript, por produtividade. O pacote `typescript` está em devDependencies apenas porque `eslint-config-next` exige — não escrevemos `.ts` |
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
        │                     (SegmentedControl, SelectableOption,
        │                      MoneyField, SheetFrame, HeaderIconButton)
        └── form/             as mesmas primitivas ligadas ao React Hook
                              Form via Controller (FormTextField,
                              FormSelectField, FormSegmented,
                              FormMoneyField, FormOptionGroup)
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
- **Edição:** `editing` — o registro aberto no sheet (ou `null` para criação) —
  e `isEdit`. Como só um sheet abre por vez, um único `editing` cobre as
  4 entidades
- **Ações:** `open*` / `save*` / `remove*` por entidade, com toast e desfazer.
  Os `save*` **recebem os valores do formulário** como argumento; o provider
  não guarda estado de formulário (ver 3.5)

**Materiais entram automaticamente em Gastos** (via `ledgerOut`), como
Trabalho › Variável. Não existe registro duplicado — é projeção derivada.

### 3.4 Formulários com React Hook Form

O estado de cada formulário vive **no próprio sheet**, via `useForm` — não no
provider. A divisão de responsabilidade é:

- **Provider:** *o que* está sendo editado (`editing`) e o que fazer ao salvar
  (`saveGasto(values)`)
- **Sheet:** *como* o formulário se comporta — valores, validação, erros

Cada sheet tem um `toDefaults(registro)` no topo do arquivo, que traduz a
entidade do domínio para os `defaultValues` do formulário. Os sheets são
desmontados quando fecham (renderização condicional dentro do `Drawer`), então
cada abertura remonta com defaults novos — não é preciso `reset()` manual.

Os componentes MUI se ligam ao RHF pelos wrappers em `ui/form/`, que encapsulam
o `Controller`. Preferimos `Controller` a `register` porque os componentes MUI
(e os nossos, como `MoneyField`) são controlados e não expõem a ref do input
do jeito que o `register` espera.

```jsx
const { control, handleSubmit } = useForm({ defaultValues: toDefaults(editing) });
…
<FormTextField control={control} name="client" label="Cliente"
  rules={{ validate: (v) => v.trim().length > 0 || "Informe a cliente." }} />
…
<Button onClick={handleSubmit(saveEntrada)}>Salvar entrada</Button>
```

Validação com **regras nativas do RHF** — sem zod/yup. As regras aqui são
simples (obrigatório, maior que zero); um resolver de schema só se justifica se
a validação passar a depender de relações entre campos ou de regras de negócio.

### 3.5 Desfazer (undo)

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

### 4.4 Use `useWatch`, não `watch`

O React Compiler (ativo no Next 16) **pula a memoização** de qualquer componente
que use o `watch()` devolvido por `useForm` — o lint acusa
`react-hooks/incompatible-library`. Para observar campos, use o hook dedicado:

```jsx
// ❌ desabilita a memoização do componente inteiro
const tipo = watch("tipo");

// ✅
const tipo = useWatch({ control, name: "tipo" });
const [cost, qty] = useWatch({ control, name: ["cost", "qty"] });
```

### 4.5 Formatação de moeda

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

**Decidido (2026-08-04): API NestJS separada, não Next fullstack.**

O motivo é escopo, não preferência técnica: a API precisa servir **mais de um
cliente**. O cenário previsto é um **app mobile nativo** consumindo a mesma API
que este PWA. Uma API independente é reaproveitável; lógica de negócio dentro
do Next não é.

Consequências que decorrem dessa escolha:

- **Server Actions estão fora** (ver 6.5). As mutações vão do navegador direto
  para o NestJS.
- **Contrato vira produto.** Como a API terá mais de um consumidor, o passo 1
  abaixo deixa de ser burocracia: versionamento e compatibilidade passam a
  importar de verdade.
- **Custo aceito:** dois projetos para manter e deployar.

> **Decidido: o cache de servidor será SWR.** A partir do momento em que a API
> existir, os dados de domínio (`items`, `materiais`, `agenda`) deixam de ser
> `useState` com seed e passam a ser servidos por SWR. Não é proposta em
> aberto — é a escolha do projeto. Ver 6.2.

Ordem sugerida:

1. **Contratos primeiro.** Extrair os tipos de `data/seed.js` para um contrato
   compartilhado (entrada, gasto, material, agendamento). O formato atual do
   `items`/`materiais`/`agenda` já é o modelo — mantê-lo como base do schema.
2. **Camada de acesso.** Introduzir `src/services/` e fazer o
   `AppDataProvider` consumir dela em vez do seed. A API pública do
   `useAppData()` **não deve mudar** — os componentes não devem saber se o dado
   veio de mock ou de rede.
3. **Estados de rede.** Loading/erro/otimista, via SWR (ver 6.2).
4. **Datas reais.** Trocar `HOJE_ISO` fixo por data corrente — atenção: isso
   reintroduz risco de hidratação, então a data deve vir do servidor ou ser
   resolvida após a montagem.

### 6.2 SWR — o cache de servidor (decidido, aguardando a API)

**Regra:** dado que vem do servidor é do SWR; dado que o usuário está digitando
é do React Hook Form (ver 3.4). As duas bibliotecas são complementares e não se
substituem — SWR nunca vê o formulário antes do submit.

Por que SWR, e não `useState` + axios cru:

- **Re-render por chave.** Hoje qualquer mudança em `items` re-renderiza todos
  os consumidores do contexto. Com SWR cada componente assina só as chaves que
  usa — a `MateriaisTab` para de re-renderizar quando uma entrada muda.
- **Otimista + rollback nativo.** O padrão de undo que já temos (3.5) é
  otimista feito à mão: ele cobre "o usuário se arrependeu", mas não "a API
  recusou". O `mutate` cobre os dois:

  ```js
  mutate("/gastos", api.remove(id), {
    optimisticData: lista.filter((i) => i.id !== id),
    rollbackOnError: true,
  });
  ```

- **Loading/erro/revalidação** prontos, em vez de reimplementados por entidade.

Notas de adoção:

- O `axios@^1.18.0` está no `package.json` desde o início e **não é importado
  em lugar nenhum**. Ao criar `src/services/`, decidir entre usá-lo de fato
  como `fetcher` do SWR ou removê-lo em favor de `fetch`.
- TanStack Query foi considerado como alternativa: mais robusto em mutations e
  com devtools, ao custo de mais peso. **Ficamos com SWR** pela simplicidade e
  por ser da própria Vercel, alinhado ao Next.

### 6.3 Módulos marcados "Em breve" no drawer

Já existem como itens desabilitados em `AppShell.jsx` (`MENU_ITEMS`), aguardando
implementação: **Clientes**, **Relatórios**, **Configurações**.

### 6.4 Itens em aberto (não decididos)

- **Persistência local** — `localStorage` foi considerado e adiado; faz sentido
  como camada offline depois que a API existir
- **Autenticação** — o drawer já tem perfil e "Sair" mockados
- **PWA de fato** — manifest, service worker, instalação. Hoje é "mobile-first",
  não instalável
- **Resolver de schema (zod/yup)** — hoje a validação usa regras nativas do
  RHF; só vale trazer um resolver se surgirem regras entre campos
- **Rotas reais por aba** — ver 3.2
- **Testes** — não há nenhum ainda

### 6.5 Alternativas avaliadas e recusadas

Registradas com o motivo e com **o sinal que deveria fazer reconsiderar** — para
a discussão não voltar daqui a meses sem o contexto.

#### Next fullstack + Server Actions (recusado em 2026-08-04)

**A proposta:** dispensar o NestJS e fazer o Next ser o backend — Route
Handlers e Server Actions falando direto com o banco via ORM. Formulários
enviariam por `action`, com `useActionState` cobrindo pending/erro.

**Por que foi recusado:** a API precisa servir um app mobile nativo no futuro
(6.1). Server Actions rodam no servidor do Next; com um NestJS atrás, elas
viram um proxy — `navegador → Next → NestJS → banco` — que adiciona um salto de
rede e uma camada de código sem entregar nada em troca.

**Vale registrar que os ganhos citados também não se aplicam a este app:**

- *Progressive enhancement* — os formulários vivem em bottom sheets abertos por
  um FAB, controlados por estado React. Sem JS não existe sheet. Um formulário
  que funciona sem JS dentro de um contêiner que exige JS é ganho zero.
- *`revalidatePath` / RSC streaming* — pressupõem navegação e conteúdo
  renderizado no servidor. Aqui é rota única, tudo `"use client"` (3.2).
- *Round-trip + revalidate* — vai contra o padrão otimista com desfazer que já
  é a espinha da UX (3.5).
- *Offline* — Server Action exige rede sempre. PWA offline está no roadmap, e
  para uso em studio com sinal ruim isso é requisito de produto, não detalhe.

**O que faria reconsiderar:** se o app mobile for descartado e a API passar a
servir só este frontend. Aí o Next fullstack entrega o mesmo produto com
aproximadamente metade da superfície de manutenção, e Server Actions passam a
ser a escolha natural.

**Nota:** RHF e Server Actions coexistem bem (`handleSubmit` chama a action),
então essa decisão não bloqueia nem obriga nada no lado de formulários.

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
