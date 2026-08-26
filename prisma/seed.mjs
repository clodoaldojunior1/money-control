/**
 * Popula o banco com a conta inicial e dados de exemplo.
 *
 * Roda com `yarn db:seed`. É idempotente: reexecutar apaga os dados da conta e
 * regrava, sem duplicar.
 *
 * Autocontido de propósito. A geração vivia em `src/data/seed.js`, mas ali ela
 * produzia strings de exibição e virou código morto quando o banco passou a
 * ser a fonte da verdade — aqui ela produz `Date` real, que é o que o schema
 * quer. Nada é duplicado: a lógica mudou de lugar.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// .env.local é o arquivo do Next; o seed lê o mesmo, para a URL não ser
// duplicada em dois lugares.
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida — copie .env.example para .env.local e preencha.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

const NOMES = [
  "Bruna Salles", "Carol Miranda", "Júlia Prado", "Larissa Reis", "Aline Duarte",
  "Marina Costa", "Paula Nogueira", "Rafaela Lima", "Sofia Bertoldi", "Tainá Moraes",
  "Vitória Campos", "Helena Braga", "Isadora Pires", "Nathália Rocha",
];

const SERVICOS = [
  ["Volume russo", 260], ["Manutenção 21 dias", 140], ["Fox eyes", 280],
  ["Volume brasileiro", 240], ["Remoção + design", 110], ["Efeito híbrido", 220],
];

const METODOS = ["Pix", "Cartão", "Pix", "Dinheiro"];

/** Data local, sem passar por UTC — mesma regra de src/lib/periodo.js. */
const dia = (ano, mes, d) => new Date(ano, mes, d);
const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate();

/** Distribui `quantidade` dias entre 1 e `ultimoDia`, do mais recente ao mais antigo. */
function diasEspalhados(quantidade, ultimoDia) {
  if (ultimoDia < 1) return [];
  const passo = ultimoDia / quantidade;
  return Array.from({ length: quantidade }, (_, i) =>
    Math.max(1, Math.round(ultimoDia - i * passo)));
}

function entradasDe(ano, mes, quantidade, ultimoDia) {
  return diasEspalhados(quantidade, ultimoDia).map((d, i) => {
    const [servico, valor] = SERVICOS[i % SERVICOS.length];
    return {
      cliente: NOMES[(i * 3) % NOMES.length],
      servico,
      metodo: METODOS[i % METODOS.length],
      data: dia(ano, mes, d),
      valor,
    };
  });
}

function dadosDeExemplo(hoje) {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diaDeHoje = hoje.getDate();

  const anoAnt = mes === 0 ? ano - 1 : ano;
  const mesAnt = mes === 0 ? 11 : mes - 1;
  const ultimoAnt = diasNoMes(anoAnt, mesAnt);

  // Preenche o mês corrente e o anterior: sem os dois, a comparação entre
  // meses e a navegação de período não teriam o que mostrar.
  const entradas = [
    ...entradasDe(ano, mes, Math.max(3, Math.min(14, diaDeHoje)), diaDeHoje),
    ...entradasDe(anoAnt, mesAnt, 28, ultimoAnt),
  ];

  const gastos = [
    { titulo: "Aluguel do studio", tipo: "trabalho", subtipo: "fixo", data: dia(ano, mes, 1), valor: 850 },
    { titulo: "Café da tarde", tipo: "pessoal", subtipo: "superfluo", data: dia(ano, mes, Math.max(1, diaDeHoje - 1)), valor: 32 },
    { titulo: "Mercado", tipo: "pessoal", subtipo: "necessario", data: dia(ano, mes, Math.max(1, diaDeHoje - 2)), valor: 410 },
    { titulo: "Aluguel do studio", tipo: "trabalho", subtipo: "fixo", data: dia(anoAnt, mesAnt, 1), valor: 850 },
    { titulo: "Internet do studio", tipo: "trabalho", subtipo: "fixo", data: dia(anoAnt, mesAnt, 12), valor: 120 },
    { titulo: "Mercado", tipo: "pessoal", subtipo: "necessario", data: dia(anoAnt, mesAnt, 20), valor: 380 },
  ];

  const materiais = [
    { nome: "Cílios 0.05 D mix", quantidade: 4, unidade: "bandeja", custo: 189.9, minimo: 2, compradoEm: dia(ano, mes, Math.max(1, diaDeHoje - 3)) },
    { nome: "Cola Glue Pro 5ml", quantidade: 2, unidade: "un", custo: 238, minimo: 1, compradoEm: dia(anoAnt, mesAnt, ultimoAnt - 3) },
    { nome: "Primer 15ml", quantidade: 1, unidade: "un", custo: 46, minimo: 2, compradoEm: dia(anoAnt, mesAnt, ultimoAnt - 6) },
    { nome: "Pinças curvas", quantidade: 3, unidade: "un", custo: 200, minimo: 1, compradoEm: dia(anoAnt, mesAnt, ultimoAnt - 9) },
  ];

  const hojeSemHora = dia(ano, mes, diaDeHoje);
  const agendamentos = [
    { cliente: "Bruna Salles", servico: "Volume russo", hora: "09:00", duracao: "2h30", status: "Concluído", valor: 260, data: hojeSemHora },
    { cliente: "Carol Miranda", servico: "Manutenção 21 dias", hora: "11:45", duracao: "1h30", status: "Em atendimento", valor: 140, data: hojeSemHora },
    { cliente: "Júlia Prado", servico: "Fox eyes", hora: "14:00", duracao: "2h", status: "Confirmado", valor: 280, data: hojeSemHora },
    { cliente: "Larissa Reis", servico: "Remoção + design", hora: "16:30", duracao: "1h", status: "Confirmado", valor: 110, data: hojeSemHora },
    { cliente: "Aline Duarte", servico: "Volume brasileiro", hora: "18:00", duracao: "2h", status: "Aguardando sinal", valor: 240, data: hojeSemHora },
  ];

  return { entradas, gastos, materiais, agendamentos };
}

async function main() {
  const email = process.env.SEED_EMAIL;
  const senha = process.env.SEED_SENHA;

  if (!email || !senha) {
    throw new Error(
      "Defina SEED_EMAIL e SEED_SENHA no .env.local antes de rodar o seed.\n" +
      "Veja .env.example.",
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { senhaHash },
    create: { email, senhaHash, nome: "Manuela Reis", studio: "Studio Manu Lashes" },
  });

  // Idempotente: limpa o que já existe desta conta antes de regravar.
  await prisma.$transaction([
    prisma.entrada.deleteMany({ where: { userId: user.id } }),
    prisma.gasto.deleteMany({ where: { userId: user.id } }),
    prisma.material.deleteMany({ where: { userId: user.id } }),
    prisma.agendamento.deleteMany({ where: { userId: user.id } }),
  ]);

  const { entradas, gastos, materiais, agendamentos } = dadosDeExemplo(new Date());
  const comDono = (lista) => lista.map((r) => ({ ...r, userId: user.id }));

  await prisma.$transaction([
    prisma.entrada.createMany({ data: comDono(entradas) }),
    prisma.gasto.createMany({ data: comDono(gastos) }),
    prisma.material.createMany({ data: comDono(materiais) }),
    prisma.agendamento.createMany({ data: comDono(agendamentos) }),
  ]);

  console.log(
    `Conta ${email} pronta com ${entradas.length} entradas, ${gastos.length} gastos, ` +
    `${materiais.length} materiais e ${agendamentos.length} agendamentos.`,
  );
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
