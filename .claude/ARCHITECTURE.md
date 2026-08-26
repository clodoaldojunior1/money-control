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
| Backend | **Next fullstack** — Server Components leem, Server Actions escrevem | ver 6.1 |
| Banco | **Postgres na Neon** via Prisma | pronto e povoado; o app ainda não o usa — ver 5.0 |
| Autenticação | **Auth.js v5** (e-mail e senha) | pendente, etapa 4 |
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
│   ├── providers.js          AppRouterCache > ColorMode (global)
│   ├── page.jsx              / → <Landing />
│   ├── login/page.jsx        /login
│   ├── cadastro/page.jsx     /cadastro
│   └── app/
│       ├── layout.jsx        envolve só o PWA com <AppDataProvider>
│       └── page.jsx          /app → <AppShell />
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
├── lib/
│   ├── periodo.js            datas e períodos (Intl pt-BR, sem armadilha UTC)
│   ├── useHoje.js            data do cliente sem quebrar hidratação
│   └── armazenamento.js      único ponto que fala com localStorage
│
├── data/
│   └── seed.js               gerarSeed(hoje) + BRL + listas de domínio
│
├── components/onboarding/    telas públicas
│   ├── PublicShell.jsx       moldura centralizada (mesma largura do app)
│   ├── Landing.jsx           hero, features, depoimento, planos, CTA
│   ├── Login.jsx             / Register.jsx — formulários em RHF
│   ├── AuthHeader.jsx        voltar + atalho para a outra tela
│   ├── BrandMark.jsx         quadrado com a inicial da marca
│   └── PasswordStrength.jsx  medidor de força (+ forcaDaSenha)
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
Não há **nenhum** literal de cor fora de `tokens.js` — vale manter assim:

```bash
grep -rE '#[0-9a-fA-F]{3,8}\b|rgba?\([0-9]' src --include=*.jsx --include=*.js \
  | grep -v 'src/theme/tokens.js'   # deve sair vazio
```

Além das rampas, existem tokens **semânticos** para casos em que o par
fundo/texto precisa virar junto entre os temas:

| Token | Para quê |
|---|---|
| `warning` | Âmbar do medidor de força de senha |
| `inverseSurface` / `onInverseSurface` | Snackbar: superfície oposta à da página |
| `deepSurface` / `onDeepSurface` | Cartão azul-profundo (depoimento da landing) |

Os dois últimos existem justamente porque as rampas invertem (4.5): usar
`neutral[800]` como fundo do snackbar funciona, mas o texto precisava virar
junto — antes era `#f5f8fa` fixo e ficava branco sobre cinza claro no dark.

### Transparências: `alpha()`, nunca sufixo hex

Compor opacidade concatenando na string (`` `${t.accent}1f` ``) é opaco e
espalhou nove alfas diferentes pelo código para três intenções. Use o
`alpha()` do MUI com a escala nomeada `alphas` de `tokens.js`:

```jsx
import { alpha } from "@mui/material/styles";
import { alphas } from "../../theme/tokens";

backgroundColor: alpha(t.accent, alphas.tint)
```

`wash` (0.10) seleção · `tint` (0.15) ícone · `tintStrong` (0.22) avatar ·
`border` (0.40) ação destrutiva · `veil` (0.88) barra translúcida.

### 3.2 Rotas públicas reais; abas do app por estado

Duas camadas diferentes, cada uma com o modelo que faz sentido:

| Rota | Conteúdo | Provider |
|---|---|---|
| `/` | Landing | só tema |
| `/login` | Entrar | só tema |
| `/cadastro` | Criar conta | só tema |
| `/app` | O PWA (5 abas) | tema + `AppDataProvider` |

**As telas públicas são rotas de verdade** — landing precisa de URL para ser
compartilhada e indexada, e login/cadastro precisam de endereço próprio.

**Dentro de `/app`, as 5 abas continuam trocando por estado** (`tab` no
`AppDataProvider`), o que mantém drawer, FAB, bottom sheet e snackbar
compartilhando estado e trocando instantaneamente.

Consequência aceita: as abas não são deep-linkáveis. Se isso passar a importar
(compartilhar link de uma aba, botão voltar do Android), o caminho é
transformá-las em segmentos sob `/app` e subir o shell para o
`src/app/app/layout.jsx`, que já existe.

O `AppDataProvider` vive nesse layout e **não** no root — as telas públicas não
carregam o estado de domínio.

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

### 3.6 O FAB é fixo e contextual

O botão (+) fica **fixo na viewport**, nunca rola com o conteúdo. Como o app
é centralizado com largura máxima, ele não pode ser um `position: fixed` solto:
mora num wrapper fixo que repete a largura do container
(`LARGURA_APP`, exportada do `AppShell`), com `pointerEvents: "none"` para não
bloquear cliques — só o botão recebe eventos. A bottom nav e o snackbar seguem
o mesmo padrão.

A ação muda conforme a aba, definida em `SHEET_POR_ABA` no `AppDataProvider`:

| Aba | Abre |
|---|---|
| Início | **Entrada** — a ação mais frequente de quem acabou de atender |
| Entradas | Entrada |
| Gastos | Gasto |
| Materiais | Material |
| Agenda | Agendamento |

O rótulo do FAB (`FAB_LABEL` no `AppShell`) é chaveado **pelo tipo de sheet**,
não pela aba, justamente para não divergir desse mapa.

### 3.7 Período: a unidade de escopo do app

Quase tudo no app é **do mês**: faturamento, gastos, materiais comprados. O
`periodo` (`"2026-08"`) vive no `AppDataProvider` e recorta `entradas`,
`ledgerOut` e `totals`. A Agenda é a exceção — ela é do **dia**.

O `PeriodNavigator` (‹ Agosto ›) aparece nas quatro abas de escopo mensal e
some da Agenda.

**A data do cliente não pode ser lida durante o render.** As rotas são
pré-renderizadas no build; `new Date()` no render gravaria a data do *build* no
HTML e divergiria do cliente. A solução é o hook `useHoje` em
`src/lib/useHoje.js`, que usa `useSyncExternalStore` com um snapshot de
servidor diferente do de cliente — a forma suportada pelo React de dizer "este
valor só existe no cliente", sem erro de hidratação.

Daí decorre a ordem de montagem:

```
app/app/layout.jsx     resolve `hoje` com useHoje()
  └─ hoje === null  →  <AppBootSkeleton />   (é o que vai no HTML estático)
  └─ hoje definido  →  <AppDataProvider hoje={hoje}>
```

O provider **só monta com a data já conhecida**, então ele semeia tudo nos
inicializadores de `useState` — sem efeito, sem estado nulo, sem flag de
"pronto" espalhada pelos componentes.

> Tentar resolver a data num `useEffect` + `setState` não funciona: o lint do
> React Compiler barra (`react-hooks/set-state-in-effect`), e com razão — gera
> renders em cascata.

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

### 4.5 As rampas tonais invertem no tema escuro

`accentRamp`, `accent2Ramp` e `neutral` vão de claro (100) a escuro (900) no
tema claro e **na direção oposta** no escuro. Isso é proposital: um par
`background: ramp[100] / color: ramp[800]` continua legível nos dois temas,
porque os dois lados viram junto.

A armadilha é usar **um lado da rampa com o outro fixo**:

```jsx
// ❌ no dark, accent2Ramp[800] é quase branco → texto branco em fundo branco
sx={{ backgroundColor: t.accent2Ramp[800], color: "#eef4f9" }}

// ✅ escolha o passo conforme o modo
const azulProfundo = palette.mode === "dark" ? t.accent2Ramp[200] : t.accent2Ramp[800];
```

Já nos mordeu no card de depoimento da landing. Ao fixar uma cor literal de um
lado, teste os dois temas.

### 4.6 Datas: nunca `new Date("2026-08-01")`

A string ISO só com data é interpretada como **UTC**. No fuso do Brasil isso
volta um dia: `new Date("2026-08-01")` vira 31/07 às 21h local, e o dia sai
errado em toda a UI.

Use os helpers de `src/lib/periodo.js`, que partem a string na mão e remontam
com `new Date(ano, mes, dia)` — construtor local:

```js
import { dataDeISO, diaCurto, periodoDe } from "../lib/periodo";
```

Rótulos de data saem de `Intl.DateTimeFormat("pt-BR", …)` pelo mesmo motivo da
moeda (4.7): formatar à mão diverge entre ambientes.

### 4.7 Formatação de moeda

Sempre `money(n)` do `useAppData()` (ou `BRL` de `data/seed.js`). Nunca
`toLocaleString` inline — locale divergente entre servidor e cliente também
quebra hidratação.

---

## 5. Dados (estado atual)

> **Em migração.** O banco Postgres já existe e está povoado (5.0), mas **o app
> ainda não o usa** — continua lendo e gravando em `localStorage`. A ligação
> acontece nas etapas 2 e 3 de 6.1. Enquanto isso, 5.1 descreve o que roda
> hoje, e vai ser removido quando o servidor virar a fonte da verdade.

### 5.0 O banco (Neon + Prisma) — pronto, ainda desligado do app

Postgres gerenciado na Neon, projeto **"Studio de Controle"** (`us-east-2`,
PG 18). Quatro tabelas de domínio (`Entrada`, `Gasto`, `Material`,
`Agendamento`) mais `User`, todas com `userId` e índice `[userId, data]`.

`prisma/schema.prisma` carrega os porquês no topo — vale ler antes de mexer:
`Decimal(10,2)` para dinheiro, `@db.Date` sem hora, campo derivado não vira
coluna, e as duas mudanças do Prisma 7 que ditaram o caminho (generator legado
`prisma-client-js`, porque o novo emite TypeScript; e o driver adapter do Neon,
porque o client não conecta mais pela URL).

`prisma/seed.mjs` é autocontido e idempotente. Comandos: `db:migrate`,
`db:seed`, `db:studio`, `db:generate`. Variáveis em `.env.example` — os valores
reais ficam em `.env.local`, fora do git.

**Detalhe que a etapa 2 precisa tratar:** `Decimal` do Prisma não é
serializável como prop de Server Component, e `Date` não é o formato que a UI
fala. A conversão (`Decimal → Number`, `Date → "YYYY-MM-DD"`) acontece na
borda da camada de leitura, para nenhum componente mudar.

### 5.1 Persistência local (a ser removida na etapa 2)

`src/lib/armazenamento.js` é o **único ponto do app que fala com
`localStorage`** — proposital, porque esta camada sempre foi intermediária:
quando o servidor virar a fonte da verdade, ela sai inteira, sem tocar no
resto.

- Chave `lash-studio:dados`, valor `{ versao, salvoEm, items, materiais, agenda }`.
- **Versão diferente descarta e re-semeia.** Suba `VERSAO` sempre que o formato
  mudar — e ele vai mudar, já que `items` mistura entradas e gastos e deve
  virar duas coleções. Descartar é preferível a quebrar o app de quem já tem
  dados salvos.
- `lerDados()` devolve `null` só quando não há nada aproveitável. Um conjunto
  **vazio é um estado legítimo** (a usuária apagou tudo) e é respeitado — o
  seed não pode ressuscitar por cima.
- Nada lança: aba privada e cota estourada dão exceção, e o app precisa seguir
  funcionando em memória. Se a primeira gravação falhar, `podeSalvar` fica
  `false` e o `AppShell` mostra um aviso **fixo** — não um toast, porque a
  condição não passa enquanto a aba estiver aberta, e some-la esconderia perda
  de dados.

Isto só é simples por causa de 3.7: o provider já monta depois de a data ser
resolvida no cliente, então ler `localStorage` no inicializador de `useState` é
seguro. Sem aquilo, persistência traria de volta o risco de hidratação.

O drawer tem **"Restaurar dados de exemplo"**, que reusa o snackbar com
Desfazer — sem diálogo de confirmação, consistente com o resto do app.

### 5.2 O seed

- `gerarSeed(hoje)` produz os dados **relativos ao dia corrente** — preenchendo
  o mês atual e o anterior. Sem os dois, a comparação entre meses e a navegação
  de período não teriam o que mostrar, e o app pareceria vazio em qualquer data
  real. É determinístico: o mesmo `hoje` gera sempre o mesmo conjunto
- Listas de domínio (`SERVICES`, `DURATIONS`, `STATUSES`, `METHODS`, `UNITS`)
  também vivem aí e alimentam os selects/segmented controls

O faturamento do mês anterior é **calculado** a partir dos dados, e não uma
constante — o `MES_ANTERIOR = 7420` que existia era um número inventado. Sem
mês anterior, a Home mostra "primeiro mês com registros" em vez de dividir por
zero.

---

## 6. Planejamento futuro

### 6.1 Backend: Next fullstack (decidido em 2026-08-26)

> **Esta decisão substitui a anterior.** Até 2026-08-04 o plano era uma **API
> NestJS separada**, justificada por um app mobile nativo que consumiria a
> mesma API. O app mobile deixou de ser certo — e isso é exatamente o gatilho
> que estava registrado em 6.5. A alternativa recusada virou a escolha.

**Arquitetura:** Next fullstack. Server Components leem, **Server Actions**
escrevem, Postgres na Neon via Prisma, Auth.js v5 para login.

**Não é irreversível.** Se o app nativo voltar à mesa, Route Handlers expõem a
mesma lógica como API — menos elegante que um NestJS desenhado para isso, mas
viável.

**Consequências:**

- **SWR sai de cena** (6.2). Foi escolhido para conversar com uma API externa;
  com Server Components lendo e `revalidatePath` invalidando, fica sem função.
- **`localStorage` sai** (5.1). O servidor vira a fonte da verdade, e dois
  donos do mesmo dado dariam divergência.
- **`items` foi separado** em `Entrada` e `Gasto` no schema — a pendência de
  modelagem que o mock escondia está resolvida.

#### Etapas

| | | |
|---|---|---|
| 0 | Datas reais e noção de período (3.7) | ✅ feito |
| 1 | Banco, schema e seed (5.0) | ✅ feito |
| 2 | App **lê** do servidor | pendente |
| 3 | App **grava** por Server Actions | pendente |
| 4 | Auth.js v5 (e-mail e senha) | pendente |
| 5 | Deploy na Vercel | pendente |

**Etapa 2 — leitura.** O provider hoje vive no *layout* de `/app`, que é
client e fica **acima** da página: dado buscado na página não sobe até ele. A
reestruturação é `layout` → Server Component (vira a guarda de sessão na etapa
4), `page` → Server Component que busca e passa `dadosIniciais`, e um
`AppRoot` client novo com `useHoje` + skeleton + provider. A conversão de tipos
acontece na borda (ver 5.0), então **nenhum componente de UI muda**.

**Etapa 3 — escrita.** `src/actions/*.js` com `"use server"`, cada ação
passando por `requireUser()` e terminando em `revalidatePath("/app")`. As 12
ações do provider viram `async`. Decisão deliberada: **esperar a resposta em
vez de atualização otimista** — são 100–200ms, imperceptíveis aqui, e evitam
reconciliar ids temporários. Desfazer chama a ação inversa preservando o `id`.

**Etapa 4 — auth.** Armadilha conhecida: o middleware roda no runtime edge,
onde bcrypt e Prisma não funcionam. A saída é a config dividida do Auth.js —
`auth.config.js` leve para o middleware, `auth.js` completo no runtime Node.
Sessão em JWT (obrigatório com Credentials), hash com `bcryptjs` (puro JS, sem
binário nativo para quebrar no deploy). `/cadastro` fica fechado: por ora a
conta é só do dono, criada pelo seed.

**Sobre o Auth da Neon.** A onboarding deles oferece Better Auth gerenciado.
Foi avaliado e recusado: amarra o login ao fornecedor. Usamos a Neon **apenas
como Postgres** — o `.neon` na raiz registra `features: ["database","auth"]`,
mas isso reflete a onboarding, não a decisão.

### 6.2 SWR — descartado antes de entrar

Estava decidido enquanto o backend seria uma API NestJS separada, e o
raciocínio continua válido *para aquele arranjo*: assinatura por chave,
otimista com rollback nativo, loading e erro prontos.

Com Next fullstack ele perde a função — Server Components leem no servidor e
`revalidatePath` invalida. **Não instalar.**

O que faria voltar: um cliente que busque dados pelo navegador em vez de
receber do servidor — por exemplo, se as abas virarem rotas com busca no
cliente, ou se o app nativo ressuscitar e houver uma API para consumir.

### 6.3 Módulos marcados "Em breve" no drawer

Já existem como itens desabilitados em `AppShell.jsx` (`MENU_ITEMS`), aguardando
implementação: **Clientes**, **Relatórios**, **Configurações**.

### 6.4 Itens em aberto (não decididos)

- **Autenticação de verdade** — as telas `/login` e `/cadastro` existem e
  validam os campos, mas **não autenticam**: qualquer formulário válido
  navega para `/app`. Não há sessão, guarda de rota nem proteção de `/app`.
  Entra junto com a API (6.1). O drawer também tem perfil e "Sair" mockados
- **Persistência do tema** — os dados já persistem (5.1), mas o modo
  claro/escuro não: ele vive só em estado React e volta ao claro a cada
  recarga. Ficou de fora de propósito, porque é mais caro que o resto — o tema
  afeta a **primeira pintura**, então sem um script bloqueante no `<head>` a
  página aparece clara e pisca para escura. As telas públicas também não têm
  controle para alterná-lo
- **PWA de fato** — manifest, service worker, instalação. Hoje é "mobile-first",
  não instalável
- **Resolver de schema (zod/yup)** — hoje a validação usa regras nativas do
  RHF; só vale trazer um resolver se surgirem regras entre campos
- **Rotas reais por aba** — ver 3.2
- **Testes** — não há nenhum ainda

### 6.5 Alternativas avaliadas e recusadas

Registradas com o motivo e com **o sinal que deveria fazer reconsiderar** — para
a discussão não voltar daqui a meses sem o contexto.

#### Next fullstack + Server Actions — recusado em 2026-08-04, **adotado em 2026-08-26**

> **Este é o registro do gatilho funcionando.** A recusa trazia escrito o sinal
> que a inverteria; o sinal apareceu, e a decisão virou. Fica aqui como
> histórico — a arquitetura vigente está em 6.1.

**Por que foi recusado na época:** a API precisaria servir um app mobile nativo.
Server Actions rodam no servidor do Next; com um NestJS atrás, virariam um
proxy — `navegador → Next → NestJS → banco` — um salto de rede a mais sem nada
em troca.

**O gatilho que estava registrado:** *"se o app mobile for descartado e a API
passar a servir só este frontend, o Next fullstack entrega o mesmo produto com
aproximadamente metade da superfície de manutenção."*

**O que aconteceu:** o app nativo deixou de ser certo, e a prioridade virou
publicar rápido. A recusa caiu junto com sua premissa.

**Três ressalvas da recusa continuam valendo,** e explicam escolhas de 6.1:

- *Progressive enhancement* segue sendo ganho zero — os formulários vivem em
  bottom sheets abertos por um FAB; sem JS não existe sheet.
- *Round-trip vs. otimista* — por isso a etapa 3 espera a resposta em vez de
  atualizar otimisticamente: é simples e 100–200ms não se notam aqui.
- *Offline* — Server Action exige rede. O item de PWA offline em 6.4 continua
  aberto e agora depende de service worker, não de `localStorage`.

**Nota:** RHF e Server Actions coexistem bem (`handleSubmit` chama a action),
então nada muda no lado de formulários.

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

### 7.1 Medindo a UI pelo DOM — armadilha de instrumento

Quando não há screenshot disponível e a verificação é feita por script no
navegador, o risco deixa de ser o código e passa a ser **a medição**.

**Regras:**

1. **`outerHTML`, `className` ou screenshot antes de `getComputedStyle`.** O
   estilo computado devolve valor defasado quando lido logo após um
   re-render — reflete o estado anterior. Ler o atributo `style` cru ou a
   classe gerada pelo emotion é confiável; o computado, não.
2. **Duas medições que se contradizem significam sonda quebrada, não código
   quebrado.** Se o resultado é logicamente impossível, a premissa (o
   instrumento) é que está errada.
3. **Valide a sonda contra um caso de resultado conhecido** antes de confiar
   nela. Um controle barato evita horas.
4. **Reescreveu o mesmo arquivo duas vezes pelo mesmo sintoma sem resolver?**
   A hipótese está errada. Pare — não tente a terceira variação.

**O caso que gerou estas regras.** O medidor de força de senha
(`PasswordStrength`) parecia não atualizar as barras: o rótulo dizia
"Senha forte." enquanto as três barras liam `divider` via `getComputedStyle`.

Isso é impossível — rótulo e barras derivam da **mesma variável, no mesmo
render**. A leitura correta dessa contradição seria "meu instrumento mente".
Em vez disso o componente foi reescrito três vezes, com teorias sucessivas
sobre o React Compiler memoizar array, closure e objeto `sx` — todas falsas.

Ao ler `outerHTML`, as barras estavam corretas desde o início. O componente
nunca teve bug; o `getComputedStyle` é que devolvia estado velho. Nada disso
sobreviveu no código — a versão final é a idiomática com `sx` —, mas o custo
foi real.
