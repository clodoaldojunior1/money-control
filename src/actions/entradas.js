"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireUser } from "../server/usuario";
import { comResultado, dia, dinheiro, servicoDoUsuario, texto } from "../server/escrita";

// As três regras destas ações estão comentadas em `gastos.js`.

// `servicoId` é resolvido à parte porque exige o banco: ver `servicoDoUsuario`.
const campos = (e) => ({
  cliente: texto(e.cliente, "Nome da cliente"),
  metodo: texto(e.metodo, "Forma de pagamento"),
  data: dia(e.data),
  valor: dinheiro(e.valor),
});

export async function criarEntrada(entrada) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const servicoId = await servicoDoUsuario(prisma, entrada.servicoId, usuario.id);
    const criada = await prisma.entrada.create({
      data: { ...campos(entrada), servicoId, userId: usuario.id, ...(entrada.id ? { id: entrada.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criada.id };
  });
}

export async function atualizarEntrada(id, entrada) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const servicoId = await servicoDoUsuario(prisma, entrada.servicoId, usuario.id);
    const { count } = await prisma.entrada.updateMany({
      where: { id, userId: usuario.id },
      data: { ...campos(entrada), servicoId },
    });
    if (!count) return { erro: "Entrada não encontrada." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirEntrada(id) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const { count } = await prisma.entrada.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Entrada não encontrada." };
    revalidatePath("/app");
    return { id };
  });
}
