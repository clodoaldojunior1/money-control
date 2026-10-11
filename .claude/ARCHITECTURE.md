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
| Banco | **Postgres na Neon** via Prisma | fonte da verdade; leitura em 5.1, escrita em 5.4 |
| Autenticação | **Auth.js v5** (e-mail e senha), sessão em JWT, hash `bcryptjs` | config partida em dois arquivos — ver 5.6 |
| Guarda de rota | `src/proxy.js` | chamava-se `middleware.js` até o Next 16 deprecar o nome |
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
│   ├── cadastro/page.jsx     /cadastro (fechado — ver 5.6)
│   ├── api/auth/[...nextauth]/  endpoints internos do Auth.js
│   ├── api/sessao-orfa/      encerra token sem conta no banco (ver 5.6)
│   └── app/
│       ├── layout.jsx        Server Component; hoje só repassa (ver 5.6)
│       └── page.jsx          /app → busca no banco → <AppRoot dados>
│
├── auth.js                   Auth.js completo (Credentials + Prisma + bcrypt)
├── auth.config.js            Auth.js leve (o que o proxy pode carregar)
├── proxy.js                  guarda de rota (era middleware.js até o Next 16)
│
├── theme/                    Design system (fonte única de verdade visual)
│   ├── tokens.js             tokens light/dark: cores, rampas, sombras, raios
│   ├── theme.js              buildTheme(mode) → createTheme + styleOverrides
│   └── tagStyles.js          tagSx(kind, tokens) para variantes de Chip
│
├── context/                  Estado global
│   ├── ColorModeProvider.jsx tema claro/escuro + ThemeProvider + CssBaseline
│   └── AppDataProvider.jsx   estado de UI + derivados; os dados vêm por prop
│
├── lib/
│   ├── periodo.js            datas e períodos (Intl pt-BR, sem armadilha UTC)
│   ├── useHoje.js            data do cliente sem quebrar hidratação
│   └── prisma.js             instância única do client (driver adapter Neon)
│
├── server/                   só roda no servidor
│   ├── usuario.js            requireUser(): a sessão que escopa tudo
│   ├── leitura.js            Prisma → formato da UI (borda de conversão)
│   ├── escrita.js            formulário → banco: validação e conversão
│   └── exemplo.js            gerador dos dados de exemplo (seed + restaurar)
│
├── actions/                  Server Actions ("use server")
│   ├── sessao.js             entrar e sair
│   ├── servicos.js           criar serviço e fixar preço padrão
│   ├── entradas.js           criar / atualizar / excluir, por entidade
│   ├── gastos.js             (as três regras comuns estão comentadas aqui)
│   ├── materiais.js
│   ├── agenda.js
│   ├── perfil.js             nome, studio, WhatsApp e troca de senha
│   └── conta.js              restaurar exemplo e o desfazer dele (só em dev)
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
    │                         Entradas, Materiais) e a ConfigTab, que só
    │                         se abre pelo drawer
    ├── sheets/               os formulários em bottom sheet (Gasto, Agenda,
    │                         Entrada, Material) e o MovimentacaoSheet, que
    │                         escolhe entre entrada e gasto
    └── ui/                   primitivas reutilizáveis
        │                     (SegmentedControl, SelectableOption,
        │                      MoneyField, SheetFrame, HeaderIconButton)
        └── form/             as mesmas primitivas ligadas ao React Hook
                              Form via Controller (FormTextField,
                              FormSelectField, FormSegmented,
                              FormMoneyField, FormOptionGroup,
                              FormCheckbox, FormPasswordField,
                              FormServicoField)
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
| `/cadastro` | Criar conta — **fechado**, valida e recusa (5.6) | só tema |
| `/app` | O PWA (5 abas) — exige sessão | tema + `AppDataProvider` |

O `proxy.js` guarda as duas direções: sem sessão, `/app` manda para `/login`;
com sessão, `/login` e `/cadastro` mandam para `/app`.

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
  `kind:"out"`), `materiais`, `agendamentos` e `conta` — tudo lido da prop
  `dados`, que o servidor manda a cada render. O provider **não os guarda**
  em estado, e o porquê disso é 5.5
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

Toda ação destrutiva/criadora chama `toast(texto, undo)`, e o snackbar dura
4,2s. É o desfazer que substitui o diálogo de confirmação: o app não pergunta
"tem certeza?" em lugar nenhum — age e oferece a volta.

**O `undo` é a ação inversa no servidor**, não um closure sobre o estado
anterior. Criar desfaz excluindo; excluir desfaz criando **com o mesmo id**;
editar desfaz regravando os valores de antes. Enquanto os dados viviam em
memória, restaurar era reinserir no índice original; com o banco, índice não
significa nada e identidade significa tudo (5.5).

A única ação sem inverso barato é "restaurar dados de exemplo", que apaga
tudo. Ali o "antes" é o retrato que o cliente já tem em mãos, e o desfazer o
manda de volta inteiro.

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
| Início | **Pergunta**: um sheet com seletor Entrada / Gasto |
| Entradas | Entrada |
| Gastos | Gasto |
| Materiais | Material |
| Agenda | Agendamento |

O rótulo do FAB (`FAB_LABEL` no `AppShell`) é chaveado **pelo tipo de sheet**,
não pela aba, justamente para não divergir desse mapa.

**A Início é a exceção, e por isso pergunta.** Dali se lança tanto o que entrou
quanto o que saiu; escolher um por padrão obrigava a fechar o sheet e trocar de
aba para registrar o outro. O `MovimentacaoSheet` resolve com um seletor —
`SegmentedControl`, o mesmo componente que o formulário de gasto usa para
Trabalho/Pessoal, em vez de inventar um menu flutuante só para esta tela.

Para isso, `FormularioEntrada` e `FormularioGasto` moram **fora** das suas
molduras: o sheet de movimentação desenha uma moldura só e troca o formulário
dentro dela. Aninhar os sheets inteiros traria duas alças e dois títulos.

### 3.7 Período: a unidade de escopo do app

Quase tudo no app é **do mês**: faturamento, gastos, materiais comprados. O
`periodo` (`"2026-08"`) vive no `AppDataProvider` e recorta `entradas`,
`ledgerOut` e `totals`. A Agenda é a exceção — ela é do **dia**.

O `PeriodNavigator` (‹ Agosto ›) aparece nas quatro abas de escopo mensal e
some da Agenda.

**A data do cliente não pode ser lida durante o render.** O HTML de `/app` é
gerado no servidor a cada requisição; `new Date()` no render gravaria ali a
data do *servidor*, que divergiria da do cliente na hidratação — e nas rotas
públicas, que são estáticas, gravaria a data do *build*. A solução é o hook `useHoje` em
`src/lib/useHoje.js`, que usa `useSyncExternalStore` com um snapshot de
servidor diferente do de cliente — a forma suportada pelo React de dizer "este
valor só existe no cliente", sem erro de hidratação.

Daí decorre a ordem de montagem:

```
AppRoot.jsx            resolve `hoje` com useHoje()
  └─ hoje === null  →  <AppBootSkeleton />   (é o que vai no HTML do servidor)
  └─ hoje definido  →  <AppDataProvider hoje={hoje} dados={dados}>
```

O provider **só monta com a data já conhecida**, então não precisa de efeito,
de estado nulo nem de flag de "pronto" espalhada pelos componentes. (O
`AppRoot` nasceu no layout e desceu para cá na etapa 2 — ver 5.2.)

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

**Quem é o usuário.** `requireUser()` (`src/server/usuario.js`) lê a sessão e
devolve a conta. Foi um placeholder que devolvia a única conta do banco até a
etapa 4 — e a troca não mexeu em nenhum chamador, que era exatamente a aposta
de tê-lo isolado desde o começo. Detalhe em 5.6.

### 5.2 A forma de `/app`

```
app/layout.jsx   Server  — só repassa; a guarda ficou no proxy (5.6)
app/page.jsx     Server  — carregarDados() → <AppRoot dados>
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

**"Restaurar dados de exemplo"** ficou no drawer como "Em breve" durante a
etapa 2 — restaurar no cliente recriaria a divergência — e voltou na etapa 3
como Server Action (5.4).

### 5.4 Escrita: Server Actions

`src/actions/*.js` — uma por entidade, três ações cada (criar, atualizar,
excluir), mais `conta.js` para restaurar exemplo. Três regras valem para
todas, comentadas por extenso em `gastos.js`:

1. **Nunca `where: { id }` sozinho.** `updateMany`/`deleteMany` escopados por
   `{ id, userId }` fazem o id de outra conta simplesmente não casar. Era
   teórico enquanto havia uma conta só; desde a etapa 4 o `userId` vem da
   sessão (5.6), e essa linha é o que separa as contas.
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
os dados novos** — não só até o banco responder. Enquanto isso o botão vira
"Salvando…" e o sheet fica aberto: se falhar, nada do que foi digitado se
perde.

**O que vem depois do `await` precisa de outro `startTransition`.** São dois
tempos: a Server Action devolve o resultado antes de terminar de chegar o RSC
que o `revalidatePath` manda na mesma resposta. Em dev, salvando um gasto:
`criarGasto` ~1,1 s, `POST /app` inteiro ~2,6 s. E no React 19 os `setState`
feitos depois de um `await` dentro de `startTransition` **não pertencem à
transição** — ressalva documentada. Por isso `executar` chama
`iniciarTransicao` de novo em volta do `aoConcluir`. Medido antes e depois,
com um `MutationObserver` na tela:

| | sheet fecha + snackbar | item na lista |
|---|---|---|
| sem o segundo `startTransition` | +1,4 s | +2,7 s |
| com ele | +2,4 s | +2,4 s, no mesmo commit |

Sem ele, por ~1,3 s a lista aparecia sem o registro **e** com um Desfazer na
tela agindo sobre dados que ainda não tinham chegado. O sintoma enganava:
`salvando` seguia verdadeiro nessa janela, mas o sheet já tinha fechado.
Consequência: o prazo de 4,2 s do snackbar conta a partir de quando ele
aparece (um efeito sobre `snack`), não de quando `toast` é chamado — o timer
disparado na chamada gastaria a espera com ele ainda invisível.

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

**E só existe em desenvolvimento.** Quando a dona do studio passou a usar o
sistema com dados reais, o botão virou o maior risco do app: um toque sem
querer no drawer apagava o histórico inteiro, com um desfazer que some em 4
segundos. A trava está nos dois lados:

- O **botão** sai do bundle de produção. A comparação com `NODE_ENV` fica
  escrita no próprio JSX, e não importada, para o build substituí-la por uma
  constante e cortar o trecho — verificado procurando o texto do botão nos
  arquivos de `.next/static`, com "Tema escuro", do mesmo drawer, como
  controle.
- As **ações** (`restaurarExemplo` e `substituirDados`) recusam antes de tocar
  no banco. Esconder o botão não bastaria: Server Action é endpoint e responde
  sem botão nenhum. O `substituirDados` entra junto porque troca a conta
  inteira pelo que receber.

É `NODE_ENV`, e não `VERCEL_ENV`, de propósito: o preview também roda como
`production`, e enquanto a `DATABASE_URL` de preview não for separada ele
aponta para o banco real. Para restaurar o ambiente de desenvolvimento,
continuam valendo o botão no `yarn dev` e o `yarn db:seed`.

**Sem rede, a Server Action rejeita — não devolve `{ erro }`.** A convenção do
projeto (5.4) é o erro voltar como valor, e isso vale para tudo que o
**servidor** decide: validação, escopo, regra. Mas se a requisição nem chega, a
própria chamada lança `TypeError: Failed to fetch`, e nenhum `return { erro }`
roda. O `executar` captura isso e o trata como `{ erro }`: toast "Sem conexão.
Confira a internet e tente de novo.", sheet aberto, formulário intacto. Sair
(`sairDaConta`) passa pelo mesmo caminho — sem rede a sessão **não** é
encerrada, e ela precisa ver o aviso em vez de achar que saiu.

O sintoma, antes disso, era feio: a rejeição escapava da transição e a tela
caía na página de erro padrão do Next ("This page couldn't load"). Não é do
navegador — é o error boundary do próprio Next, e é isso que aparece quando
uma exceção do cliente escapa. Qualquer ação nova tem que passar por
`executar`, nunca chamar a Server Action solta.

### 5.6 Sessão (Auth.js v5)

Login por e-mail e senha, sessão em **JWT**. Não é preferência: o provider
Credentials do Auth.js v5 só funciona assim. Hash com **`bcryptjs`** — o
`bcrypt` é binário nativo e precisaria compilar no destino.

**A config vive partida em dois arquivos**, e essa é a decisão central:

- `auth.config.js` — só o declarativo (página de login, callbacks do token).
  É o que o `proxy.js` carrega, porque ele roda no runtime **edge**, onde o
  Prisma não conecta.
- `auth.js` — o provider de credenciais, que consulta o banco e compara o
  hash. Só roda no Node.

A chave `providers: []` na config leve parece supérflua e não é: `NextAuth()`
itera sobre ela na inicialização e, sem a chave, estoura com um
`undefined.map` que não diz nada sobre a causa.

**`requireUser()`** (`src/server/usuario.js`) substituiu o placeholder da etapa
2. Lê a sessão e redireciona para `/login` quando não há — em vez de devolver
`null` — porque quem chama está sempre dentro de `/app` ou de uma ação dele, e
ali "sem sessão" não é estado a tratar. Ele também cobre o que o proxy não vê:
a sessão que expira **entre** a página abrir e uma Server Action rodar.

**Sessão órfã termina em `/api/sessao-orfa`.** Um JWT válido cujo `token.id`
não existe no banco — conta apagada, ou token emitido contra outro branch da
Neon — prendia o navegador num laço (`ERR_TOO_MANY_REDIRECTS`, visto em
2026-10-03): o proxy vê o token e manda `/login` para `/app`; o `requireUser()`
não acha a conta e manda `/app` para `/login`. A única saída era chamar o
`signout` do Auth.js à mão.

A causa é que **as duas camadas discordavam sobre o que é estar logada**, e só
apagar o cookie as põe de acordo. Decidido assim:

- `requireUser()` distingue os dois casos: sem sessão vai para `/login`, como
  antes; sessão sem conta (ou sem `id`) vai para `/api/sessao-orfa`.
- **Ele não apaga o cookie direto porque roda em Server Component**, onde
  cookie não se escreve. Server Action até poderia, mas o `requireUser()` não
  sabe de onde foi chamado — uma rota só serve os dois.
- **Route handler, e não Server Action:** um `redirect()` só sabe mandar para
  uma URL, e um GET é o que o navegador faz ao segui-la. Ali `signOut` escreve
  o cookie e termina em `/login`, já sem sessão — o proxy deixa passar.
- **A rota só desloga se a sessão for mesmo órfã.** É um GET, então qualquer
  página poderia embuti-la num `<img>`; deslogar incondicionalmente seria um
  "sair" que um estranho aperta por ela. Com a conta existindo, só devolve
  para `/app`.
- **Não foi no proxy** porque ele roda no edge e não consulta o banco — é
  justamente por isso que ele confia no token. **Nem no callback `jwt`**
  (devolver `null` invalida o token), porque esse callback também roda no
  `auth()` do Server Component, que não consegue gravar a invalidação: o
  cookie velho continuaria lá, e o proxy, logado.

Uma falha de banco no `findUnique` lança, não devolve `null` — então um banco
fora do ar dá erro, nunca desloga ninguém.

**As regras de rota ficam no `proxy.js`, não no callback `authorized`.** A
primeira versão devolvia `Response.redirect` de dentro daquele callback e o
redirecionamento simplesmente não acontecia — a requisição seguia e quem já
estava logada via a tela de login. Devolver `false` funciona, mas só sabe
mandar para a página de login. Escrever as duas decisões no wrapper deixa a
regra explícita e independente de como a biblioteca interpreta o retorno.

**O nome do arquivo é `proxy.js`.** O Next 16 deprecou `middleware.js` e avisa
a cada boot; a documentação do Auth.js ainda usa o nome antigo.

**Cadastro fechado.** `/cadastro` continua existindo e validando, mas o envio
recusa com uma mensagem — a conta é só do dono, criada pelo `yarn db:seed`. A
recusa vem **depois** da validação, de propósito: quem preenche errado vê o
erro do campo, não uma negativa genérica.

**O que a UI passou a tirar da sessão:** nome, primeiro nome no cabeçalho,
studio e a inicial do avatar. Eles eram literais ("Manuela Reis"), o que
deixava uma conta autenticada exibindo o nome de outra pessoa. A conta viaja
junto com os dados, em `carregarDados` — só o que aparece na tela: hash e
e-mail não atravessam.

### 5.7 O catálogo de serviços

O serviço era texto solto em `Entrada` e `Agendamento`, e a lista de opções
vivia no nosso código. Isso tirava a autonomia dela — só fazia o que estava
previsto — e texto livre no lugar teria destruído qualquer análise: "Volume
russo", "volume russo" e "Vol. russo" contariam como três serviços num gráfico.

**A saída é dar liberdade para criar o vocabulário, não para digitar qualquer
coisa a cada lançamento.** Os lançamentos apontam para uma linha de `Servico`,
então renomear propaga para todo o histórico e a contagem continua honesta.

Decisões que ficaram gravadas no modelo:

- **Serviço não se apaga, se desativa** (`ativo`). A relação é `Restrict`: o
  banco **recusa** apagar um serviço com histórico. Desativado some da lista de
  escolha, continua nos relatórios, e segue aparecendo no formulário de um
  lançamento antigo que o use — senão editar aquele registro trocaria o serviço
  dele sem ninguém pedir.
- **`precoPadrao` é sugestão, nunca verdade.** O valor cobrado mora no
  lançamento e não é recalculado quando o padrão muda: promoção não reescreve o
  passado.
- **Criar é idempotente.** Quem chama é o campo do formulário, onde repetir um
  nome que já existe é acidente comum. Recusar faria a usuária corrigir algo
  que, para ela, estava certo — então a ação devolve o serviço existente. A
  comparação ignora caixa e espaços; o nome é gravado como ela digitou.

**O preço nunca passa por cima do que foi digitado.** Ao trocar de serviço, o
campo só é preenchido se estiver vazio ou se o que está lá foi a sugestão do
serviço anterior.

**O convite para fixar um novo padrão mora no sheet, não no snackbar.** Lá o
botão já é o Desfazer, e dois botões num toque viram escolha difícil. Ele
aparece quando o valor difere do padrão e some depois de aceito. Na agenda não
existe: agendamento é previsão, e o padrão deve nascer do que foi cobrado.

E é um **botão**, não um texto clicável: precisa parecer tocável, ter alvo de
dedo e **dizer o valor** — "fixar este valor" não conta o que vai acontecer,
"atualizar o preço padrão de Volume russo para R$ 200,00" conta. O estado
guarda o valor fixado, e não um sim/não, para o convite voltar sozinho se ela
mudar o preço outra vez no mesmo formulário.

**A migração foi escrita à mão** (`20261003120000_catalogo_de_servicos`). O
Prisma recusou gerá-la — proporia apagar a coluna e criar a nova `NOT NULL`,
o que falharia com 48 registros existentes. A ordem correta cria, preenche,
trava e só então apaga; o `SET NOT NULL` antes do `DROP COLUMN` é a rede, que
derruba a migração inteira em vez de perder ligação em silêncio. O agrupamento
ignora caixa, então variações de grafia já existentes viram um serviço só.

Os ids do backfill saem de `gen_random_uuid()` porque ali não há código
rodando, só SQL — formato diferente do cuid do resto, e invisível para o app.

### 5.8 Deploy e migrações

Vercel ligada ao GitHub: **push na `main` publica em produção**, push em
qualquer outro branch gera um preview com URL própria. Mudança vai por branch,
é conferida no preview e só então é juntada.

**Dois bancos, um projeto na Neon.** O branch `production` é o de verdade; o
`development`, filho dele, é o do `.env.local` e o dos previews. Os papéis
são esses e não os nomes ao contrário de propósito: o branch padrão da Neon é
o que não pode ser apagado, e é bom que seja o de produção. Por isso também
`yarn db:seed` só alcança desenvolvimento — ele apaga os dados da conta antes
de regravar.

**Variáveis na Vercel:** `DATABASE_URL` e `AUTH_SECRET`, este último **gerado
separado** do de desenvolvimento. `SEED_EMAIL` e `SEED_SENHA` não vão — o seed
não roda lá, e senha não fica guardada onde não é usada. `AUTH_URL` não é
necessária: na Vercel o Auth.js descobre o endereço sozinho.

**Duas coisas que o build precisa fazer sozinho**, e que quebrariam o deploy
se faltassem:

- `postinstall: prisma generate` — o `@prisma/client` 7 não gera mais o client
  na instalação. Localmente passa despercebido porque ele já está em
  `node_modules`; na Vercel, que instala do zero, não existiria.
- `build: prisma migrate deploy && next build` — sem isso o deploy publicaria
  código novo sobre um banco velho. É a única forma de a migração chegar em
  produção, já que nada mais toca naquele banco.

#### Mudança de schema, passo a passo

1. `yarn db:migrate` cria o arquivo em `prisma/migrations/` e aplica no
   desenvolvimento.
2. **Antes de juntar na `main`**, criar na Neon um branch a partir de
   `production` chamado `backup-AAAA-MM-DD`. É instantâneo e serve de foto: se
   a migração estragar algo, os dados de antes continuam lá.
3. Conferir no preview, com o banco de desenvolvimento.
4. Juntar na `main`. O build aplica a migração e publica.

O passo 2 existe porque `migrate deploy` roda sozinho: uma migração destrutiva
não pede confirmação a ninguém.

### 5.9 Configurações (perfil e senha)

Existe porque trocar nome, studio ou senha exigia SQL no painel da Neon — e já
tinha dado trabalho duas vezes. É a `ConfigTab`, aberta pelo drawer: entra no
mesmo `tab` das outras (3.2), mas **não** na bottom nav, que é do dia a dia, e
ali o FAB some — `SHEET_POR_ABA` não tem entrada para ela e não há o que lançar.

**O e-mail é só leitura.** É a identidade do login, e sem recuperação de senha
(6.4) um erro de digitação ali tranca a conta — a saída seria o mesmo SQL que a
tela veio substituir.

**Perfil segue o padrão de edição:** salva e oferece desfazer, que regrava o
que estava em `conta`. O formulário usa `values`, não `defaultValues`, para
voltar sozinho à versão do servidor — depois de salvar e depois de desfazer.
Isso depende do segundo `startTransition` de `executar` (5.5): como o snackbar
só aparece junto com a versão nova, não há como desfazer antes de o formulário
ter visto a mudança. Antes dele, um desfazer rápido levava `conta` de A direto
para A, e o formulário ficava mostrando B como alteração pendente.

**Senha exige a atual e não tem desfazer.** A atual porque a sessão dura 30
dias e um celular desbloqueado não deveria bastar para tomar a conta; sem
desfazer porque o "antes" não volta do hash. Ela **não derruba as outras
sessões**: com JWT não há tabela de sessões, e invalidar exigiria uma versão de
senha no token conferida a cada requisição. O sinal para fazer isso é precisar
expulsar um aparelho — com uma usuária e os aparelhos dela, não há.

### 5.10 PWA instalável

**O que entrega:** instalar na tela inicial (Android e iOS), abrir sem barra do
navegador em `/app`, e uma tela de "sem conexão" no lugar do erro do navegador.
**Não** entrega uso offline — ver 6.4.

**Peças:** `src/app/manifest.js` (o Next serve em `/manifest.webmanifest` e põe
o `<link>`), `src/app/icon.svg` e `apple-icon.png` (convenção do Next),
`public/icon-*.png` (192, 512 e maskable), `public/sw.js`, `public/offline.html`
e `RegistrarServiceWorker` no `layout`. A marca é um N dentro de um C
(`BrandMark` e `scripts/gerar-icones.mjs` usam a mesma geometria).

**O SW cacheia pouco de propósito.** Só `/_next/static/*` (imutável, com hash)
e os ícones, cache-primeiro. Navegação vai sempre à rede e só cai na página
offline se ela falhar. HTML, Server Actions, RSC e API passam direto: cachear
`/app` mostraria dados de uma sessão já encerrada. Subir a constante `VERSAO`
em `sw.js` só é preciso se mudar a lista de pré-cache.

**Registro só em produção.** Em dev o SW cacheando `/_next/static` brigaria com
o hot reload. Por isso o teste exige `next build` + `next start`.

**A página offline não depende só do cache.** A primeira versão (`nico-v1`)
pré-cacheava com `cache.addAll`, que é tudo-ou-nada, e devolvia
`caches.match(OFFLINE)` direto: se o item não estivesse lá, o resultado era
`undefined` e o navegador mostrava a própria tela de erro. A `nico-v2` adiciona
item a item (`Promise.allSettled`) e tem um HTML mínimo embutido em `sw.js`
como último recurso. Mudou a lógica do SW? Suba `VERSAO`, ou os aparelhos
seguem com o antigo.

**Como foi verificado — e o que não foi.**

- Build, manifest, `<head>` e endpoints: conferidos por `next build` +
  `next start` e `curl`.
- Registro e ativação do SW: confirmados em produção pelo DevTools (Application
  → Service Workers: `nico-v2`, *activated and running*).
- O toast de "sem conexão" ao salvar com a rede cortada: conferido na preview,
  com o sheet aberto e o formulário preservado (5.5).
- **Não confirmado de ponta a ponta:** a navegação offline caindo na tela do
  Nico. O navegador embutido do app recusa qualquer service worker (nem um
  vazio, em outra porta, registra), então não dá para testar aqui; e o
  *Offline* do painel Network e o do painel Service Workers se comportam
  diferente. O teste definitivo é desligar o Wi-Fi e recarregar.
- Pendente: Lighthouse (instalabilidade).

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
| 4 | Auth.js v5 (e-mail e senha) (5.6) | ✅ feito |
| 5 | Deploy na Vercel (5.8) | ✅ feito |

**Etapa 2 — leitura. Feita.** O provider vivia no *layout* de `/app`, que é
client e fica **acima** da página: dado buscado na página não subia até ele.
Ficou `layout` → Server Component, `page` → Server Component que busca, e o
`AppRoot` client com `useHoje` + skeleton + provider. A conversão de tipos acontece numa borda só, e por isso **nenhum
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

**Etapa 4 — auth. Feita.** A armadilha prevista se confirmou e a config
dividida resolveu (detalhe em 5.6). Duas que não estavam previstas: o callback
`authorized` não honra um `Response.redirect`, então as regras de rota foram
para o wrapper do `proxy.js`; e o `matcher` precisa de **duas** barras para
casar um ponto literal (é string JS antes de virar regex) — com uma só, o
proxy rodava apenas em `/`, e a proteção parecia funcionar porque
`requireUser()` redirecionava por baixo.

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
implementação: **Clientes** e **Relatórios**. Configurações saiu da lista (5.9).

### 6.4 Itens em aberto (não decididos)

- **"Manter conectada"** — o checkbox do login é decorativo: a sessão dura 30
  dias marcado ou não. Implementá-lo exige duas durações de JWT decididas na
  chamada do `signIn`, e não muda nada perceptível hoje
- **"Esqueci a senha" e "Continuar com Google"** — links sem destino na tela
  de login. O segundo é um provider a mais no Auth.js; o primeiro precisa de
  e-mail transacional, que o projeto não tem
- **`"Em atendimento"` fora de `STATUSES`** — o seed grava esse status, mas
  ele não está na lista que o formulário oferece: quem editar um agendamento
  assim perde o status. Por isso a validação de status não é lista fechada
  (5.4)
- **Aviso do Node no `yarn db:seed`** — `prisma/seed.mjs` importa um `.js` de
  um pacote sem `"type": "module"`, e o Node avisa que reinterpretou o arquivo.
  É cosmético e só no seed
- **Persistência do tema** — os dados vivem no banco (5.0), mas o modo
  claro/escuro não: ele vive só em estado React e volta ao claro a cada
  recarga. Ficou de fora de propósito, porque é mais caro que o resto — o tema
  afeta a **primeira pintura**, então sem um script bloqueante no `<head>` a
  página aparece clara e pisca para escura. As telas públicas também não têm
  controle para alterná-lo. Quando entrar, o script vai alterar o `<html>`
  antes da hidratação — o `suppressHydrationWarning` que já está lá (posto
  por causa de extensões do navegador) cobre esse caso também
- **Offline de verdade** — o PWA (5.10) é instalável e mostra uma tela de "sem
  conexão", mas não abre sem rede: os dados vêm do servidor e são
  autenticados. Escrever offline exigiria fila de sincronização e resolução de
  conflito — outro projeto, e hoje ninguém pediu
- **Gerenciar serviços** — hoje ela cria pelo formulário, mas renomear e
  desativar só pelo banco. A tela mora dentro de Configurações (5.9), que já
  reserva o lugar com um card "Em breve", e o
  modelo já suporta as duas operações
- **Gráfico de serviços mais prestados** — era o motivo de estruturar o
  catálogo (5.7). Com o dado amarrado, é agrupar por `servicoId`
- **Resolver de schema (zod/yup)** — segue em aberto de propósito: a etapa 3
  validou no servidor à mão (5.4) para não misturar duas decisões num commit
  só. A validação do formulário usa regras nativas do RHF; só vale trazer um
  resolver se surgirem regras entre campos — e aí ele serviria aos dois lados
- **Rotas reais por aba** — ver 3.2
- **Testes** — não há nenhum ainda

### 6.5 Alternativas avaliadas e recusadas

Registradas com o motivo e com **o sinal que deveria fazer reconsiderar** — para
a discussão não voltar daqui a meses sem o contexto.

#### Trocar Postgres por MySQL ou SQLite — recusado em 2026-10-03

Veio junto da ideia de um dia migrar para a AWS. São três decisões diferentes, e
misturá-las custaria semanas sem ganho:

- **Trocar de fornecedor é barato.** Sair da Neon para RDS, Aurora, Supabase ou
  um Postgres em container é mexer na `DATABASE_URL` e no driver adapter. Schema,
  migrações e código continuam iguais.
- **Trocar de banco é caro e não compra nada.** MySQL exigiria reescrever as
  migrações e revisar tipos — `Decimal` e datas se comportam diferente, e é
  exatamente ali que moram as armadilhas 7 e 8 do CLAUDE.md.
- **SQLite é outra categoria.** É um arquivo: serve a app local ou desktop, não
  a várias contas atendidas por servidores que sobem e descem.
- **AWS é decisão de operação, não de arquitetura.** Next, Prisma e Auth.js
  rodam em container, Amplify ou OpenNext. O que muda é quanto trabalho de
  infraestrutura passa a ser nosso — hoje, zero.

**O gatilho para reconsiderar:** uma conta da AWS já paga por outro motivo, ou
um requisito que o Postgres não atenda. Vender para terceiros **não** é gatilho:
o que isso cobra não é o banco, e sim isolamento entre contas com gente de
verdade, cobrança, e-mail transacional e backup com garantia.

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

O preview do Claude Code está configurado em `.claude/launch.json` — ele sobe
o `yarn dev` na porta 3000 (antes só sabia se anexar a um servidor já em pé, e
isso deixava a sessão sem preview quando o processo caía).

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

Com sessão, o roteiro ganha mais quatro passos, e todos já falharam alguma vez
em algum projeto: entrar com credencial **errada** (mensagem na tela, sem
sessão criada), entrar com a certa (tem que **chegar** em `/app`, não voltar
para o login), ir a `/login` **já logada** (tem que cair em `/app`) e sair
(tem que voltar a barrar `/app`).

Dois detalhes do ambiente:

- O badge do Next.js dev tools fica no canto inferior esquerdo, **em cima da
  aba "Início"**. Cliques automatizados naquele ponto acertam o badge, não o
  app.
- Senha não se digita em campo por automação. Para exercitar o login sem
  manusear credencial de ninguém, crie uma conta descartável com senha gerada
  na hora, teste, e apague a linha no fim.

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
6. **Uma barra a menos e a sonda mente.** O `matcher` do proxy tinha `"\."`
   onde precisava de `"\."`: em string JS a barra some, o ponto vira
   "qualquer caractere" e o proxy passou a rodar só em `/`. O teste de rota
   protegida continuava passando — porque `requireUser()` redirecionava por
   baixo. **Verifique qual camada respondeu**, não só que a resposta veio: um
   cabeçalho temporário na resposta do proxy resolve em um minuto.
7. **O log do servidor desempata.** Quando a tela não diz qual ação rodou, o
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
