"use client";

import { AppDataProvider } from "../../context/AppDataProvider";
import { AppBootSkeleton } from "../../components/lash-studio/AppBootSkeleton";
import { useHoje } from "../../lib/useHoje";

export default function AppLayout({ children }) {
  const hoje = useHoje();

  // `hoje` é null durante a pré-renderização estática. O provider só monta com
  // a data já conhecida, o que deixa os inicializadores de estado dele semearem
  // os dados direto — sem efeito e sem estado intermediário nulo.
  if (!hoje) return <AppBootSkeleton />;

  return <AppDataProvider hoje={hoje}>{children}</AppDataProvider>;
}
