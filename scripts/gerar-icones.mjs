// Gera os ícones do PWA a partir da marca (N dentro de um C). Rode com
// `node scripts/gerar-icones.mjs` quando a marca mudar; os PNGs ficam
// versionados. Usa o `sharp`, que já vem junto do Next.
//
// As cores são literais porque isto vira imagem: não passa pelo tema.
// Têm que acompanhar `accent`/`accentRamp` de src/theme/tokens.js.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const FUNDO = "#1f5f5b";
const ANEL = "#a6cbc6";
const LETRA = "#ffffff";

// Letra e anel ficam dentro do raio de 205px (zona segura do maskable,
// 80% do lado) — por isso a mesma arte serve aos dois formatos.
const marca = `
  <path d="M371 160 A150 150 0 1 0 371 352" fill="none" stroke="${ANEL}" stroke-width="30" stroke-linecap="round"/>
  <path d="M196 322 V190 L316 322 V190" fill="none" stroke="${LETRA}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>`;

const svg = (raio) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${raio}" fill="${FUNDO}"/>${marca}
</svg>`;

const arredondado = svg(112);
const sangrado = svg(0);

writeFileSync("src/app/icon.svg", arredondado);

const png = (origem, lado, destino) =>
  sharp(Buffer.from(origem)).resize(lado, lado).png().toFile(destino);

await Promise.all([
  png(arredondado, 192, "public/icon-192.png"),
  png(arredondado, 512, "public/icon-512.png"),
  png(sangrado, 512, "public/icon-maskable-512.png"),
  png(sangrado, 180, "src/app/apple-icon.png"),
]);
console.log("ícones gerados");
