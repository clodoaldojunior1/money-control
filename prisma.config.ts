// Config do Prisma CLI. É arquivo de tooling — como o eslint.config.mjs —,
// então ser .ts não conflita com a decisão de o app ser JavaScript: o Prisma 7
// só reconhece este nome. O `typescript` já está em devDependencies por causa
// do eslint-config-next.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// O .env.local é o arquivo usado pelo Next; carregamos ele também para o CLI
// enxergar a DATABASE_URL sem precisar duplicar o valor no .env.
import { config } from "dotenv";
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
