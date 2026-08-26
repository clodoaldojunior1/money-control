import { prisma } from "../lib/prisma";

/**
 * O dono dos dados.
 *
 * **Placeholder até a etapa 4 (ARCHITECTURE 6.1).** Não existe sessão ainda,
 * então "o usuário" é a única conta do banco — a que `yarn db:seed` cria.
 * Quando o Auth.js entrar, esta função passa a ler a sessão e vira o
 * `requireUser()` do plano, sem que nenhum chamador mude.
 *
 * `SEED_EMAIL` tem precedência para o caso de o banco ganhar outras contas
 * antes da etapa 4; sem ela, cai na conta mais antiga.
 */
export async function usuarioAtual() {
  const email = process.env.SEED_EMAIL;

  const usuario =
    (email ? await prisma.user.findUnique({ where: { email } }) : null) ??
    (await prisma.user.findFirst({ orderBy: { criadoEm: "asc" } }));

  if (!usuario) {
    throw new Error("Nenhuma conta no banco — rode `yarn db:seed`.");
  }
  return usuario;
}
