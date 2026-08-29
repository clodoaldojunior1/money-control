"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { usuarioAtual } from "../server/usuario";
import { comResultado, dia, dinheiro, texto, umDe } from "../server/escrita";

/**
 * Escrita de gastos.
 *
 * Três regras valem para as 4 entidades:
 *
 * 1. **Nunca `where: { id }` sozinho.** `updateMany`/`deleteMany` com
 *    `{ id, userId }` fazem o id de outra conta simplesmente não casar. Hoje
 *    há uma conta só e isso é teórico; na etapa 4 deixa de ser, e aqui custa
 *    uma linha.
 * 2. **`revalidatePath("/app")` no fim.** É ele que faz o servidor
 *    re-renderizar e mandar os dados novos — o provider não guarda cópia.
 * 3. **`criar` aceita um `id`**, para o desfazer de uma exclusão recriar o
 *    registro com a mesma identidade em vez de um sósia.
 */

const TIPOS = ["trabalho", "pessoal"];
const SUBTIPOS = ["fixo", "variavel", "superfluo", "necessario"];

const campos = (g) => ({
  titulo: texto(g.titulo, "Descrição", { padrao: "Gasto sem descrição" }),
  tipo: umDe(g.tipo, TIPOS, "Tipo"),
  subtipo: umDe(g.subtipo, SUBTIPOS, "Natureza do gasto"),
  data: dia(g.data),
  valor: dinheiro(g.valor),
});

export async function criarGasto(gasto) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const criado = await prisma.gasto.create({
      data: { ...campos(gasto), userId: usuario.id, ...(gasto.id ? { id: gasto.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criado.id };
  });
}

export async function atualizarGasto(id, gasto) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.gasto.updateMany({
      where: { id, userId: usuario.id },
      data: campos(gasto),
    });
    if (!count) return { erro: "Gasto não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirGasto(id) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.gasto.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Gasto não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}
