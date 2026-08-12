"use client";

import { useSyncExternalStore } from "react";
import { hojeISO } from "./periodo";

// Sem assinatura: o dia não muda enquanto a aba está aberta. Se um dia isso
// importar (app aberto atravessando a meia-noite), é aqui que entra um timer.
const semAssinatura = () => () => {};

const snapshotCliente = () => hojeISO();
const snapshotServidor = () => null;

/**
 * O dia de hoje no cliente, ou `null` durante a pré-renderização.
 *
 * As rotas são geradas estaticamente no build; ler a data durante o render
 * gravaria a data do build no HTML e divergiria do cliente. `useSyncExternalStore`
 * com um snapshot de servidor diferente é a forma suportada pelo React de
 * expressar "este valor só existe no cliente" sem erro de hidratação.
 */
export function useHoje() {
  return useSyncExternalStore(semAssinatura, snapshotCliente, snapshotServidor);
}
