"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireUser } from "../server/usuario";
import { dadosDeExemplo } from "../server/exemplo";
import { comResultado, dia, diaISO, dinheiro, hora, inteiro, texto, umDe } from "../server/escrita";

/**
 * Ações que trocam **todos** os dados da conta de uma vez.
 *
 * As duas escrevem só nas linhas do usuário atual: apagam por `userId` e
 * gravam com ele. Nenhuma id de outra conta é alcançável daqui.
 *
 * Por que `substituirDados` existe: restaurar é destrutivo, e o app não usa
 * diálogo de confirmação em lugar nenhum (o padrão daqui é agir e oferecer
 * desfazer). Desfazer um "apagar tudo" exige o estado anterior, e quem o tem
 * é o cliente — ele já recebeu os dados do servidor. Então o desfazer devolve
 * o retrato que estava na tela.
 *
 * Uma transação para as duas: um restaurar que apagasse e falhasse ao gravar
 * deixaria a conta vazia, e é o único ponto do app onde isso seria possível.
 */

const TIPOS = ["trabalho", "pessoal"];
const SUBTIPOS = ["fixo", "variavel", "superfluo", "necessario"];

const entrada = (e) => ({
  id: e.id, cliente: texto(e.cliente, "Nome da cliente"), servico: texto(e.servico, "Serviço"),
  metodo: texto(e.metodo, "Forma de pagamento"), data: dia(e.data), valor: dinheiro(e.valor),
});

const gasto = (g) => ({
  id: g.id, titulo: texto(g.titulo, "Descrição", { padrao: "Gasto sem descrição" }),
  tipo: umDe(g.tipo, TIPOS, "Tipo"), subtipo: umDe(g.subtipo, SUBTIPOS, "Natureza do gasto"),
  data: dia(g.data), valor: dinheiro(g.valor),
});

const material = (m) => ({
  id: m.id, nome: texto(m.nome, "Nome do material"),
  quantidade: inteiro(m.quantidade, "Quantidade", { minimo: 1 }), unidade: texto(m.unidade, "Unidade"),
  custo: dinheiro(m.custo, "Custo"), minimo: inteiro(m.minimo, "Estoque mínimo"),
  compradoEm: dia(m.compradoEm, "Data da compra"),
});

const agendamento = (a) => ({
  id: a.id, cliente: texto(a.cliente, "Nome da cliente"), servico: texto(a.servico, "Serviço"),
  data: dia(a.data), hora: hora(a.hora), duracao: texto(a.duracao, "Duração"),
  status: texto(a.status, "Status"), valor: dinheiro(a.valor, "Valor do serviço"),
});

/**
 * **As duas ações só existem no `yarn dev`.** Em produção a conta tem dados
 * reais, e um toque sem querer no drawer apagaria o histórico inteiro — com um
 * desfazer que some em 4 segundos. Esconder o botão não bastaria: Server Action
 * é endpoint e continua respondendo sem botão nenhum. Então a trava vem antes
 * de qualquer acesso ao banco.
 *
 * `NODE_ENV` e não `VERCEL_ENV`: o preview também é `production`, e é o que se
 * quer — enquanto a `DATABASE_URL` de preview não estiver separada, ele aponta
 * para o banco real.
 */
const PERMITIDO = process.env.NODE_ENV !== "production";
const RECUSA = { erro: "Restaurar dados de exemplo só existe em desenvolvimento." };

/** Apaga tudo da conta e grava o conjunto recebido, já no formato do banco. */
async function regravar(userId, { entradas, gastos, materiais, agendamentos }) {
  const comDono = (lista) => lista.map((r) => ({ ...r, userId }));

  await prisma.$transaction([
    prisma.entrada.deleteMany({ where: { userId } }),
    prisma.gasto.deleteMany({ where: { userId } }),
    prisma.material.deleteMany({ where: { userId } }),
    prisma.agendamento.deleteMany({ where: { userId } }),
    prisma.entrada.createMany({ data: comDono(entradas) }),
    prisma.gasto.createMany({ data: comDono(gastos) }),
    prisma.material.createMany({ data: comDono(materiais) }),
    prisma.agendamento.createMany({ data: comDono(agendamentos) }),
  ]);

  revalidatePath("/app");
}

/** `hoje` vem do cliente: o dia de exemplo é o dela, não o do servidor. */
export async function restaurarExemplo(hoje) {
  if (!PERMITIDO) return RECUSA;
  return comResultado(async () => {
    const usuario = await requireUser();
    await regravar(usuario.id, dadosDeExemplo(diaISO(hoje)));
    return { ok: true };
  });
}

/** Desfazer do restaurar: devolve o retrato que o cliente tinha em mãos. */
export async function substituirDados(retrato) {
  if (!PERMITIDO) return RECUSA;
  return comResultado(async () => {
    const usuario = await requireUser();
    await regravar(usuario.id, {
      entradas: (retrato.entradas ?? []).map(entrada),
      gastos: (retrato.gastos ?? []).map(gasto),
      materiais: (retrato.materiais ?? []).map(material),
      agendamentos: (retrato.agendamentos ?? []).map(agendamento),
    });
    return { ok: true };
  });
}
