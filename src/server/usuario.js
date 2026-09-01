import { redirect } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../lib/prisma";

/**
 * O dono dos dados da requisição atual.
 *
 * Substituiu o placeholder que devolvia a única conta do banco. Toda leitura e
 * toda escrita passam por aqui, e é o `id` daqui que escopa as consultas —
 * nunca um id vindo do cliente.
 *
 * **Redireciona em vez de devolver `null`.** Quem chama está sempre dentro de
 * `/app` ou de uma Server Action de `/app`, e nesses lugares "sem sessão" não
 * é um estado a tratar: é para sair. O middleware já barra a navegação; isto
 * cobre o caso da sessão que expira **entre** a página abrir e a ação rodar —
 * o middleware não vê Server Action de rota já carregada.
 */
export async function requireUser() {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id) redirect("/login");

  const usuario = await prisma.user.findUnique({ where: { id } });
  if (!usuario) redirect("/login"); // conta apagada com o token ainda válido

  return usuario;
}
