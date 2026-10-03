"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireUser } from "../server/usuario";
import { comResultado, dia, dinheiro, hora, servicoDoUsuario, texto } from "../server/escrita";

// As três regras destas ações estão comentadas em `gastos.js`.

// `servicoId` é resolvido à parte porque exige o banco: ver `servicoDoUsuario`.
const campos = (a) => ({
  cliente: texto(a.cliente, "Nome da cliente"),
  data: dia(a.data),
  hora: hora(a.hora),
  duracao: texto(a.duracao, "Duração"),
  status: texto(a.status, "Status"),
  valor: dinheiro(a.valor, "Valor do serviço"),
});

export async function criarAgendamento(agendamento) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const servicoId = await servicoDoUsuario(prisma, agendamento.servicoId, usuario.id);
    const criado = await prisma.agendamento.create({
      data: { ...campos(agendamento), servicoId, userId: usuario.id, ...(agendamento.id ? { id: agendamento.id } : {}) },
    });
    revalidatePath("/app");
    return { id: criado.id };
  });
}

export async function atualizarAgendamento(id, agendamento) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const servicoId = await servicoDoUsuario(prisma, agendamento.servicoId, usuario.id);
    const { count } = await prisma.agendamento.updateMany({
      where: { id, userId: usuario.id },
      data: { ...campos(agendamento), servicoId },
    });
    if (!count) return { erro: "Agendamento não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}

export async function excluirAgendamento(id) {
  return comResultado(async () => {
    const usuario = await requireUser();
    const { count } = await prisma.agendamento.deleteMany({ where: { id, userId: usuario.id } });
    if (!count) return { erro: "Agendamento não encontrado." };
    revalidatePath("/app");
    return { id };
  });
}
