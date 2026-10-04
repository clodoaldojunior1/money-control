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
 *
 * **Sessão órfã vai para `/api/sessao-orfa`, não para `/login`.** Token
 * válido sem conta no banco (apagada, ou emitida contra outro branch da Neon)
 * ainda é "logada" para o proxy, que devolveria `/login` para `/app` — um laço
 * de redirecionamentos. Daqui não dá para apagar o cookie (Server Component não
 * escreve cookie); aquela rota dá. Ver 5.6 do ARCHITECTURE.
 */
export async function requireUser() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const id = sessao.user.id;
  const usuario = id ? await prisma.user.findUnique({ where: { id } }) : null;
  if (!usuario) redirect("/api/sessao-orfa");

  return usuario;
}
