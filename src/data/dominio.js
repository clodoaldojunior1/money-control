/**
 * Vocabulário do domínio: as listas que alimentam selects e segmented
 * controls, a formatação de moeda e o mapa de categoria dos gastos.
 *
 * Não confundir com `prisma/seed.mjs`: aquele povoa o banco, este só descreve
 * o domínio. (Este arquivo já se chamou `seed.js`, e o nome disputava
 * significado com o outro.)
 */

export const BRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const SERVICES = [
  "Volume russo",
  "Volume brasileiro",
  "Fox eyes",
  "Manutenção 21 dias",
  "Remoção + design",
  "Efeito híbrido",
];

export const DURATIONS = ["1h", "1h30", "2h", "2h30"];
export const STATUSES = ["Confirmado", "Aguardando sinal", "Concluído"];
export const METHODS = ["Pix", "Cartão", "Dinheiro"];
export const UNITS = ["un", "par", "bandeja", "ml"];

/**
 * A categoria exibida de um gasto sai do subtipo — é derivada, e por isso não
 * é coluna no banco (ver o cabeçalho de `prisma/schema.prisma`). Mora aqui
 * porque tanto a leitura no servidor quanto o provider precisam dela.
 */
export const CAT_POR_SUB = {
  fixo: "Fixo",
  variavel: "Material",
  superfluo: "Supérfluo",
  necessario: "Necessário",
};
