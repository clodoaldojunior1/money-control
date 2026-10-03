-- Catálogo de serviços: o texto solto em Entrada e Agendamento passa a apontar
-- para uma linha de `Servico`.
--
-- **Escrita à mão de propósito.** O `prisma migrate dev` recusou gerar esta:
-- ele proporia apagar a coluna `servico` e criar `servicoId NOT NULL`, o que
-- falharia com 48 registros existentes. A ordem abaixo preserva o histórico —
-- cria, preenche, trava e só então apaga.
--
-- O Postgres executa DDL em transação, e o Prisma envolve a migração inteira
-- numa: se qualquer passo falhar, nada disto fica pela metade.

-- 1. A tabela nova.
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoPadrao" DECIMAL(10,2),
    "duracaoPadrao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Servico_userId_nome_key" ON "Servico"("userId", "nome");

ALTER TABLE "Servico" ADD CONSTRAINT "Servico_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Um serviço por nome distinto, ignorando caixa e espaços nas pontas: se o
--    histórico tiver "Volume russo" e "volume russo", eles viram um só. O nome
--    que fica é o primeiro em ordem alfabética, o que entre esses dois devolve
--    a grafia com maiúscula.
--
--    `gen_random_uuid()` em vez de cuid porque aqui não há código rodando, só
--    SQL. O formato do id é opaco para o app.
INSERT INTO "Servico" ("id", "userId", "nome")
SELECT gen_random_uuid()::text, "userId", MIN("servico")
FROM (
    SELECT "userId", "servico" FROM "Entrada"
    UNION ALL
    SELECT "userId", "servico" FROM "Agendamento"
) AS usados
GROUP BY "userId", lower(btrim("servico"));

-- 3. Entrada: cria a coluna, liga pelo nome, trava e só então apaga a antiga.
--    O `SET NOT NULL` é a rede: se algum registro não encontrar seu serviço,
--    a migração inteira falha em vez de perder a ligação em silêncio.
ALTER TABLE "Entrada" ADD COLUMN "servicoId" TEXT;

UPDATE "Entrada" e
SET "servicoId" = s."id"
FROM "Servico" s
WHERE s."userId" = e."userId"
  AND lower(btrim(s."nome")) = lower(btrim(e."servico"));

ALTER TABLE "Entrada" ALTER COLUMN "servicoId" SET NOT NULL;
ALTER TABLE "Entrada" DROP COLUMN "servico";

ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_servicoId_fkey"
    FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Entrada_servicoId_idx" ON "Entrada"("servicoId");

-- 4. Agendamento: o mesmo caminho.
ALTER TABLE "Agendamento" ADD COLUMN "servicoId" TEXT;

UPDATE "Agendamento" a
SET "servicoId" = s."id"
FROM "Servico" s
WHERE s."userId" = a."userId"
  AND lower(btrim(s."nome")) = lower(btrim(a."servico"));

ALTER TABLE "Agendamento" ALTER COLUMN "servicoId" SET NOT NULL;
ALTER TABLE "Agendamento" DROP COLUMN "servico";

ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_servicoId_fkey"
    FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Agendamento_servicoId_idx" ON "Agendamento"("servicoId");
