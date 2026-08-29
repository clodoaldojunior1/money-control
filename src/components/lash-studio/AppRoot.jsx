"use client";

import { AppDataProvider } from "../../context/AppDataProvider";
import { AppShell } from "./AppShell";
import { AppBootSkeleton } from "./AppBootSkeleton";
import { useHoje } from "../../lib/useHoje";

/**
 * A fronteira entre o servidor e o app.
 *
 * Recebe os dados já buscados e convertidos (`src/server/leitura.js`) e espera
 * a data do cliente para montar o provider. A cada gravação o servidor manda
 * `dados` novos por aqui — por isso o provider não os copia para o estado. `hoje` é `null` no HTML do
 * servidor — ver `useHoje`: ler a data durante o render gravaria a data do
 * servidor no HTML e divergiria na hidratação. Enquanto isso, o skeleton.
 *
 * Os dados chegam pelo servidor e a data pelo cliente, e é justamente por isso
 * que esta divisão existe: só o `hoje` precisa esperar a montagem.
 */
export function AppRoot({ dados }) {
  const hoje = useHoje();

  if (!hoje) return <AppBootSkeleton />;

  return (
    <AppDataProvider hoje={hoje} dados={dados}>
      <AppShell />
    </AppDataProvider>
  );
}
