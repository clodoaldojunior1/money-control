"use client";
import { useState } from "react";
import { CaixaContext } from "../context/CaixaContext";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

export function Providers({ children }) {
  const [faturamento, setFaturamento] = useState(0);

  const adicionarFaturamento = (valor) => {
    setFaturamento((totalAtual) => totalAtual + Number(valor));
  };

  return (

    <CaixaContext value={{ faturamento, adicionarFaturamento }}>
      <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
    </CaixaContext>
  );
}
