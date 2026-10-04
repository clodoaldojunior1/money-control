import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { prisma } from "../../../lib/prisma";

/**
 * Encerra a sessão cujo token aponta para uma conta que não existe mais.
 *
 * É para cá que `requireUser()` manda quando o JWT é válido mas o `id` dele
 * não está no banco — conta apagada, ou token emitido contra outro branch da
 * Neon. Sem isso o navegador entrava em laço: o proxy vê o token e manda
 * `/login` para `/app`, e `requireUser()` não acha a conta e manda `/app` de
 * volta para `/login`.
 *
 * **Por que uma rota, e não o próprio `requireUser()`:** ele roda em Server
 * Component, onde cookie não se escreve — e apagar o cookie é a única coisa que
 * convence o proxy. Aqui, num route handler, `signOut` pode.
 *
 * **Só desloga se a sessão for mesmo órfã.** É um GET, então qualquer página
 * poderia apontar um `<img>` para cá; se deslogasse incondicionalmente, viraria
 * um botão de "sair" que um estranho aperta por ela. Com a conta existindo, a
 * rota não faz nada além de devolver para `/app`.
 */
export async function GET() {
  const sessao = await auth();
  const id = sessao?.user?.id;

  if (id) {
    const usuario = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (usuario) redirect("/app");
  }

  await signOut({ redirectTo: "/login" });
}
