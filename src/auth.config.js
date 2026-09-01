/**
 * Configuração **leve** do Auth.js — a metade que o middleware pode carregar.
 *
 * O middleware do Next roda no runtime **edge**, onde não existem os módulos
 * nativos do Node: `bcryptjs` até funciona (é JS puro), mas o Prisma não
 * conecta. Se a config completa fosse importada ali, o build quebraria — e é
 * por isso que a configuração do Auth.js v5 vive partida em dois arquivos.
 *
 * Aqui só entra o que é declarativo: a página de login e os callbacks que
 * montam o token. O provider de credenciais, que precisa do banco, fica em
 * `auth.js`; quem decide o acesso por rota é o `proxy.js`.
 */

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  /**
   * Lista vazia de propósito: o provider de credenciais precisa do banco e
   * mora em `auth.js`. Mas a chave tem que existir — `NextAuth()` itera sobre
   * ela na inicialização e, sem isso, estoura com um `undefined.map` que não
   * diz nada sobre a causa.
   */
  providers: [],

  callbacks: {
    /**
     * O id do usuário viaja no token porque a sessão é JWT (obrigatório com
     * Credentials) e não há tabela de sessões para consultar. É esse id que
     * `requireUser()` usa para escopar toda leitura e escrita.
     */
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
};
