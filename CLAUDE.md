# money-control (Lash Studio)

PWA de gestão financeira para lash designers: entradas, gastos, materiais e agenda.

**A arquitetura completa, as decisões e o roadmap estão em
[`.claude/ARCHITECTURE.md`](.claude/ARCHITECTURE.md) — leia antes de mexer na
estrutura.**

## Essencial

- **Yarn**, não npm: `yarn dev`, `yarn lint`, `yarn build`
- **JavaScript**, não TypeScript (decisão explícita do projeto)
- **MUI v9** para tudo. O design system vive em `src/theme/` — cor nova entra em
  `tokens.js`, nunca hex solto no componente
- Estado global em `src/context/AppDataProvider.jsx`, consumido via `useAppData()`
- **Dados 100% mockados e em memória** (`src/data/seed.js`). Backend NestJS é o
  próximo passo planejado
- App de rota única (`/`); as 5 abas trocam por estado, não por navegação

## Armadilhas que já nos morderam

1. **MUI v9 removeu system props de `Stack`/`Box`.** `alignItems="center"` como
   prop solta vaza pro DOM e quebra o console — use `sx={{ alignItems: "center" }}`.
   `direction` e `spacing` seguem válidos.
2. **`Card` com `gap` precisa de `display: "flex"`** explícito.
3. **Comparadores de `sort` têm que ser ordem total.** Comparador não-transitivo
   ordena diferente no SSR e no cliente → erro de hidratação.
4. **Moeda sempre via `money()`/`BRL`**, nunca `toLocaleString` inline (locale
   divergente também quebra hidratação).

## Verificação

`yarn lint` + validar no navegador em viewport mobile (5 abas, tema claro/escuro,
FAB → sheet → salvar/editar/excluir com desfazer) e conferir o console limpo.
