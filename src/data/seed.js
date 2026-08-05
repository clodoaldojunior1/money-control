export const BRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const MES_ANTERIOR = 7420;
export const HOJE_ISO = "2026-08-01";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const fmtDia = (iso) => {
  const [, m, d] = iso.split("-");
  return `${d} ${MESES[+m - 1]}`;
};

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

function buildEntradasSeed() {
  const nomes = [
    "Bruna Salles", "Carol Miranda", "Júlia Prado", "Larissa Reis", "Aline Duarte",
    "Marina Costa", "Paula Nogueira", "Rafaela Lima", "Sofia Bertoldi", "Tainá Moraes",
    "Vitória Campos", "Helena Braga", "Isadora Pires", "Nathália Rocha",
  ];
  const servicos = [
    ["Volume russo", 260], ["Manutenção 21 dias", 140], ["Fox eyes", 280],
    ["Volume brasileiro", 240], ["Remoção + design", 110], ["Efeito híbrido", 220],
  ];
  const metodos = ["Pix", "Cartão", "Pix", "Dinheiro"];

  return Array.from({ length: 42 }, (_, i) => {
    const sv = servicos[i % servicos.length];
    const dia = Math.max(1, 31 - Math.floor((i - 3) * 0.72));
    const iso = i < 3 ? HOJE_ISO : `2026-07-${String(dia).padStart(2, "0")}`;
    return {
      id: `e${i + 1}`,
      kind: "in",
      client: nomes[i % nomes.length],
      service: sv[0],
      method: metodos[i % metodos.length],
      iso,
      date: fmtDia(iso),
      value: sv[1],
    };
  });
}

export const ENTRADAS_SEED = buildEntradasSeed();

export const AGENDA_SEED = [
  { id: "a1", hour: "09:00", dur: "2h30", name: "Bruna Salles", service: "Volume russo", status: "Concluído", value: 260, date: HOJE_ISO },
  { id: "a2", hour: "11:45", dur: "1h30", name: "Carol Miranda", service: "Manutenção 21 dias", status: "Em atendimento", value: 140, date: HOJE_ISO },
  { id: "a3", hour: "14:00", dur: "2h", name: "Júlia Prado", service: "Fox eyes", status: "Confirmado", value: 280, date: HOJE_ISO },
  { id: "a4", hour: "16:30", dur: "1h", name: "Larissa Reis", service: "Remoção + design", status: "Confirmado", value: 110, date: HOJE_ISO },
  { id: "a5", hour: "18:00", dur: "2h", name: "Aline Duarte", service: "Volume brasileiro", status: "Aguardando sinal", value: 240, date: HOJE_ISO },
];

export const MATERIAIS_SEED = [
  { id: "m1", name: "Cílios 0.05 D mix", qty: 4, unit: "bandeja", cost: 189.9, min: 2, iso: "2026-07-31", date: "31 jul" },
  { id: "m2", name: "Cola Glue Pro 5ml", qty: 2, unit: "un", cost: 238, min: 1, iso: "2026-07-28", date: "28 jul" },
  { id: "m3", name: "Primer 15ml", qty: 1, unit: "un", cost: 46, min: 2, iso: "2026-07-28", date: "28 jul" },
  { id: "m4", name: "Pinças curvas", qty: 3, unit: "un", cost: 200, min: 1, iso: "2026-07-26", date: "26 jul" },
];

export const GASTOS_SEED = [
  { id: "g1", kind: "out", tipo: "trabalho", sub: "fixo", title: "Aluguel do studio", cat: "Fixo", iso: HOJE_ISO, date: fmtDia(HOJE_ISO), value: 850 },
  { id: "g2", kind: "out", tipo: "pessoal", sub: "superfluo", title: "Café da tarde", cat: "Supérfluo", iso: "2026-07-30", date: "30 jul", value: 32 },
  { id: "g3", kind: "out", tipo: "pessoal", sub: "necessario", title: "Mercado", cat: "Necessário", iso: "2026-07-29", date: "29 jul", value: 410 },
];
