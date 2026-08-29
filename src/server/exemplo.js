/**
 * Gerador dos dados de exemplo, no formato do banco.
 *
 * Dois consumidores: `prisma/seed.mjs` (`yarn db:seed`) e a ação
 * "Restaurar dados de exemplo" do drawer. Vivia dentro do seed, e duplicá-lo
 * na ação faria os dois divergirem no primeiro ajuste.
 *
 * Puro de propósito: não importa Prisma nem nada do Next, e por isso o seed
 * consegue importá-lo rodando em Node puro.
 *
 * Determinístico: o mesmo `hoje` gera sempre o mesmo conjunto. Preenche o mês
 * corrente **e** o anterior — sem os dois, a comparação entre meses e a
 * navegação de período não teriam o que mostrar.
 *
 * `hoje` entra como string `"YYYY-MM-DD"`, não como `Date`, justamente para
 * não haver fuso nenhum no meio: os dois chamadores têm noções diferentes de
 * "hoje" (o do seed é de quem roda o comando, o da ação é o do navegador da
 * usuária) e quem sabe qual é o dia certo é o chamador.
 */

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

/**
 * Meia-noite UTC, que é como o Prisma grava e lê `@db.Date` (ver
 * `isoDeDataUTC` em `src/lib/periodo.js`). O construtor local gravaria um dia
 * diferente conforme o fuso de quem roda.
 */
const dia = (ano, mes, d) => new Date(Date.UTC(ano, mes, d));
const diasNoMes = (ano, mes) => new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

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

/** `hoje` é o dia corrente em ISO: `"2026-08-29"`. */
export function dadosDeExemplo(hoje) {
  const [ano, mesUm, diaDeHoje] = hoje.split("-").map(Number);
  const mes = mesUm - 1;

  const anoAnt = mes === 0 ? ano - 1 : ano;
  const mesAnt = mes === 0 ? 11 : mes - 1;
  const ultimoAnt = diasNoMes(anoAnt, mesAnt);

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
