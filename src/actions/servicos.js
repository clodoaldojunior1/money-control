"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireUser } from "../server/usuario";
import { comResultado, dinheiro, texto } from "../server/escrita";

/**
 * O catálogo de serviços.
 *
 * As três regras das ações valem aqui também (ver `gastos.js`): escopo por
 * `userId`, `revalidatePath` no fim, erro como `{ erro }`.
 */

/**
 * Cria um serviço — ou devolve o que já existe com esse nome.
 *
 * **Idempotente de propósito.** Quem chama é o campo de serviço do formulário,
 * onde digitar um nome que já existe é acidente comum (e um acento ou uma
 * maiúscula de diferença é ainda mais comum). Recusar com "já existe" faria a
 * usuária corrigir algo que, para ela, estava certo; devolver o existente leva
 * ao mesmo lugar sem atrito.
 *
 * A comparação ignora caixa e espaços nas pontas, mas o nome é gravado como
 * ela digitou: quem define a grafia do próprio serviço é ela.
 */
export async function criarServico(nome) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const limpo = texto(nome, "Nome do serviço");

    const existente = await prisma.servico.findFirst({
      where: { userId: usuario.id, nome: { equals: limpo, mode: "insensitive" } },
      select: { id: true, nome: true },
    });
    if (existente) return { id: existente.id, nome: existente.nome, jaExistia: true };

    const criado = await prisma.servico.create({
      data: { userId: usuario.id, nome: limpo },
      select: { id: true, nome: true },
    });
    revalidatePath("/app");
    return { id: criado.id, nome: criado.nome, jaExistia: false };
  });
}

/**
 * Fixa o preço sugerido do serviço.
 *
 * Só muda o que vem **depois**: lançamentos já gravados mantêm o valor que
 * foram cobrados. É o que separa "mudei meu preço" de "fiz uma promoção" — a
 * segunda nunca chega aqui.
 */
export async function definirPrecoPadrao(servicoId, preco) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const valor = dinheiro(preco, "Preço padrão");

    const { count } = await prisma.servico.updateMany({
      where: { id: servicoId, userId: usuario.id },
      data: { precoPadrao: valor },
    });
    if (!count) return { erro: "Serviço não encontrado." };

    revalidatePath("/app");
    return { ok: true };
  });
}
