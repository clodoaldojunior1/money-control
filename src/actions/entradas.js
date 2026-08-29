"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { usuarioAtual } from "../server/usuario";
import { comResultado, dia, dinheiro, texto } from "../server/escrita";

// As três regras destas ações estão comentadas em `gastos.js`.

const campos = (e) => ({
  cliente: texto(e.cliente, "Nome da cliente"),
  servico: texto(e.servico, "Serviço"),
  metodo: texto(e.metodo, "Forma de pagamento"),
  data: dia(e.data),
  valor: dinheiro(e.valor),
});

export async function criarEntrada(entrada) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const criada = await prisma.entrada.create({
      data: { ...campos(entrada), userId: usuario.id, ...(entrada.id ? { id: entrada.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criada.id };
  });
}

export async function atualizarEntrada(id, entrada) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.entrada.updateMany({
      where: { id, userId: usuario.id },
      data: campos(entrada),
    });
    if (!count) return { erro: "Entrada não encontrada." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirEntrada(id) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.entrada.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Entrada não encontrada." };
    revalidatePath("/app");
    return { id };
  });
}
