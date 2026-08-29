"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { usuarioAtual } from "../server/usuario";
import { comResultado, dia, dinheiro, inteiro, texto } from "../server/escrita";

// As três regras destas ações estão comentadas em `gastos.js`.

const campos = (m) => ({
  nome: texto(m.nome, "Nome do material"),
  quantidade: inteiro(m.quantidade, "Quantidade", { minimo: 1 }),
  unidade: texto(m.unidade, "Unidade"),
  custo: dinheiro(m.custo, "Custo"),
  minimo: inteiro(m.minimo, "Estoque mínimo"),
  compradoEm: dia(m.compradoEm, "Data da compra"),
});

export async function criarMaterial(material) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const criado = await prisma.material.create({
      data: { ...campos(material), userId: usuario.id, ...(material.id ? { id: material.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criado.id };
  });
}

export async function atualizarMaterial(id, material) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.material.updateMany({
      where: { id, userId: usuario.id },
      data: campos(material),
    });
    if (!count) return { erro: "Material não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirMaterial(id) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.material.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Material não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}
