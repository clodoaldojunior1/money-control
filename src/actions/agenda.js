"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { usuarioAtual } from "../server/usuario";
import { comResultado, dia, dinheiro, hora, texto } from "../server/escrita";

// As três regras destas ações estão comentadas em `gastos.js`.

const campos = (a) => ({
  cliente: texto(a.cliente, "Nome da cliente"),
  servico: texto(a.servico, "Serviço"),
  data: dia(a.data),
  hora: hora(a.hora),
  duracao: texto(a.duracao, "Duração"),
  status: texto(a.status, "Status"),
  valor: dinheiro(a.valor, "Valor do serviço"),
});

export async function criarAgendamento(agendamento) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const criado = await prisma.agendamento.create({
      data: { ...campos(agendamento), userId: usuario.id, ...(agendamento.id ? { id: agendamento.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criado.id };
  });
}

export async function atualizarAgendamento(id, agendamento) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.agendamento.updateMany({
      where: { id, userId: usuario.id },
      data: campos(agendamento),
    });
    if (!count) return { erro: "Agendamento não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirAgendamento(id) {
  return comResultado(async () => {
    const usuario = await usuarioAtual();
    const { count } = await prisma.agendamento.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Agendamento não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}
