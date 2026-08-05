"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { LARGURA_APP } from "../lash-studio/AppShell";

/** Moldura das telas públicas: mesma largura do app, centralizada. */
export function PublicShell({ children }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <Box sx={{ minHeight: "100dvh", backgroundColor: t.pageBg, display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: LARGURA_APP,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: t.bg,
          color: t.text,
          boxShadow: { xs: "none", sm: t.shadow.lg },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
