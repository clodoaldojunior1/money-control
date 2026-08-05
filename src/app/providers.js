"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ColorModeProvider } from "../context/ColorModeProvider";

// Só o tema é global — as telas públicas (landing, login, cadastro) não
// precisam do estado de domínio. O AppDataProvider vive no layout de /app.
export function Providers({ children }) {
  return (
    <AppRouterCacheProvider>
      <ColorModeProvider>{children}</ColorModeProvider>
    </AppRouterCacheProvider>
  );
}
