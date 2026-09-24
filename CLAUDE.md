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
- Estado global em `src/context/AppDataProvider.jsx`, consumido via `useAppData()`.
  Ele **recebe os dados do servidor** pela prop `dados` e não os copia para
  estado — quem guarda é o servidor (5.5)
- **Formulários com React Hook Form**, dentro de cada sheet (o provider não
  guarda estado de formulário). Componentes MUI se ligam via os wrappers em
  `src/components/lash-studio/ui/form/`
- **Período é a unidade de escopo**: `periodo` (`"2026-08"`) no provider recorta
  entradas, gastos e totais; a Agenda é do dia. A data do cliente vem do
  `useHoje()` — **nunca** `new Date()` durante o render (o HTML vem do
  servidor, e a data dele divergiria da do cliente na hidratação)
- **Backend: Next fullstack** — Server Components leem, **Server Actions**
  escrevem, Postgres na Neon via Prisma, Auth.js v5 no login. Isto **substitui**
  o plano anterior de API NestJS; SWR foi descartado antes de entrar (não
  instale). Ver seção 6.1 do ARCHITECTURE
- **O banco é a fonte da verdade e o app lê dele.** `src/server/leitura.js` é a
  **única** borda de conversão (Decimal → Number, Date → `"YYYY-MM-DD"`,
  derivados) — é por isso que ligar o banco não mudou nenhum componente.
  Não existe mais `localStorage`
- **Escrita: Server Actions** em `src/actions/`. Cada ação é escopada por
  `{ id, userId }` (nunca só o id), valida no servidor — endpoint não confia
  no formulário — e termina em `revalidatePath("/app")`. Erro volta como
  `{ erro }`, vira toast e mantém o sheet aberto. Ver 5.4 do ARCHITECTURE
- **O provider não guarda os dados.** Ele lê `dados` da prop, porque é o
  `revalidatePath` que traz a versão nova; guardar em `useState` congelaria a
  tela. Desfazer é a ação inversa, preservando o `id`. Ver 5.5
- **Rotas:** `/` landing, `/login`, `/cadastro` (públicas, estáticas, só tema)
  e `/app` (dinâmica: `layout` Server → `page` Server que busca → `AppRoot`
  client com `useHoje` + provider). Dentro de `/app` as 5 abas trocam por
  estado, não por navegação
- **Sessão: Auth.js v5**, e-mail e senha, JWT (obrigatório com Credentials),
  hash `bcryptjs`. A config é **partida em dois**: `auth.config.js` leve para o
  `proxy.js` (runtime edge, sem Prisma) e `auth.js` completo no Node. As regras
  de rota ficam no wrapper do `proxy.js`, não no callback `authorized`. Ver 5.6
- **`requireUser()`** escopa toda leitura e escrita, e redireciona para
  `/login` quando não há sessão. `/cadastro` valida mas recusa: a conta é do
  dono, criada pelo seed
- **Produção tem dados reais** (branch `production` da Neon; o `.env.local`
  aponta para `desenvolvimento`). Ferramenta destrutiva de desenvolvimento —
  como "Restaurar dados de exemplo" — fica atrás de `NODE_ENV` **no cliente e
  na Server Action**: esconder o botão não basta, action é endpoint. Push na
  `main` faz deploy de produção; mudança vai por branch e preview

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
8. **A mesma armadilha ao contrário no banco:** Prisma devolve `@db.Date` como
   meia-noite **UTC**, então ali quem erra por um dia é o getter *local*. Use
   `isoDeDataUTC`, e só na borda de leitura.
9. **Erro de hidratação em atributo do `<html>` quase sempre é extensão do
   navegador**, não código. Antes de investigar, abra em aba anônima: se sumir,
   é extensão. O `<html>` já tem `suppressHydrationWarning` por isso — vale só
   para os atributos dele; divergência dentro das páginas continua acusada.

## Onde estamos

Etapas 0 (período), 1 (banco), 2 (leitura), 3 (escrita) e 4 (auth) **feitas**.
Falta: 5 — deploy. Detalhe em 6.1 do ARCHITECTURE.

`AUTH_SECRET` é obrigatório no `.env.local` — sem ele o login não assina nada.

Banco: projeto **"Studio de Controle"** na Neon. Comandos `yarn db:migrate`,
`db:seed`, `db:studio`. Segredos em `.env.local` (fora do git); o template sem
valores é o `.env.example`.

## Verificação

`yarn lint` + validar no navegador em viewport mobile (5 abas, tema claro/escuro,
FAB → sheet → salvar/editar/excluir com desfazer) e conferir o console limpo.
Salvar, editar e excluir se conferem **no banco**, incluindo a data; o desfazer
de uma exclusão tem que devolver o mesmo id.

Mexeu em sessão? O roteiro é: credencial errada (mensagem, sem sessão), certa
(**chega** em `/app`), `/login` já logada (cai em `/app`) e Sair (`/app` volta
a barrar). Senha não se digita em campo por automação — para exercitar o
login, crie uma conta descartável com senha gerada na hora e apague depois.

Com o banco ligado, confira também **números** contra ele (`yarn db:studio`):
conversão errada na borda dá uma tela que parece certa com valores trocados.
O badge do Next dev tools fica em cima da aba "Início" — clique automatizado
ali acerta o badge, não o app. E o log do `next dev` lista cada Server Action
com argumentos: é ele que desempata quando a tela não diz qual ação rodou.

### Ao medir a UI pelo DOM

1. **`outerHTML`, `className` ou screenshot antes de `getComputedStyle`.** Esse
   último devolve valor defasado quando lido logo após um re-render — mostra o
   estado anterior. Já custou horas.
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
6. **Elemento certo, instância errada.** Procurar "o botão Desfazer" acha o do
   snackbar anterior, ainda não expirado, e desfaz a ação errada — parecendo
   ter dado tudo certo. Encadeando ações, espere o snackbar sumir ou
   identifique pelo texto da mensagem.
7. **Confira qual camada respondeu, não só que respondeu.** Por uma barra a
   menos no `matcher`, o proxy rodava só em `/` — e mesmo assim o teste de
   rota protegida passava, porque o `requireUser()` redirecionava por baixo.
   Um cabeçalho temporário na resposta do proxy distingue as duas.
