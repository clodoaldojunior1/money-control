import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";
import { authConfig } from "./auth.config";

/**
 * Configuração completa do Auth.js — a metade que só roda no Node.
 *
 * Ver `auth.config.js` para o porquê da divisão. Aqui entra o provider de
 * credenciais, que consulta o banco e compara o hash — duas coisas que o
 * runtime edge do middleware não faz.
 *
 * **Sessão em JWT, não em banco.** Não é preferência: o provider Credentials
 * do Auth.js v5 só funciona com JWT.
 *
 * **`bcryptjs`, não `bcrypt`.** O segundo é binário nativo e precisa compilar
 * no destino; o primeiro é JS puro e sobrevive ao deploy da Vercel.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },

      /**
       * Devolver `null` é o que o Auth.js entende como "não autenticou". A
       * mensagem é sempre a mesma para e-mail inexistente e senha errada:
       * distinguir os dois contaria a um estranho quais e-mails têm conta.
       */
      async authorize(credenciais) {
        const email = String(credenciais?.email ?? "").trim().toLowerCase();
        const senha = String(credenciais?.senha ?? "");
        if (!email || !senha) return null;

        const usuario = await prisma.user.findUnique({ where: { email } });
        if (!usuario) return null;

        const confere = await bcrypt.compare(senha, usuario.senhaHash);
        if (!confere) return null;

        return { id: usuario.id, email: usuario.email, name: usuario.nome };
      },
    }),
  ],
});
