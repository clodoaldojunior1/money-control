/**
 * Popula o banco com a conta inicial e dados de exemplo.
 *
 * Roda com `yarn db:seed`. É idempotente: reexecutar apaga os dados da conta e
 * regrava, sem duplicar.
 *
 * A geração dos dados vive em `src/server/exemplo.js`, compartilhada com a
 * ação "Restaurar dados de exemplo" do drawer — duplicá-la faria as duas
 * divergirem no primeiro ajuste. Aquele módulo é puro (não importa Prisma nem
 * Next), então este script o importa rodando em Node puro.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { dadosDeExemplo } from "../src/server/exemplo.js";
import { isoDeData } from "../src/lib/periodo.js";

// .env.local é o arquivo do Next; o seed lê o mesmo, para a URL não ser
// duplicada em dois lugares.
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida — copie .env.example para .env.local e preencha.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

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

  const { entradas, gastos, materiais, agendamentos } = dadosDeExemplo(isoDeData(new Date()));
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
