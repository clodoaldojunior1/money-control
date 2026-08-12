# money-control (Lash Studio)

PWA de gestão financeira para lash designers: entradas, gastos, materiais e agenda.

**A arquitetura completa, as decisões e o roadmap estão em
[`.claude/ARCHITECTURE.md`](.claude/ARCHITECTURE.md) — leia antes de mexer na
estrutura.**

## Essencial

- **Yarn**, não npm: `yarn dev`, `yarn lint`, `yarn build`
- **JavaScript**, não TypeScript (decisão explícita do projeto)
- **MUI v9** para tudo. O design system vive em `src/theme/` — cor nova entra em
  `tokens.js`, nunca hex solto no componente. Hoje não há **nenhum** literal de
  cor fora de `tokens.js`; transparência se faz com `alpha(token, alphas.x)`,
  nunca concatenando sufixo hex
- Estado global em `src/context/AppDataProvider.jsx`, consumido via `useAppData()`
- **Formulários com React Hook Form**, dentro de cada sheet (o provider não
  guarda estado de formulário). Componentes MUI se ligam via os wrappers em
  `src/components/lash-studio/ui/form/`
- **Período é a unidade de escopo**: `periodo` (`"2026-08"`) no provider recorta
  entradas, gastos e totais; a Agenda é do dia. A data do cliente vem do
  `useHoje()` — **nunca** `new Date()` durante o render (as rotas são
  pré-renderizadas e isso quebra a hidratação)
- **Dados 100% mockados e em memória** (`src/data/seed.js`). O próximo passo é
  uma **API NestJS separada** — decidida assim porque ela também vai servir um
  app mobile nativo no futuro. Por isso **Server Actions estão fora** (viraram
  proxy nesse arranjo; ver seção 6.5 do ARCHITECTURE)
- **Quando a API existir, o cache de servidor será SWR** (decisão fechada).
  Regra: dado do servidor é do SWR, dado que o usuário está digitando é do RHF
- **Rotas:** `/` landing, `/login`, `/cadastro` (públicas, só tema) e `/app`
  (o PWA, único envolvido pelo `AppDataProvider`). Dentro de `/app` as 5 abas
  trocam por estado, não por navegação
- **Login/cadastro validam mas não autenticam** — qualquer formulário válido
  entra em `/app`. Não há sessão nem guarda de rota até a API existir

## Armadilhas que já nos morderam

1. **MUI v9 removeu system props de `Stack`/`Box`.** `alignItems="center"` como
   prop solta vaza pro DOM e quebra o console — use `sx={{ alignItems: "center" }}`.
   `direction` e `spacing` seguem válidos.
2. **`Card` com `gap` precisa de `display: "flex"`** explícito.
3. **Comparadores de `sort` têm que ser ordem total.** Comparador não-transitivo
   ordena diferente no SSR e no cliente → erro de hidratação.
4. **Moeda sempre via `money()`/`BRL`**, nunca `toLocaleString` inline (locale
   divergente também quebra hidratação).
5. **`useWatch`, nunca `watch`** do React Hook Form — `watch()` desabilita a
   memoização do componente pelo React Compiler.
6. **As rampas tonais invertem no tema escuro.** `ramp[100]/ramp[800]` juntos
   funcionam nos dois temas; um lado da rampa com uma cor literal do outro
   lado, não — vira branco sobre branco no dark.
7. **`new Date("2026-08-01")` é UTC** e volta um dia no nosso fuso. Datas
   passam pelos helpers de `src/lib/periodo.js`, que remontam com
   `new Date(ano, mes, dia)`.

## Verificação

`yarn lint` + validar no navegador em viewport mobile (5 abas, tema claro/escuro,
FAB → sheet → salvar/editar/excluir com desfazer) e conferir o console limpo.

### Ao medir a UI pelo DOM

1. **`outerHTML`, `className` ou screenshot antes de `getComputedStyle`.** Esse
   último devolve valor defasado quando lido logo após um re-render — mostra o
   estado anterior. Já custou horas nesta sessão.
2. **Duas medições que se contradizem = sonda quebrada, não código quebrado.**
   Se o resultado é logicamente impossível (mesma variável, mesmo render,
   valores diferentes), o instrumento está errado. Desconfie dele primeiro.
3. **Valide a sonda num caso de resultado conhecido** antes de confiar nela.
4. **Reescreveu o mesmo arquivo duas vezes pelo mesmo sintoma sem resolver?**
   A hipótese está errada, não a implementação. Pare e reavalie — não tente a
   terceira variação.
5. Para pergunta visual ("de que cor está?", "está centralizado?"), o
   instrumento certo é o olho. Sem screenshot disponível, prefira ler o
   atributo `style`/`class` a inferir por estilo computado.
