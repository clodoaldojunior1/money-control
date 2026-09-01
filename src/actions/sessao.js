"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "../auth";

/**
 * Entrar e sair.
 *
 * Ficam aqui, e não dentro dos componentes, porque `signIn`/`signOut` do
 * Auth.js v5 precisam do runtime Node — o mesmo motivo que parte a config em
 * dois arquivos (ver `auth.config.js`).
 */

/**
 * `CredentialsSignin` é o erro que o Auth.js lança quando o `authorize`
 * devolve `null`. Só ele vira mensagem para a usuária; qualquer outro é
 * problema nosso, e dizer "e-mail ou senha incorretos" para uma falha de
 * banco mandaria ela tentar de novo para sempre.
 */
export async function entrar({ email, senha }) {
  try {
    await signIn("credentials", { email, senha, redirect: false });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") return { erro: "E-mail ou senha incorretos." };
      return { erro: "Não foi possível entrar. Tente de novo." };
    }
    throw e;
  }
}

export async function sair() {
  await signOut({ redirectTo: "/login" });
}
