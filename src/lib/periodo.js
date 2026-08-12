/**
 * Datas e períodos do app.
 *
 * Duas regras que valem para tudo aqui:
 *
 * 1. **Nunca `new Date("2026-08-01")`.** A string ISO só com data é
 *    interpretada como UTC; no fuso do Brasil isso volta um dia. Datas ISO são
 *    partidas na mão e remontadas com `new Date(ano, mes, dia)`, que é local.
 * 2. **Nada aqui roda durante o SSR.** Todas as funções que dependem do "agora"
 *    só devem ser chamadas depois da montagem — ver `AppDataProvider`.
 *
 * Vocabulário: `iso` é um dia (`"2026-08-01"`), `periodo` é um mês
 * (`"2026-08"`).
 */

const LOCALE = "pt-BR";

const pad = (n) => String(n).padStart(2, "0");

/** "2026-08-01" → Date local (meia-noite), sem passar por UTC. */
export function dataDeISO(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function isoDeData(data) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

/** Dia de hoje. Só chame no cliente. */
export function hojeISO() {
  return isoDeData(new Date());
}

/** "2026-08-01" → "2026-08" */
export function periodoDe(iso) {
  return iso.slice(0, 7);
}

/** Mês corrente. Só chame no cliente. */
export function periodoAtual() {
  return periodoDe(hojeISO());
}

/** Desloca o período em N meses. `deslocarPeriodo("2026-01", -1)` → "2025-12". */
export function deslocarPeriodo(periodo, meses) {
  const [ano, mes] = periodo.split("-").map(Number);
  const d = new Date(ano, mes - 1 + meses, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export const periodoAnterior = (periodo) => deslocarPeriodo(periodo, -1);
export const periodoSeguinte = (periodo) => deslocarPeriodo(periodo, 1);

const primeiroDiaDo = (periodo) => {
  const [ano, mes] = periodo.split("-").map(Number);
  return new Date(ano, mes - 1, 1);
};

/** "2026-08" → "agosto" */
export function nomeDoMes(periodo) {
  return new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(primeiroDiaDo(periodo));
}

/** "2026-08" → "agosto de 2026"; omite o ano quando é o ano corrente. */
export function rotuloDoPeriodo(periodo, { comAno = "auto" } = {}) {
  const mes = nomeDoMes(periodo);
  const ano = periodo.slice(0, 4);
  const mostrarAno = comAno === true || (comAno === "auto" && ano !== String(new Date().getFullYear()));
  return mostrarAno ? `${mes} de ${ano}` : mes;
}

/**
 * "2026-08-01" → "01 ago" (formato curto das listas).
 *
 * O pt-BR formata como "01 de ago."; o " de " e o ponto saem para caber nas
 * colunas estreitas das listas, como no design.
 */
export function diaCurto(iso) {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short" })
    .format(dataDeISO(iso))
    .replace(" de ", " ")
    .replace(".", "");
}

/** "2026-08-01" → "Sábado, 1 de agosto" */
export function diaPorExtenso(iso) {
  const d = dataDeISO(iso);
  const semana = new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(d);
  const resto = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long" }).format(d);
  return `${semana[0].toUpperCase()}${semana.slice(1)}, ${resto}`;
}

/** "2026-08-01" → "1 de agosto" */
export function diaEMes(iso) {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long" }).format(dataDeISO(iso));
}

/** O item pertence ao período? Aceita qualquer objeto com `iso`. */
export const noPeriodo = (periodo) => (item) => (item.iso || "").startsWith(periodo);
