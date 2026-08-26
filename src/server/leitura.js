import { prisma } from "../lib/prisma";
import { CAT_POR_SUB } from "../data/dominio";
import { diaCurto, isoDeDataUTC } from "../lib/periodo";
import { usuarioAtual } from "./usuario";

/**
 * Leitura do banco para a UI. Roda só no servidor.
 *
 * **Esta é a borda de conversão** (ARCHITECTURE 5.0). Duas coisas que vêm do
 * Prisma não servem como prop de Server Component:
 *
 * - `Decimal` não é serializável — vira `Number`. Cabe: `Decimal(10,2)` é
 *   dinheiro em centavos, muito abaixo do inteiro seguro do JS. A precisão
 *   decimal é responsabilidade do banco, que é onde a soma acontece.
 * - `Date` não é o formato que a UI fala. Vira `"YYYY-MM-DD"` via
 *   `isoDeDataUTC` (leia o porquê do UTC lá).
 *
 * Convertendo aqui, **nenhum componente muda**: o formato de saída é
 * exatamente o que o seed mockado produzia. Os campos derivados (`date` curto,
 * `cat`, `kind`) também nascem aqui, pelo mesmo motivo de não serem coluna.
 */

const valor = (decimal) => Number(decimal);

const deEntrada = (e) => {
  const iso = isoDeDataUTC(e.data);
  return {
    id: e.id,
    kind: "in",
    client: e.cliente,
    service: e.servico,
    method: e.metodo,
    iso,
    date: diaCurto(iso),
    value: valor(e.valor),
  };
};

const deGasto = (g) => {
  const iso = isoDeDataUTC(g.data);
  return {
    id: g.id,
    kind: "out",
    tipo: g.tipo,
    sub: g.subtipo,
    cat: CAT_POR_SUB[g.subtipo],
    title: g.titulo,
    iso,
    date: diaCurto(iso),
    value: valor(g.valor),
  };
};

const deMaterial = (m) => {
  const iso = isoDeDataUTC(m.compradoEm);
  return {
    id: m.id,
    name: m.nome,
    qty: m.quantidade,
    unit: m.unidade,
    cost: valor(m.custo),
    min: m.minimo,
    iso,
    date: diaCurto(iso),
  };
};

// A agenda é a exceção: `date` aqui é o dia ISO, não o rótulo curto — é assim
// que os componentes e o AgendaSheet já falam.
const deAgendamento = (a) => ({
  id: a.id,
  name: a.cliente,
  service: a.servico,
  date: isoDeDataUTC(a.data),
  hour: a.hora,
  dur: a.duracao,
  status: a.status,
  value: valor(a.valor),
});

/**
 * Todos os registros da conta, no formato da UI.
 *
 * **Busca tudo de propósito.** A navegação de período acontece no cliente,
 * filtrando por prefixo do `iso` (3.7), e é isso que a mantém instantânea e
 * sem refetch. São dezenas de registros por ano de uso — quando o volume
 * pesar, o corte é por período, e aí a navegação vira URL para o servidor
 * saber o que buscar.
 *
 * A ordem da agenda vem do banco porque a UI a renderiza na ordem do array;
 * as demais listas são reordenadas nas abas.
 */
export async function carregarDadosIniciais() {
  const usuario = await usuarioAtual();
  const doDono = { where: { userId: usuario.id } };

  const [entradas, gastos, materiais, agendamentos] = await Promise.all([
    prisma.entrada.findMany({ ...doDono, orderBy: { data: "desc" } }),
    prisma.gasto.findMany({ ...doDono, orderBy: { data: "desc" } }),
    prisma.material.findMany({ ...doDono, orderBy: { compradoEm: "desc" } }),
    prisma.agendamento.findMany({ ...doDono, orderBy: [{ data: "asc" }, { hora: "asc" }] }),
  ]);

  return {
    items: [...entradas.map(deEntrada), ...gastos.map(deGasto)],
    materiais: materiais.map(deMaterial),
    agendamentos: agendamentos.map(deAgendamento),
  };
}
