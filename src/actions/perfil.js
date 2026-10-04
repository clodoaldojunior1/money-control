"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireUser } from "../server/usuario";
import { comResultado, DadoInvalido, texto } from "../server/escrita";

/**
 * A conta de quem está logada: perfil e senha.
 *
 * Existe porque trocar nome, studio ou senha exigia SQL no painel da Neon. As
 * regras das ações valem aqui (ver `gastos.js`), com uma diferença de forma: o
 * registro é o próprio `requireUser()`, então o escopo é o `id` da sessão e
 * não há id vindo do cliente para conferir.
 *
 * **O e-mail fica de fora de propósito.** É a identidade do login, e sem
 * recuperação de senha por e-mail (6.4) um erro de digitação ali tranca a conta
 * — e a saída seria de novo o SQL que esta tela veio substituir.
 */

const LIMITE = 80;

function curto(valor, campo) {
  if (valor.length > LIMITE) throw new DadoInvalido(`${campo} tem no máximo ${LIMITE} caracteres.`);
  return valor;
}

/** Vazio vira `null`: studio e WhatsApp são opcionais no schema. */
const opcional = (valor, campo) => {
  const limpo = String(valor ?? "").trim();
  return limpo ? curto(limpo, campo) : null;
};

/**
 * Grava nome, studio e WhatsApp. Serve também ao desfazer, que é chamar de
 * novo com os valores que estavam na tela.
 */
export async function atualizarPerfil(perfil) {
  return comResultado(async () => {
    const usuario = await requireUser();
    await prisma.user.update({
      where: { id: usuario.id },
      data: {
        nome: curto(texto(perfil?.nome, "Nome"), "Nome"),
        studio: opcional(perfil?.studio, "Nome do studio"),
        whatsapp: opcional(perfil?.whatsapp, "WhatsApp"),
      },
    });
    revalidatePath("/app");
    return { ok: true };
  });
}

const MINIMO_SENHA = 8;

/**
 * Troca a senha, exigindo a atual.
 *
 * A senha atual não é cerimônia: a sessão dura 30 dias, e um celular
 * desbloqueado na mão de outra pessoa não deveria bastar para tomar a conta.
 *
 * **Não derruba as outras sessões.** A sessão é JWT (5.6): não há tabela para
 * apagar, e o token já emitido segue válido até expirar. Invalidar exigiria uma
 * versão de senha no token, conferida a cada requisição — custo que só se paga
 * quando houver motivo para expulsar um aparelho. Com uma usuária e os
 * aparelhos dela, não há.
 *
 * Sem desfazer, também de propósito: o "antes" seria a senha antiga em texto,
 * e ela não volta do hash.
 */
export async function trocarSenha({ atual, nova } = {}) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const senhaAtual = String(atual ?? "");
    const senhaNova = String(nova ?? "");

    if (senhaNova.length < MINIMO_SENHA) {
      throw new DadoInvalido(`A nova senha tem no mínimo ${MINIMO_SENHA} caracteres.`);
    }
    if (!(await bcrypt.compare(senhaAtual, usuario.senhaHash))) {
      throw new DadoInvalido("A senha atual não confere.");
    }
    if (senhaNova === senhaAtual) {
      throw new DadoInvalido("A nova senha é igual à atual.");
    }

    // Mesmo custo do seed, para os dois caminhos gravarem hashes iguais.
    await prisma.user.update({
      where: { id: usuario.id },
      data: { senhaHash: await bcrypt.hash(senhaNova, 10) },
    });
    // Sem `revalidatePath`: nada na tela deriva do hash.
    return { ok: true };
  });
}
