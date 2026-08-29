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
│       ├── layout.jsx        Server Component; guarda de sessão na etapa 4
│       └── page.jsx          /app → busca no banco → <AppRoot dadosIniciais>
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
│   └── prisma.js             instância única do client (driver adapter Neon)
│
├── server/                   só roda no servidor
│   ├── usuario.js            o dono dos dados (vira requireUser na etapa 4)
│   ├── leitura.js            Prisma → formato da UI (borda de conversão)
│   ├── escrita.js            formulário → banco: validação e conversão
│   └── exemplo.js            gerador dos dados de exemplo (seed + restaurar)
│
├── actions/                  Server Actions ("use server")
│   ├── entradas.js           criar / atualizar / excluir, por entidade
│   ├── gastos.js             (as três regras comuns estão comentadas aqui)
│   ├── materiais.js
│   ├── agenda.js
│   └── conta.js              restaurar exemplo e o desfazer dele
│
├── data/
│   └── dominio.js            BRL + listas de domínio + CAT_POR_SUB
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
    ├── AppRoot.jsx           fronteira servidor→app: espera `hoje`, mostra o
    │                         skeleton e monta o <AppDataProvider>
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

O `AppDataProvider` vive dentro de `/app` (no `AppRoot`, ver 5.2) e **não** no
root — as telas públicas não carregam o estado de domínio.

### 3.3 Um provider para todo o domínio

`AppDataProvider` concentra estado de domínio **e** de UI, expostos por
`useAppData()`:

- **Domínio:** `items` (ledger unificado: entradas `kind:"in"` + gastos
  `kind:"out"`), `materiais`, `agendamentos` — tudo vindo do servidor por
  `dadosIniciais` (5.1)
- **Derivados (`useMemo`):** `entradas`, `ledgerOut` (gastos + materiais
  projetados como gasto), `totals` (faturamento, trabalho, pessoal, materiais)
  e `agenda` — os agendamentos de `hoje`, porque a agenda é do dia e não do
  período
- **UI:** `tab`, `sheet`, `drawerOpen`, `filtro`, `snack`
- **Edição:** `editing` — o registro aberto no sheet (ou `null` para criação) —
  e `isEdit`. Como só um sheet abre por vez, um único `editing` cobre as
  4 entidades
- **Ações:** `open*` / `save*` / `remove*` por entidade, com toast e desfazer.
  Os `save*` **recebem os valores do formulário** como argumento; o provider
  não guarda estado de formulário (ver 3.5). Desde a etapa 3 elas chamam
  Server Actions e expõem `salvando` (5.4, 5.5)

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

**A mesma armadilha ao contrário, vindo do banco.** Prisma devolve colunas
`@db.Date` como meia-noite **UTC**, e aí quem erra é o construtor local: ler
com `isoDeData` (getters locais) devolve o dia anterior. Datas do banco passam
por `isoDeDataUTC`, e essa conversão mora numa só borda — `src/server/leitura.js`
(5.1).

### 4.7 Formatação de moeda

Sempre `money(n)` do `useAppData()` (ou `BRL` de `data/dominio.js`). Nunca
`toLocaleString` inline — locale divergente entre servidor e cliente também
quebra hidratação.

---

## 5. Dados

O banco é a **fonte da verdade**: o app lê dele a cada requisição (5.1) e
grava por Server Actions (5.4). Não há cópia local nem no navegador (5.3) nem
no estado do React (5.5) — o dado tem um dono só.

### 5.0 O banco (Neon + Prisma)

Postgres gerenciado na Neon, projeto **"Studio de Controle"** (`us-east-2`,
PG 18). Quatro tabelas de domínio (`Entrada`, `Gasto`, `Material`,
`Agendamento`) mais `User`, todas com `userId` e índice `[userId, data]`.

`prisma/schema.prisma` carrega os porquês no topo — vale ler antes de mexer:
`Decimal(10,2)` para dinheiro, `@db.Date` sem hora, campo derivado não vira
coluna, e as duas mudanças do Prisma 7 que ditaram o caminho (generator legado
`prisma-client-js`, porque o novo emite TypeScript; e o driver adapter do Neon,
porque o client não conecta mais pela URL).

`prisma/seed.mjs` é idempotente; a geração dos dados vive em
`src/server/exemplo.js`, compartilhada com a ação de restaurar. Comandos:
`db:migrate`, `db:seed`, `db:studio`, `db:generate`. Variáveis em `.env.example` — os valores
reais ficam em `.env.local`, fora do git.

### 5.1 Leitura: a borda de conversão

`src/server/leitura.js` é o único ponto que traduz banco → UI, e existe porque
duas coisas do Prisma não atravessam a fronteira do Server Component:

- **`Decimal` não é serializável** como prop. Vira `Number` aqui. Cabe:
  `Decimal(10,2)` é dinheiro em centavos, muito abaixo do inteiro seguro do JS,
  e a precisão decimal é responsabilidade do banco, que é onde a soma acontece.
- **`Date` não é o formato que a UI fala.** Vira `"YYYY-MM-DD"`.

Junto nascem os campos derivados (`date` curto, `cat`, `kind`), pelo mesmo
motivo de não serem coluna. O formato de saída é exatamente o que o seed
mockado produzia — foi assim que a etapa 2 ligou o banco **sem mudar nenhum
componente de UI**.

**Armadilha de fuso, versão do banco.** Prisma devolve colunas `@db.Date` como
meia-noite **UTC** — medido contra registros de dia conhecido. Convertê-las com
os getters locais devolve o dia anterior em qualquer fuso a oeste de Greenwich.
Por isso existe `isoDeDataUTC` em `src/lib/periodo.js`, separada de `isoDeData`:
são conversões opostas, e usar uma pela outra erra silenciosamente por um dia.

**Busca tudo da conta, de propósito.** A navegação de período filtra no cliente
por prefixo do `iso` (3.7), e é isso que a mantém instantânea e sem refetch.
São dezenas de registros por ano de uso. Quando o volume pesar, o corte passa a
ser por período — e aí a navegação precisa virar URL, para o servidor saber o
que buscar.

**Quem é o usuário.** `src/server/usuario.js` devolve a única conta do banco.
É placeholder assumido: na etapa 4 ele lê a sessão e vira o `requireUser()`,
sem que nenhum chamador mude.

### 5.2 A forma de `/app`

```
app/layout.jsx   Server  — nada hoje; guarda de sessão na etapa 4
app/page.jsx     Server  — carregarDadosIniciais() → <AppRoot dadosIniciais>
AppRoot.jsx      Client  — useHoje() → skeleton → <AppDataProvider>
```

O provider morava no layout, e por isso a etapa 2 começou por aqui: **o layout
fica acima da página**, então dado buscado na página não subiria até ele.

A divisão em três é o que permite as duas origens conviverem: os dados vêm do
servidor, `hoje` vem do cliente (3.7), e só o segundo precisa esperar a
montagem. Enquanto espera, o `AppBootSkeleton`.

A rota é `dynamic = "force-dynamic"`: pré-renderizar congelaria os dados no
build e ainda faria o build exigir acesso ao banco. As rotas públicas seguem
estáticas — só `/app` é dinâmica.

**A agenda é do dia.** O filtro por `hoje` é do provider e é novo: com o seed
mockado só existiam agendamentos de hoje, e a lista inteira já era "o dia".
Vinda do banco ela traz todos os dias.

### 5.3 A persistência local, removida na etapa 2

`src/lib/armazenamento.js` guardava tudo em `localStorage` e sempre foi
declaradamente intermediária. Saiu inteira quando o servidor virou a fonte da
verdade: dois donos do mesmo dado divergem já na primeira gravação. Com ela
foram embora o aviso fixo de "este navegador não permite salvar" e o
`gerarSeed` do mock.

**"Restaurar dados de exemplo"** ficou no drawer como "Em breve". Restaurar no
cliente recriaria a divergência; hoje quem restaura é `yarn db:seed`, e o botão
volta na etapa 3 como Server Action.

### 5.4 Escrita: Server Actions

`src/actions/*.js` — uma por entidade, três ações cada (criar, atualizar,
excluir), mais `conta.js` para restaurar exemplo. Três regras valem para
todas, comentadas por extenso em `gastos.js`:

1. **Nunca `where: { id }` sozinho.** `updateMany`/`deleteMany` escopados por
   `{ id, userId }` fazem o id de outra conta simplesmente não casar. Hoje há
   uma conta só e isso é teórico; na etapa 4 deixa de ser, e custa uma linha.
2. **`revalidatePath("/app")` no fim.** É por ele que a tela recebe o
   resultado — ver 5.5.
3. **`criar` aceita um `id`.** O desfazer de uma exclusão recria o registro
   com a mesma identidade em vez de um sósia.

`src/server/escrita.js` valida e converte, e existe por um motivo que
`leitura.js` não tem: **Server Action é um endpoint**. O que chega ali
atravessou a rede e não é confiável só porque o formulário do app validou
antes.

**O que é lista fechada e o que não é.** `tipo` e `subtipo` do gasto sim,
porque a UI deriva rótulo e categoria deles e um valor fora da lista quebraria
a tela. Serviço, duração e status não: o próprio seed grava "Em atendimento",
que não está entre os `STATUSES` oferecidos, e fechar a lista impediria de
editar registros que já existem.

**Erro nunca sobe como exceção.** `comResultado` devolve `{ erro }` — texto
para a usuária quando o dado é inválido, mensagem genérica com o stack no log
do servidor quando é outra coisa. Uma ação que lança vira erro de runtime no
cliente, e em produção a mensagem é apagada: a tela quebraria sem dizer por
quê. No app, o erro vira toast **sem** botão de desfazer e o sheet **continua
aberto**, com o que foi digitado.

### 5.5 Por que o provider não guarda os dados

As ações terminam em `revalidatePath("/app")`; o servidor re-renderiza e manda
a versão nova por prop. Um `useState` inicializado uma vez ignoraria isso e
deixaria a tela num retrato antigo — e copiar para o estado traria de volta os
dois donos que 5.3 eliminou. Então o provider **lê `dados` da prop**, e o que
continua sendo estado é só o que o cliente sabe sozinho: aba, sheet, período,
filtro, snackbar.

**Esperar, não ser otimista** (decisão de 6.1). As ações rodam dentro de uma
`useTransition`, e é ela que mantém `salvando` verdadeiro até a tela **já ter
os dados novos** — não só até o banco responder. Fechar o sheet antes disso
mostraria por um instante a lista sem o registro recém-salvo. Enquanto isso o
botão vira "Salvando…" e o sheet fica aberto: se falhar, nada do que foi
digitado se perde.

**Desfazer é a ação inversa.** Criar desfaz excluindo; excluir desfaz criando
com o mesmo id; editar desfaz regravando os valores anteriores. Para isso o
provider tem dois tradutores por entidade — `de*Formulario` prepara o que
acabou de ser digitado, `de*Registro` remonta os mesmos campos a partir do que
está na tela.

**Restaurar exemplo** é o caso especial: apagar tudo não tem inverso barato, e
quem tem o "antes" é o cliente, que já recebeu os dados. O desfazer manda esse
retrato de volta (`substituirDados`). Apagar e regravar acontecem na mesma
transação — é o único ponto do app onde uma falha no meio deixaria a conta
vazia.

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
- **`localStorage` saiu** (5.3). O servidor virou a fonte da verdade, e dois
  donos do mesmo dado divergem já na primeira gravação.
- **`items` foi separado** em `Entrada` e `Gasto` no schema — a pendência de
  modelagem que o mock escondia está resolvida.

#### Etapas

| | | |
|---|---|---|
| 0 | Datas reais e noção de período (3.7) | ✅ feito |
| 1 | Banco, schema e seed (5.0) | ✅ feito |
| 2 | App **lê** do servidor (5.1, 5.2) | ✅ feito |
| 3 | App **grava** por Server Actions (5.4, 5.5) | ✅ feito |
| 4 | Auth.js v5 (e-mail e senha) | pendente |
| 5 | Deploy na Vercel | pendente |

**Etapa 2 — leitura. Feita.** O provider vivia no *layout* de `/app`, que é
client e fica **acima** da página: dado buscado na página não subia até ele.
Ficou `layout` → Server Component (guarda de sessão na etapa 4), `page` →
Server Component que busca, e o `AppRoot` client com `useHoje` + skeleton +
provider. A conversão de tipos acontece numa borda só, e por isso **nenhum
componente de UI mudou**. O detalhe está em 5.1 e 5.2; o `localStorage` saiu
junto (5.3).

**Etapa 3 — escrita. Feita.** `src/actions/*.js` com `"use server"`, cada ação
escopada pelo dono e terminando em `revalidatePath("/app")`. A decisão de
**esperar a resposta em vez de atualizar otimisticamente** se manteve, e o
desfazer virou a ação inversa preservando o `id`. Duas coisas que só
apareceram ao implementar: o provider precisou **parar de guardar os dados**
(5.5), senão a tela ignoraria o `revalidatePath`; e "Restaurar dados de
exemplo" precisou de uma ação inversa própria, porque apagar tudo não tem
inverso barato. Detalhe em 5.4 e 5.5.

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
- **Persistência do tema** — os dados vivem no banco (5.0), mas o modo
  claro/escuro não: ele vive só em estado React e volta ao claro a cada
  recarga. Ficou de fora de propósito, porque é mais caro que o resto — o tema
  afeta a **primeira pintura**, então sem um script bloqueante no `<head>` a
  página aparece clara e pisca para escura. As telas públicas também não têm
  controle para alterná-lo
- **PWA de fato** — manifest, service worker, instalação. Hoje é "mobile-first",
  não instalável
- **Resolver de schema (zod/yup)** — segue em aberto de propósito: a etapa 3
  validou no servidor à mão (5.4) para não misturar duas decisões num commit
  só. A validação do formulário usa regras nativas do RHF; só vale trazer um
  resolver se surgirem regras entre campos — e aí ele serviria aos dois lados
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

Com o banco ligado, vale conferir **números** contra ele, e não só a tela: uma
conversão errada na borda (5.1) produz um app que parece certo com valores
trocados. `yarn db:studio` mostra as tabelas.

Agora que o app grava, o roteiro inclui **salvar, editar e excluir conferindo
a linha no banco** — inclusive a data, que é onde o fuso morde (4.6). O
desfazer de uma exclusão tem que devolver o **mesmo id**, não um registro
parecido.

Um detalhe do ambiente: o badge do Next.js dev tools fica no canto inferior
esquerdo, **em cima da aba "Início"**. Cliques automatizados naquele ponto
acertam o badge, não o app.

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
5. **Elemento certo, instância errada.** Uma sonda que procura "o botão
   Desfazer" acha o do snackbar **anterior**, que ainda não expirou, e
   desfaz a ação errada — com tudo parecendo ter funcionado. Ao encadear
   ações com desfazer, espere o snackbar sumir antes da próxima, ou identifique
   o alvo pelo texto da mensagem, não pelo botão.
6. **O log do servidor desempata.** Quando a tela não diz qual ação rodou, o
   log do `next dev` lista as Server Actions com argumentos e duração — foi
   ele que revelou o `criarEntrada → excluirEntrada → restaurarExemplo` que
   denunciou a regra 5.

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
