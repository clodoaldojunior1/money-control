import { diaCurto, periodoDe, periodoAnterior, dataDeISO } from "../lib/periodo";

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

const NOMES = [
  "Bruna Salles", "Carol Miranda", "Júlia Prado", "Larissa Reis", "Aline Duarte",
  "Marina Costa", "Paula Nogueira", "Rafaela Lima", "Sofia Bertoldi", "Tainá Moraes",
  "Vitória Campos", "Helena Braga", "Isadora Pires", "Nathália Rocha",
];

const SERVICOS_COM_PRECO = [
  ["Volume russo", 260], ["Manutenção 21 dias", 140], ["Fox eyes", 280],
  ["Volume brasileiro", 240], ["Remoção + design", 110], ["Efeito híbrido", 220],
];

const METODOS = ["Pix", "Cartão", "Pix", "Dinheiro"];

const pad = (n) => String(n).padStart(2, "0");
const diaDoPeriodo = (periodo, dia) => `${periodo}-${pad(dia)}`;
const diasNoMes = (periodo) => {
  const [ano, mes] = periodo.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
};

/** Distribui `quantidade` dias entre 1 e `ultimoDia`, do mais recente ao mais antigo. */
function diasEspalhados(quantidade, ultimoDia) {
  if (ultimoDia < 1) return [];
  const passo = ultimoDia / quantidade;
  return Array.from({ length: quantidade }, (_, i) =>
    Math.max(1, Math.round(ultimoDia - i * passo)));
}

function entradasDoPeriodo(periodo, quantidade, ultimoDia, prefixo) {
  return diasEspalhados(quantidade, ultimoDia).map((dia, i) => {
    const [servico, valor] = SERVICOS_COM_PRECO[i % SERVICOS_COM_PRECO.length];
    const iso = diaDoPeriodo(periodo, dia);
    return {
      id: `${prefixo}${i + 1}`,
      kind: "in",
      client: NOMES[(i * 3) % NOMES.length],
      service: servico,
      method: METODOS[i % METODOS.length],
      iso,
      date: diaCurto(iso),
      value: valor,
    };
  });
}

const gasto = (id, iso, tipo, sub, cat, title, value) => ({
  id, kind: "out", tipo, sub, cat, title, iso, date: diaCurto(iso), value,
});

const material = (id, iso, name, qty, unit, cost, min) => ({
  id, name, qty, unit, cost, min, iso, date: diaCurto(iso),
});

/**
 * Gera os dados mockados relativos a um dia. Determinístico: o mesmo `hoje`
 * produz sempre o mesmo conjunto.
 *
 * Preenche o mês corrente **e** o anterior — sem isso a comparação entre meses
 * e a navegação de período não teriam o que mostrar.
 */
export function gerarSeed(hoje) {
  const atual = periodoDe(hoje);
  const anterior = periodoAnterior(atual);
  const diaDeHoje = dataDeISO(hoje).getDate();

  const entradas = [
    ...entradasDoPeriodo(atual, Math.max(3, Math.min(14, diaDeHoje)), diaDeHoje, "e"),
    ...entradasDoPeriodo(anterior, 28, diasNoMes(anterior), "ea"),
  ];

  const gastos = [
    gasto("g1", diaDoPeriodo(atual, 1), "trabalho", "fixo", "Fixo", "Aluguel do studio", 850),
    gasto("g2", diaDoPeriodo(atual, Math.max(1, diaDeHoje - 1)), "pessoal", "superfluo", "Supérfluo", "Café da tarde", 32),
    gasto("g3", diaDoPeriodo(atual, Math.max(1, diaDeHoje - 2)), "pessoal", "necessario", "Necessário", "Mercado", 410),
    gasto("g4", diaDoPeriodo(anterior, 1), "trabalho", "fixo", "Fixo", "Aluguel do studio", 850),
    gasto("g5", diaDoPeriodo(anterior, 12), "trabalho", "fixo", "Fixo", "Internet do studio", 120),
    gasto("g6", diaDoPeriodo(anterior, 20), "pessoal", "necessario", "Necessário", "Mercado", 380),
  ];

  const ultimoDiaAnterior = diasNoMes(anterior);
  const materiais = [
    material("m1", diaDoPeriodo(atual, Math.max(1, diaDeHoje - 3)), "Cílios 0.05 D mix", 4, "bandeja", 189.9, 2),
    material("m2", diaDoPeriodo(anterior, ultimoDiaAnterior - 3), "Cola Glue Pro 5ml", 2, "un", 238, 1),
    material("m3", diaDoPeriodo(anterior, ultimoDiaAnterior - 6), "Primer 15ml", 1, "un", 46, 2),
    material("m4", diaDoPeriodo(anterior, ultimoDiaAnterior - 9), "Pinças curvas", 3, "un", 200, 1),
  ];

  const agenda = [
    { id: "a1", hour: "09:00", dur: "2h30", name: "Bruna Salles", service: "Volume russo", status: "Concluído", value: 260, date: hoje },
    { id: "a2", hour: "11:45", dur: "1h30", name: "Carol Miranda", service: "Manutenção 21 dias", status: "Em atendimento", value: 140, date: hoje },
    { id: "a3", hour: "14:00", dur: "2h", name: "Júlia Prado", service: "Fox eyes", status: "Confirmado", value: 280, date: hoje },
    { id: "a4", hour: "16:30", dur: "1h", name: "Larissa Reis", service: "Remoção + design", status: "Confirmado", value: 110, date: hoje },
    { id: "a5", hour: "18:00", dur: "2h", name: "Aline Duarte", service: "Volume brasileiro", status: "Aguardando sinal", value: 240, date: hoje },
  ];

  return { items: [...entradas, ...gastos], materiais, agenda };
}
