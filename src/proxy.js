import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * A guarda de rota. Importa **só** a config leve: este arquivo roda no runtime
 * edge, onde o Prisma do `auth.js` não conectaria (ver `auth.config.js`).
 *
 * Chama-se `proxy.js` e não `middleware.js` porque o Next 16 deprecou aquele
 * nome — a documentação do Auth.js ainda fala em middleware, mas o conteúdo é
 * o mesmo.
 *
 * **As duas regras ficam aqui, e não no callback `authorized`.** A primeira
 * versão devolvia `Response.redirect` de dentro daquele callback, e o
 * redirecionamento simplesmente não acontecia: a requisição seguia e a tela de
 * login aparecia para quem já estava logada (medido com `fetch(..., { redirect:
 * "manual" })`, que voltou 200 em vez de um redirect opaco). Devolver `false`
 * dali funciona, mas só sabe mandar para a página de login. Escrevendo as duas
 * decisões aqui, a regra é explícita e não depende de como a biblioteca
 * interpreta o retorno.
 */
const { auth } = NextAuth(authConfig);

/** Rotas que exigem sessão. */
const PRECISA_DE_SESSAO = ["/app"];

/** Rotas que não fazem sentido para quem já entrou. */
const SO_DESLOGADA = ["/login", "/cadastro"];

export default auth((requisicao) => {
  const logada = !!requisicao.auth?.user;
  const { pathname } = requisicao.nextUrl;

  if (!logada && PRECISA_DE_SESSAO.some((rota) => pathname.startsWith(rota))) {
    return Response.redirect(new URL("/login", requisicao.nextUrl));
  }

  if (logada && SO_DESLOGADA.includes(pathname)) {
    return Response.redirect(new URL("/app", requisicao.nextUrl));
  }

  // Sem retorno: a requisição segue.
});

export const config = {
  /**
   * Tudo, menos o que não faz sentido interceptar: os endpoints do próprio
   * Auth.js, os assets do Next e arquivos com extensão. Sem esse recorte o
   * proxy rodaria a cada ícone pedido.
   */
  // A barra dupla antes do ponto é obrigatória: isto é uma string JS, e nela
  // uma barra só some — o ponto vira "qualquer caractere", o lookahead passa a
  // rejeitar toda rota com pelo menos uma letra, e o proxy roda apenas em `/`.
  // Foi exatamente o que aconteceu aqui, e o sintoma não aponta para a causa:
  // a proteção parecia funcionar porque `requireUser()` redirecionava por baixo.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.).*)"],
};
