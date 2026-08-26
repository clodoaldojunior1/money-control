import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Instância única do Prisma.
 *
 * O Prisma 7 não conecta mais direto pela URL: exige um **driver adapter**.
 * Usamos o do Neon, que fala com o banco pelo driver serverless deles — o que
 * casa com o ambiente sem processo persistente da Vercel.
 *
 * O singleton existe por causa do hot reload: em desenvolvimento os módulos
 * são reavaliados a cada alteração e, sem guardar a instância no escopo
 * global, cada recarga abriria uma conexão nova até estourar o limite do
 * banco. Em produção o módulo é avaliado uma vez só.
 */
const globalParaPrisma = globalThis;

function criarCliente() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida — veja .env.example");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

export const prisma = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
