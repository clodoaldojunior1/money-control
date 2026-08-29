import { dataUTCDeISO } from "../lib/periodo";

/**
 * Borda de escrita: validação e conversão do que chega do formulário.
 *
 * Espelho de `leitura.js`. Existe pelo mesmo motivo — o formato da UI e o do
 * banco são diferentes — e por mais um: **Server Action é um endpoint**. O que
 * chega aqui atravessou a rede e não é confiável só porque o formulário do
 * app validou antes.
 *
 * O que é validado com lista fechada e o que não é: `tipo` e `subtipo` do
 * gasto sim, porque a UI deriva rótulo e categoria deles (`CAT_POR_SUB`) e um
 * valor fora da lista quebraria a tela. Serviço, duração e status não — o
 * próprio seed grava "Em atendimento", que não está entre os `STATUSES`
 * oferecidos, e fechar a lista impediria de editar registros que já existem.
 */

/** Erro de dado inválido — vira mensagem para a usuária, não log de servidor. */
export class DadoInvalido extends Error {}

export function texto(valor, campo, { padrao } = {}) {
  const limpo = String(valor ?? "").trim();
  if (limpo) return limpo;
  if (padrao !== undefined) return padrao;
  throw new DadoInvalido(`${campo} é obrigatório.`);
}

export function umDe(valor, aceitos, campo) {
  const limpo = String(valor ?? "").trim();
  if (!aceitos.includes(limpo)) throw new DadoInvalido(`${campo} inválido.`);
  return limpo;
}

/** Dinheiro: número finito e maior que zero. Chega como string do formulário. */
export function dinheiro(valor, campo = "Valor") {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) throw new DadoInvalido(`${campo} precisa ser maior que zero.`);
  return n;
}

/** Igual a `dinheiro`, mas aceita zero — usado no estoque mínimo. */
export function inteiro(valor, campo, { minimo = 0 } = {}) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < minimo) throw new DadoInvalido(`${campo} precisa ser um número inteiro.`);
  return n;
}

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Valida o formato e devolve a própria string ISO. */
export function diaISO(iso, campo = "Data") {
  const limpo = String(iso ?? "").trim();
  if (!FORMATO_ISO.test(limpo)) throw new DadoInvalido(`${campo} inválida.`);
  return limpo;
}

/** "2026-08-01" → `Date` de meia-noite UTC, que é como o `@db.Date` guarda. */
export function dia(iso, campo = "Data") {
  const data = dataUTCDeISO(diaISO(iso, campo));
  if (Number.isNaN(data.getTime())) throw new DadoInvalido(`${campo} inválida.`);
  return data;
}

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function hora(valor, campo = "Horário") {
  const limpo = String(valor ?? "").trim();
  if (!FORMATO_HORA.test(limpo)) throw new DadoInvalido(`${campo} inválido.`);
  return limpo;
}

/**
 * Envelope de toda ação: devolve `{ erro }` em vez de estourar.
 *
 * Uma Server Action que lança vira erro de runtime no cliente, e em produção a
 * mensagem é apagada — a usuária veria a tela quebrar sem saber o motivo. Erro
 * de dado volta com o texto; erro inesperado vira mensagem genérica e fica no
 * log do servidor, que é onde o stack serve para alguma coisa.
 */
export async function comResultado(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof DadoInvalido) return { erro: e.message };
    console.error("[action]", e);
    return { erro: "Não foi possível salvar. Tente de novo." };
  }
}
